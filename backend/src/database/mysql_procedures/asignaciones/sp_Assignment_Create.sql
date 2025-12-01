-- =============================================
-- Description: Crea una nueva asignación para un activo, actualiza el estado del activo y registra la actividad.
-- Empleado es obligatorio, sector y sucursal son opcionales.
-- =============================================
DROP PROCEDURE IF EXISTS sp_Assignment_Create;

DELIMITER //

CREATE PROCEDURE sp_Assignment_Create(
    IN p_inventario_individual_id INT,
    IN p_empleado_id INT,
    IN p_sector_id INT,
    IN p_sucursal_id INT,
    IN p_usuario_asigna_id INT,
    IN p_observaciones TEXT,
    IN p_password_encriptacion VARCHAR(255),
    IN p_numero_telefono VARCHAR(20),
    IN p_cuenta_gmail VARCHAR(100),
    IN p_password_gmail VARCHAR(255),
    IN p_codigo_2fa_whatsapp VARCHAR(50),
    IN p_imei_1 VARCHAR(20),
    IN p_imei_2 VARCHAR(20),
    OUT p_id_asignacion INT
)
BEGIN
    DECLARE v_estado_actual VARCHAR(20);
    DECLARE v_nombre_empleado VARCHAR(200);
    DECLARE v_nombre_sector VARCHAR(100);
    DECLARE v_nombre_sucursal VARCHAR(100);
    DECLARE v_json_details TEXT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- Validar que se especificó un empleado (obligatorio)
    IF p_empleado_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Debe especificar un empleado para la asignación.';
    END IF;

    -- Obtener nombres para el log
    SELECT CONCAT(nombre, ' ', apellido) INTO v_nombre_empleado FROM Empleados WHERE id = p_empleado_id;
    IF p_sector_id IS NOT NULL THEN
        SELECT nombre INTO v_nombre_sector FROM Sectores WHERE id = p_sector_id;
    END IF;
    IF p_sucursal_id IS NOT NULL THEN
        SELECT nombre INTO v_nombre_sucursal FROM Sucursales WHERE id = p_sucursal_id;
    END IF;

    -- Validar estado del activo
    SELECT estado INTO v_estado_actual
    FROM InventarioIndividual
    WHERE id = p_inventario_individual_id FOR UPDATE;

    IF v_estado_actual IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El activo de inventario no existe.';
    END IF;

    IF v_estado_actual != 'Disponible' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El activo no está disponible para asignación.';
    END IF;

    START TRANSACTION;

    -- Crear la asignación (empleado obligatorio, sector y sucursal opcionales)
    INSERT INTO Asignaciones (
        inventario_individual_id, empleado_id, sector_id, sucursal_id, fecha_asignacion,
        usuario_asigna_id, observaciones, password_encriptacion, numero_telefono,
        cuenta_gmail, password_gmail, codigo_2fa_whatsapp, imei_1, imei_2, activa
    )
    VALUES (
        p_inventario_individual_id, p_empleado_id, p_sector_id, p_sucursal_id, NOW(),
        p_usuario_asigna_id, p_observaciones, p_password_encriptacion, p_numero_telefono,
        p_cuenta_gmail, p_password_gmail, p_codigo_2fa_whatsapp, p_imei_1, p_imei_2, 1
    );

    SET p_id_asignacion = LAST_INSERT_ID();

    -- Actualizar estado del activo en InventarioIndividual
    UPDATE InventarioIndividual SET estado = 'Asignado' WHERE id = p_inventario_individual_id;
    
    -- Log de actividad con nombres para mostrar en timeline
    SET v_json_details = JSON_OBJECT(
        'accion', 'Nueva Asignación',
        'empleado', v_nombre_empleado,
        'sector', IFNULL(v_nombre_sector, ''),
        'sucursal', IFNULL(v_nombre_sucursal, ''),
        'observaciones', IFNULL(p_observaciones, '')
    );

    CALL sp_Log_Create(
        p_usuario_asigna_id,
        'Asignaciones',
        'INSERT',
        p_id_asignacion,
        NULL,
        v_json_details
    );

    COMMIT;

END //

DELIMITER ; 