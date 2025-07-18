-- =============================================
-- Description: Completa un proceso de reparación, actualizando el estado de la reparación y del activo.
-- =============================================
DROP PROCEDURE IF EXISTS sp_Repair_Complete;

DELIMITER //

CREATE PROCEDURE sp_Repair_Complete(
    IN p_reparacion_id INT,
    IN p_estado_reparacion VARCHAR(20),
    IN p_solucion_descripcion TEXT,
    IN p_usuario_recibe_id INT,
    IN p_motivo_baja TEXT
)
BEGIN
    DECLARE v_inventario_id INT;
    DECLARE v_estado_actual_reparacion VARCHAR(20);
    DECLARE v_nuevo_estado_inventario VARCHAR(20);
    DECLARE v_json_old TEXT;
    DECLARE v_json_new TEXT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Verificar que la reparación existe y está 'En Reparación'
    SELECT r.inventario_individual_id, r.estado
    INTO v_inventario_id, v_estado_actual_reparacion
    FROM Reparaciones r
    WHERE r.id = p_reparacion_id FOR UPDATE;

    IF v_inventario_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La reparación especificada no existe';
    END IF;

    IF v_estado_actual_reparacion != 'En Reparación' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Solo se pueden completar reparaciones con estado "En Reparación"';
    END IF;

    -- Validar el estado de reparación entrante
    IF p_estado_reparacion NOT IN ('Reparado', 'Sin Reparación') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Estado de reparación inválido. Debe ser "Reparado" o "Sin Reparación"';
    END IF;

    -- Determinar nuevo estado para el inventario y validar campos
    IF p_estado_reparacion = 'Reparado' THEN
        SET v_nuevo_estado_inventario = 'Disponible';
        IF p_solucion_descripcion IS NULL OR LENGTH(p_solucion_descripcion) < 5 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Debe proporcionar una descripción de la solución para ítems reparados';
        END IF;
    ELSE -- 'Sin Reparación'
        SET v_nuevo_estado_inventario = 'Dado de Baja';
        IF p_motivo_baja IS NULL OR LENGTH(p_motivo_baja) < 5 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Debe proporcionar un motivo de baja para ítems sin reparación';
        END IF;
    END IF;

    -- Actualizar registro de reparación
    UPDATE Reparaciones
    SET 
        fecha_retorno = NOW(),
        solucion_descripcion = p_solucion_descripcion,
        estado = p_estado_reparacion,
        usuario_recibe_id = p_usuario_recibe_id,
        fecha_modificacion = NOW()
    WHERE id = p_reparacion_id;

    -- Actualizar estado del inventario
    UPDATE InventarioIndividual
    SET 
        estado = v_nuevo_estado_inventario,
        fecha_baja = IF(v_nuevo_estado_inventario = 'Dado de Baja', NOW(), fecha_baja),
        motivo_baja = IF(v_nuevo_estado_inventario = 'Dado de Baja', p_motivo_baja, motivo_baja),
        usuario_baja_id = IF(v_nuevo_estado_inventario = 'Dado de Baja', p_usuario_recibe_id, usuario_baja_id),
        fecha_modificacion = NOW()
    WHERE id = v_inventario_id;

    -- Registrar actividad
    SET v_json_old = JSON_OBJECT('estado_reparacion', v_estado_actual_reparacion);
    SET v_json_new = JSON_OBJECT(
        'estado_reparacion', p_estado_reparacion, 
        'solucion', p_solucion_descripcion, 
        'motivo_baja', p_motivo_baja,
        'nuevo_estado_inventario', v_nuevo_estado_inventario
    );
    CALL sp_Log_Create(
        p_usuario_recibe_id, 'Reparaciones', 'UPDATE', p_reparacion_id, v_json_old, v_json_new
    );

    COMMIT;

END //

DELIMITER ; 