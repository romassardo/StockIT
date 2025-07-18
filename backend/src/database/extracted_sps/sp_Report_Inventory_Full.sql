CREATE   PROCEDURE sp_Report_Inventory_Full
    @PageNumber INT = 1,
    @PageSize INT = 20,
    @FilterType NVARCHAR(50) = NULL, -- 'Serializado', 'General', NULL para todos
    @SortBy NVARCHAR(50) = 'Categoria',
    @SortOrder NVARCHAR(4) = 'ASC'
AS
BEGIN
    SET NOCOUNT ON;

    WITH CombinedInventory AS (
        -- Activos Serializados (Notebooks y Celulares)
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

        UNION ALL

        -- Stock General (sin nÃºmero de serie)
        SELECT
            p.id AS ProductoId,
            c.nombre AS Categoria,
            p.marca,
            p.modelo,
            p.descripcion,
            'N/A' AS numero_serie,
            'Disponible' AS estado, -- Asumimos disponible para el stock general
            sg.cantidad_actual,
            sg.ubicacion,
            'General' AS TipoInventario
        FROM StockGeneral sg
        JOIN Productos p ON sg.producto_id = p.id
        JOIN Categorias c ON p.categoria_id = c.id
    )
    SELECT 
        *,
        (SELECT COUNT(*) FROM CombinedInventory 
         WHERE (@FilterType IS NULL OR TipoInventario = @FilterType)) AS TotalRecords
    FROM CombinedInventory
    WHERE (@FilterType IS NULL OR TipoInventario = @FilterType)
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