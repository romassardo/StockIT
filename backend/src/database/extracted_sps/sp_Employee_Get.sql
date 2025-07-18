-- =============================================
-- Description: Obtiene un empleado por su ID.
-- =============================================

DROP PROCEDURE IF EXISTS sp_Employee_Get;

DELIMITER //

CREATE PROCEDURE sp_Employee_Get(
    IN p_id INT
)
BEGIN
    DECLARE v_count INT;

    SELECT COUNT(*) INTO v_count FROM Empleados WHERE id = p_id;
    
    IF v_count = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Empleado no encontrado';
    ELSE
        SELECT 
            id,
            nombre,
            apellido,
            CONCAT(nombre, ' ', apellido) as nombre_completo,
            activo
        FROM Empleados
        WHERE id = p_id;
    END IF;
END //

DELIMITER ;
