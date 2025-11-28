-- =============================================
-- Description: Obtiene un historial paginado de movimientos de stock con filtros.
-- =============================================
DROP PROCEDURE IF EXISTS sp_StockGeneral_GetMovements;

DELIMITER //

CREATE PROCEDURE sp_StockGeneral_GetMovements(
    IN p_producto_id INT,
    IN p_tipo_movimiento VARCHAR(20),
    IN p_empleado_id INT,
    IN p_sector_id INT,
    IN p_sucursal_id INT,
    IN p_fecha_desde DATE,
    IN p_fecha_hasta DATE,
    IN p_search VARCHAR(100),
    IN p_PageNumber INT,
    IN p_PageSize INT
)
BEGIN
    DECLARE v_fecha_hasta DATE;
    DECLARE v_offset INT;
    DECLARE v_page_size INT;

    SET v_page_size = IF(p_PageSize < 1 OR p_PageSize IS NULL, 50, LEAST(p_PageSize, 10000));
    SET v_offset = (IF(p_PageNumber < 1 OR p_PageNumber IS NULL, 1, p_PageNumber) - 1) * v_page_size;

    IF p_fecha_hasta IS NOT NULL THEN
        SET v_fecha_hasta = DATE_ADD(p_fecha_hasta, INTERVAL 1 DAY);
    END IF;

    SELECT 
        ms.id AS movimiento_id,
        ms.producto_id,
        p.marca AS nombre_marca,
        p.modelo AS nombre_producto,
        c.nombre AS categoria,
        ms.tipo_movimiento,
        ms.cantidad,
        ms.fecha_movimiento,
        ms.motivo,
        ms.observaciones,
        CONCAT(e.nombre, ' ', e.apellido) AS empleado_nombre,
        s.nombre AS sector_nombre,
        su.nombre AS sucursal_nombre,
        u.nombre AS usuario_nombre
    FROM 
        MovimientosStock ms
    INNER JOIN Productos p ON ms.producto_id = p.id
    INNER JOIN Categorias c ON p.categoria_id = c.id
    INNER JOIN Usuarios u ON ms.usuario_id = u.id
    LEFT JOIN Empleados e ON ms.empleado_id = e.id
    LEFT JOIN Sectores s ON ms.sector_id = s.id
    LEFT JOIN Sucursales su ON ms.sucursal_id = su.id
    WHERE 
        (p_producto_id IS NULL OR ms.producto_id = p_producto_id)
        AND (p_tipo_movimiento IS NULL OR ms.tipo_movimiento = p_tipo_movimiento)
        AND (p_empleado_id IS NULL OR ms.empleado_id = p_empleado_id)
        AND (p_sector_id IS NULL OR ms.sector_id = p_sector_id)
        AND (p_sucursal_id IS NULL OR ms.sucursal_id = p_sucursal_id)
        AND (p_fecha_desde IS NULL OR ms.fecha_movimiento >= p_fecha_desde)
        AND (v_fecha_hasta IS NULL OR ms.fecha_movimiento < v_fecha_hasta)
        AND (p_search IS NULL OR 
             p.marca LIKE CONCAT('%', p_search, '%') OR 
             p.modelo LIKE CONCAT('%', p_search, '%') OR
             c.nombre LIKE CONCAT('%', p_search, '%') OR
             ms.motivo LIKE CONCAT('%', p_search, '%') OR
             e.nombre LIKE CONCAT('%', p_search, '%') OR
             e.apellido LIKE CONCAT('%', p_search, '%') OR
             s.nombre LIKE CONCAT('%', p_search, '%') OR
             su.nombre LIKE CONCAT('%', p_search, '%') OR
             u.nombre LIKE CONCAT('%', p_search, '%'))
    ORDER BY 
        ms.fecha_movimiento DESC
    LIMIT v_page_size OFFSET v_offset;

END //

DELIMITER ; 