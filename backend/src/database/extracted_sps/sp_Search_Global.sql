
CREATE PROCEDURE sp_Search_Global
    @searchTerm NVARCHAR(100),
    @searchType NVARCHAR(50) = NULL,
    @pageNumber INT = 1,
    @pageSize INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @offset INT = (@pageNumber - 1) * @pageSize;
    DECLARE @totalCount INT = 0;
    
    IF @searchTerm IS NULL OR LEN(TRIM(@searchTerm)) < 3
    BEGIN
        RAISERROR('El tÃ©rmino de bÃºsqueda debe tener al menos 3 caracteres', 16, 1);
        RETURN;
    END
    
    IF @searchType IS NULL
    BEGIN
        SET @searchType = 'General';
    END
    
    SET @searchTerm = TRIM(@searchTerm);
    SET @searchTerm = '%' + @searchTerm + '%';
    
    CREATE TABLE #SearchResults (
        ResultType NVARCHAR(50),
        ItemId INT,
        Title NVARCHAR(200),
        Description NVARCHAR(500),
        Status NVARCHAR(50),
        DateInfo DATETIME,
        EntityType NVARCHAR(50),
        SerialNumber NVARCHAR(100),
        EncryptionPassword NVARCHAR(100),
        RelatedInfo NVARCHAR(500)
    );
    
    -- BÃšSQUEDA POR NÃšMERO DE SERIE (CORREGIDA PARA DEVOLVER TIPO CORRECTO)
    IF @searchType = 'SerialNumber' OR @searchType = 'General'
    BEGIN
        INSERT INTO #SearchResults (
            ResultType, ItemId, Title, Description, Status, 
            DateInfo, EntityType, SerialNumber, EncryptionPassword, RelatedInfo
        )
        SELECT TOP (1000)
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
                WHEN r.id IS NOT NULL THEN 'En reparaciÃ³n desde: ' + CONVERT(NVARCHAR(20), r.fecha_envio, 103)
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
            Reparaciones r ON ii.id = r.inventario_individual_id AND r.estado = 'En ReparaciÃ³n'
        WHERE 
            ii.numero_serie LIKE @searchTerm;
    END
    
    -- BÃšSQUEDA POR CONTRASEÃ‘AS/DATOS SENSIBLES (mantener lÃ³gica existente)
    IF @searchType = 'EncryptionPassword' OR @searchType = 'General'
    BEGIN
        INSERT INTO #SearchResults (
            ResultType, ItemId, Title, Description, Status, 
            DateInfo, EntityType, SerialNumber, EncryptionPassword, RelatedInfo
        )
        SELECT TOP (1000)
            'Asignacion' AS ResultType,
            a.id AS ItemId,
            CASE 
                WHEN e.id IS NOT NULL THEN 'Asignado a: ' + e.nombre + ' ' + e.apellido
                WHEN s.id IS NOT NULL THEN 'Asignado a sector: ' + s.nombre
                WHEN b.id IS NOT NULL THEN 'Asignado a sucursal: ' + b.nombre
                ELSE 'AsignaciÃ³n'
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
    
    -- BÃšSQUEDAS GENERALES (empleados, productos, sectores, sucursales)
    IF @searchType = 'General'
    BEGIN
        -- Empleados
        INSERT INTO #SearchResults (ResultType, ItemId, Title, Description, Status, DateInfo, EntityType, SerialNumber, EncryptionPassword, RelatedInfo)
        SELECT TOP (500) 'Empleado', e.id, e.nombre + ' ' + e.apellido, 'Empleado', 
               CASE WHEN e.activo = 1 THEN 'Activo' ELSE 'Inactivo' END, GETDATE(), 'Empleado', NULL, NULL, NULL
        FROM Empleados e
        WHERE (e.nombre LIKE @searchTerm OR e.apellido LIKE @searchTerm) AND e.activo = 1;
            
        -- Productos
        INSERT INTO #SearchResults (ResultType, ItemId, Title, Description, Status, DateInfo, EntityType, SerialNumber, EncryptionPassword, RelatedInfo)
        SELECT TOP (500) 'Producto', p.id, p.marca + ' ' + p.modelo, p.descripcion,
               CASE WHEN p.activo = 1 THEN 'Activo' ELSE 'Inactivo' END, GETDATE(), c.nombre, NULL, NULL,
               'CategorÃ­a: ' + c.nombre + ', Stock mÃ­nimo: ' + CAST(p.stock_minimo AS NVARCHAR(10))
        FROM Productos p INNER JOIN Categorias c ON p.categoria_id = c.id
        WHERE (p.marca LIKE @searchTerm OR p.modelo LIKE @searchTerm OR p.descripcion LIKE @searchTerm) AND p.activo = 1;
            
        -- Sectores
        INSERT INTO #SearchResults (ResultType, ItemId, Title, Description, Status, DateInfo, EntityType, SerialNumber, EncryptionPassword, RelatedInfo)
        SELECT TOP (100) 'Sector', s.id, s.nombre, 'Sector',
               CASE WHEN s.activo = 1 THEN 'Activo' ELSE 'Inactivo' END, GETDATE(), 'Sector', NULL, NULL, NULL
        FROM Sectores s WHERE s.nombre LIKE @searchTerm AND s.activo = 1;
            
        -- Sucursales
        INSERT INTO #SearchResults (ResultType, ItemId, Title, Description, Status, DateInfo, EntityType, SerialNumber, EncryptionPassword, RelatedInfo)
        SELECT TOP (100) 'Sucursal', b.id, b.nombre, 'Sucursal',
               CASE WHEN b.activo = 1 THEN 'Activo' ELSE 'Inactivo' END, GETDATE(), 'Sucursal', NULL, NULL, NULL
        FROM Sucursales b WHERE b.nombre LIKE @searchTerm AND b.activo = 1;
    END
    
    -- Obtener total y devolver resultados paginados
    SELECT @totalCount = COUNT(*) FROM #SearchResults;
    
    SELECT 
        ResultType, ItemId, Title, Description, Status, DateInfo, EntityType, SerialNumber, EncryptionPassword, RelatedInfo,
        @totalCount AS TotalCount, @pageNumber AS CurrentPage, @pageSize AS PageSize,
        CEILING(CAST(@totalCount AS FLOAT) / @pageSize) AS TotalPages
    FROM #SearchResults
    ORDER BY 
        CASE 
            WHEN ResultType = 'Inventario' THEN 1
            WHEN ResultType = 'Asignacion' THEN 2
            WHEN ResultType = 'Empleado' THEN 3
            WHEN ResultType = 'Producto' THEN 4
            WHEN ResultType = 'Sector' THEN 5
            WHEN ResultType = 'Sucursal' THEN 6
            ELSE 99
        END,
        Title
    OFFSET @offset ROWS
    FETCH NEXT @pageSize ROWS ONLY;
    
    DROP TABLE #SearchResults;
END;
