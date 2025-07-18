-- =============================================
-- Description: Actualizar producto con validaciones críticas de inventario existente
-- =============================================

DROP PROCEDURE IF EXISTS sp_Producto_Update;

DELIMITER //

CREATE PROCEDURE sp_Producto_Update(
    IN p_id INT,
    IN p_categoria_id INT,
    IN p_marca VARCHAR(50),
    IN p_modelo VARCHAR(100),
    IN p_descripcion TEXT,
    IN p_stock_minimo INT,
    IN p_usa_numero_serie BOOLEAN,
    IN p_usuario_id INT
)
BEGIN
    DECLARE v_usa_numero_serie_actual BOOLEAN;
    DECLARE v_marca_actual VARCHAR(50);
    DECLARE v_modelo_actual VARCHAR(100);
    DECLARE v_old_data JSON;
    DECLARE v_new_data JSON;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- Validaciones
    IF p_id IS NULL OR p_id <= 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'id es requerido y debe ser válido'; END IF;
    IF p_categoria_id IS NULL OR p_categoria_id <= 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'categoria_id es requerido y debe ser válido'; END IF;
    IF p_marca IS NULL OR TRIM(p_marca) = '' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'marca es requerida'; END IF;
    IF p_modelo IS NULL OR TRIM(p_modelo) = '' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'modelo es requerido'; END IF;
    IF p_stock_minimo < 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'stock_minimo no puede ser negativo'; END IF;
    IF p_usa_numero_serie IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'usa_numero_serie es requerido'; END IF;
    IF p_usuario_id IS NULL OR p_usuario_id <= 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'usuario_id es requerido y debe ser válido'; END IF;
    IF NOT EXISTS (SELECT 1 FROM Categorias WHERE id = p_categoria_id AND activo = 1) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La categoría especificada no existe o está inactiva'; END IF;
    IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE id = p_usuario_id AND activo = 1) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El usuario especificado no existe o está inactivo'; END IF;
    IF EXISTS (SELECT 1 FROM Productos WHERE marca = p_marca AND modelo = p_modelo AND activo = 1 AND id != p_id) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ya existe otro producto activo con la misma marca y modelo'; END IF;

    -- Obtener datos actuales
    SELECT usa_numero_serie, marca, modelo
    INTO v_usa_numero_serie_actual, v_marca_actual, v_modelo_actual
    FROM Productos WHERE id = p_id;
    
    IF v_usa_numero_serie_actual IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El producto especificado no existe';
    END IF;

    -- VALIDACIÓN CRÍTICA
    IF p_usa_numero_serie != v_usa_numero_serie_actual THEN
        IF v_usa_numero_serie_actual = 1 AND EXISTS (SELECT 1 FROM InventarioIndividual WHERE producto_id = p_id) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se puede cambiar usa_numero_serie: el producto tiene inventario individual existente';
        END IF;
        IF v_usa_numero_serie_actual = 0 AND EXISTS (SELECT 1 FROM StockGeneral WHERE producto_id = p_id AND cantidad_actual > 0) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se puede cambiar usa_numero_serie: el producto tiene stock general existente';
        END IF;
    END IF;

    SET v_old_data = JSON_OBJECT(
        'categoria_id', (SELECT categoria_id FROM Productos WHERE id = p_id),
        'marca', v_marca_actual,
        'modelo', v_modelo_actual,
        'usa_numero_serie', v_usa_numero_serie_actual
    );

    START TRANSACTION;

    UPDATE Productos SET
        categoria_id = p_categoria_id,
        marca = p_marca,
        modelo = p_modelo,
        descripcion = p_descripcion,
        stock_minimo = p_stock_minimo,
        usa_numero_serie = p_usa_numero_serie,
        fecha_modificacion = NOW()
    WHERE id = p_id;

    IF v_usa_numero_serie_actual = 0 AND p_usa_numero_serie = 1 THEN
        DELETE FROM StockGeneral WHERE producto_id = p_id;
    END IF;

    IF v_usa_numero_serie_actual = 1 AND p_usa_numero_serie = 0 THEN
        INSERT INTO StockGeneral (producto_id, cantidad_actual, ultima_actualizacion, ubicacion)
        VALUES (p_id, 0, NOW(), 'Almacén Principal');
    END IF;

    SET v_new_data = JSON_OBJECT(
        'categoria_id', p_categoria_id,
        'marca', p_marca,
        'modelo', p_modelo,
        'usa_numero_serie', p_usa_numero_serie
    );

    CALL sp_Log_Create(p_usuario_id, 'Productos', 'UPDATE', p_id, v_old_data, v_new_data);

    COMMIT;

    -- Retornar el producto actualizado
    SELECT 
        p.id, p.categoria_id, c.nombre as categoria_nombre, p.marca, p.modelo, p.descripcion,
        p.stock_minimo, p.usa_numero_serie, p.activo,
        (CASE WHEN p.usa_numero_serie = 1 THEN (SELECT COUNT(*) FROM InventarioIndividual WHERE producto_id = p.id AND estado = 'Disponible') ELSE COALESCE(sg.cantidad_actual, 0) END) as stock_actual,
        (CASE WHEN p.usa_numero_serie = 1 THEN (SELECT COUNT(*) FROM InventarioIndividual WHERE producto_id = p.id) ELSE COALESCE(sg.cantidad_actual, 0) END) as inventario_total
    FROM Productos p
    INNER JOIN Categorias c ON p.categoria_id = c.id
    LEFT JOIN StockGeneral sg ON p.id = sg.producto_id
    WHERE p.id = p_id;

END //

DELIMITER ; 