
CREATE PROCEDURE sp_InventarioIndividual_GetByProducto
    @producto_id INT,
    @estado NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validar que el producto existe
    IF NOT EXISTS (SELECT 1 FROM Productos WHERE id = @producto_id)
    BEGIN
        THROW 50001, N'El producto no existe', 1;
        RETURN;
    END
    
    -- Validar que el producto usa nÃºmero de serie
    DECLARE @usa_numero_serie BIT;
    SELECT @usa_numero_serie = usa_numero_serie FROM Productos WHERE id = @producto_id;
    
    IF @usa_numero_serie = 0
    BEGIN
        THROW 50002, N'Este producto no utiliza inventario individual', 1;
        RETURN;
    END
    
    -- Validar que el estado sea vÃ¡lido (si se proporciona)
    IF @estado IS NOT NULL AND @estado NOT IN (N'Disponible', N'Asignado', N'En ReparaciÃ³n', N'Dado de Baja')
    BEGIN
        THROW 50008, N'Estado no vÃ¡lido. Los estados permitidos son: Disponible, Asignado, En ReparaciÃ³n, Dado de Baja', 1;
        RETURN;
    END
    
    SELECT 
        ii.id,
        ii.producto_id,
        p.marca AS producto_marca,
        p.modelo AS producto_modelo,
        c.nombre AS categoria_nombre,
        ii.numero_serie,
        ii.estado,
        ii.fecha_ingreso,
        ii.fecha_baja,
        ii.motivo_baja
    FROM 
        InventarioIndividual ii
    INNER JOIN 
        Productos p ON ii.producto_id = p.id
    INNER JOIN 
        Categorias c ON p.categoria_id = c.id
    WHERE 
        ii.producto_id = @producto_id
        AND (@estado IS NULL OR ii.estado = @estado)
    ORDER BY 
        ii.estado ASC,
        ii.fecha_ingreso DESC;
END;
