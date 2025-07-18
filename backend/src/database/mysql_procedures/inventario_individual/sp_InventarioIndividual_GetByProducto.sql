-- =============================================
-- Description: Obtiene todos los ítems de inventario para un producto específico, con filtro opcional por estado.
-- =============================================
DROP PROCEDURE IF EXISTS sp_InventarioIndividual_GetByProducto;

DELIMITER //

CREATE PROCEDURE sp_InventarioIndividual_GetByProducto(
    IN p_producto_id INT,
    IN p_estado VARCHAR(20)
)
BEGIN
    DECLARE v_usa_numero_serie BOOLEAN;

    -- Validar que el producto existe
    IF NOT EXISTS (SELECT 1 FROM Productos WHERE id = p_producto_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El producto no existe';
    END IF;
    
    -- Validar que el producto usa número de serie
    SELECT usa_numero_serie INTO v_usa_numero_serie FROM Productos WHERE id = p_producto_id;
    
    IF v_usa_numero_serie = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Este producto no utiliza inventario individual';
    END IF;
    
    -- Validar que el estado sea válido (si se proporciona)
    IF p_estado IS NOT NULL AND p_estado NOT IN ('Disponible', 'Asignado', 'En Reparación', 'Dado de Baja') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Estado no válido. Los estados permitidos son: Disponible, Asignado, En Reparación, Dado de Baja';
    END IF;
    
    SELECT 
        ii.id,
        ii.producto_id,
        p.marca AS producto_marca,
        p.modelo AS producto_modelo,
        c.nombre AS categoria_nombre,
        ii.numero_serie,
        ii.estado,
        ii.fecha_ingreso,
        ii.fecha_baja,
        ii.motivo_baja
    FROM 
        InventarioIndividual ii
    INNER JOIN 
        Productos p ON ii.producto_id = p.id
    INNER JOIN 
        Categorias c ON p.categoria_id = c.id
    WHERE 
        ii.producto_id = p_producto_id
        AND (p_estado IS NULL OR ii.estado = p_estado)
    ORDER BY 
        ii.estado ASC,
        ii.fecha_ingreso DESC;

END //

DELIMITER ; 