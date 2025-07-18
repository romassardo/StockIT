-- =============================================
-- Description: Activar/desactivar producto con validaciones de dependencias
-- =============================================

DROP PROCEDURE IF EXISTS sp_Producto_ToggleActive;

DELIMITER //

CREATE PROCEDURE sp_Producto_ToggleActive(
    IN p_id INT,
    IN p_usuario_id INT
)
BEGIN
    DECLARE v_activo_actual BOOLEAN;
    DECLARE v_usa_numero_serie BOOLEAN;
    DECLARE v_nuevo_estado BOOLEAN;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- Validaciones
    IF p_id IS NULL OR p_id <= 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'id es requerido y debe ser válido'; END IF;
    IF p_usuario_id IS NULL OR p_usuario_id <= 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'usuario_id es requerido y debe ser válido'; END IF;

    SELECT activo, usa_numero_serie
    INTO v_activo_actual, v_usa_numero_serie
    FROM Productos
    WHERE id = p_id;

    IF v_activo_actual IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El producto especificado no existe';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE id = p_usuario_id AND activo = 1) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El usuario especificado no existe o está inactivo';
    END IF;

    -- Si se va a desactivar, verificar dependencias
    IF v_activo_actual = 1 THEN
        IF v_usa_numero_serie = 1 AND EXISTS (SELECT 1 FROM InventarioIndividual WHERE producto_id = p_id AND estado IN ('Asignado', 'En Reparación')) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se puede desactivar: el producto tiene activos asignados o en reparación';
        END IF;
        IF v_usa_numero_serie = 0 AND EXISTS (SELECT 1 FROM StockGeneral WHERE producto_id = p_id AND cantidad_actual > 0) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se puede desactivar: el producto tiene stock disponible';
        END IF;
        IF EXISTS (SELECT 1 FROM MovimientosStock WHERE producto_id = p_id AND fecha_movimiento >= DATE_SUB(NOW(), INTERVAL 30 DAY)) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se puede desactivar: el producto tiene movimientos recientes de stock';
        END IF;
    END IF;

    SET v_nuevo_estado = NOT v_activo_actual;

    START TRANSACTION;

    UPDATE Productos SET activo = v_nuevo_estado WHERE id = p_id;

    CALL sp_Log_Create(
        p_usuario_id,
        'Productos',
        CASE WHEN v_nuevo_estado = 1 THEN 'ACTIVATE' ELSE 'DEACTIVATE' END,
        p_id,
        JSON_OBJECT('activo', v_activo_actual),
        JSON_OBJECT('activo', v_nuevo_estado)
    );

    COMMIT;

    -- Retornar el producto actualizado con info de dependencias
    SELECT 
        p.id, p.categoria_id, c.nombre as categoria_nombre, p.marca, p.modelo, p.descripcion,
        p.stock_minimo, p.usa_numero_serie, p.activo,
        (CASE WHEN p.usa_numero_serie = 1 THEN (SELECT COUNT(*) FROM InventarioIndividual WHERE producto_id = p.id AND estado = 'Disponible') ELSE COALESCE(sg.cantidad_actual, 0) END) as stock_actual,
        (CASE WHEN p.usa_numero_serie = 1 THEN (SELECT COUNT(*) FROM InventarioIndividual WHERE producto_id = p.id) ELSE COALESCE(sg.cantidad_actual, 0) END) as inventario_total,
        (CASE WHEN p.usa_numero_serie = 1 THEN (SELECT COUNT(*) FROM InventarioIndividual WHERE producto_id = p.id AND estado IN ('Asignado', 'En Reparación')) ELSE 0 END) as dependencias_activas
    FROM Productos p
    INNER JOIN Categorias c ON p.categoria_id = c.id
    LEFT JOIN StockGeneral sg ON p.id = sg.producto_id
    WHERE p.id = p_id;

END //

DELIMITER ; 