
-- =============================================
-- Author:      Cascade (Adaptado para MySQL)
-- Create date: Julio 2025
-- Description: Actualiza una categoría existente.
-- =============================================

DROP PROCEDURE IF EXISTS sp_Categoria_Update;

DELIMITER //

CREATE PROCEDURE sp_Categoria_Update(
    IN p_id INT,
    IN p_nombre VARCHAR(50),
    IN p_categoria_padre_id INT,
    IN p_requiere_serie BOOLEAN,
    IN p_permite_asignacion BOOLEAN,
    IN p_permite_reparacion BOOLEAN,
    IN p_activo BOOLEAN,
    IN p_usuario_accion_id INT
)
BEGIN
    DECLARE v_valores_anteriores JSON;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- Capturar valores actuales para el log
    SELECT JSON_OBJECT(
            'nombre', c.nombre,
            'categoria_padre_id', c.categoria_padre_id,
            'requiere_serie', c.requiere_serie,
            'permite_asignacion', c.permite_asignacion,
            'permite_reparacion', c.permite_reparacion,
            'activo', c.activo
        )
    INTO v_valores_anteriores
    FROM Categorias c
    WHERE c.id = p_id;

    IF v_valores_anteriores IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Categoría no encontrada.';
    END IF;

    -- Validaciones
    IF p_nombre IS NOT NULL AND EXISTS (SELECT 1 FROM Categorias WHERE nombre = p_nombre AND activo = 1 AND id <> p_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ya existe otra categoría activa con el nombre proporcionado.';
    END IF;

    IF p_categoria_padre_id IS NOT NULL THEN
        IF p_categoria_padre_id = p_id THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Una categoría no puede ser su propia categoría padre.';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM Categorias WHERE id = p_categoria_padre_id AND activo = 1) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La categoría padre especificada no existe o está inactiva.';
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE id = p_usuario_accion_id AND activo = 1) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El usuario que realiza la acción no existe o está inactivo.';
    END IF;

    START TRANSACTION;

    UPDATE Categorias
    SET 
        nombre = COALESCE(p_nombre, nombre),
        categoria_padre_id = COALESCE(p_categoria_padre_id, categoria_padre_id),
        requiere_serie = COALESCE(p_requiere_serie, requiere_serie),
        permite_asignacion = COALESCE(p_permite_asignacion, permite_asignacion),
        permite_reparacion = COALESCE(p_permite_reparacion, permite_reparacion),
        activo = COALESCE(p_activo, activo),
        fecha_modificacion = NOW()
    WHERE id = p_id;

    -- Registrar en LogsActividad
    CALL sp_Log_Create(
        p_usuario_accion_id,
        'Categorias',
        'UPDATE',
        p_id,
        v_valores_anteriores,
        JSON_OBJECT(
            'nombre', COALESCE(p_nombre, JSON_UNQUOTE(JSON_EXTRACT(v_valores_anteriores, '$.nombre'))),
            'categoria_padre_id', COALESCE(p_categoria_padre_id, JSON_UNQUOTE(JSON_EXTRACT(v_valores_anteriores, '$.categoria_padre_id'))),
            'requiere_serie', COALESCE(p_requiere_serie, JSON_EXTRACT(v_valores_anteriores, '$.requiere_serie')),
            'permite_asignacion', COALESCE(p_permite_asignacion, JSON_EXTRACT(v_valores_anteriores, '$.permite_asignacion')),
            'permite_reparacion', COALESCE(p_permite_reparacion, JSON_EXTRACT(v_valores_anteriores, '$.permite_reparacion')),
            'activo', COALESCE(p_activo, JSON_EXTRACT(v_valores_anteriores, '$.activo'))
        )
    );

    COMMIT;

END //

DELIMITER ;
