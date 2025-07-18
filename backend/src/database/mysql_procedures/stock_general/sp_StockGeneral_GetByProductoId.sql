-- =============================================
-- Description: Obtiene la información de stock para un producto específico.
-- =============================================
DROP PROCEDURE IF EXISTS sp_StockGeneral_GetByProductoId;

DELIMITER //

CREATE PROCEDURE sp_StockGeneral_GetByProductoId(
    IN p_producto_id_param INT
)
BEGIN
    SELECT
        p.id AS producto_id,
        p.marca AS producto_marca,
        p.modelo AS producto_modelo,
        p.descripcion AS producto_descripcion,
        p.categoria_id,
        c.nombre AS categoria_nombre,
        sg.cantidad_actual,
        sg.ubicacion,
        sg.ultima_actualizacion AS fecha_modificacion_stock,
        p.stock_minimo,
        p.activo AS producto_activo,
        p.usa_numero_serie
    FROM Productos p
    INNER JOIN StockGeneral sg ON p.id = sg.producto_id
    INNER JOIN Categorias c ON p.categoria_id = c.id
    WHERE p.id = p_producto_id_param
      AND p.activo = 1
      AND p.usa_numero_serie = 0;
END //

DELIMITER ; 