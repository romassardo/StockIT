-- =============================================
-- Description: Cambia la contraseña de un usuario.
-- =============================================

DROP PROCEDURE IF EXISTS sp_User_ChangePassword;

DELIMITER //

CREATE PROCEDURE sp_User_ChangePassword(
    IN p_user_id INT,
    IN p_new_password_hash VARCHAR(255),
    IN p_usuario_ejecutor_id INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- Verificar que el usuario existe
    IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE id = p_user_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Usuario no encontrado';
    END IF;

    START TRANSACTION;

    UPDATE Usuarios
    SET 
        password_hash = p_new_password_hash
    WHERE id = p_user_id;

    CALL sp_Log_Create(
        p_usuario_ejecutor_id,
        'Usuarios',
        'UPDATE',
        p_user_id,
        JSON_OBJECT('password_changed_at', NOW()),
        NULL
    );

    COMMIT;

    SELECT 'Contraseña actualizada exitosamente' AS mensaje;

END //

DELIMITER ;
