-- =============================================
-- Description: Obtiene una lista de todos los productos con filtros y paginación
-- =============================================
DROP PROCEDURE IF EXISTS sp_Producto_GetAll;

DELIMITER //

CREATE PROCEDURE sp_Producto_GetAll(
    IN p_categoria_id INT,
    IN p_categoria_nombre VARCHAR(100),
    IN p_usa_numero_serie BOOLEAN,
    IN p_activo BOOLEAN,
    IN p_page INT,
    IN p_limit INT
)
BEGIN
    DECLARE v_offset INT;
    
    -- Calcular offset para paginación
    SET v_offset = (p_page - 1) * p_limit;
    
    SELECT
        p.id,
        p.categoria_id,
        c.nombre AS categoria_nombre,
        p.marca,
        p.modelo,
        p.descripcion,
        p.stock_minimo,
        p.usa_numero_serie,
        p.activo,
        p.fecha_creacion,
        p.fecha_modificacion
    FROM
        Productos p
    INNER JOIN
        Categorias c ON p.categoria_id = c.id
    WHERE
        (p_categoria_id IS NULL OR p.categoria_id = p_categoria_id)
        AND (p_categoria_nombre IS NULL OR c.nombre LIKE CONCAT('%', p_categoria_nombre, '%'))
        AND (p_usa_numero_serie IS NULL OR p.usa_numero_serie = p_usa_numero_serie)
        AND (p_activo IS NULL OR p.activo = p_activo)
    ORDER BY
        p.modelo ASC
    LIMIT p_limit OFFSET v_offset;
END //

DELIMITER ;
