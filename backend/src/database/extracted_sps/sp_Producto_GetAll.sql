-- =============================================
-- Description: Obtiene productos con filtros y paginación
-- =============================================

DROP PROCEDURE IF EXISTS sp_Producto_GetAll;

DELIMITER //

CREATE PROCEDURE sp_Producto_GetAll(
    IN p_categoria_id INT,
    IN p_categoria_nombre VARCHAR(100),
    IN p_usa_numero_serie BOOLEAN,
    IN p_activo BOOLEAN,
    IN p_PageNumber INT,
    IN p_PageSize INT
)
BEGIN
    DECLARE v_offset INT;
    DECLARE v_sql TEXT;

    -- Validaciones y valores por defecto
    SET p_PageNumber = IF(p_PageNumber < 1, 1, p_PageNumber);
    SET p_PageSize = IF(p_PageSize < 1 OR p_PageSize > 100, 50, p_PageSize);
    SET v_offset = (p_PageNumber - 1) * p_PageSize;

    -- Construcción de la consulta base
    SET v_sql = '
        SELECT 
            p.id, p.categoria_id, c.nombre AS categoria_nombre, p.marca, p.modelo, 
            p.descripcion, p.stock_minimo, p.usa_numero_serie, p.activo,
            p.fecha_creacion, p.fecha_modificacion,
            CASE 
                WHEN p.usa_numero_serie = 1 THEN (
                    SELECT COUNT(*) 
                    FROM InventarioIndividual ii 
                    WHERE ii.producto_id = p.id AND ii.estado = ''Disponible''
                )
                ELSE COALESCE((
                    SELECT sg.cantidad_actual 
                    FROM StockGeneral sg 
                    WHERE sg.producto_id = p.id
                ), 0)
            END AS cantidad_disponible,
            CASE 
                WHEN p.usa_numero_serie = 1 THEN (
                    SELECT COUNT(*) 
                    FROM InventarioIndividual ii 
                    WHERE ii.producto_id = p.id
                )
                ELSE NULL
            END AS total_items_serializados,
            CASE 
                WHEN p.usa_numero_serie = 0 THEN 
                    CASE 
                        WHEN COALESCE((SELECT sg.cantidad_actual FROM StockGeneral sg WHERE sg.producto_id = p.id), 0) <= p.stock_minimo
                        THEN 1 
                        ELSE 0 
                    END
                ELSE 0
            END AS alerta_stock_bajo,
            (SELECT COUNT(*) FROM Productos p_count INNER JOIN Categorias c_count ON p_count.categoria_id = c_count.id WHERE 
                (? IS NULL OR p_count.categoria_id = ?)
                AND (? IS NULL OR c_count.nombre LIKE ?)
                AND (? IS NULL OR p_count.usa_numero_serie = ?)
                AND (? IS NULL OR p_count.activo = ?)
            ) as TotalRecords
        FROM Productos p
        INNER JOIN Categorias c ON p.categoria_id = c.id
        WHERE 
            (? IS NULL OR p.categoria_id = ?)
            AND (? IS NULL OR c.nombre LIKE ?)
            AND (? IS NULL OR p.usa_numero_serie = ?)
            AND (? IS NULL OR p.activo = ?)
        ORDER BY c.nombre, p.marca, p.modelo
        LIMIT ?, ?';
    
    -- Preparar y ejecutar la consulta
    SET @stmt = v_sql;
    
    SET @p_categoria_id = p_categoria_id;
    SET @p_categoria_nombre = p_categoria_nombre;
    SET @p_categoria_nombre_like = CONCAT('%', p_categoria_nombre, '%');
    SET @p_usa_numero_serie = p_usa_numero_serie;
    SET @p_activo = p_activo;
    SET @v_offset = v_offset;
    SET @p_PageSize = p_PageSize;

    PREPARE stmt FROM @stmt;
    EXECUTE stmt USING 
        @p_categoria_id, @p_categoria_id, 
        @p_categoria_nombre, @p_categoria_nombre_like,
        @p_usa_numero_serie, @p_usa_numero_serie,
        @p_activo, @p_activo,
        @p_categoria_id, @p_categoria_id, 
        @p_categoria_nombre, @p_categoria_nombre_like,
        @p_usa_numero_serie, @p_usa_numero_serie,
        @p_activo, @p_activo,
        @v_offset, @p_PageSize;
    DEALLOCATE PREPARE stmt;

END //

DELIMITER ; 