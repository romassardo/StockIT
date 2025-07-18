-- =============================================
-- Description: Genera un reporte del stock disponible, combinando inventario individual y general.
-- =============================================
DROP PROCEDURE IF EXISTS sp_Report_StockDisponible;

DELIMITER //

CREATE PROCEDURE sp_Report_StockDisponible(
    IN p_PageNumber INT,
    IN p_PageSize INT,
    IN p_FilterType VARCHAR(50),
    IN p_FilterCategoria VARCHAR(100),
    IN p_SortBy VARCHAR(50),
    IN p_SortOrder VARCHAR(4)
)
BEGIN
    DECLARE v_offset INT;
    DECLARE v_page_size INT;

    SET v_page_size = IF(p_PageSize < 1 OR p_PageSize IS NULL, 20, LEAST(p_PageSize, 100));
    SET v_offset = (IF(p_PageNumber < 1 OR p_PageNumber IS NULL, 1, p_PageNumber) - 1) * v_page_size;

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
        WHERE sg.cantidad_actual > 0
    ),
    FilteredStock AS (
        SELECT 
            ProductoId, Categoria, marca, modelo, descripcion, cantidad_disponible, TipoInventario
        FROM StockDisponibleAgrupado
        WHERE (p_FilterType IS NULL OR TipoInventario = p_FilterType)
          AND (p_FilterCategoria IS NULL OR Categoria = p_FilterCategoria)
    )
    SELECT 
        *,
        (SELECT COUNT(*) FROM FilteredStock) AS TotalRecords
    FROM FilteredStock
    ORDER BY
        CASE WHEN p_SortBy = 'Categoria' AND p_SortOrder = 'ASC' THEN Categoria END ASC,
        CASE WHEN p_SortBy = 'Categoria' AND p_SortOrder = 'DESC' THEN Categoria END DESC,
        CASE WHEN p_SortBy = 'Marca' AND p_SortOrder = 'ASC' THEN marca END ASC,
        CASE WHEN p_SortBy = 'Marca' AND p_SortOrder = 'DESC' THEN marca END DESC,
        CASE WHEN p_SortBy = 'Modelo' AND p_SortOrder = 'ASC' THEN modelo END ASC,
        CASE WHEN p_SortBy = 'Modelo' AND p_SortOrder = 'DESC' THEN modelo END DESC,
        CASE WHEN p_SortBy = 'Cantidad' AND p_SortOrder = 'ASC' THEN cantidad_disponible END ASC,
        CASE WHEN p_SortBy = 'Cantidad' AND p_SortOrder = 'DESC' THEN cantidad_disponible END DESC,
        modelo ASC -- Sorteo por defecto
    LIMIT v_page_size OFFSET v_offset;

END //

DELIMITER ; 