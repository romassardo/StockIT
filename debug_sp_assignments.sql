-- ═══════════════════════════════════════════════════════════════════════════════
-- 🔍 DEBUG ESPECÍFICO DE sp_Report_AssignmentsByDestination
-- Para entender por qué EMPLEADO, PRODUCTO, ESTADO están vacíos
-- ═══════════════════════════════════════════════════════════════════════════════

PRINT '🔍 DEBUGGEANDO sp_Report_AssignmentsByDestination...';
PRINT '';

-- ═══════════════════════════════════════════════════════════════════════════════
PRINT '1️⃣ EJECUTANDO SP ACTUAL CON DEBUG:';
PRINT '==================================';
EXEC sp_Report_AssignmentsByDestination @TipoDestino = 'Empleado', @PageNumber = 1, @PageSize = 3;

PRINT '';

-- ═══════════════════════════════════════════════════════════════════════════════
PRINT '2️⃣ VERIFICANDO DATOS DIRECTOS DE ASIGNACIONES:';
PRINT '==============================================';

PRINT 'Asignaciones con datos completos (query manual):';
SELECT TOP 3
    a.id,
    a.fecha_asignacion,
    a.fecha_devolucion,
    CASE 
        WHEN a.empleado_id IS NOT NULL THEN CONCAT(e.nombre, ' ', e.apellido)
        WHEN a.sector_id IS NOT NULL THEN s.nombre
        WHEN a.sucursal_id IS NOT NULL THEN b.nombre
        ELSE 'Desconocido'
    END AS destino_nombre,
    CASE 
        WHEN ii.numero_serie IS NOT NULL THEN CONCAT(p_ind.marca, ' ', p_ind.modelo, ' (', ii.numero_serie, ')')
        ELSE CONCAT(p_gen.marca, ' ', p_gen.modelo, ' (Cant: ', a.cantidad, ')')
    END AS producto_nombre,
    CASE 
        WHEN a.activa = 1 THEN 'Activa'
        ELSE 'Devuelta'
    END AS estado_asignacion,
    u_asigna.nombre_usuario AS usuario_asigna,
    DATEDIFF(day, a.fecha_asignacion, ISNULL(a.fecha_devolucion, GETDATE())) AS dias_asignado
FROM 
    Asignaciones a
    LEFT JOIN Empleados e ON a.empleado_id = e.id
    LEFT JOIN Sectores s ON a.sector_id = s.id
    LEFT JOIN Sucursales b ON a.sucursal_id = b.id
    LEFT JOIN InventarioIndividual ii ON a.inventario_individual_id = ii.id
    LEFT JOIN Productos p_ind ON ii.producto_id = p_ind.id
    LEFT JOIN Productos p_gen ON a.producto_id = p_gen.id
    LEFT JOIN Usuarios u_asigna ON a.usuario_asigna_id = u_asigna.id
WHERE a.empleado_id IS NOT NULL
ORDER BY a.fecha_asignacion DESC;

PRINT '';
PRINT '✅ DEBUG COMPLETADO';