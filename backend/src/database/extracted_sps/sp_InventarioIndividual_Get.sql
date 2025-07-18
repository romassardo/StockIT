
CREATE PROCEDURE sp_InventarioIndividual_Get
    @inventario_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Verificar que el Ã­tem existe
    IF NOT EXISTS (SELECT 1 FROM InventarioIndividual WHERE id = @inventario_id)
    BEGIN
        THROW 50004, N'El Ã­tem de inventario no existe', 1;
        RETURN;
    END
    
    -- Obtener informaciÃ³n detallada del Ã­tem, incluyendo informaciÃ³n del producto
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
        ii.fecha_creacion,
        ii.fecha_modificacion,
        ua.nombre AS usuario_alta_nombre,
        ub.nombre AS usuario_baja_nombre,
        
        -- InformaciÃ³n de asignaciÃ³n actual (si estÃ¡ asignado)
        (SELECT TOP 1 a.id 
         FROM Asignaciones a 
         WHERE a.inventario_individual_id = ii.id AND a.activa = 1) AS asignacion_actual_id,
        
        -- InformaciÃ³n de reparaciÃ³n actual (si estÃ¡ en reparaciÃ³n)
        (SELECT TOP 1 r.id 
         FROM Reparaciones r 
         WHERE r.inventario_individual_id = ii.id AND r.estado = N'En ReparaciÃ³n') AS reparacion_actual_id
    FROM 
        InventarioIndividual ii
    INNER JOIN 
        Productos p ON ii.producto_id = p.id
    INNER JOIN 
        Categorias c ON p.categoria_id = c.id
    INNER JOIN 
        Usuarios ua ON ii.usuario_alta_id = ua.id
    LEFT JOIN 
        Usuarios ub ON ii.usuario_baja_id = ub.id
    WHERE 
        ii.id = @inventario_id;
END;
