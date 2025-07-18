-- =============================================
-- Description: Obtiene una lista paginada de items del inventario individual con filtros.
-- =============================================
DROP PROCEDURE IF EXISTS sp_InventarioIndividual_GetAll;

DELIMITER //

CREATE PROCEDURE sp_InventarioIndividual_GetAll(
    IN p_estado VARCHAR(20),
    IN p_categoria_id INT,
    IN p_search VARCHAR(255),
    IN p_activos_only BOOLEAN,
    IN p_PageNumber INT,
    IN p_PageSize INT
)
BEGIN
    DECLARE v_offset INT;
    DECLARE v_page_size INT;

    SET v_page_size = IF(p_PageSize < 1 OR p_PageSize IS NULL, 28, LEAST(p_PageSize, 100));
    SET v_offset = (IF(p_PageNumber < 1 OR p_PageNumber IS NULL, 1, p_PageNumber) - 1) * v_page_size;

    SELECT
        ii.id,
        ii.producto_id,
        p.marca AS producto_marca,
        p.modelo AS producto_modelo,
        p.descripcion AS producto_descripcion,
        c.nombre AS categoria_nombre,
        c.id AS categoria_id,
        ii.numero_serie,
        ii.estado,
        ii.fecha_ingreso,
        ii.fecha_baja,
        ii.motivo_baja,
        ii.fecha_creacion,
        ii.fecha_modificacion,
        COUNT(*) OVER() AS TotalRows
    FROM
        InventarioIndividual ii
    INNER JOIN
        Productos p ON ii.producto_id = p.id
    INNER JOIN
        Categorias c ON p.categoria_id = c.id
    WHERE
        (
            -- Si se especifica un estado, ese filtro tiene prioridad
            (p_estado IS NOT NULL AND ii.estado = p_estado)
            OR
            -- Si no se especifica un estado, aplica la lógica por defecto
            (
                p_estado IS NULL 
                AND ii.estado != 'Asignado'
                AND (p_activos_only = FALSE OR ii.estado != 'Dado de Baja')
            )
        )
        AND (p_categoria_id IS NULL OR p.categoria_id = p_categoria_id)
        AND (p_search IS NULL OR (
            ii.numero_serie LIKE CONCAT('%', p_search, '%')
            OR p.marca LIKE CONCAT('%', p_search, '%')
            OR p.modelo LIKE CONCAT('%', p_search, '%')
            OR c.nombre LIKE CONCAT('%', p_search, '%')
            OR ii.estado LIKE CONCAT('%', p_search, '%')
        ))
    ORDER BY
        ii.fecha_creacion DESC
    LIMIT v_page_size OFFSET v_offset;

END //

DELIMITER ; 