-- =============================================
-- Description: Actualiza el nombre y apellido de un empleado existente.
-- =============================================

DROP PROCEDURE IF EXISTS sp_Employee_Update;

DELIMITER //

CREATE PROCEDURE sp_Employee_Update(
    IN p_id INT,
    IN p_nombre VARCHAR(50),
    IN p_apellido VARCHAR(50),
    IN p_usuario_id INT
)
BEGIN
    DECLARE v_old_data JSON;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- Capturar datos antiguos para el log y validar existencia
    SELECT JSON_OBJECT('nombre', nombre, 'apellido', apellido) INTO v_old_data
    FROM Empleados WHERE id = p_id;
    
    IF v_old_data IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Empleado no encontrado';
    END IF;

    -- Validaciones
    IF p_nombre IS NULL OR TRIM(p_nombre) = '' OR p_apellido IS NULL OR TRIM(p_apellido) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El nombre y apellido son obligatorios';
    END IF;

    START TRANSACTION;

    UPDATE Empleados 
    SET 
        nombre = p_nombre,
        apellido = p_apellido
    WHERE id = p_id;

    CALL sp_Log_Create(
        p_usuario_id,
        'Empleados',
        'UPDATE',
        p_id,
        v_old_data,
        JSON_OBJECT('nombre', p_nombre, 'apellido', p_apellido)
    );

    COMMIT;

    SELECT p_id AS id, 'Empleado actualizado exitosamente' AS mensaje;

END //

DELIMITER ;
