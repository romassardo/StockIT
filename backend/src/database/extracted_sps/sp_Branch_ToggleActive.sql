-- =============================================
-- Description: Activa o desactiva una sucursal.
-- =============================================

DROP PROCEDURE IF EXISTS sp_Branch_ToggleActive;

DELIMITER //

CREATE PROCEDURE sp_Branch_ToggleActive(
    IN p_id INT,
    IN p_activo BOOLEAN,
    IN p_usuario_id INT
)
BEGIN
    DECLARE v_current_activo BOOLEAN;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- Validaciones
    SELECT activo INTO v_current_activo FROM Sucursales WHERE id = p_id;

    IF v_current_activo IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Sucursal no encontrada';
    END IF;
    
    IF v_current_activo = p_activo THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La sucursal ya tiene ese estado';
    END IF;

    START TRANSACTION;

    UPDATE Sucursales 
    SET activo = p_activo
    WHERE id = p_id;

    CALL sp_Log_Create(
        p_usuario_id,
        'Sucursales',
        'UPDATE (Toggle Active)',
        p_id,
        JSON_OBJECT('activo', v_current_activo),
        JSON_OBJECT('activo', p_activo)
    );

    COMMIT;

    SELECT 
        p_id AS id, 
        CASE WHEN p_activo = 1 
            THEN 'Sucursal activada exitosamente' 
            ELSE 'Sucursal desactivada exitosamente' 
        END AS mensaje;

END //

DELIMITER ;
