-- =============================================
-- Description: Actualiza el estado de un ítem del inventario individual, validando las transiciones de estado.
-- =============================================
DROP PROCEDURE IF EXISTS sp_InventarioIndividual_UpdateEstado;

DELIMITER //

CREATE PROCEDURE sp_InventarioIndividual_UpdateEstado(
    IN p_inventario_id INT,
    IN p_nuevo_estado VARCHAR(20),
    IN p_motivo TEXT,
    IN p_usuario_id INT
)
BEGIN
    DECLARE v_estado_actual VARCHAR(20);
    DECLARE v_asignacion_activa BOOLEAN;
    DECLARE v_reparacion_activa BOOLEAN;
    DECLARE v_json_old TEXT;
    DECLARE v_json_new TEXT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Validar que el ítem existe y obtener estado actual
    SELECT estado INTO v_estado_actual
    FROM InventarioIndividual 
    WHERE id = p_inventario_id FOR UPDATE; -- Bloquear la fila para la transacción

    IF v_estado_actual IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El ítem de inventario no existe';
    END IF;

    -- Validar que el nuevo estado sea válido
    IF p_nuevo_estado NOT IN ('Disponible', 'Asignado', 'En Reparación', 'Dado de Baja') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Estado no válido. Los estados permitidos son: Disponible, Asignado, En Reparación, Dado de Baja';
    END IF;

    -- Verificar si tiene asignación activa
    SELECT EXISTS(SELECT 1 FROM Asignaciones WHERE inventario_individual_id = p_inventario_id AND activa = 1) INTO v_asignacion_activa;
    
    -- Verificar si tiene reparación activa
    SELECT EXISTS(SELECT 1 FROM Reparaciones WHERE inventario_individual_id = p_inventario_id AND estado = 'En Reparación') INTO v_reparacion_activa;

    -- Validar reglas de cambio de estado
    IF v_estado_actual = 'Asignado' AND p_nuevo_estado NOT IN ('Disponible', 'En Reparación') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Un ítem Asignado solo puede cambiar a Disponible o En Reparación';
    END IF;
    
    IF v_estado_actual = 'En Reparación' AND p_nuevo_estado NOT IN ('Disponible', 'Asignado', 'Dado de Baja') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Un ítem En Reparación solo puede cambiar a Disponible, Asignado o Dado de Baja';
    END IF;
    
    IF p_nuevo_estado = 'Asignado' AND NOT v_asignacion_activa THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se puede cambiar a estado Asignado sin una asignación activa';
    END IF;
    
    IF p_nuevo_estado = 'En Reparación' AND NOT v_reparacion_activa THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se puede cambiar a estado En Reparación sin una reparación activa';
    END IF;

    -- Actualizar estado
    UPDATE InventarioIndividual
    SET 
        estado = p_nuevo_estado,
        fecha_baja = CASE WHEN p_nuevo_estado = 'Dado de Baja' THEN NOW() ELSE fecha_baja END,
        motivo_baja = CASE WHEN p_nuevo_estado = 'Dado de Baja' THEN p_motivo ELSE motivo_baja END,
        usuario_baja_id = CASE WHEN p_nuevo_estado = 'Dado de Baja' THEN p_usuario_id ELSE usuario_baja_id END,
        fecha_modificacion = NOW()
    WHERE 
        id = p_inventario_id;

    -- Log de actividad
    SET v_json_old = JSON_OBJECT('estado', v_estado_actual);
    SET v_json_new = JSON_OBJECT('estado', p_nuevo_estado, 'motivo', p_motivo);
    
    CALL sp_Log_Create(
        p_usuario_id, 
        'InventarioIndividual', 
        'UPDATE_ESTADO', 
        p_inventario_id, 
        v_json_old,
        v_json_new
    );
    
    COMMIT;

    -- Retornar mensaje de éxito
    SELECT p_inventario_id AS id, CONCAT('Estado actualizado de "', v_estado_actual, '" a "', p_nuevo_estado, '"') AS mensaje;

END //

DELIMITER ; 