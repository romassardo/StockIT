-- =============================================
-- Description: Obtiene todos los ítems de inventario que coinciden con un estado específico.
-- =============================================
DROP PROCEDURE IF EXISTS sp_InventarioIndividual_GetByEstado;

DELIMITER //

CREATE PROCEDURE sp_InventarioIndividual_GetByEstado(
    IN p_estado VARCHAR(20)
)
BEGIN
    -- Validar que el estado sea válido
    IF p_estado NOT IN ('Disponible', 'Asignado', 'En Reparación', 'Dado de Baja') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Estado no válido. Los estados permitidos son: Disponible, Asignado, En Reparación, Dado de Baja';
    END IF;
    
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
        
        -- Información de asignación (si aplica)
        CASE WHEN p_estado = 'Asignado' THEN
            (SELECT a.id FROM Asignaciones a WHERE a.inventario_individual_id = ii.id AND a.activa = 1 ORDER BY a.fecha_asignacion DESC LIMIT 1)
        ELSE NULL END AS asignacion_id,
        
        -- Información de reparación (si aplica)
        CASE WHEN p_estado = 'En Reparación' THEN
            (SELECT r.id FROM Reparaciones r WHERE r.inventario_individual_id = ii.id AND r.estado = 'En Reparación' ORDER BY r.fecha_envio DESC LIMIT 1)
        ELSE NULL END AS reparacion_id
        
    FROM 
        InventarioIndividual ii
    INNER JOIN 
        Productos p ON ii.producto_id = p.id
    INNER JOIN 
        Categorias c ON p.categoria_id = c.id
    WHERE 
        ii.estado = p_estado
    ORDER BY 
        ii.fecha_modificacion DESC;

END //

DELIMITER ; 