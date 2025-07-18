-- =============================================
-- Description: Crea un nuevo usuario.
-- =============================================

DROP PROCEDURE IF EXISTS sp_User_Create;

DELIMITER //

CREATE PROCEDURE sp_User_Create(
    IN p_nombre VARCHAR(100),
    IN p_email VARCHAR(100),
    IN p_password_hash VARCHAR(255),
    IN p_rol VARCHAR(20),
    IN p_usuario_ejecutor_id INT
)
BEGIN
    DECLARE v_user_id INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- Validaciones
    IF EXISTS (SELECT 1 FROM Usuarios WHERE email = p_email) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El email ya existe en el sistema';
    END IF;

    IF NOT (p_rol IN ('admin', 'usuario')) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El rol debe ser "admin" o "usuario"';
    END IF;

    START TRANSACTION;

    INSERT INTO Usuarios (nombre, email, password_hash, rol, activo, fecha_creacion)
    VALUES (p_nombre, p_email, p_password_hash, p_rol, 1, NOW());

    SET v_user_id = LAST_INSERT_ID();

    CALL sp_Log_Create(
        p_usuario_ejecutor_id,
        'Usuarios',
        'INSERT',
        v_user_id,
        NULL,
        JSON_OBJECT(
            'nombre', p_nombre,
            'email', p_email,
            'rol', p_rol,
            'activo', 1
        )
    );

    COMMIT;

    SELECT v_user_id AS id, 'Usuario creado exitosamente' AS mensaje;

END //

DELIMITER ;
