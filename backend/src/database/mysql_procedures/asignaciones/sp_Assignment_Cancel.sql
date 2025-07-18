-- =============================================
-- Description: Cancela una asignación activa, devolviendo el activo al estado 'Disponible'.
-- =============================================
DROP PROCEDURE IF EXISTS sp_Assignment_Cancel;

DELIMITER //

CREATE PROCEDURE sp_Assignment_Cancel(
    IN p_assignment_id INT,
    IN p_motivo TEXT,
    IN p_usuario_id INT
)
BEGIN
    DECLARE v_inventario_individual_id INT;
    DECLARE v_current_activa BOOLEAN;
    DECLARE v_json_old TEXT;
    DECLARE v_json_new TEXT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Obtener información de la asignación y bloquearla
    SELECT inventario_individual_id, activa
    INTO v_inventario_individual_id, v_current_activa
    FROM Asignaciones
    WHERE id = p_assignment_id FOR UPDATE;

    IF v_inventario_individual_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Asignación no encontrada.';
    END IF;

    IF v_current_activa = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se puede cancelar una asignación que no está activa.';
    END IF;

    -- Actualizar asignación
    UPDATE Asignaciones
    SET 
        activa = 0,
        fecha_devolucion = NOW(),
        usuario_recibe_id = p_usuario_id,
        observaciones = CONCAT(IFNULL(observaciones, ''), ' | CANCELACIÓN: ', p_motivo)
    WHERE id = p_assignment_id;

    -- Actualizar estado del inventario
    UPDATE InventarioIndividual
    SET estado = 'Disponible', fecha_modificacion = NOW()
    WHERE id = v_inventario_individual_id;

    -- Log de actividad
    SET v_json_old = JSON_OBJECT('activa', 1);
    SET v_json_new = JSON_OBJECT('activa', 0, 'motivo_cancelacion', p_motivo);

    CALL sp_Log_Create(
        p_usuario_id,
        'Asignaciones',
        'CANCEL',
        p_assignment_id,
        v_json_old,
        v_json_new
    );

    COMMIT;

    SELECT 'Asignación cancelada exitosamente' AS message;

END //

DELIMITER ; 