
CREATE PROCEDURE sp_InventarioIndividual_GetByEstado
    @estado NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validar que el estado sea vÃ¡lido
    IF @estado NOT IN (N'Disponible', N'Asignado', N'En ReparaciÃ³n', N'Dado de Baja')
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
        ii.motivo_baja,
        
        -- InformaciÃ³n de asignaciÃ³n (si aplica)
        CASE WHEN @estado = N'Asignado' THEN
            (SELECT TOP 1 a.id FROM Asignaciones a WHERE a.inventario_individual_id = ii.id AND a.activa = 1)
        ELSE NULL END AS asignacion_id,
        
        -- InformaciÃ³n de reparaciÃ³n (si aplica)
        CASE WHEN @estado = N'En ReparaciÃ³n' THEN
            (SELECT TOP 1 r.id FROM Reparaciones r WHERE r.inventario_individual_id = ii.id AND r.estado = N'En ReparaciÃ³n')
        ELSE NULL END AS reparacion_id
        
    FROM 
        InventarioIndividual ii
    INNER JOIN 
        Productos p ON ii.producto_id = p.id
    INNER JOIN 
        Categorias c ON p.categoria_id = c.id
    WHERE 
        ii.estado = @estado
    ORDER BY 
        ii.fecha_modificacion DESC;
END;
