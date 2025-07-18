-- =============================================
-- Description: Obtiene productos filtrando por si usan o no número de serie.
-- =============================================

DROP PROCEDURE IF EXISTS sp_Productos_GetByUsaNumeroSerie;

DELIMITER //

CREATE PROCEDURE sp_Productos_GetByUsaNumeroSerie(
    IN p_usa_numero_serie BOOLEAN
)
BEGIN
    SELECT
        p.id,
        p.id as producto_id,
        CONCAT(p.marca, ' ', p.modelo) as nombre_producto,
        p.descripcion,
        p.modelo,
        p.marca,
        p.marca as nombre_marca,
        c.id as categoria_id,
        c.nombre as nombre_categoria,
        p.usa_numero_serie,
        p.activo
    FROM
        Productos p
    INNER JOIN
        Categorias c ON p.categoria_id = c.id
    WHERE
        p.usa_numero_serie = p_usa_numero_serie
        AND p.activo = 1
    ORDER BY
        p.marca, p.modelo;
END //

DELIMITER ;
