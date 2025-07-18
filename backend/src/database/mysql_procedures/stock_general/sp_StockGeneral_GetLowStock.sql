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
        p.marca,
        p.modelo,
        c.nombre AS categoria,
        sg.id AS stock_id,
        sg.cantidad_actual,
        p.stock_minimo,
        sg.ubicacion,
        sg.ultima_actualizacion,
        (p.stock_minimo - sg.cantidad_actual) AS cantidad_faltante
    FROM 
        StockGeneral sg
    INNER JOIN Productos p ON sg.producto_id = p.id
    INNER JOIN Categorias c ON p.categoria_id = c.id
    WHERE 
        sg.cantidad_actual < p.stock_minimo
        AND p.activo = 1
        AND (p_categoria_id IS NULL OR p.categoria_id = p_categoria_id)
    ORDER BY 
        cantidad_faltante DESC,
        c.nombre,
        p.marca,
        p.modelo;
END //

DELIMITER ; 