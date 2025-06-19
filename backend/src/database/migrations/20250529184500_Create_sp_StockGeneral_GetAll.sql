CREATE OR ALTER PROCEDURE sp_StockGeneral_GetAll
    @categoria_id INT = NULL,
    @solo_bajo_stock BIT = 0,
    @producto_id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        sg.producto_id,
        p.nombre AS nombre_producto,
        p.descripcion AS descripcion_producto,
        p.codigo_barra,
        p.imagen_url,
        p.unidad_medida,
        ISNULL(p.min_stock, 0) AS min_stock,
        ISNULL(p.max_stock, 0) AS max_stock,
        c.id AS categoria_id,
        c.nombre AS nombre_categoria,
        m.id AS marca_id,
        m.nombre AS nombre_marca,
        sg.cantidad_actual,
        sg.ultima_modificacion,
        (CASE WHEN sg.cantidad_actual < ISNULL(p.min_stock, 0) THEN 1 ELSE 0 END) AS alerta_stock_bajo
    FROM 
        StockGeneral sg
    INNER JOIN 
        Productos p ON sg.producto_id = p.id
    INNER JOIN 
        Categorias c ON p.categoria_id = c.id
    INNER JOIN
        Marca m ON p.marca_id = m.id
    WHERE
        p.activo = 1
        AND p.usa_numero_serie = 0
        AND (@categoria_id IS NULL OR p.categoria_id = @categoria_id)
        AND (@producto_id IS NULL OR sg.producto_id = @producto_id)
        AND (@solo_bajo_stock = 0 OR sg.cantidad_actual < ISNULL(p.min_stock, 0))
    ORDER BY
        p.nombre ASC;
END
GO
