-- =============================================
-- Description: Crea un nuevo item en el inventario individual (para productos con número de serie).
-- =============================================

DROP PROCEDURE IF EXISTS sp_InventarioIndividual_Create;

DELIMITER //

CREATE PROCEDURE sp_InventarioIndividual_Create(
    IN p_producto_id INT,
    IN p_numero_serie VARCHAR(100),
    IN p_motivo_baja TEXT,
    IN p_usuario_alta_id INT
)
BEGIN
    DECLARE v_inventory_id INT;
    DECLARE v_usa_numero_serie BOOLEAN;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- Validaciones
    SELECT usa_numero_serie INTO v_usa_numero_serie FROM Productos WHERE id = p_producto_id AND activo = 1;

    IF v_usa_numero_serie IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El producto no existe o está inactivo';
    END IF;

    IF v_usa_numero_serie = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Este producto no requiere número de serie individual';
    END IF;

    IF EXISTS (SELECT 1 FROM InventarioIndividual WHERE numero_serie = p_numero_serie) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El número de serie ya existe en el sistema';
    END IF;

    START TRANSACTION;

    INSERT INTO InventarioIndividual (
        producto_id, numero_serie, estado, motivo_baja, usuario_alta_id, fecha_ingreso, fecha_creacion
    )
    VALUES (
        p_producto_id, p_numero_serie, 'Disponible', p_motivo_baja, p_usuario_alta_id, NOW(), NOW()
    );

    SET v_inventory_id = LAST_INSERT_ID();

    CALL sp_Log_Create(
        p_usuario_alta_id,
        'InventarioIndividual',
        'INSERT',
        v_inventory_id,
        NULL,
        JSON_OBJECT(
            'producto_id', p_producto_id,
            'numero_serie', p_numero_serie
        )
    );

    COMMIT;

    SELECT v_inventory_id AS id, 'Ítem de inventario individual creado exitosamente' AS mensaje;

END //

DELIMITER ;
