-- =============================================
-- Description: Obtiene una sucursal por su ID.
-- =============================================

DROP PROCEDURE IF EXISTS sp_Branch_Get;

DELIMITER //

CREATE PROCEDURE sp_Branch_Get(
    IN p_id INT
)
BEGIN
    DECLARE v_count INT;

    SELECT COUNT(*) INTO v_count FROM Sucursales WHERE id = p_id;
    
    IF v_count = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Sucursal no encontrada';
    ELSE
        SELECT 
            id,
            nombre,
            activo
        FROM Sucursales
        WHERE id = p_id;
    END IF;
END //

DELIMITER ;
