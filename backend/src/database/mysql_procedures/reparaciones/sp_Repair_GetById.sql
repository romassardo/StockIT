-- =============================================
-- Description: Obtiene los detalles de un registro de reparación específico por su ID.
-- =============================================
DROP PROCEDURE IF EXISTS sp_Repair_GetById;

DELIMITER //

CREATE PROCEDURE sp_Repair_GetById(
    IN p_ReparacionID INT
)
BEGIN
    SELECT 
        r.id AS reparacion_id,
        r.inventario_individual_id,
        i.numero_serie,
        p.modelo AS producto_modelo,
        r.fecha_envio,
        r.fecha_retorno,
        r.problema_descripcion,
        r.solucion_descripcion,
        r.estado,
        r.proveedor,
        u_envia.nombre AS usuario_envia,
        u_recibe.nombre AS usuario_recibe,
        DATEDIFF(IFNULL(r.fecha_retorno, NOW()), r.fecha_envio) AS dias_reparacion
    FROM 
        Reparaciones r
    INNER JOIN Usuarios u_envia ON r.usuario_envia_id = u_envia.id
    INNER JOIN InventarioIndividual i ON r.inventario_individual_id = i.id
    INNER JOIN Productos p ON i.producto_id = p.id
    LEFT JOIN Usuarios u_recibe ON r.usuario_recibe_id = u_recibe.id
    WHERE 
        r.id = p_ReparacionID;
END //

DELIMITER ; 