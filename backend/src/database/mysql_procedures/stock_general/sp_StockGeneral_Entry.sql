-- =============================================
-- Description: Registra una entrada de stock para productos de manejo general (sin número de serie).
--              Crea el registro en StockGeneral si no existe, o actualiza la cantidad si ya existe.
-- =============================================
DROP PROCEDURE IF EXISTS sp_StockGeneral_Entry;

DELIMITER //

CREATE PROCEDURE sp_StockGeneral_Entry(
    IN p_producto_id INT,
    IN p_cantidad INT,
    IN p_motivo VARCHAR(100),
    IN p_observaciones TEXT,
    IN p_usuario_id INT,
    OUT p_movimiento_id INT,
    OUT p_stock_id INT,
    OUT p_stock_actual INT,
    OUT p_mensaje VARCHAR(500)
)
BEGIN
    DECLARE v_usa_numero_serie BOOLEAN;
    DECLARE v_stock_anterior INT DEFAULT 0;
    DECLARE v_stock_nuevo INT DEFAULT 0;
    DECLARE v_movimiento_id_local INT;
    DECLARE v_stock_id_local INT;
    DECLARE v_json_details TEXT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- Validaciones
    IF NOT EXISTS (SELECT 1 FROM Productos WHERE id = p_producto_id AND activo = 1) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El producto no existe o está inactivo';
    END IF;

    IF p_cantidad <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La cantidad debe ser mayor a cero';
    END IF;

    SELECT usa_numero_serie INTO v_usa_numero_serie 
    FROM Productos 
    WHERE id = p_producto_id;
    
    IF v_usa_numero_serie = 1 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Este producto usa número de serie y debe gestionarse por InventarioIndividual';
    END IF;
    
    START TRANSACTION;

    -- Verificar si existe el producto en StockGeneral y bloquear la fila
    SELECT id, cantidad_actual INTO v_stock_id_local, v_stock_anterior
    FROM StockGeneral 
    WHERE producto_id = p_producto_id FOR UPDATE;

    IF v_stock_id_local IS NOT NULL THEN
        -- Actualizar stock existente
        SET v_stock_nuevo = v_stock_anterior + p_cantidad;
        UPDATE StockGeneral
        SET cantidad_actual = v_stock_nuevo,
            ultima_actualizacion = NOW()
        WHERE id = v_stock_id_local;
    ELSE
        -- Crear nuevo registro en StockGeneral
        SET v_stock_anterior = 0;
        SET v_stock_nuevo = p_cantidad;
        INSERT INTO StockGeneral (producto_id, cantidad_actual, ultima_actualizacion)
        VALUES (p_producto_id, v_stock_nuevo, NOW());
        SET v_stock_id_local = LAST_INSERT_ID();
    END IF;

    -- Registrar el movimiento
    INSERT INTO MovimientosStock (
        producto_id, tipo_movimiento, cantidad, fecha_movimiento, usuario_id, motivo, observaciones
    )
    VALUES (
        p_producto_id, 'Entrada', p_cantidad, NOW(), p_usuario_id, p_motivo, p_observaciones
    );
    SET v_movimiento_id_local = LAST_INSERT_ID();

    -- Log de actividad
    SET v_json_details = JSON_OBJECT(
        'producto_id', p_producto_id,
        'cantidad_ingresada', p_cantidad,
        'stock_anterior', v_stock_anterior,
        'stock_nuevo', v_stock_nuevo,
        'motivo', p_motivo
    );
    
    CALL sp_Log_Create(
        p_usuario_id, 'StockGeneral', 'ENTRADA', v_stock_id_local, NULL, v_json_details
    );
    
    COMMIT;

    -- Asignar valores a parámetros de salida
    SET p_movimiento_id = v_movimiento_id_local;
    SET p_stock_id = v_stock_id_local;
    SET p_stock_actual = v_stock_nuevo;
    SET p_mensaje = 'Entrada de stock registrada exitosamente';

END //

DELIMITER ; 