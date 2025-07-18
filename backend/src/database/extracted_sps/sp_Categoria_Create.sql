
-- =============================================
-- Author:      Cascade (Adaptado para MySQL)
-- Create date: Julio 2025
-- Description: Crea una nueva categoría de producto.
-- =============================================

DROP PROCEDURE IF EXISTS sp_Categoria_Create;

DELIMITER //

CREATE PROCEDURE sp_Categoria_Create(
    IN p_nombre VARCHAR(50),
    IN p_categoria_padre_id INT,
    IN p_requiere_serie BOOLEAN,
    IN p_permite_asignacion BOOLEAN,
    IN p_permite_reparacion BOOLEAN,
    IN p_usuario_accion_id INT,
    OUT p_nueva_categoria_id INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- Si ocurre un error, revertir la transacción
        ROLLBACK;
        -- Re-lanzar el error para que la aplicación lo reciba
        RESIGNAL;
    END;

    -- Validar que el nombre de la categoría no esté duplicado
    IF EXISTS (SELECT 1 FROM Categorias WHERE nombre = p_nombre AND activo = 1) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ya existe una categoría activa con el nombre proporcionado.';
    END IF;

    -- Validar que categoria_padre_id exista si se proporciona
    IF p_categoria_padre_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Categorias WHERE id = p_categoria_padre_id AND activo = 1) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La categoría padre especificada no existe o está inactiva.';
    END IF;

    -- Validar que el usuario_accion_id exista y esté activo
    IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE id = p_usuario_accion_id AND activo = 1) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El usuario que realiza la acción no existe o está inactivo.';
    END IF;

    -- Iniciar transacción
    START TRANSACTION;

    INSERT INTO Categorias (
        nombre,
        categoria_padre_id,
        requiere_serie,
        permite_asignacion,
        permite_reparacion,
        activo,
        fecha_creacion
    )
    VALUES (
        p_nombre,
        p_categoria_padre_id,
        p_requiere_serie,
        p_permite_asignacion,
        p_permite_reparacion,
        1,
        NOW()
    );

    SET p_nueva_categoria_id = LAST_INSERT_ID();

    -- Registrar en LogsActividad (Asumiendo que sp_Log_Create será adaptado también)
    CALL sp_Log_Create(
        p_usuario_accion_id,
        'Categorias',
        'INSERT',
        p_nueva_categoria_id,
        NULL, -- valores_anteriores
        JSON_OBJECT(
            'nombre', p_nombre,
            'categoria_padre_id', p_categoria_padre_id,
            'requiere_serie', p_requiere_serie,
            'permite_asignacion', p_permite_asignacion,
            'permite_reparacion', p_permite_reparacion,
            'activo', 1
        ) -- valores_nuevos
    );

    COMMIT;

END //

DELIMITER ;
