-- =============================================
-- Author:      StockIT Dev Team  
-- Create date: Enero 2025
-- Description: Obtener todos los productos con filtros y paginación
-- =============================================
USE StockIT;
GO

IF OBJECT_ID('sp_Producto_GetAll', 'P') IS NOT NULL
    DROP PROCEDURE sp_Producto_GetAll;
GO

CREATE PROCEDURE sp_Producto_GetAll
    @categoria_id INT = NULL,
    @usa_numero_serie BIT = NULL,
    @incluir_inactivos BIT = 0,
    @filtro_busqueda NVARCHAR(255) = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 25
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validación de parámetros
    IF @PageNumber < 1 SET @PageNumber = 1;
    IF @PageSize < 1 SET @PageSize = 1;
    IF @PageSize > 100 SET @PageSize = 100;
    
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    
    SELECT 
        p.id,
        p.categoria_id,
        c.nombre AS categoria_nombre,
        c.requiere_serie AS categoria_requiere_serie,
        c.permite_asignacion AS categoria_permite_asignacion,
        c.permite_reparacion AS categoria_permite_reparacion,
        p.marca,
        p.modelo,
        p.descripcion,
        p.stock_minimo,
        p.usa_numero_serie,
        p.activo,
        p.fecha_creacion,
        p.fecha_modificacion,
        -- Información de inventario según tipo
        CASE 
            WHEN p.usa_numero_serie = 1 THEN 
                (SELECT COUNT(*) FROM InventarioIndividual WHERE producto_id = p.id)
            ELSE 
                ISNULL((SELECT cantidad_actual FROM StockGeneral WHERE producto_id = p.id), 0)
        END AS cantidad_total,
        CASE 
            WHEN p.usa_numero_serie = 1 THEN 
                (SELECT COUNT(*) FROM InventarioIndividual WHERE producto_id = p.id AND estado = 'Disponible')
            ELSE 
                ISNULL((SELECT cantidad_actual FROM StockGeneral WHERE producto_id = p.id), 0)
        END AS cantidad_disponible,
        CASE 
            WHEN p.usa_numero_serie = 1 THEN 
                (SELECT COUNT(*) FROM InventarioIndividual WHERE producto_id = p.id AND estado = 'Asignado')
            ELSE 
                0
        END AS cantidad_asignada,
        CASE 
            WHEN p.usa_numero_serie = 1 THEN 
                (SELECT COUNT(*) FROM InventarioIndividual WHERE producto_id = p.id AND estado = 'En Reparación')
            ELSE 
                0
        END AS cantidad_en_reparacion,
        -- Indicador de stock bajo
        CASE 
            WHEN p.usa_numero_serie = 1 THEN 
                CASE WHEN (SELECT COUNT(*) FROM InventarioIndividual WHERE producto_id = p.id AND estado = 'Disponible') < p.stock_minimo THEN 1 ELSE 0 END
            ELSE 
                CASE WHEN ISNULL((SELECT cantidad_actual FROM StockGeneral WHERE producto_id = p.id), 0) < p.stock_minimo THEN 1 ELSE 0 END
        END AS stock_bajo,
        COUNT(*) OVER() AS TotalRows
    FROM Productos p
    INNER JOIN Categorias c ON p.categoria_id = c.id
    WHERE 
        (@categoria_id IS NULL OR p.categoria_id = @categoria_id)
        AND (@usa_numero_serie IS NULL OR p.usa_numero_serie = @usa_numero_serie)
        AND (@incluir_inactivos = 1 OR p.activo = 1)
        AND (
            @filtro_busqueda IS NULL 
            OR p.marca LIKE '%' + @filtro_busqueda + '%'
            OR p.modelo LIKE '%' + @filtro_busqueda + '%'
            OR p.descripcion LIKE '%' + @filtro_busqueda + '%'
            OR c.nombre LIKE '%' + @filtro_busqueda + '%'
        )
    ORDER BY c.nombre, p.marca, p.modelo
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
    
END;
GO

PRINT N'Stored procedure sp_Producto_GetAll creado exitosamente.'; 