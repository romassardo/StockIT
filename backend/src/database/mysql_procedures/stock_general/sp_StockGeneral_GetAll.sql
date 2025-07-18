-- =============================================
-- Description: Obtiene una lista de todos los productos en el stock general, con filtros.
-- =============================================
DROP PROCEDURE IF EXISTS sp_StockGeneral_GetAll;

DELIMITER //

CREATE PROCEDURE sp_StockGeneral_GetAll(
    IN p_categoria_id INT,
    IN p_solo_bajo_stock BOOLEAN,
    IN p_producto_id INT
)
BEGIN
    SELECT
        sg.producto_id,
        p.modelo AS nombre_producto,
        p.marca AS nombre_marca,
        p.descripcion AS descripcion_producto,
        c.id AS categoria_id,
        c.nombre AS nombre_categoria,
        sg.cantidad_actual,
        IFNULL(p.stock_minimo, 0) AS min_stock,
        sg.ultima_actualizacion AS ultima_modificacion,
        (CASE WHEN sg.cantidad_actual < IFNULL(p.stock_minimo, 0) THEN 1 ELSE 0 END) AS alerta_stock_bajo
    FROM
        StockGeneral sg
    INNER JOIN
        Productos p ON sg.producto_id = p.id
    INNER JOIN
        Categorias c ON p.categoria_id = c.id
    WHERE
        p.activo = 1
        AND p.usa_numero_serie = 0
        AND (p_categoria_id IS NULL OR p.categoria_id = p_categoria_id)
        AND (p_producto_id IS NULL OR sg.producto_id = p_producto_id)
        AND (p_solo_bajo_stock = FALSE OR sg.cantidad_actual < IFNULL(p.stock_minimo, 0))
    ORDER BY
        p.modelo ASC;
END //

DELIMITER ; 