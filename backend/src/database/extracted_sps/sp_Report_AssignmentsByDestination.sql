
CREATE PROCEDURE dbo.sp_Report_AssignmentsByDestination
    @TipoDestino NVARCHAR(20) = NULL,
    @DestinoID INT = NULL,
    @EstadoAsignacion NVARCHAR(20) = NULL,
    @FechaDesde DATE = NULL,
    @FechaHasta DATE = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @SkipRows INT = (@PageNumber - 1) * @PageSize;
    
    -- Crear tabla temporal para almacenar resultados
    CREATE TABLE #AsignacionesTemp (
        id INT,
        tipo_asignacion NVARCHAR(20),
        estado NVARCHAR(20),
        fecha_asignacion DATETIME,
        fecha_devolucion DATETIME,
        destino_nombre NVARCHAR(200),
        producto_nombre NVARCHAR(200),
        tipo_inventario NVARCHAR(20),
        usuario_asigna NVARCHAR(100),
        usuario_recibe NVARCHAR(100),
        dias_asignado INT
    );
    
    -- Insertar datos en tabla temporal
    INSERT INTO #AsignacionesTemp
    SELECT 
        a.id,
        CASE 
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
            WHEN a.inventario_individual_id IS NOT NULL THEN 'Individual'
            ELSE 'General'
        END AS tipo_inventario,
        ISNULL(u_asigna.nombre, 'N/A') AS usuario_asigna,
        ISNULL(u_recibe.nombre, 'N/A') AS usuario_recibe,
        DATEDIFF(day, a.fecha_asignacion, ISNULL(a.fecha_devolucion, GETDATE())) AS dias_asignado
    FROM 
        Asignaciones a
        LEFT JOIN Empleados e ON a.empleado_id = e.id
        LEFT JOIN Sectores s ON a.sector_id = s.id
        LEFT JOIN Sucursales b ON a.sucursal_id = b.id
        LEFT JOIN InventarioIndividual ii ON a.inventario_individual_id = ii.id
        LEFT JOIN Productos p_individual ON ii.producto_id = p_individual.id
        LEFT JOIN Usuarios u_asigna ON a.usuario_asigna_id = u_asigna.id
        LEFT JOIN Usuarios u_recibe ON a.usuario_recibe_id = u_recibe.id
    WHERE 
        (@TipoDestino IS NULL OR 
            (@TipoDestino = 'Empleado' AND a.empleado_id IS NOT NULL) OR
            (@TipoDestino = 'Sector' AND a.sector_id IS NOT NULL) OR
            (@TipoDestino = 'Sucursal' AND a.sucursal_id IS NOT NULL)
        )
        AND (@DestinoID IS NULL OR 
            (a.empleado_id = @DestinoID) OR
            (a.sector_id = @DestinoID) OR
            (a.sucursal_id = @DestinoID)
        )
        AND (@EstadoAsignacion IS NULL OR 
            (@EstadoAsignacion = 'Activa' AND a.activa = 1) OR
            (@EstadoAsignacion = 'Devuelta' AND a.activa = 0)
        )
        AND (@FechaDesde IS NULL OR a.fecha_asignacion >= @FechaDesde)
        AND (@FechaHasta IS NULL OR a.fecha_asignacion <= @FechaHasta);
    
    -- Obtener total de registros
    DECLARE @TotalRows INT;
    SELECT @TotalRows = COUNT(*) FROM #AsignacionesTemp;
    
    -- Devolver resultados paginados
    SELECT 
        *,
        @TotalRows AS TotalRows
    FROM #AsignacionesTemp
    ORDER BY fecha_asignacion DESC, id
    OFFSET @SkipRows ROWS
    FETCH NEXT @PageSize ROWS ONLY;
    
    -- Limpiar tabla temporal
    DROP TABLE #AsignacionesTemp;
END;
