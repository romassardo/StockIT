-- =============================================
-- Description: Crea un nuevo empleado.
-- =============================================

DROP PROCEDURE IF EXISTS sp_Employee_Create;

DELIMITER //

CREATE PROCEDURE sp_Employee_Create(
    IN p_nombre VARCHAR(50),
    IN p_apellido VARCHAR(50),
    IN p_activo BOOLEAN,
    IN p_usuario_id INT
)
BEGIN
    DECLARE v_employee_id INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF p_nombre IS NULL OR TRIM(p_nombre) = '' OR p_apellido IS NULL OR TRIM(p_apellido) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El nombre y apellido son obligatorios';
    END IF;

    START TRANSACTION;

    INSERT INTO Empleados (nombre, apellido, activo)
    VALUES (p_nombre, p_apellido, IFNULL(p_activo, 1));

    SET v_employee_id = LAST_INSERT_ID();

    CALL sp_Log_Create(
        p_usuario_id,
        'Empleados',
        'INSERT',
        v_employee_id,
        NULL,
        JSON_OBJECT('nombre', p_nombre, 'apellido', p_apellido, 'activo', IFNULL(p_activo, 1))
    );

    COMMIT;

    SELECT v_employee_id AS id, 'Empleado creado exitosamente' AS mensaje;

END //

DELIMITER ;
