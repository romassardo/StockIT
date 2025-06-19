-- =============================================
-- Author:      StockIT Dev Team
-- Create date: 31/05/2025
-- Description: Realizar búsqueda global en múltiples tablas del sistema
-- =============================================
USE StockIT;
GO

-- Verificar si el procedimiento ya existe y eliminarlo
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Search_Global')
BEGIN
    DROP PROCEDURE sp_Search_Global;
    PRINT N'Procedimiento sp_Search_Global eliminado para su recreación.';
END
GO

CREATE PROCEDURE sp_Search_Global
    @searchTerm NVARCHAR(100),        -- Término de búsqueda general
    @searchType NVARCHAR(50) = NULL,  -- Tipo de búsqueda: 'SerialNumber', 'EncryptionPassword', 'General' (por defecto)
    @pageNumber INT = 1,              -- Número de página para paginación
    @pageSize INT = 10                -- Tamaño de página para paginación
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Variables locales
    DECLARE @offset INT = (@pageNumber - 1) * @pageSize;
    DECLARE @totalCount INT = 0;
    
    -- Validar parámetros
    IF @searchTerm IS NULL OR LEN(TRIM(@searchTerm)) < 3
    BEGIN
        THROW 50001, N'El término de búsqueda debe tener al menos 3 caracteres', 1;
        RETURN;
    END
    
    -- Establecer el tipo de búsqueda por defecto si no se especifica
    IF @searchType IS NULL
    BEGIN
        SET @searchType = 'General';
    END
    
    -- Verificar que el tipo de búsqueda sea válido
    IF @searchType NOT IN ('SerialNumber', 'EncryptionPassword', 'General')
    BEGIN
        THROW 50002, N'Tipo de búsqueda no válido. Debe ser SerialNumber, EncryptionPassword o General', 1;
        RETURN;
    END
    
    -- Limpiar y preparar el término de búsqueda
    SET @searchTerm = TRIM(@searchTerm);
    SET @searchTerm = '%' + @searchTerm + '%'; -- Para búsquedas LIKE
    
    -- Tabla temporal para almacenar resultados
    CREATE TABLE #SearchResults (
        ResultType NVARCHAR(50),      -- Tipo de resultado (ej: 'Inventario', 'Asignacion')
        ItemId INT,                   -- ID del elemento
        Title NVARCHAR(200),          -- Título o nombre del elemento
        Description NVARCHAR(500),    -- Descripción adicional
        Status NVARCHAR(50),          -- Estado del elemento
        DateInfo DATETIME,            -- Fecha relevante
        EntityType NVARCHAR(50),      -- Tipo de entidad (ej: 'Notebook', 'Celular')
        SerialNumber NVARCHAR(100),   -- Número de serie (si aplica)
        EncryptionPassword NVARCHAR(100), -- Contraseña de encriptación (si aplica)
        RelatedInfo NVARCHAR(500)     -- Información relacionada adicional
    );
    
    -- CASO 1: Búsqueda por número de serie
    IF @searchType = 'SerialNumber' OR @searchType = 'General'
    BEGIN
        INSERT INTO #SearchResults (
            ResultType, ItemId, Title, Description, Status, 
            DateInfo, EntityType, SerialNumber, EncryptionPassword, RelatedInfo
        )
        SELECT TOP (1000) -- Limitamos para evitar sobrecarga
            CASE 
                WHEN a.id IS NOT NULL THEN 'Asignacion'
                WHEN r.id IS NOT NULL THEN 'Reparacion'
                ELSE 'Inventario'
            END AS ResultType,
            CASE 
                WHEN a.id IS NOT NULL THEN a.id
                WHEN r.id IS NOT NULL THEN r.id
                ELSE ii.id
            END AS ItemId,
            p.marca + ' ' + p.modelo AS Title,
            c.nombre + ' - S/N: ' + ii.numero_serie AS Description,
            ii.estado AS Status,
            ii.fecha_ingreso AS DateInfo,
            c.nombre AS EntityType,
            ii.numero_serie AS SerialNumber,
            NULL AS EncryptionPassword,
            CASE 
                WHEN a.id IS NOT NULL THEN 'Asignado a: ' + COALESCE(e.nombre + ' ' + e.apellido, s.nombre, b.nombre, 'Desconocido')
                WHEN r.id IS NOT NULL THEN 'En reparación desde: ' + CONVERT(NVARCHAR(20), r.fecha_envio, 103)
                ELSE NULL
            END AS RelatedInfo
        FROM 
            InventarioIndividual ii
        INNER JOIN 
            Productos p ON ii.producto_id = p.id
        INNER JOIN 
            Categorias c ON p.categoria_id = c.id
        LEFT JOIN 
            Asignaciones a ON ii.id = a.inventario_individual_id AND a.activa = 1
        LEFT JOIN 
            Empleados e ON a.empleado_id = e.id
        LEFT JOIN 
            Sectores s ON a.sector_id = s.id
        LEFT JOIN 
            Sucursales b ON a.sucursal_id = b.id
        LEFT JOIN 
            Reparaciones r ON ii.id = r.inventario_individual_id AND r.estado = 'En Reparación'
        WHERE 
            ii.numero_serie LIKE @searchTerm;
    END
    
    -- CASO 2: Búsqueda por contraseña de notebooks o datos de celulares
    IF @searchType = 'EncryptionPassword' OR @searchType = 'General'
    BEGIN
        INSERT INTO #SearchResults (
            ResultType, ItemId, Title, Description, Status, 
            DateInfo, EntityType, SerialNumber, EncryptionPassword, RelatedInfo
        )
        SELECT TOP (1000) -- Limitamos para evitar sobrecarga
            'Asignación' AS ResultType,
            a.id AS ItemId,
            CASE 
                WHEN e.id IS NOT NULL THEN 'Asignado a: ' + e.nombre + ' ' + e.apellido
                WHEN s.id IS NOT NULL THEN 'Asignado a sector: ' + s.nombre
                WHEN b.id IS NOT NULL THEN 'Asignado a sucursal: ' + b.nombre
                ELSE 'Asignación'
            END AS Title,
            p.marca + ' ' + p.modelo + ' - S/N: ' + ii.numero_serie AS Description,
            CASE WHEN a.activa = 1 THEN 'Asignado' ELSE 'Inactivo' END AS Status,
            a.fecha_asignacion AS DateInfo,
            c.nombre AS EntityType,
            ii.numero_serie AS SerialNumber,
            CASE 
                WHEN c.nombre LIKE '%Notebook%' THEN a.password_encriptacion
                WHEN c.nombre LIKE '%Celular%' THEN a.password_gmail
                ELSE NULL
            END AS EncryptionPassword,
            CASE
                WHEN c.nombre LIKE '%Celular%' THEN 
                    'Gmail: ' + COALESCE(a.cuenta_gmail, 'N/A') + 
                    ', Tel: ' + COALESCE(a.numero_telefono, 'N/A') + 
                    ', 2FA: ' + COALESCE(a.codigo_2fa_whatsapp, 'N/A')
                ELSE 'Asignado el: ' + CONVERT(NVARCHAR(20), a.fecha_asignacion, 103)
            END AS RelatedInfo
        FROM 
            Asignaciones a
        INNER JOIN 
            InventarioIndividual ii ON a.inventario_individual_id = ii.id
        INNER JOIN 
            Productos p ON ii.producto_id = p.id
        INNER JOIN 
            Categorias c ON p.categoria_id = c.id
        LEFT JOIN 
            Empleados e ON a.empleado_id = e.id
        LEFT JOIN 
            Sectores s ON a.sector_id = s.id
        LEFT JOIN 
            Sucursales b ON a.sucursal_id = b.id
        WHERE 
            (a.password_encriptacion LIKE @searchTerm OR 
             a.cuenta_gmail LIKE @searchTerm OR 
             a.password_gmail LIKE @searchTerm OR
             a.numero_telefono LIKE @searchTerm OR
             a.codigo_2fa_whatsapp LIKE @searchTerm)
            AND a.activa = 1;
    END
    
    -- CASO 3: Búsqueda general (si el tipo es 'General')
    IF @searchType = 'General'
    BEGIN
        -- Búsqueda en empleados
        INSERT INTO #SearchResults (
            ResultType, ItemId, Title, Description, Status, 
            DateInfo, EntityType, SerialNumber, EncryptionPassword, RelatedInfo
        )
        SELECT TOP (500) -- Limitamos para evitar sobrecarga
            'Empleado' AS ResultType,
            e.id AS ItemId,
            e.nombre + ' ' + e.apellido AS Title,
            'Empleado' AS Description,
            CASE WHEN e.activo = 1 THEN 'Activo' ELSE 'Inactivo' END AS Status,
            GETDATE() AS DateInfo, -- No hay fecha_creacion, usamos GETDATE()
            'Empleado' AS EntityType,
            NULL AS SerialNumber,
            NULL AS EncryptionPassword,
            NULL AS RelatedInfo
        FROM 
            Empleados e
        WHERE 
            (e.nombre LIKE @searchTerm OR 
            e.apellido LIKE @searchTerm)
            AND e.activo = 1;
            
        -- Búsqueda en productos
        INSERT INTO #SearchResults (
            ResultType, ItemId, Title, Description, Status, 
            DateInfo, EntityType, SerialNumber, EncryptionPassword, RelatedInfo
        )
        SELECT TOP (500) -- Limitamos para evitar sobrecarga
            'Producto' AS ResultType,
            p.id AS ItemId,
            p.marca + ' ' + p.modelo AS Title,
            p.descripcion AS Description,
            CASE WHEN p.activo = 1 THEN 'Activo' ELSE 'Inactivo' END AS Status,
            GETDATE() AS DateInfo, -- No hay fecha_creacion, usamos GETDATE()
            c.nombre AS EntityType,
            NULL AS SerialNumber,
            NULL AS EncryptionPassword,
            'Categoría: ' + c.nombre + ', Stock mínimo: ' + CAST(p.stock_minimo AS NVARCHAR(10)) AS RelatedInfo
        FROM 
            Productos p
        INNER JOIN 
            Categorias c ON p.categoria_id = c.id
        WHERE 
            (p.marca LIKE @searchTerm OR 
            p.modelo LIKE @searchTerm OR 
            p.descripcion LIKE @searchTerm)
            AND p.activo = 1;
            
        -- Búsqueda en sectores
        INSERT INTO #SearchResults (
            ResultType, ItemId, Title, Description, Status, 
            DateInfo, EntityType, SerialNumber, EncryptionPassword, RelatedInfo
        )
        SELECT TOP (100) -- Limitamos para evitar sobrecarga
            'Sector' AS ResultType,
            s.id AS ItemId,
            s.nombre AS Title,
            'Sector' AS Description, -- No hay descripcion, usamos un valor fijo
            CASE WHEN s.activo = 1 THEN 'Activo' ELSE 'Inactivo' END AS Status,
            GETDATE() AS DateInfo, -- No hay fecha_creacion, usamos GETDATE()
            'Sector' AS EntityType,
            NULL AS SerialNumber,
            NULL AS EncryptionPassword,
            NULL AS RelatedInfo
        FROM 
            Sectores s
        WHERE 
            s.nombre LIKE @searchTerm
            AND s.activo = 1;
            
        -- Búsqueda en sucursales
        INSERT INTO #SearchResults (
            ResultType, ItemId, Title, Description, Status, 
            DateInfo, EntityType, SerialNumber, EncryptionPassword, RelatedInfo
        )
        SELECT TOP (100) -- Limitamos para evitar sobrecarga
            'Sucursal' AS ResultType,
            b.id AS ItemId,
            b.nombre AS Title,
            'Sucursal' AS Description,
            CASE WHEN b.activo = 1 THEN 'Activo' ELSE 'Inactivo' END AS Status,
            GETDATE() AS DateInfo, -- No hay fecha_creacion, usamos GETDATE()
            'Sucursal' AS EntityType,
            NULL AS SerialNumber,
            NULL AS EncryptionPassword,
            NULL AS RelatedInfo
        FROM 
            Sucursales b
        WHERE 
            b.nombre LIKE @searchTerm
            AND b.activo = 1;
    END
    
    -- Obtener el conteo total de resultados
    SELECT @totalCount = COUNT(*) FROM #SearchResults;
    
    -- Devolver los resultados paginados
    SELECT 
        ResultType,
        ItemId,
        Title,
        Description,
        Status,
        DateInfo,
        EntityType,
        SerialNumber,
        EncryptionPassword,
        RelatedInfo,
        @totalCount AS TotalCount,
        @pageNumber AS CurrentPage,
        @pageSize AS PageSize,
        CEILING(CAST(@totalCount AS FLOAT) / @pageSize) AS TotalPages
    FROM 
        #SearchResults
    ORDER BY 
        CASE 
            WHEN ResultType = 'Inventario' THEN 1
            WHEN ResultType = 'Asignación' THEN 2
            WHEN ResultType = 'Empleado' THEN 3
            WHEN ResultType = 'Producto' THEN 4
            WHEN ResultType = 'Sector' THEN 5
            WHEN ResultType = 'Sucursal' THEN 6
            ELSE 99
        END,
        Title
    OFFSET @offset ROWS
    FETCH NEXT @pageSize ROWS ONLY;
    
    -- Limpiar tabla temporal
    DROP TABLE #SearchResults;
END;
GO

PRINT N'Procedimiento sp_Search_Global creado exitosamente.';
GO