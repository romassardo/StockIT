-- Stored Procedures básicos para StockIT MySQL
USE stockit_mysql;

-- Eliminar procedimientos si existen
DROP PROCEDURE IF EXISTS sp_User_GetByEmail;
DROP PROCEDURE IF EXISTS sp_User_Get;
DROP PROCEDURE IF EXISTS sp_User_ChangePassword;

-- ===================================
-- PROCEDIMIENTOS DE AUTENTICACIÓN
-- ===================================

-- Obtener usuario por email (para login)
DELIMITER //
CREATE PROCEDURE sp_User_GetByEmail(IN p_email VARCHAR(100))
BEGIN
    SELECT id, nombre, email, password_hash, rol, activo
    FROM Usuarios
    WHERE email = p_email AND activo = TRUE;
END //
DELIMITER ;

-- Obtener usuario por ID (para token refresh)
DELIMITER //
CREATE PROCEDURE sp_User_Get(IN p_user_id INT)
BEGIN
    SELECT id, nombre, email, password_hash, rol, activo
    FROM Usuarios
    WHERE id = p_user_id AND activo = TRUE;
END //
DELIMITER ;

-- Cambiar contraseña de usuario
DELIMITER //
CREATE PROCEDURE sp_User_ChangePassword(
    IN p_user_id INT,
    IN p_new_password_hash VARCHAR(255)
)
BEGIN
    UPDATE Usuarios 
    SET password_hash = p_new_password_hash 
    WHERE id = p_user_id;
    
    SELECT ROW_COUNT() as affected_rows;
END //
DELIMITER ;

-- ===================================
-- PROCEDIMIENTOS DE STOCK BÁSICOS
-- ===================================

-- Obtener todo el stock general
DELIMITER //
CREATE PROCEDURE sp_StockGeneral_GetAll(
    IN p_categoria_id INT,
    IN p_solo_bajo_stock BOOLEAN,
    IN p_producto_id INT
)
BEGIN
    SELECT 
        sg.id,
        sg.producto_id,
        p.marca,
        p.modelo,
        p.descripcion,
        c.nombre as categoria,
        sg.cantidad_actual,
        p.stock_minimo,
        sg.ubicacion,
        sg.ultima_actualizacion,
        CASE 
            WHEN sg.cantidad_actual = 0 THEN 'Sin Stock'
            WHEN sg.cantidad_actual <= p.stock_minimo THEN 'Stock Bajo'
            ELSE 'Normal'
        END as estado_stock
    FROM StockGeneral sg
    INNER JOIN Productos p ON sg.producto_id = p.id
    INNER JOIN Categorias c ON p.categoria_id = c.id
    WHERE (p_categoria_id IS NULL OR p.categoria_id = p_categoria_id)
      AND (p_producto_id IS NULL OR p.id = p_producto_id)
      AND (p_solo_bajo_stock = FALSE OR sg.cantidad_actual <= p.stock_minimo)
      AND p.activo = TRUE
    ORDER BY c.nombre, p.marca, p.modelo;
END //
DELIMITER ;

-- Procedimiento básico de entrada de stock
DELIMITER //
CREATE PROCEDURE sp_StockGeneral_Entry(
    IN p_producto_id INT,
    IN p_cantidad INT,
    IN p_usuario_id INT,
    IN p_motivo VARCHAR(100),
    IN p_observaciones TEXT,
    IN p_ubicacion VARCHAR(100)
)
BEGIN
    DECLARE v_stock_anterior INT DEFAULT 0;
    DECLARE v_nuevo_stock INT DEFAULT 0;
    DECLARE v_movimiento_id INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Obtener stock actual o crear registro si no existe
    SELECT cantidad_actual INTO v_stock_anterior
    FROM StockGeneral 
    WHERE producto_id = p_producto_id;
    
    IF v_stock_anterior IS NULL THEN
        SET v_stock_anterior = 0;
        INSERT INTO StockGeneral (producto_id, cantidad_actual, ubicacion, ultima_actualizacion)
        VALUES (p_producto_id, 0, p_ubicacion, NOW());
    END IF;
    
    -- Calcular nuevo stock
    SET v_nuevo_stock = v_stock_anterior + p_cantidad;
    
    -- Actualizar stock
    UPDATE StockGeneral 
    SET cantidad_actual = v_nuevo_stock,
        ubicacion = IFNULL(p_ubicacion, ubicacion),
        ultima_actualizacion = NOW()
    WHERE producto_id = p_producto_id;
    
    -- Registrar movimiento
    INSERT INTO MovimientosStock (
        producto_id, tipo_movimiento, cantidad, fecha_movimiento,
        usuario_id, motivo, observaciones
    ) VALUES (
        p_producto_id, 'Entrada', p_cantidad, NOW(),
        p_usuario_id, p_motivo, p_observaciones
    );
    
    SET v_movimiento_id = LAST_INSERT_ID();
    
    COMMIT;
    
    -- Retornar resultado
    SELECT 
        v_stock_anterior as stock_anterior,
        v_nuevo_stock as nuevo_stock,
        v_movimiento_id as movimiento_id;
END //
DELIMITER ;

-- Mensaje de éxito
SELECT 'Stored procedures básicos creados exitosamente' as mensaje; 