-- =============================================
-- Description: Cancela un proceso de reparación en curso, devolviendo el activo al estado 'Disponible'.
-- =============================================
DROP PROCEDURE IF EXISTS sp_Repair_Cancel;

DELIMITER //

CREATE PROCEDURE sp_Repair_Cancel(
    IN p_reparacion_id INT,
    IN p_motivo_cancelacion TEXT,
    IN p_usuario_id INT
)
BEGIN
    DECLARE v_inventario_id INT;
    DECLARE v_estado_actual_reparacion VARCHAR(20);
    DECLARE v_json_old TEXT;
    DECLARE v_json_new TEXT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Verificar que la reparación existe y está 'En Reparación'
    SELECT r.inventario_individual_id, r.estado
    INTO v_inventario_id, v_estado_actual_reparacion
    FROM Reparaciones r
    WHERE r.id = p_reparacion_id FOR UPDATE;

    IF v_inventario_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La reparación especificada no existe';
    END IF;

    IF v_estado_actual_reparacion != 'En Reparación' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Solo se pueden cancelar reparaciones con estado "En Reparación"';
    END IF;
    
    IF p_motivo_cancelacion IS NULL OR LENGTH(p_motivo_cancelacion) < 5 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Debe proporcionar un motivo de cancelación válido';
    END IF;

    -- Actualizar registro de reparación
    UPDATE Reparaciones
    SET 
        estado = 'Cancelado',
        fecha_retorno = NOW(),
        solucion_descripcion = CONCAT('Cancelado: ', p_motivo_cancelacion),
        usuario_recibe_id = p_usuario_id,
        fecha_modificacion = NOW()
    WHERE id = p_reparacion_id;

    -- Actualizar estado del inventario (volver a disponible)
    UPDATE InventarioIndividual
    SET 
        estado = 'Disponible',
        fecha_modificacion = NOW()
    WHERE id = v_inventario_id;

    -- Registrar actividad
    SET v_json_old = JSON_OBJECT('estado_reparacion', v_estado_actual_reparacion);
    SET v_json_new = JSON_OBJECT('estado_reparacion', 'Cancelado', 'motivo', p_motivo_cancelacion);
    CALL sp_Log_Create(
        p_usuario_id, 'Reparaciones', 'CANCEL', p_reparacion_id, v_json_old, v_json_new
    );

    COMMIT;

END //

DELIMITER ; 