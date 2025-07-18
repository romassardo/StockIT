-- =============================================
-- Description: Activa o desactiva un sector.
-- =============================================

DROP PROCEDURE IF EXISTS sp_Sector_ToggleActive;

DELIMITER //

CREATE PROCEDURE sp_Sector_ToggleActive(
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
    SELECT activo INTO v_current_activo FROM Sectores WHERE id = p_id;

    IF v_current_activo IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Sector no encontrado';
    END IF;
    
    IF v_current_activo = p_activo THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El sector ya tiene ese estado';
    END IF;

    START TRANSACTION;

    UPDATE Sectores 
    SET activo = p_activo
    WHERE id = p_id;

    CALL sp_Log_Create(
        p_usuario_id,
        'Sectores',
        'UPDATE (Toggle Active)',
        p_id,
        JSON_OBJECT('activo', v_current_activo),
        JSON_OBJECT('activo', p_activo)
    );

    COMMIT;

    SELECT 
        p_id AS id, 
        CASE WHEN p_activo = 1 
            THEN 'Sector activado exitosamente' 
            ELSE 'Sector desactivado exitosamente' 
        END AS mensaje;

END //

DELIMITER ;
