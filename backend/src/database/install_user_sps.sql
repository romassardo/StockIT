-- Script para instalar stored procedures de usuarios en MySQL
USE stockit_mysql;

-- =============================================
-- sp_Log_Create (versión simple para no romper otros SPs)
-- =============================================
DROP PROCEDURE IF EXISTS sp_Log_Create;
DELIMITER //
CREATE PROCEDURE sp_Log_Create(
    IN p_usuario_id INT,
    IN p_tabla VARCHAR(100),
    IN p_accion VARCHAR(50),
    IN p_registro_id INT,
    IN p_datos_anteriores JSON,
    IN p_datos_nuevos JSON
)
BEGIN
    -- Simplemente no hace nada por ahora
    -- En producción aquí se insertaría en una tabla de logs
    SELECT 1;
END //
DELIMITER ;

-- =============================================
-- sp_User_GetAll - Obtiene usuarios con paginación
-- =============================================
DROP PROCEDURE IF EXISTS sp_User_GetAll;
DELIMITER //
CREATE PROCEDURE sp_User_GetAll(
    IN p_page INT,
    IN p_pageSize INT,
    IN p_search VARCHAR(255),
    IN p_rol VARCHAR(50),
    IN p_activo BOOLEAN
)
BEGIN
    DECLARE v_offset INT;
    DECLARE v_total INT;
    
    SET v_offset = (COALESCE(p_page, 1) - 1) * COALESCE(p_pageSize, 25);
    
    -- Contar total
    SELECT COUNT(*) INTO v_total
    FROM Usuarios
    WHERE (p_search IS NULL OR p_search = '' OR nombre LIKE CONCAT('%', p_search, '%') OR email LIKE CONCAT('%', p_search, '%'))
      AND (p_rol IS NULL OR p_rol = '' OR rol = p_rol)
      AND (p_activo IS NULL OR activo = p_activo);
    
    -- Retornar usuarios
    SELECT 
        id, nombre, email, rol, activo, fecha_creacion,
        v_total AS TotalRecords
    FROM Usuarios
    WHERE (p_search IS NULL OR p_search = '' OR nombre LIKE CONCAT('%', p_search, '%') OR email LIKE CONCAT('%', p_search, '%'))
      AND (p_rol IS NULL OR p_rol = '' OR rol = p_rol)
      AND (p_activo IS NULL OR activo = p_activo)
    ORDER BY nombre
    LIMIT v_offset, p_pageSize;
END //
DELIMITER ;

-- =============================================
-- sp_User_GetStats - Estadísticas de usuarios
-- =============================================
DROP PROCEDURE IF EXISTS sp_User_GetStats;
DELIMITER //
CREATE PROCEDURE sp_User_GetStats()
BEGIN
    SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN rol = 'admin' THEN 1 ELSE 0 END) AS admins,
        SUM(CASE WHEN rol = 'usuario' THEN 1 ELSE 0 END) AS usuarios,
        SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) AS activos,
        SUM(CASE WHEN activo = 0 THEN 1 ELSE 0 END) AS inactivos
    FROM Usuarios;
END //
DELIMITER ;

-- =============================================
-- sp_User_ValidateEmail - Valida email disponible
-- =============================================
DROP PROCEDURE IF EXISTS sp_User_ValidateEmail;
DELIMITER //
CREATE PROCEDURE sp_User_ValidateEmail(
    IN p_email VARCHAR(255),
    IN p_exclude_id INT
)
BEGIN
    DECLARE v_count INT;
    
    SELECT COUNT(*) INTO v_count
    FROM Usuarios
    WHERE email = p_email
      AND (p_exclude_id IS NULL OR id != p_exclude_id);
    
    SELECT CASE WHEN v_count = 0 THEN 1 ELSE 0 END AS available;
END //
DELIMITER ;

-- =============================================
-- sp_User_Create - Crear usuario
-- =============================================
DROP PROCEDURE IF EXISTS sp_User_Create;
DELIMITER //
CREATE PROCEDURE sp_User_Create(
    IN p_nombre VARCHAR(100),
    IN p_email VARCHAR(100),
    IN p_password_hash VARCHAR(255),
    IN p_rol VARCHAR(20),
    IN p_activo BOOLEAN,
    IN p_usuario_ejecutor_id INT
)
BEGIN
    DECLARE v_user_id INT;
    
    -- Validar email único
    IF EXISTS (SELECT 1 FROM Usuarios WHERE email = p_email) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El email ya existe en el sistema';
    END IF;
    
    -- Validar rol
    IF NOT (p_rol IN ('admin', 'usuario')) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El rol debe ser admin o usuario';
    END IF;
    
    INSERT INTO Usuarios (nombre, email, password_hash, rol, activo, fecha_creacion)
    VALUES (p_nombre, p_email, p_password_hash, p_rol, COALESCE(p_activo, 1), NOW());
    
    SET v_user_id = LAST_INSERT_ID();
    
    SELECT v_user_id AS id, p_nombre AS nombre, p_email AS email, p_rol AS rol, 
           COALESCE(p_activo, 1) AS activo, 'Usuario creado exitosamente' AS mensaje;
END //
DELIMITER ;

-- =============================================
-- sp_User_Update - Actualizar usuario
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
    -- Verificar que existe
    IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE id = p_user_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Usuario no encontrado';
    END IF;
    
    -- Validar email único si se cambia
    IF p_email IS NOT NULL AND EXISTS (SELECT 1 FROM Usuarios WHERE email = p_email AND id != p_user_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El email ya existe en el sistema';
    END IF;
    
    UPDATE Usuarios
    SET
        nombre = COALESCE(p_nombre, nombre),
        email = COALESCE(p_email, email),
        password_hash = COALESCE(p_password_hash, password_hash),
        rol = COALESCE(p_rol, rol),
        activo = COALESCE(p_activo, activo)
    WHERE id = p_user_id;
    
    SELECT id, nombre, email, rol, activo, 'Usuario actualizado exitosamente' AS mensaje
    FROM Usuarios WHERE id = p_user_id;
END //
DELIMITER ;

-- =============================================
-- sp_User_ToggleActive - Activar/Desactivar usuario
-- =============================================
DROP PROCEDURE IF EXISTS sp_User_ToggleActive;
DELIMITER //
CREATE PROCEDURE sp_User_ToggleActive(
    IN p_user_id INT,
    IN p_usuario_ejecutor_id INT
)
BEGIN
    DECLARE v_new_status BOOLEAN;
    
    -- Verificar que existe
    IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE id = p_user_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Usuario no encontrado';
    END IF;
    
    -- Toggle
    UPDATE Usuarios SET activo = NOT activo WHERE id = p_user_id;
    
    SELECT activo INTO v_new_status FROM Usuarios WHERE id = p_user_id;
    
    SELECT id, nombre, email, rol, activo,
           CASE WHEN v_new_status = 1 THEN 'Usuario activado' ELSE 'Usuario desactivado' END AS mensaje
    FROM Usuarios WHERE id = p_user_id;
END //
DELIMITER ;

SELECT 'Stored procedures de usuarios instalados correctamente' AS resultado;
