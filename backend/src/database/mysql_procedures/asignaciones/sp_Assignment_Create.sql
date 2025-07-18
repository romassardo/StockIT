-- =============================================
-- Description: Crea una nueva asignación para un activo, actualiza el estado del activo y registra la actividad.
-- =============================================
DROP PROCEDURE IF EXISTS sp_Assignment_Create;

DELIMITER //

CREATE PROCEDURE sp_Assignment_Create(
    IN p_inventario_individual_id INT,
    IN p_tipo_asignacion VARCHAR(20),
    IN p_id_destino INT,
    IN p_usuario_asigna_id INT,
    IN p_observaciones TEXT,
    IN p_password_encriptacion VARCHAR(255),
    IN p_numero_telefono VARCHAR(20),
    IN p_cuenta_gmail VARCHAR(100),
    IN p_password_gmail VARCHAR(255),
    IN p_codigo_2fa_whatsapp VARCHAR(50),
    OUT p_id_asignacion INT
)
BEGIN
    DECLARE v_estado_actual VARCHAR(20);
    DECLARE v_id_empleado INT DEFAULT NULL;
    DECLARE v_id_sector INT DEFAULT NULL;
    DECLARE v_id_sucursal INT DEFAULT NULL;
    DECLARE v_nombre_entidad VARCHAR(100);
    DECLARE v_json_details TEXT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

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

    -- Determinar el destino
    CASE p_tipo_asignacion
        WHEN 'Empleado' THEN SET v_id_empleado = p_id_destino;
        WHEN 'Sector' THEN SET v_id_sector = p_id_destino;
        WHEN 'Sucursal' THEN SET v_id_sucursal = p_id_destino;
        ELSE SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tipo de asignación no válido.';
    END CASE;

    START TRANSACTION;

    -- Crear la asignación
    INSERT INTO Asignaciones (
        inventario_individual_id, empleado_id, sector_id, sucursal_id, fecha_asignacion,
        usuario_asigna_id, observaciones, password_encriptacion, numero_telefono,
        cuenta_gmail, password_gmail, codigo_2fa_whatsapp, activa
    )
    VALUES (
        p_inventario_individual_id, v_id_empleado, v_id_sector, v_id_sucursal, NOW(),
        p_usuario_asigna_id, p_observaciones, p_password_encriptacion, p_numero_telefono,
        p_cuenta_gmail, p_password_gmail, p_codigo_2fa_whatsapp, 1
    );

    SET p_id_asignacion = LAST_INSERT_ID();

    -- Actualizar estado del activo en InventarioIndividual
    UPDATE InventarioIndividual SET estado = 'Asignado' WHERE id = p_inventario_individual_id;
    
    -- Log de actividad
    SET v_json_details = JSON_OBJECT(
        'inventario_individual_id', p_inventario_individual_id,
        'tipo_destino', p_tipo_asignacion,
        'id_destino', p_id_destino,
        'observaciones', p_observaciones
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