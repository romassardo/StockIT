-- =============================================
-- Description: Activa o desactiva un usuario.
-- =============================================

DROP PROCEDURE IF EXISTS sp_User_ToggleActive;

DELIMITER //

CREATE PROCEDURE sp_User_ToggleActive(
    IN p_user_id INT,
    IN p_usuario_ejecutor_id INT
)
BEGIN
    DECLARE v_current_status BOOLEAN;
    DECLARE v_new_status BOOLEAN;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- Verificar que el usuario existe y obtener estado actual
    SELECT activo INTO v_current_status 
    FROM Usuarios 
    WHERE id = p_user_id;
    
    IF v_current_status IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Usuario no encontrado';
    END IF;

    -- Cambiar el estado
    SET v_new_status = NOT v_current_status;

    START TRANSACTION;

    UPDATE Usuarios 
    SET activo = v_new_status
    WHERE id = p_user_id;

    CALL sp_Log_Create(
        p_usuario_ejecutor_id,
        'Usuarios',
        'UPDATE (Toggle Active)',
        p_user_id,
        JSON_OBJECT('activo', v_current_status),
        JSON_OBJECT('activo', v_new_status)
    );

    COMMIT;

    SELECT 
        CASE 
            WHEN v_new_status = 1 THEN 'Usuario activado exitosamente'
            ELSE 'Usuario desactivado exitosamente'
        END AS mensaje;

END //

DELIMITER ;
