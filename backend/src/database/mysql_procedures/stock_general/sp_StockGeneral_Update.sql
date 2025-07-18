-- =============================================
-- Description: Actualiza campos de un registro de stock general (ubicacion, etc).
-- =============================================
DROP PROCEDURE IF EXISTS sp_StockGeneral_Update;

DELIMITER //

CREATE PROCEDURE sp_StockGeneral_Update(
    IN p_stock_id INT,
    IN p_ubicacion VARCHAR(100),
    IN p_observaciones TEXT, -- Aunque no se usa para actualizar, puede ser para el log
    IN p_usuario_id INT,
    OUT p_mensaje VARCHAR(500)
)
BEGIN
    DECLARE v_producto_id INT;
    DECLARE v_ubicacion_anterior VARCHAR(100);
    DECLARE v_json_old TEXT;
    DECLARE v_json_new TEXT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Validar que el stock existe y obtener info actual
    SELECT producto_id, ubicacion
    INTO v_producto_id, v_ubicacion_anterior
    FROM StockGeneral
    WHERE id = p_stock_id FOR UPDATE;

    IF v_producto_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El registro de stock no existe';
    END IF;

    -- Actualizar stock
    UPDATE StockGeneral
    SET 
        ubicacion = IFNULL(p_ubicacion, ubicacion),
        ultima_actualizacion = NOW()
    WHERE id = p_stock_id;

    -- Log de actividad
    SET v_json_old = JSON_OBJECT('ubicacion', v_ubicacion_anterior);
    SET v_json_new = JSON_OBJECT('ubicacion', p_ubicacion, 'observaciones', p_observaciones);

    CALL sp_Log_Create(
        p_usuario_id,
        'StockGeneral',
        'UPDATE',
        p_stock_id,
        v_json_old,
        v_json_new
    );

    COMMIT;

    -- Asignar valores a parámetros de salida
    SET p_mensaje = 'Información de stock actualizada exitosamente';

END //

DELIMITER ; 