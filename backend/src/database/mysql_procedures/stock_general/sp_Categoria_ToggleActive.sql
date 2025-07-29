-- =============================================
-- Description: Activa o desactiva una categoría
-- =============================================
DROP PROCEDURE IF EXISTS sp_Categoria_ToggleActive;

DELIMITER //

CREATE PROCEDURE sp_Categoria_ToggleActive(
    IN p_id INT,
    IN p_usuario_id INT
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;
    DECLARE v_current_active BOOLEAN DEFAULT FALSE;
    DECLARE v_productos_count INT DEFAULT 0;
    
    -- Verificar que la categoría existe
    SELECT COUNT(*), activo INTO v_exists, v_current_active
    FROM Categorias
    WHERE id = p_id;
    
    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Categoría no encontrada';
    END IF;
    
    -- Si se intenta desactivar, verificar que no tenga productos activos
    IF v_current_active = TRUE THEN
        SELECT COUNT(*) INTO v_productos_count
        FROM Productos
        WHERE categoria_id = p_id AND activo = 1;
        
        IF v_productos_count > 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se puede desactivar la categoría porque tiene productos activos asociados';
        END IF;
    END IF;
    
    -- Cambiar el estado activo
    UPDATE Categorias SET
        activo = NOT v_current_active,
        fecha_modificacion = NOW()
    WHERE id = p_id;
    
    -- Devolver la categoría actualizada
    SELECT
        c.id,
        c.nombre,
        c.categoria_padre_id,
        CASE 
            WHEN c.categoria_padre_id IS NOT NULL THEN cp.nombre 
            ELSE NULL 
        END AS categoria_padre_nombre,
        c.requiere_serie,
        c.permite_asignacion,
        c.permite_reparacion,
        c.activo,
        c.fecha_creacion,
        c.fecha_modificacion
    FROM
        Categorias c
    LEFT JOIN
        Categorias cp ON c.categoria_padre_id = cp.id
    WHERE
        c.id = p_id;
END //

DELIMITER ;
