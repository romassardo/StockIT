-- =============================================
-- Description: Crea un nuevo registro de reparación para un activo, actualiza el estado del activo y registra la actividad.
-- =============================================
DROP PROCEDURE IF EXISTS sp_Repair_Create;

DELIMITER //

CREATE PROCEDURE sp_Repair_Create(
    IN p_inventario_individual_id INT,
    IN p_descripcion_problema TEXT,
    IN p_usuario_envia_id INT,
    IN p_proveedor VARCHAR(100),
    OUT p_NuevaReparacionID INT
)
BEGIN
    DECLARE v_producto_id INT;
    DECLARE v_estado_actual VARCHAR(20);
    DECLARE v_json_details TEXT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Verificar que el ítem existe y obtener su estado
    SELECT producto_id, estado
    INTO v_producto_id, v_estado_actual
    FROM InventarioIndividual
    WHERE id = p_inventario_individual_id FOR UPDATE;

    IF v_producto_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El ítem de inventario especificado no existe.';
    END IF;

    -- Validar que el estado permite enviar a reparación
    IF v_estado_actual NOT IN ('Disponible', 'Asignado') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El ítem debe estar en estado "Disponible" o "Asignado" para enviarlo a reparación.';
    END IF;

    -- Crear registro de reparación
    INSERT INTO Reparaciones (
        inventario_individual_id, fecha_envio, problema_descripcion, proveedor, estado,
        usuario_envia_id, fecha_creacion
    )
    VALUES (
        p_inventario_individual_id, NOW(), p_descripcion_problema, p_proveedor, 'En Reparación',
        p_usuario_envia_id, NOW()
    );

    SET p_NuevaReparacionID = LAST_INSERT_ID();

    -- Actualizar estado del inventario
    UPDATE InventarioIndividual
    SET estado = 'En Reparación', fecha_modificacion = NOW()
    WHERE id = p_inventario_individual_id;

    -- Registrar la actividad
    SET v_json_details = JSON_OBJECT(
        'accion', 'Envío a Reparación',
        'inventario_id', p_inventario_individual_id,
        'problema', p_descripcion_problema,
        'proveedor', p_proveedor
    );
    CALL sp_Log_Create(
        p_usuario_envia_id, 'Reparaciones', 'INSERT', p_NuevaReparacionID, NULL, v_json_details
    );

    COMMIT;

END //

DELIMITER ; 