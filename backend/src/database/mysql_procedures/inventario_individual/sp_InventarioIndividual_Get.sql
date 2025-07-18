-- =============================================
-- Description: Obtiene la información detallada de un ítem del inventario individual.
-- =============================================
DROP PROCEDURE IF EXISTS sp_InventarioIndividual_Get;

DELIMITER //

CREATE PROCEDURE sp_InventarioIndividual_Get(
    IN p_inventario_id INT
)
BEGIN
    -- Verificar que el ítem existe
    IF NOT EXISTS (SELECT 1 FROM InventarioIndividual WHERE id = p_inventario_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El ítem de inventario no existe';
    END IF;
    
    -- Obtener información detallada del ítem, incluyendo información del producto
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
        
        -- Información de asignación actual (si está asignado)
        (SELECT a.id 
         FROM Asignaciones a 
         WHERE a.inventario_individual_id = ii.id AND a.activa = 1
         ORDER BY a.fecha_asignacion DESC
         LIMIT 1) AS asignacion_actual_id,
        
        -- Información de reparación actual (si está en reparación)
        (SELECT r.id 
         FROM Reparaciones r 
         WHERE r.inventario_individual_id = ii.id AND r.estado = 'En Reparación'
         ORDER BY r.fecha_envio DESC
         LIMIT 1) AS reparacion_actual_id
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
        ii.id = p_inventario_id;

END //

DELIMITER ; 