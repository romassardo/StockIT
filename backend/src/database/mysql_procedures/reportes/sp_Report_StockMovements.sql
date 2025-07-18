-- =============================================
-- Description: Genera un reporte paginado de los movimientos de stock, con filtros.
-- =============================================
DROP PROCEDURE IF EXISTS sp_Report_StockMovements;

DELIMITER //

CREATE PROCEDURE sp_Report_StockMovements(
    IN p_tipo_movimiento VARCHAR(20),
    IN p_fecha_desde DATE,
    IN p_fecha_hasta DATE,
    IN p_producto VARCHAR(100),
    IN p_usuario VARCHAR(100),
    IN p_PageNumber INT,
    IN p_PageSize INT
)
BEGIN
    DECLARE v_fecha_hasta DATE;
    DECLARE v_offset INT;
    DECLARE v_page_size INT;

    SET v_page_size = IF(p_PageSize < 1 OR p_PageSize IS NULL, 25, LEAST(p_PageSize, 100));
    SET v_offset = (IF(p_PageNumber < 1 OR p_PageNumber IS NULL, 1, p_PageNumber) - 1) * v_page_size;

    IF p_fecha_hasta IS NOT NULL THEN
        SET v_fecha_hasta = DATE_ADD(p_fecha_hasta, INTERVAL 1 DAY);
    END IF;

    WITH FilteredMovements AS (
        SELECT 
            ms.id AS movimiento_id,
            CONCAT(p.marca, ' ', p.modelo) AS producto,
            c.nombre AS categoria,
            ms.tipo_movimiento,
            ms.cantidad,
            ms.fecha_movimiento,
            ms.motivo,
            ms.observaciones,
            CASE 
                WHEN ms.empleado_id IS NOT NULL THEN CONCAT(e.nombre, ' ', e.apellido)
                WHEN ms.sector_id IS NOT NULL THEN s.nombre
                WHEN ms.sucursal_id IS NOT NULL THEN su.nombre
                ELSE 'N/A'
            END AS destino,
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
            (p_tipo_movimiento IS NULL OR ms.tipo_movimiento = p_tipo_movimiento)
            AND (p_fecha_desde IS NULL OR ms.fecha_movimiento >= p_fecha_desde)
            AND (v_fecha_hasta IS NULL OR ms.fecha_movimiento < v_fecha_hasta)
            AND (p_producto IS NULL OR 
                 CONCAT(p.marca, ' ', p.modelo) LIKE CONCAT('%', p_producto, '%') OR
                 c.nombre LIKE CONCAT('%', p_producto, '%'))
            AND (p_usuario IS NULL OR u.nombre LIKE CONCAT('%', p_usuario, '%'))
    )
    SELECT 
        *,
        (SELECT COUNT(*) FROM FilteredMovements) AS TotalRecords
    FROM FilteredMovements
    ORDER BY fecha_movimiento DESC
    LIMIT v_page_size OFFSET v_offset;

END //

DELIMITER ; 