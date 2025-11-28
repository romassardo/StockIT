DELIMITER $$

CREATE PROCEDURE `sp_Report_AssignmentsByDestination`(
    IN `p_TipoDestino` VARCHAR(20),
    IN `p_DestinoID` INT,
    IN `p_EstadoAsignacion` VARCHAR(20),
    IN `p_FechaDesde` DATE,
    IN `p_FechaHasta` DATE,
    IN `p_PageNumber` INT,
    IN `p_PageSize` INT,
    IN `p_SearchTerm` VARCHAR(100),
    IN `p_TipoDispositivo` VARCHAR(50)
)
BEGIN
    DECLARE v_Offset INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        DROP TEMPORARY TABLE IF EXISTS AsignacionesTemp;
        RESIGNAL;
    END;

    SET v_Offset = (p_PageNumber - 1) * p_PageSize;

    CREATE TEMPORARY TABLE AsignacionesTemp (
        id INT,
        tipo_asignacion VARCHAR(20),
        estado VARCHAR(20),
        fecha_asignacion DATETIME,
        fecha_devolucion DATETIME,
        destino_nombre VARCHAR(255),
        producto_nombre VARCHAR(255),
        categoria_nombre VARCHAR(100),
        tipo_inventario VARCHAR(20),
        usuario_asigna VARCHAR(100),
        usuario_recibe VARCHAR(100),
        dias_asignado INT
    );

    INSERT INTO AsignacionesTemp
    SELECT 
        a.id,
        CASE 
            WHEN p_TipoDestino = 'Sector' AND a.sector_id IS NOT NULL THEN 'Sector'
            WHEN p_TipoDestino = 'Sucursal' AND a.sucursal_id IS NOT NULL THEN 'Sucursal'
            WHEN p_TipoDestino = 'Empleado' AND a.empleado_id IS NOT NULL THEN 'Empleado'
            WHEN a.empleado_id IS NOT NULL THEN 'Empleado'
            WHEN a.sector_id IS NOT NULL THEN 'Sector'
            WHEN a.sucursal_id IS NOT NULL THEN 'Sucursal'
            ELSE 'Desconocido'
        END AS tipo_asignacion,
        CASE 
            WHEN a.activa = 1 THEN 'Activa'
            ELSE 'Devuelta'
        END AS estado,
        a.fecha_asignacion,
        a.fecha_devolucion,
        CASE 
            WHEN p_TipoDestino = 'Sector' AND a.sector_id IS NOT NULL THEN s.nombre
            WHEN p_TipoDestino = 'Sucursal' AND a.sucursal_id IS NOT NULL THEN b.nombre
            WHEN p_TipoDestino = 'Empleado' AND a.empleado_id IS NOT NULL THEN CONCAT(e.nombre, ' ', e.apellido)
            WHEN a.empleado_id IS NOT NULL THEN CONCAT(e.nombre, ' ', e.apellido)
            WHEN a.sector_id IS NOT NULL THEN s.nombre
            WHEN a.sucursal_id IS NOT NULL THEN b.nombre
            ELSE 'Desconocido'
        END AS destino_nombre,
        CASE 
            WHEN a.inventario_individual_id IS NOT NULL THEN CONCAT(p_individual.marca, ' ', p_individual.modelo, ' (', ii.numero_serie, ')')
            ELSE 'Producto General'
        END AS producto_nombre,
        CASE 
            WHEN a.inventario_individual_id IS NOT NULL THEN c.nombre
            ELSE 'General'
        END AS categoria_nombre,
        CASE 
            WHEN a.inventario_individual_id IS NOT NULL THEN 'Individual'
            ELSE 'General'
        END AS tipo_inventario,
        IFNULL(u_asigna.nombre, 'N/A') AS usuario_asigna,
        IFNULL(u_recibe.nombre, 'N/A') AS usuario_recibe,
        DATEDIFF(IFNULL(a.fecha_devolucion, NOW()), a.fecha_asignacion) AS dias_asignado
    FROM 
        Asignaciones a
        LEFT JOIN Empleados e ON a.empleado_id = e.id
        LEFT JOIN Sectores s ON a.sector_id = s.id
        LEFT JOIN Sucursales b ON a.sucursal_id = b.id
        LEFT JOIN InventarioIndividual ii ON a.inventario_individual_id = ii.id
        LEFT JOIN Productos p_individual ON ii.producto_id = p_individual.id
        LEFT JOIN Categorias c ON p_individual.categoria_id = c.id
        LEFT JOIN Usuarios u_asigna ON a.usuario_asigna_id = u_asigna.id
        LEFT JOIN Usuarios u_recibe ON a.usuario_recibe_id = u_recibe.id
    WHERE 
        (p_TipoDestino IS NULL OR 
            (p_TipoDestino = 'Empleado' AND a.empleado_id IS NOT NULL) OR
            (p_TipoDestino = 'Sector' AND a.sector_id IS NOT NULL) OR
            (p_TipoDestino = 'Sucursal' AND a.sucursal_id IS NOT NULL)
        )
        AND (p_DestinoID IS NULL OR 
            (a.empleado_id = p_DestinoID) OR
            (a.sector_id = p_DestinoID) OR
            (a.sucursal_id = p_DestinoID)
        )
        AND (p_EstadoAsignacion IS NULL OR 
            (p_EstadoAsignacion = 'Activa' AND a.activa = 1) OR
            (p_EstadoAsignacion = 'Devuelta' AND a.activa = 0)
        )
        AND (p_FechaDesde IS NULL OR a.fecha_asignacion >= p_FechaDesde)
        AND (p_FechaHasta IS NULL OR a.fecha_asignacion <= p_FechaHasta)
        AND (p_SearchTerm IS NULL OR p_SearchTerm = '' OR
            CONCAT(IFNULL(e.nombre,''), ' ', IFNULL(e.apellido,'')) LIKE CONCAT('%', p_SearchTerm, '%') OR
            s.nombre LIKE CONCAT('%', p_SearchTerm, '%') OR
            b.nombre LIKE CONCAT('%', p_SearchTerm, '%') OR
            p_individual.marca LIKE CONCAT('%', p_SearchTerm, '%') OR
            p_individual.modelo LIKE CONCAT('%', p_SearchTerm, '%') OR
            ii.numero_serie LIKE CONCAT('%', p_SearchTerm, '%') OR
            u_asigna.nombre LIKE CONCAT('%', p_SearchTerm, '%')
        )
        AND (p_TipoDispositivo IS NULL OR p_TipoDispositivo = '' OR 
             c.nombre LIKE CONCAT('%', p_TipoDispositivo, '%')
        );

    -- Calcular total de filas antes de paginar para evitar 'Can\'t reopen table'
    SELECT COUNT(*) INTO @TotalRows FROM AsignacionesTemp;

    SELECT 
        *,
        @TotalRows AS TotalRows
    FROM AsignacionesTemp
    ORDER BY fecha_asignacion DESC, id
    LIMIT v_Offset, p_PageSize;

    DROP TEMPORARY TABLE IF EXISTS AsignacionesTemp;
END$$

DELIMITER ;