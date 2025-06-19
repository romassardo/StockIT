-- sp_StockGeneral_GetAll.sql
-- Archivo creado para reflejar el Stored Procedure existente en la base de datos

CREATE OR ALTER PROCEDURE sp_StockGeneral_GetAll
    @categoria_id INT = NULL,
    @solo_bajo_stock BIT = 0,
    @producto_id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        sg.producto_id,
        p.modelo AS nombre_producto, -- CORREGIDO: Usar p.modelo
        p.descripcion AS descripcion_producto,
        -- p.codigo_barra, -- Columna no encontrada en sp_help Productos
        -- p.imagen_url, -- Columna no encontrada en sp_help Productos
        -- p.unidad_medida, -- Columna no encontrada en sp_help Productos
        ISNULL(p.stock_minimo, 0) AS min_stock,
        -- ISNULL(p.max_stock, 0) AS max_stock, -- Columna no encontrada en sp_help Productos
        c.id AS categoria_id,
        c.nombre AS nombre_categoria,
        NULL AS marca_id,  -- No hay ID de marca si la marca es un campo de texto en Productos
        p.marca AS nombre_marca, -- Tomamos la marca de la tabla Productos
        sg.cantidad_actual,
        sg.ultima_actualizacion AS ultima_modificacion,
        (CASE WHEN sg.cantidad_actual < ISNULL(p.stock_minimo, 0) THEN 1 ELSE 0 END) AS alerta_stock_bajo
    FROM
        StockGeneral sg
    INNER JOIN
        Productos p ON sg.producto_id = p.id
    INNER JOIN
        Categorias c ON p.categoria_id = c.id
    WHERE
        p.activo = 1
        AND p.usa_numero_serie = 0
        AND (@categoria_id IS NULL OR p.categoria_id = @categoria_id)
        AND (@producto_id IS NULL OR sg.producto_id = @producto_id)
        AND (@solo_bajo_stock = 0 OR sg.cantidad_actual < ISNULL(p.stock_minimo, 0))
    ORDER BY
        p.modelo ASC; -- CORREGIDO: Usar p.modelo
END
GO
