-- =============================================
-- Description: Crea una nueva categoría
-- =============================================
DROP PROCEDURE IF EXISTS sp_Categoria_Create;

DELIMITER //

CREATE PROCEDURE sp_Categoria_Create(
    IN p_nombre VARCHAR(100),
    IN p_categoria_padre_id INT,
    IN p_requiere_serie BOOLEAN,
    IN p_permite_asignacion BOOLEAN,
    IN p_permite_reparacion BOOLEAN,
    IN p_usuario_id INT
)
BEGIN
    DECLARE v_categoria_id INT;
    DECLARE v_exists INT DEFAULT 0;
    
    -- Verificar si ya existe una categoría con el mismo nombre
    SELECT COUNT(*) INTO v_exists
    FROM Categorias
    WHERE nombre = p_nombre AND activo = 1;
    
    IF v_exists > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ya existe otra categoría con este nombre';
    END IF;
    
    -- Verificar que la categoría padre existe si se especifica
    IF p_categoria_padre_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_exists
        FROM Categorias
        WHERE id = p_categoria_padre_id AND activo = 1;
        
        IF v_exists = 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La categoría padre especificada no existe o no está activa';
        END IF;
    END IF;
    
    -- Insertar la nueva categoría
    INSERT INTO Categorias (
        nombre,
        categoria_padre_id,
        requiere_serie,
        permite_asignacion,
        permite_reparacion,
        activo,
        fecha_creacion
    ) VALUES (
        p_nombre,
        p_categoria_padre_id,
        p_requiere_serie,
        p_permite_asignacion,
        p_permite_reparacion,
        1,
        NOW()
    );
    
    SET v_categoria_id = LAST_INSERT_ID();
    
    -- Devolver la categoría creada
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
        c.id = v_categoria_id;
END //

DELIMITER ;
