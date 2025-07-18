-- =============================================
-- Description: Actualiza un ítem del inventario individual.
-- =============================================
DROP PROCEDURE IF EXISTS sp_InventarioIndividual_Update;

DELIMITER //

CREATE PROCEDURE sp_InventarioIndividual_Update(
    IN p_inventario_id INT,
    IN p_numero_serie VARCHAR(100),
    IN p_motivo_baja TEXT,
    IN p_usuario_id INT
)
BEGIN
    DECLARE v_estado_actual VARCHAR(20);
    DECLARE v_old_numero_serie VARCHAR(100);
    DECLARE v_old_motivo_baja TEXT;
    DECLARE v_count INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Validar que el item existe y obtener datos actuales
    SELECT estado, numero_serie, motivo_baja
    INTO v_estado_actual, v_old_numero_serie, v_old_motivo_baja
    FROM InventarioIndividual 
    WHERE id = p_inventario_id;

    IF v_estado_actual IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El item de inventario no existe';
    END IF;

    -- Validar que no este asignado o en reparacion
    IF v_estado_actual IN ('Asignado', 'En Reparacion') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se puede modificar un item que esta en uso';
    END IF;

    -- Validar que el numero de serie no existe (si cambio)
    IF p_numero_serie != v_old_numero_serie THEN
        SELECT COUNT(*)
        INTO v_count
        FROM InventarioIndividual 
        WHERE numero_serie = p_numero_serie 
        AND id != p_inventario_id;
        
        IF v_count > 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El numero de serie ya existe en otro item';
        END IF;
    END IF;

    -- Actualizar inventario individual
    UPDATE InventarioIndividual
    SET 
        numero_serie = p_numero_serie,
        motivo_baja = p_motivo_baja
    WHERE 
        id = p_inventario_id;

    COMMIT;

    -- Retornar mensaje de exito
    SELECT p_inventario_id AS id, 'Item de inventario individual actualizado exitosamente' AS mensaje;

END //

DELIMITER ; 