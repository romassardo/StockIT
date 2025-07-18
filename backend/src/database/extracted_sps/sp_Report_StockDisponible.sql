
-- Reemplazar el SP existente con versión agrupada
CREATE PROCEDURE sp_Report_StockDisponible
    @PageNumber INT = 1,
    @PageSize INT = 20,
    @FilterType NVARCHAR(50) = NULL,
    @FilterCategoria NVARCHAR(100) = NULL,
    @SortBy NVARCHAR(50) = 'Categoria',
    @SortOrder NVARCHAR(4) = 'ASC'
AS
BEGIN
    SET NOCOUNT ON;

    WITH StockDisponibleAgrupado AS (
        -- Activos Serializados DISPONIBLES agrupados por producto
        SELECT
            p.id AS ProductoId,
            c.nombre AS Categoria,
            p.marca,
            p.modelo,
            p.descripcion,
            COUNT(ii.id) AS cantidad_disponible,
            'Serializado' AS TipoInventario
        FROM InventarioIndividual ii
        JOIN Productos p ON ii.producto_id = p.id
        JOIN Categorias c ON p.categoria_id = c.id
        WHERE ii.estado = 'Disponible'
        GROUP BY p.id, c.nombre, p.marca, p.modelo, p.descripcion

        UNION ALL

        -- Stock General (ya viene agrupado)
        SELECT
            p.id AS ProductoId,
            c.nombre AS Categoria,
            p.marca,
            p.modelo,
            p.descripcion,
            sg.cantidad_actual AS cantidad_disponible,
            'General' AS TipoInventario
        FROM StockGeneral sg
        JOIN Productos p ON sg.producto_id = p.id
        JOIN Categorias c ON p.categoria_id = c.id
        WHERE sg.cantidad_actual > 0  -- Solo productos con stock
    )
    SELECT 
        ProductoId,
        Categoria,
        marca,
        modelo,
        descripcion,
        cantidad_disponible,
        TipoInventario,
        (SELECT COUNT(*) FROM StockDisponibleAgrupado 
         WHERE (@FilterType IS NULL OR TipoInventario = @FilterType)
           AND (@FilterCategoria IS NULL OR Categoria = @FilterCategoria)) AS TotalRecords
    FROM StockDisponibleAgrupado
    WHERE (@FilterType IS NULL OR TipoInventario = @FilterType)
      AND (@FilterCategoria IS NULL OR Categoria = @FilterCategoria)
    ORDER BY
        CASE WHEN @SortBy = 'Categoria' AND @SortOrder = 'ASC' THEN Categoria END ASC,
        CASE WHEN @SortBy = 'Categoria' AND @SortOrder = 'DESC' THEN Categoria END DESC,
        CASE WHEN @SortBy = 'Marca' AND @SortOrder = 'ASC' THEN marca END ASC,
        CASE WHEN @SortBy = 'Marca' AND @SortOrder = 'DESC' THEN marca END DESC,
        CASE WHEN @SortBy = 'Modelo' AND @SortOrder = 'ASC' THEN modelo END ASC,
        CASE WHEN @SortBy = 'Modelo' AND @SortOrder = 'DESC' THEN modelo END DESC,
        CASE WHEN @SortBy = 'Cantidad' AND @SortOrder = 'ASC' THEN cantidad_disponible END ASC,
        CASE WHEN @SortBy = 'Cantidad' AND @SortOrder = 'DESC' THEN cantidad_disponible END DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;
