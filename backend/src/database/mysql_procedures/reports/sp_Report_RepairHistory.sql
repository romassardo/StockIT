DELIMITER $$

CREATE PROCEDURE `sp_Report_RepairHistory`(
    IN `p_FechaDesde` DATE,
    IN `p_FechaHasta` DATE,
    IN `p_Estado` VARCHAR(20),
    IN `p_Proveedor` VARCHAR(100),
    IN `p_PageNumber` INT,
    IN `p_PageSize` INT
)
BEGIN
    DECLARE v_Offset INT;
    DECLARE v_PageSize INT;
    
    -- Validar y establecer valores por defecto para paginación
    IF p_PageNumber < 1 THEN
        SET p_PageNumber = 1;
    END IF;
    
    IF p_PageSize < 1 OR p_PageSize > 100 THEN
        SET v_PageSize = 20;
    ELSE
        SET v_PageSize = p_PageSize;
    END IF;
    
    SET v_Offset = (p_PageNumber - 1) * v_PageSize;
    
    -- CTE para el historial de reparaciones
    WITH RepairHistoryCTE AS (
        SELECT 
            r.id AS reparacion_id,
            ii.numero_serie,
            p.marca,
            p.modelo,
            c.nombre AS categoria,
            r.fecha_envio,
            r.fecha_retorno,
            r.proveedor,
            r.problema_descripcion,
            r.solucion_descripcion,
            r.estado,
            u_envia.nombre AS usuario_envia,
            u_recibe.nombre AS usuario_recibe,
            CASE 
                WHEN r.fecha_retorno IS NOT NULL 
                THEN DATEDIFF(r.fecha_retorno, r.fecha_envio)
                ELSE DATEDIFF(NOW(), r.fecha_envio)
            END AS dias_reparacion
        FROM 
            Reparaciones r
            INNER JOIN InventarioIndividual ii ON r.inventario_individual_id = ii.id
            INNER JOIN Productos p ON ii.producto_id = p.id
            INNER JOIN Categorias c ON p.categoria_id = c.id
            INNER JOIN Usuarios u_envia ON r.usuario_envia_id = u_envia.id
            LEFT JOIN Usuarios u_recibe ON r.usuario_recibe_id = u_recibe.id
        WHERE 
            (p_FechaDesde IS NULL OR r.fecha_envio >= p_FechaDesde)
            AND (p_FechaHasta IS NULL OR r.fecha_envio <= p_FechaHasta)
            AND (p_Estado IS NULL OR r.estado = p_Estado)
            AND (p_Proveedor IS NULL OR r.proveedor LIKE CONCAT('%', p_Proveedor, '%'))
    )
    SELECT 
        *,
        (SELECT COUNT(*) FROM RepairHistoryCTE) AS TotalRows
    FROM RepairHistoryCTE
    ORDER BY fecha_envio DESC
    LIMIT v_Offset, v_PageSize;

END$$

DELIMITER ; 