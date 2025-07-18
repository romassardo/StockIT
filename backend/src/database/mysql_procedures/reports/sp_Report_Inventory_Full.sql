DELIMITER $$

CREATE PROCEDURE `sp_Report_Inventory_Full`(
    IN `p_PageNumber` INT,
    IN `p_PageSize` INT,
    IN `p_FilterType` VARCHAR(50), -- 'Serializado', 'General', NULL para todos
    IN `p_SortBy` VARCHAR(50),
    IN `p_SortOrder` VARCHAR(4)
)
BEGIN
    -- Declaración de variables para paginación
    DECLARE v_Offset INT;
    SET v_Offset = (p_PageNumber - 1) * p_PageSize;

    -- CTE para combinar ambos tipos de inventario
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

        -- Stock General (sin número de serie)
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
    ),
    FilteredInventory AS (
        SELECT 
            *,
            COUNT(*) OVER() AS TotalRecords
        FROM CombinedInventory
        WHERE (p_FilterType IS NULL OR TipoInventario = p_FilterType)
    )
    SELECT *
    FROM FilteredInventory
    ORDER BY
        CASE WHEN p_SortBy = 'Categoria' AND p_SortOrder = 'ASC' THEN Categoria END ASC,
        CASE WHEN p_SortBy = 'Categoria' AND p_SortOrder = 'DESC' THEN Categoria END DESC,
        CASE WHEN p_SortBy = 'Marca' AND p_SortOrder = 'ASC' THEN marca END ASC,
        CASE WHEN p_SortBy = 'Marca' AND p_SortOrder = 'DESC' THEN marca END DESC,
        CASE WHEN p_SortBy = 'Modelo' AND p_SortOrder = 'ASC' THEN modelo END ASC,
        CASE WHEN p_SortBy = 'Modelo' AND p_SortOrder = 'DESC' THEN modelo END DESC,
        ProductoId ASC -- Ordenamiento por defecto
    LIMIT v_Offset, p_PageSize;

END$$

DELIMITER ; 