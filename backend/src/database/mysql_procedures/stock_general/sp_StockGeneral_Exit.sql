-- =============================================
-- Description: Registra una salida de stock para productos de manejo general.
--              Valida el stock disponible y los destinos.
-- =============================================
DROP PROCEDURE IF EXISTS sp_StockGeneral_Exit;

DELIMITER //

CREATE PROCEDURE sp_StockGeneral_Exit(
    IN p_producto_id INT,
    IN p_cantidad INT,
    IN p_motivo VARCHAR(100),
    IN p_empleado_id INT,
    IN p_sector_id INT,
    IN p_sucursal_id INT,
    IN p_observaciones TEXT,
    IN p_usuario_id INT
)
BEGIN
    DECLARE v_usa_numero_serie BOOLEAN;
    DECLARE v_stock_anterior INT DEFAULT 0;
    DECLARE v_stock_nuevo INT DEFAULT 0;
    DECLARE v_stock_minimo INT DEFAULT 0;
    DECLARE v_movimiento_id_local INT;
    DECLARE v_stock_id_local INT;
    DECLARE v_destino_count INT DEFAULT 0;
    DECLARE v_alerta_bajo_stock BOOLEAN DEFAULT FALSE;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- Validaciones
    IF NOT EXISTS (SELECT 1 FROM Productos WHERE id = p_producto_id AND activo = 1) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El producto no existe o esta inactivo';
    END IF;

    IF p_cantidad <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La cantidad debe ser mayor a cero';
    END IF;

    SELECT usa_numero_serie, stock_minimo INTO v_usa_numero_serie, v_stock_minimo
    FROM Productos WHERE id = p_producto_id;

    IF v_usa_numero_serie = 1 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Este producto usa numero de serie y debe gestionarse por InventarioIndividual';
    END IF;

    -- Validar destinos
    IF p_empleado_id IS NOT NULL THEN SET v_destino_count = v_destino_count + 1; END IF;
    IF p_sector_id IS NOT NULL THEN SET v_destino_count = v_destino_count + 1; END IF;
    IF p_sucursal_id IS NOT NULL THEN SET v_destino_count = v_destino_count + 1; END IF;

    IF v_destino_count = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Debe especificar al menos un destino (empleado, sector o sucursal)';
    END IF;

    START TRANSACTION;

    -- Obtener stock actual y bloquear fila
    SELECT id, cantidad_actual INTO v_stock_id_local, v_stock_anterior
    FROM StockGeneral WHERE producto_id = p_producto_id FOR UPDATE;

    IF v_stock_id_local IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No existe registro de stock para este producto. No se puede dar salida.';
    END IF;

    -- Validar stock suficiente
    IF v_stock_anterior < p_cantidad THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stock insuficiente para realizar la salida';
    END IF;

    -- Calcular y actualizar stock
    SET v_stock_nuevo = v_stock_anterior - p_cantidad;
    UPDATE StockGeneral
    SET cantidad_actual = v_stock_nuevo, ultima_actualizacion = NOW()
    WHERE id = v_stock_id_local;

    -- Registrar movimiento
    INSERT INTO MovimientosStock (
        producto_id, tipo_movimiento, cantidad, fecha_movimiento, usuario_id,
        empleado_id, sector_id, sucursal_id, motivo, observaciones
    )
    VALUES (
        p_producto_id, 'Salida', p_cantidad, NOW(), p_usuario_id,
        p_empleado_id, p_sector_id, p_sucursal_id, p_motivo, p_observaciones
    );
    SET v_movimiento_id_local = LAST_INSERT_ID();

    -- Verificar alerta de stock bajo
    SET v_alerta_bajo_stock = IF(v_stock_nuevo < v_stock_minimo, TRUE, FALSE);

    COMMIT;

    -- Retornar resultado
    SELECT 
        v_movimiento_id_local AS movimiento_id,
        v_stock_id_local AS stock_id, 
        v_stock_nuevo AS stock_actual,
        v_alerta_bajo_stock AS alerta_bajo_stock,
        'Salida de stock registrada exitosamente' AS mensaje;

END //

DELIMITER ; 