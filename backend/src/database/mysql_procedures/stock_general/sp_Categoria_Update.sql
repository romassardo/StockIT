-- =============================================
-- Description: Actualiza una categoría existente
-- =============================================
DROP PROCEDURE IF EXISTS sp_Categoria_Update;

DELIMITER //

CREATE PROCEDURE sp_Categoria_Update(
    IN p_id INT,
    IN p_nombre VARCHAR(100),
    IN p_categoria_padre_id INT,
    IN p_requiere_serie BOOLEAN,
    IN p_permite_asignacion BOOLEAN,
    IN p_permite_reparacion BOOLEAN,
    IN p_usuario_id INT
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;
    DECLARE v_current_name VARCHAR(100);
    
    -- Verificar que la categoría existe
    SELECT COUNT(*), nombre INTO v_exists, v_current_name
    FROM Categorias
    WHERE id = p_id AND activo = 1;
    
    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Categoría no encontrada';
    END IF;
    
    -- Verificar si ya existe otra categoría con el mismo nombre (excluyendo la actual)
    IF p_nombre != v_current_name THEN
        SELECT COUNT(*) INTO v_exists
        FROM Categorias
        WHERE nombre = p_nombre AND activo = 1 AND id != p_id;
        
        IF v_exists > 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ya existe otra categoría con este nombre';
        END IF;
    END IF;
    
    -- Verificar que la categoría padre existe si se especifica
    IF p_categoria_padre_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_exists
        FROM Categorias
        WHERE id = p_categoria_padre_id AND activo = 1 AND id != p_id;
        
        IF v_exists = 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La categoría padre especificada no existe o no está activa';
        END IF;
    END IF;
    
    -- Actualizar la categoría
    UPDATE Categorias SET
        nombre = p_nombre,
        categoria_padre_id = p_categoria_padre_id,
        requiere_serie = p_requiere_serie,
        permite_asignacion = p_permite_asignacion,
        permite_reparacion = p_permite_reparacion,
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
