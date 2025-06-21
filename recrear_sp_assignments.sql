-- ═══════════════════════════════════════════════════════════════════════════════
-- 🔧 RECREAR sp_Report_AssignmentsByDestination CON LA DEFINICIÓN CORRECTA
-- Solución al problema de campos EMPLEADO, PRODUCTO, ESTADO vacíos
-- ═══════════════════════════════════════════════════════════════════════════════

PRINT '🔧 RECREANDO sp_Report_AssignmentsByDestination...';
PRINT '';

-- ═══════════════════════════════════════════════════════════════════════════════
PRINT '1️⃣ ELIMINANDO SP CORRUPTO EXISTENTE:';
PRINT '===================================';
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_Report_AssignmentsByDestination')
BEGIN
    DROP PROCEDURE dbo.sp_Report_AssignmentsByDestination;
    PRINT '✅ SP anterior eliminado';
END
ELSE
    PRINT 'ℹ️ SP no existía previamente';

PRINT '';

-- ═══════════════════════════════════════════════════════════════════════════════
PRINT '2️⃣ CREANDO SP CON DEFINICIÓN CORRECTA:';
PRINT '======================================';
GO

CREATE PROCEDURE dbo.sp_Report_AssignmentsByDestination
    @TipoDestino NVARCHAR(20) = NULL, -- 'Empleado', 'Sector', 'Sucursal', NULL para todos
    @DestinoID INT = NULL,           -- ID del destino específico, NULL para todos
    @EstadoAsignacion NVARCHAR(20) = NULL, -- 'Activa', 'Devuelta', 'Cancelada', NULL para todas
    @FechaDesde DATE = NULL,         -- Fecha de asignación desde, NULL para todas
    @FechaHasta DATE = NULL,         -- Fecha de asignación hasta, NULL para todas
    @PageNumber INT = 1,
    @PageSize INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @SkipRows INT = (@PageNumber - 1) * @PageSize;
    
    -- Query principal
    WITH AsignacionesFiltradas AS (
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
            a.inventario_individual_id,
            a.empleado_id,
            a.sector_id,
            a.sucursal_id,
            a.observaciones,
            CASE 
                WHEN a.empleado_id IS NOT NULL THEN CONCAT(e.nombre, ' ', e.apellido)
                WHEN a.sector_id IS NOT NULL THEN s.nombre
                WHEN a.sucursal_id IS NOT NULL THEN b.nombre
                ELSE 'Desconocido'
            END AS destino_nombre,
            CASE 
                WHEN a.inventario_individual_id IS NOT NULL THEN ii.numero_serie
                ELSE NULL
            END AS numero_serie,
            CASE 
                WHEN a.inventario_individual_id IS NOT NULL THEN CONCAT(p_individual.marca, ' ', p_individual.modelo)
                ELSE 'Producto General'
            END AS producto_nombre,
            CASE 
                WHEN a.inventario_individual_id IS NOT NULL THEN 'Individual'
                ELSE 'General'
            END AS tipo_inventario,
            u_asigna.nombre AS usuario_asigna,
            u_recibe.nombre AS usuario_recibe,
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
            AND (@FechaHasta IS NULL OR a.fecha_asignacion <= @FechaHasta)
    )
    
    -- Obtener recuento total para paginación
    SELECT COUNT(*) AS TotalRows INTO #TotalCount FROM AsignacionesFiltradas;
    
    -- Obtener datos paginados
    SELECT 
        af.*,
        tc.TotalRows
    FROM 
        AsignacionesFiltradas af
        CROSS JOIN #TotalCount tc
    ORDER BY 
        af.fecha_asignacion DESC, af.id
    OFFSET @SkipRows ROWS
    FETCH NEXT @PageSize ROWS ONLY;
    
    -- Limpiar
    DROP TABLE #TotalCount;
    
    -- Devolver estadísticas agregadas
    SELECT
        'Estadísticas' AS ReportType,
        tipo_asignacion,
        estado,
        COUNT(*) AS total_asignaciones,
        SUM(CASE WHEN tipo_inventario = 'Individual' THEN 1 ELSE 0 END) AS total_individual,
        MIN(fecha_asignacion) AS primera_asignacion,
        MAX(fecha_asignacion) AS ultima_asignacion,
        AVG(dias_asignado) AS promedio_dias_asignado
    FROM 
        AsignacionesFiltradas
    GROUP BY 
        tipo_asignacion, estado;
END;
GO

PRINT '';
PRINT '✅ sp_Report_AssignmentsByDestination RECREADO EXITOSAMENTE';

-- ═══════════════════════════════════════════════════════════════════════════════
PRINT '';
PRINT '3️⃣ PROBANDO SP CORREGIDO:';
PRINT '=========================';
EXEC sp_Report_AssignmentsByDestination @TipoDestino = 'Empleado', @PageNumber = 1, @PageSize = 3;

PRINT '';
PRINT '🎉 CORRECCIÓN COMPLETADA - Los campos EMPLEADO, PRODUCTO, ESTADO ahora deberían funcionar correctamente';