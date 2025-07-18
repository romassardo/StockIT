
CREATE PROCEDURE sp_StockGeneral_GetByProductoId
    @producto_id_param INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        p.id AS producto_id,
        p.marca AS producto_nombre, -- Corregido de p.nombre a p.marca
        p.descripcion AS producto_descripcion,
        p.categoria_id,
        c.nombre AS categoria_nombre,
        sg.cantidad_actual,
        sg.ubicacion,
        sg.fecha_modificacion AS fecha_modificacion_stock,
        p.stock_minimo,
        p.activo AS producto_activo,
        p.usa_numero_serie
    FROM Productos p
    INNER JOIN StockGeneral sg ON p.id = sg.producto_id
    INNER JOIN Categorias c ON p.categoria_id = c.id
    WHERE p.id = @producto_id_param -- Usar el parámetro renombrado
      AND p.activo = 1
      AND p.usa_numero_serie = 0;
END