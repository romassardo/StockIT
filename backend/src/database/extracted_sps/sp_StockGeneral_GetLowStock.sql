
CREATE PROCEDURE sp_StockGeneral_GetLowStock
    @categoria_id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Consultar productos con stock bajo el mÃ­nimo
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
        p.stock_minimo - sg.cantidad_actual AS cantidad_faltante
    FROM 
        StockGeneral sg
        INNER JOIN Productos p ON sg.producto_id = p.id
        INNER JOIN Categorias c ON p.categoria_id = c.id
    WHERE 
        sg.cantidad_actual < p.stock_minimo
        AND p.activo = 1
        AND (@categoria_id IS NULL OR p.categoria_id = @categoria_id)
    ORDER BY 
        (p.stock_minimo - sg.cantidad_actual) DESC, -- Ordenar por mayor dÃ©ficit primero
        c.nombre,
        p.marca,
        p.modelo;
END;
