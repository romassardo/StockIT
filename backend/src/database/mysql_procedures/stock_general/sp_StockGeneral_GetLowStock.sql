-- =============================================
-- Description: Obtiene una lista de productos cuyo stock actual está por debajo del mínimo definido.
-- =============================================
DROP PROCEDURE IF EXISTS sp_StockGeneral_GetLowStock;

DELIMITER //

CREATE PROCEDURE sp_StockGeneral_GetLowStock(
    IN p_categoria_id INT
)
BEGIN
    SELECT 
        p.id AS producto_id,
        p.modelo AS nombre_producto,
        p.marca AS nombre_marca,
        c.nombre AS nombre_categoria,
        sg.id AS stock_id,
        sg.cantidad_actual,
        p.stock_minimo AS min_stock,
        (p.stock_minimo - sg.cantidad_actual) AS diferencia,
        IF(p.stock_minimo > 0, (sg.cantidad_actual / p.stock_minimo) * 100, 0) AS porcentaje_disponible,
        sg.ubicacion,
        sg.ultima_actualizacion
    FROM 
        StockGeneral sg
    INNER JOIN Productos p ON sg.producto_id = p.id
    INNER JOIN Categorias c ON p.categoria_id = c.id
    WHERE 
        sg.cantidad_actual < p.stock_minimo
        AND p.activo = 1
        AND (p_categoria_id IS NULL OR p.categoria_id = p_categoria_id)
    ORDER BY 
        diferencia DESC,
        c.nombre,
        p.marca,
        p.modelo;
END //

DELIMITER ; 