-- =============================================
-- Description: Registra la devolución de un activo asignado, actualizando la asignación y el estado del activo.
-- =============================================
DROP PROCEDURE IF EXISTS sp_Assignment_Return;

DELIMITER //

CREATE PROCEDURE sp_Assignment_Return(
    IN p_assignment_id INT,
    IN p_observaciones TEXT,
    IN p_usuario_id INT
)
BEGIN
    DECLARE v_inventario_id INT;
    DECLARE v_json_old TEXT;
    DECLARE v_json_new TEXT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Obtener información de la asignación activa y bloquearla
    SELECT inventario_individual_id
    INTO v_inventario_id
    FROM Asignaciones 
    WHERE id = p_assignment_id AND activa = 1
    FOR UPDATE;
    
    IF v_inventario_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Asignación no encontrada o ya fue devuelta.';
    END IF;

    -- Actualizar asignación
    UPDATE Asignaciones 
    SET 
        activa = 0,
        fecha_devolucion = NOW(),
        usuario_recibe_id = p_usuario_id,
        fecha_modificacion = NOW(),
        observaciones = IF(p_observaciones IS NOT NULL, 
                           CONCAT(IFNULL(observaciones, ''), ' | DEVOLUCIÓN: ', p_observaciones), 
                           observaciones)
    WHERE id = p_assignment_id;

    -- Actualizar estado del inventario
    UPDATE InventarioIndividual 
    SET 
        estado = 'Disponible', 
        fecha_modificacion = NOW()
    WHERE id = v_inventario_id;

    -- Log de actividad
    SET v_json_old = JSON_OBJECT('activa', 1);
    SET v_json_new = JSON_OBJECT('activa', 0, 'fecha_devolucion', NOW(), 'observaciones_devolucion', p_observaciones);

    CALL sp_Log_Create(
        p_usuario_id,
        'Asignaciones',
        'UPDATE',
        p_assignment_id,
        v_json_old,
        v_json_new
    );

    COMMIT;

    SELECT 'Devolución registrada exitosamente' AS message;

END //

DELIMITER ; 