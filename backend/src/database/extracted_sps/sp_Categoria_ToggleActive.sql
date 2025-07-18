
-- =============================================
-- Author:      Cascade (Adaptado para MySQL)
-- Create date: Julio 2025
-- Description: Activa o desactiva una categoría.
-- =============================================

DROP PROCEDURE IF EXISTS sp_Categoria_ToggleActive;

DELIMITER //

CREATE PROCEDURE sp_Categoria_ToggleActive(
    IN p_id INT,
    IN p_usuario_accion_id INT
)
BEGIN
    DECLARE v_current_activo BOOLEAN;
    DECLARE v_new_activo BOOLEAN;
    DECLARE v_valores_anteriores JSON;
    DECLARE v_valores_nuevos JSON;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- Validar que la categoría exista y obtener estado actual
    SELECT activo INTO v_current_activo
    FROM Categorias
    WHERE id = p_id;

    IF v_current_activo IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Categoría no encontrada.';
    END IF;
    
    SET v_valores_anteriores = JSON_OBJECT('activo', v_current_activo);
    SET v_new_activo = NOT v_current_activo;
    SET v_valores_nuevos = JSON_OBJECT('activo', v_new_activo);

    -- Validaciones antes de desactivar
    IF v_new_activo = 0 THEN
        -- Validar que no tenga categorías hijas activas
        IF EXISTS (SELECT 1 FROM Categorias WHERE categoria_padre_id = p_id AND activo = 1) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se puede desactivar la categoría porque tiene subcategorías activas.';
        END IF;

        -- Validar que no existan productos activos asociados a esta categoría
        IF EXISTS (SELECT 1 FROM Productos WHERE categoria_id = p_id AND activo = 1) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se puede desactivar la categoría porque tiene productos activos asociados.';
        END IF;
    END IF;

    -- Validar que el usuario_accion_id exista y esté activo
    IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE id = p_usuario_accion_id AND activo = 1) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El usuario que realiza la acción no existe o está inactivo.';
    END IF;

    START TRANSACTION;

    UPDATE Categorias
    SET activo = v_new_activo
    WHERE id = p_id;

    -- Registrar en LogsActividad
    CALL sp_Log_Create(
        p_usuario_accion_id,
        'Categorias',
        'UPDATE (Toggle Active)',
        p_id,
        v_valores_anteriores,
        v_valores_nuevos
    );

    COMMIT;

END //

DELIMITER ;
