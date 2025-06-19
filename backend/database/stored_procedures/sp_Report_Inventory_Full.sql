CREATE OR ALTER PROCEDURE sp_Report_StockDisponible
    @PageNumber INT = 1,
    @PageSize INT = 20,
    @FilterType NVARCHAR(50) = NULL, -- 'Serializado', 'General', NULL para todos
    @FilterCategoria NVARCHAR(100) = NULL, -- Filtro por categoría
    @SortBy NVARCHAR(50) = 'Categoria',
    @SortOrder NVARCHAR(4) = 'ASC'
AS
BEGIN
    SET NOCOUNT ON;

    WITH StockDisponible AS (
        -- Activos Serializados DISPONIBLES únicamente (Notebooks y Celulares)
        SELECT
            p.id AS ProductoId,
            c.nombre AS Categoria,
            p.marca,
            p.modelo,
            p.descripcion,
            ii.numero_serie,
            ii.estado,
            1 AS cantidad_actual,
            'N/A' AS ubicacion,
            'Serializado' AS TipoInventario
        FROM InventarioIndividual ii
        JOIN Productos p ON ii.producto_id = p.id
        JOIN Categorias c ON p.categoria_id = c.id
        WHERE ii.estado = 'Disponible' -- ✅ SOLO DISPONIBLES, NO ASIGNADOS

        UNION ALL

        -- Stock General (sin número de serie) - Siempre disponible por definición
        SELECT
            p.id AS ProductoId,
            c.nombre AS Categoria,
            p.marca,
            p.modelo,
            p.descripcion,
            'N/A' AS numero_serie,
            'Disponible' AS estado,
            sg.cantidad_actual,
            ISNULL(sg.ubicacion, 'Almacén') AS ubicacion,
            'General' AS TipoInventario
        FROM StockGeneral sg
        JOIN Productos p ON sg.producto_id = p.id
        JOIN Categorias c ON p.categoria_id = c.id
        WHERE sg.cantidad_actual > 0 -- ✅ SOLO CON STOCK POSITIVO
    )
    SELECT 
        *,
        (SELECT COUNT(*) FROM StockDisponible 
         WHERE (@FilterType IS NULL OR TipoInventario = @FilterType)
           AND (@FilterCategoria IS NULL OR Categoria = @FilterCategoria)) AS TotalRecords
    FROM StockDisponible
    WHERE (@FilterType IS NULL OR TipoInventario = @FilterType)
      AND (@FilterCategoria IS NULL OR Categoria = @FilterCategoria)
    ORDER BY
        CASE WHEN @SortBy = 'Categoria' AND @SortOrder = 'ASC' THEN Categoria END ASC,
        CASE WHEN @SortBy = 'Categoria' AND @SortOrder = 'DESC' THEN Categoria END DESC,
        CASE WHEN @SortBy = 'Marca' AND @SortOrder = 'ASC' THEN marca END ASC,
        CASE WHEN @SortBy = 'Marca' AND @SortOrder = 'DESC' THEN marca END DESC,
        CASE WHEN @SortBy = 'Modelo' AND @SortOrder = 'ASC' THEN modelo END ASC,
        CASE WHEN @SortBy = 'Modelo' AND @SortOrder = 'DESC' THEN modelo END DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END; 