-- =============================================
-- Description: Actualiza un usuario existente.
-- =============================================

DROP PROCEDURE IF EXISTS sp_User_Update;

DELIMITER //

CREATE PROCEDURE sp_User_Update(
    IN p_user_id INT,
    IN p_nombre VARCHAR(100),
    IN p_email VARCHAR(100),
    IN p_password_hash VARCHAR(255),
    IN p_rol VARCHAR(20),
    IN p_activo BOOLEAN,
    IN p_usuario_ejecutor_id INT
)
BEGIN
    DECLARE v_old_data JSON;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- Capturar datos antiguos y validar existencia
    SELECT JSON_OBJECT(
            'nombre', nombre,
            'email', email,
            'rol', rol,
            'activo', activo
        )
    INTO v_old_data
    FROM Usuarios
    WHERE id = p_user_id;

    IF v_old_data IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Usuario no encontrado';
    END IF;

    -- Validaciones
    IF EXISTS (SELECT 1 FROM Usuarios WHERE email = p_email AND id != p_user_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El email ya está en uso por otro usuario';
    END IF;

    IF p_rol IS NOT NULL AND NOT (p_rol IN ('admin', 'usuario')) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El rol debe ser "admin" o "usuario"';
    END IF;

    START TRANSACTION;

    UPDATE Usuarios
    SET
        nombre = COALESCE(p_nombre, nombre),
        email = COALESCE(p_email, email),
        password_hash = COALESCE(p_password_hash, password_hash),
        rol = COALESCE(p_rol, rol),
        activo = COALESCE(p_activo, activo)
    WHERE id = p_user_id;

    CALL sp_Log_Create(
        p_usuario_ejecutor_id,
        'Usuarios',
        'UPDATE',
        p_user_id,
        v_old_data,
        JSON_OBJECT(
            'nombre', COALESCE(p_nombre, JSON_UNQUOTE(JSON_EXTRACT(v_old_data, '$.nombre'))),
            'email', COALESCE(p_email, JSON_UNQUOTE(JSON_EXTRACT(v_old_data, '$.email'))),
            'rol', COALESCE(p_rol, JSON_UNQUOTE(JSON_EXTRACT(v_old_data, '$.rol'))),
            'activo', COALESCE(p_activo, JSON_EXTRACT(v_old_data, '$.activo')),
            'password_changed', (p_password_hash IS NOT NULL)
        )
    );

    COMMIT;

    SELECT 'Usuario actualizado exitosamente' AS mensaje;

END //

DELIMITER ;
