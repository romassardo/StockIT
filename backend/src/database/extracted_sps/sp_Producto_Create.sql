-- =============================================
-- Description: Crear nuevo producto con validaciones e integración automática
-- =============================================

DROP PROCEDURE IF EXISTS sp_Producto_Create;

DELIMITER //

CREATE PROCEDURE sp_Producto_Create(
    IN p_categoria_id INT,
    IN p_marca VARCHAR(50),
    IN p_modelo VARCHAR(100),
    IN p_descripcion TEXT,
    IN p_stock_minimo INT,
    IN p_usa_numero_serie BOOLEAN,
    IN p_usuario_id INT
)
BEGIN
    DECLARE v_producto_id INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- Validaciones
    IF p_categoria_id IS NULL OR p_categoria_id <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'categoria_id es requerido y debe ser válido';
    END IF;
    IF p_marca IS NULL OR TRIM(p_marca) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'marca es requerida';
    END IF;
    IF p_modelo IS NULL OR TRIM(p_modelo) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'modelo es requerido';
    END IF;
    IF p_stock_minimo < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'stock_minimo no puede ser negativo';
    END IF;
    IF p_usa_numero_serie IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'usa_numero_serie es requerido';
    END IF;
    IF p_usuario_id IS NULL OR p_usuario_id <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'usuario_id es requerido y debe ser válido';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM Categorias WHERE id = p_categoria_id AND activo = 1) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La categoría especificada no existe o está inactiva';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE id = p_usuario_id AND activo = 1) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El usuario especificado no existe o está inactivo';
    END IF;
    IF EXISTS (SELECT 1 FROM Productos WHERE marca = p_marca AND modelo = p_modelo AND activo = 1) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ya existe un producto activo con la misma marca y modelo';
    END IF;

    START TRANSACTION;

    INSERT INTO Productos (
        categoria_id, marca, modelo, descripcion, stock_minimo, usa_numero_serie, activo, fecha_creacion, fecha_modificacion
    ) VALUES (
        p_categoria_id, p_marca, p_modelo, p_descripcion, p_stock_minimo, p_usa_numero_serie, 1, NOW(), NOW()
    );

    SET v_producto_id = LAST_INSERT_ID();

    IF p_usa_numero_serie = 0 THEN
        INSERT INTO StockGeneral (
            producto_id, cantidad_actual, ultima_actualizacion, ubicacion
        ) VALUES (
            v_producto_id, 0, NOW(), 'Almacén Principal'
        );
    END IF;

    CALL sp_Log_Create(
        p_usuario_id,
        'Productos',
        'CREATE',
        v_producto_id,
        NULL,
        JSON_OBJECT(
            'marca', p_marca,
            'modelo', p_modelo,
            'usa_serie', p_usa_numero_serie
        )
    );

    COMMIT;

    -- Retornar el producto creado
    SELECT 
        p.id, p.categoria_id, c.nombre as categoria_nombre, p.marca, p.modelo, p.descripcion,
        p.stock_minimo, p.usa_numero_serie, p.activo,
        CASE 
            WHEN p.usa_numero_serie = 1 THEN
                (SELECT COUNT(*) FROM InventarioIndividual WHERE producto_id = p.id AND estado = 'Disponible')
            ELSE
                COALESCE(sg.cantidad_actual, 0)
        END as stock_actual,
        CASE 
            WHEN p.usa_numero_serie = 1 THEN
                (SELECT COUNT(*) FROM InventarioIndividual WHERE producto_id = p.id)
            ELSE
                COALESCE(sg.cantidad_actual, 0)
        END as inventario_total
    FROM Productos p
    INNER JOIN Categorias c ON p.categoria_id = c.id
    LEFT JOIN StockGeneral sg ON p.id = sg.producto_id
    WHERE p.id = v_producto_id;

END //

DELIMITER ; 