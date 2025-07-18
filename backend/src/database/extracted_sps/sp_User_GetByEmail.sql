-- =============================================
-- Description: Obtiene un usuario por su email.
-- =============================================

DROP PROCEDURE IF EXISTS sp_User_GetByEmail;

DELIMITER //

CREATE PROCEDURE sp_User_GetByEmail(
    IN p_Email VARCHAR(255)
)
BEGIN
    SELECT 
        id, 
        nombre, 
        email, 
        password_hash, 
        rol, 
        activo 
    FROM Usuarios 
    WHERE email = p_Email;
END //

DELIMITER ;