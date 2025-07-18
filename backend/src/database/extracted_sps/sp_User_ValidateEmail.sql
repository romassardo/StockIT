-- =============================================
-- Description: Valida si un email está disponible, opcionalmente excluyendo un ID de usuario.
-- =============================================

DROP PROCEDURE IF EXISTS sp_User_ValidateEmail;

DELIMITER //

CREATE PROCEDURE sp_User_ValidateEmail(
    IN p_email VARCHAR(255),
    IN p_exclude_id INT
)
BEGIN
    DECLARE v_count INT;

    SELECT COUNT(*)
    INTO v_count
    FROM Usuarios
    WHERE email = p_email
      AND (p_exclude_id IS NULL OR id != p_exclude_id);

    SELECT 
        CASE WHEN v_count = 0 THEN 1 ELSE 0 END AS available;
END //

DELIMITER ;
