-- =============================================
-- Description: Actualiza el nombre de una sucursal existente.
-- =============================================

DROP PROCEDURE IF EXISTS sp_Branch_Update;

DELIMITER //

CREATE PROCEDURE sp_Branch_Update(
    IN p_id INT,
    IN p_nombre VARCHAR(100),
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
    SELECT JSON_OBJECT('nombre', nombre) INTO v_old_data
    FROM Sucursales WHERE id = p_id;
    
    IF v_old_data IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Sucursal no encontrada';
    END IF;

    -- Validaciones
    IF p_nombre IS NULL OR TRIM(p_nombre) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El nombre de la sucursal es obligatorio';
    END IF;

    IF EXISTS (SELECT 1 FROM Sucursales WHERE nombre = p_nombre AND id != p_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ya existe otra sucursal con ese nombre';
    END IF;

    START TRANSACTION;

    UPDATE Sucursales 
    SET nombre = p_nombre
    WHERE id = p_id;

    CALL sp_Log_Create(
        p_usuario_id,
        'Sucursales',
        'UPDATE',
        p_id,
        v_old_data,
        JSON_OBJECT('nombre', p_nombre)
    );

    COMMIT;

    SELECT p_id AS id, 'Sucursal actualizada exitosamente' AS mensaje;

END //

DELIMITER ;
