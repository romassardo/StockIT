-- =============================================
-- Description: Obtiene un sector por su ID.
-- =============================================

DROP PROCEDURE IF EXISTS sp_Sector_Get;

DELIMITER //

CREATE PROCEDURE sp_Sector_Get(
    IN p_id INT
)
BEGIN
    DECLARE v_count INT;

    SELECT COUNT(*) INTO v_count FROM Sectores WHERE id = p_id;
    
    IF v_count = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Sector no encontrado';
    ELSE
        SELECT 
            id,
            nombre,
            activo
        FROM Sectores
        WHERE id = p_id;
    END IF;
END //

DELIMITER ;
