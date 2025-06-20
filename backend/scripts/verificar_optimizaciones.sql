-- VERIFICACIÓN DE OPTIMIZACIONES STOCKIT
-- Ejecutar DESPUÉS de aplicar los índices y las optimizaciones

PRINT '🎯 VERIFICANDO OPTIMIZACIONES DE STOCKIT...';
PRINT '==========================================';

-- 1. VERIFICAR NUEVOS ÍNDICES CREADOS
PRINT '';
PRINT '✅ VERIFICANDO ÍNDICES OPTIMIZADOS:';

SELECT 
    t.name AS Tabla,
    i.name AS NombreIndice,
    i.type_desc AS TipoIndice,
    CASE 
        WHEN i.name LIKE 'IX_%ProductoEstado' THEN '🎯 BÚSQUEDA PRODUCTO-ESTADO'
        WHEN i.name LIKE 'IX_%NumeroSerie' THEN '🔍 BÚSQUEDA NÚMERO SERIE'
        WHEN i.name LIKE 'IX_%EmpleadoActiva' THEN '👤 ASIGNACIONES EMPLEADO'
        WHEN i.name LIKE 'IX_%InventarioFecha' THEN '📅 HISTORIAL ACTIVOS'
        WHEN i.name LIKE 'IX_%ProductoCantidad' THEN '📊 ALERTAS STOCK'
        WHEN i.name LIKE 'IX_%ProductoFecha' THEN '📈 MOVIMIENTOS'
        WHEN i.name LIKE 'IX_%FechaTipo' THEN '📋 REPORTES'
        ELSE '📌 ÍNDICE ESTÁNDAR'
    END AS Optimizacion,
    CASE WHEN i.is_unique = 1 THEN '🔒 ÚNICO' ELSE '📂 NORMAL' END AS Tipo
FROM sys.tables t
INNER JOIN sys.indexes i ON t.object_id = i.object_id
WHERE t.name IN ('InventarioIndividual', 'Asignaciones', 'StockGeneral', 'MovimientosStock')
    AND i.name LIKE 'IX_%'
ORDER BY t.name, i.name;

-- 2. VERIFICAR ESTADÍSTICAS ACTUALIZADAS
PRINT '';
PRINT '📊 VERIFICANDO ESTADÍSTICAS:';

SELECT 
    t.name AS Tabla,
    s.name AS Estadistica,
    sp.last_updated AS UltimaActualizacion,
    CASE 
        WHEN sp.last_updated > DATEADD(MINUTE, -30, GETDATE()) THEN '🟢 RECIENTE'
        WHEN sp.last_updated > DATEADD(HOUR, -24, GETDATE()) THEN '🟡 ACEPTABLE'
        ELSE '🔴 ANTIGUA'
    END AS Estado
FROM sys.tables t
INNER JOIN sys.stats s ON t.object_id = s.object_id
INNER JOIN sys.dm_db_stats_properties(s.object_id, s.stats_id) sp ON 1=1
WHERE t.name IN ('InventarioIndividual', 'Asignaciones', 'StockGeneral', 'MovimientosStock')
ORDER BY sp.last_updated DESC;

-- 3. MEDIR PERFORMANCE DE QUERIES CLAVE
PRINT '';
PRINT '⚡ MIDIENDO PERFORMANCE DE QUERIES CLAVE:';

-- Benchmark 1: Búsqueda por número de serie (debe ser súper rápida)
DECLARE @start_time datetime2 = SYSDATETIME();

SELECT TOP 1 
    ii.id, 
    ii.numero_serie, 
    ii.estado,
    p.marca + ' ' + p.modelo AS producto
FROM InventarioIndividual ii
INNER JOIN Productos p ON ii.producto_id = p.id
WHERE ii.numero_serie LIKE 'TEST%'
ORDER BY ii.id;

DECLARE @end_time datetime2 = SYSDATETIME();
DECLARE @duration_ms int = DATEDIFF(MICROSECOND, @start_time, @end_time) / 1000.0;

PRINT '🔍 Búsqueda por número de serie: ' + CAST(@duration_ms AS VARCHAR) + 'ms ' + 
      CASE WHEN @duration_ms < 50 THEN '🟢 EXCELENTE' 
           WHEN @duration_ms < 200 THEN '🟡 BUENO' 
           ELSE '🔴 LENTO' END;

-- Benchmark 2: Filtro por estado (debe ser rápida)
SET @start_time = SYSDATETIME();

SELECT COUNT(*) AS TotalDisponibles
FROM InventarioIndividual ii
INNER JOIN Productos p ON ii.producto_id = p.id
WHERE ii.estado = 'Disponible';

SET @end_time = SYSDATETIME();
SET @duration_ms = DATEDIFF(MICROSECOND, @start_time, @end_time) / 1000.0;

PRINT '📦 Conteo por estado: ' + CAST(@duration_ms AS VARCHAR) + 'ms ' + 
      CASE WHEN @duration_ms < 100 THEN '🟢 EXCELENTE' 
           WHEN @duration_ms < 500 THEN '🟡 BUENO' 
           ELSE '🔴 LENTO' END;

-- Benchmark 3: Asignaciones activas (debe ser rápida)
SET @start_time = SYSDATETIME();

SELECT COUNT(*) AS AsignacionesActivas
FROM Asignaciones a
INNER JOIN InventarioIndividual ii ON a.inventario_individual_id = ii.id
WHERE a.activa = 1;

SET @end_time = SYSDATETIME();
SET @duration_ms = DATEDIFF(MICROSECOND, @start_time, @end_time) / 1000.0;

PRINT '👥 Asignaciones activas: ' + CAST(@duration_ms AS VARCHAR) + 'ms ' + 
      CASE WHEN @duration_ms < 100 THEN '🟢 EXCELENTE' 
           WHEN @duration_ms < 500 THEN '🟡 BUENO' 
           ELSE '🔴 LENTO' END;

-- Benchmark 4: Stock bajo mínimo (debe ser rápida)
SET @start_time = SYSDATETIME();

SELECT COUNT(*) AS ProductosBajoMinimo
FROM StockGeneral sg
INNER JOIN Productos p ON sg.producto_id = p.id
WHERE sg.cantidad_actual < p.stock_minimo;

SET @end_time = SYSDATETIME();
SET @duration_ms = DATEDIFF(MICROSECOND, @start_time, @end_time) / 1000.0;

PRINT '🚨 Alertas de stock: ' + CAST(@duration_ms AS VARCHAR) + 'ms ' + 
      CASE WHEN @duration_ms < 50 THEN '🟢 EXCELENTE' 
           WHEN @duration_ms < 200 THEN '🟡 BUENO' 
           ELSE '🔴 LENTO' END;

-- 4. VERIFICAR FRAGMENTACIÓN DESPUÉS DE OPTIMIZACIÓN
PRINT '';
PRINT '🧩 VERIFICANDO FRAGMENTACIÓN POST-OPTIMIZACIÓN:';

SELECT 
    OBJECT_NAME(ps.object_id) AS Tabla,
    i.name AS Indice,
    CAST(ps.avg_fragmentation_in_percent AS DECIMAL(5,2)) AS FragmentacionPorcentaje,
    ps.page_count AS TotalPaginas,
    CASE 
        WHEN ps.avg_fragmentation_in_percent < 5 THEN '🟢 ÓPTIMO'
        WHEN ps.avg_fragmentation_in_percent < 15 THEN '🟡 ACEPTABLE'
        WHEN ps.avg_fragmentation_in_percent < 30 THEN '🟠 ATENCIÓN'
        ELSE '🔴 CRÍTICO'
    END AS Estado
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ps
INNER JOIN sys.indexes i ON ps.object_id = i.object_id AND ps.index_id = i.index_id
WHERE ps.page_count > 50
    AND OBJECT_NAME(ps.object_id) IN ('InventarioIndividual', 'Asignaciones', 'StockGeneral', 'MovimientosStock')
ORDER BY ps.avg_fragmentation_in_percent DESC;

-- 5. RESUMEN DE OPTIMIZACIONES
PRINT '';
PRINT '📈 RESUMEN DE OPTIMIZACIONES APLICADAS:';
PRINT '=========================================';

-- Contar índices optimizados
DECLARE @indices_count INT;
SELECT @indices_count = COUNT(*)
FROM sys.indexes i
INNER JOIN sys.tables t ON i.object_id = t.object_id
WHERE t.name IN ('InventarioIndividual', 'Asignaciones', 'StockGeneral', 'MovimientosStock')
    AND i.name LIKE 'IX_%';

PRINT '✅ Índices de rendimiento creados: ' + CAST(@indices_count AS VARCHAR);

-- Verificar stored procedures críticos
DECLARE @sp_count INT;
SELECT @sp_count = COUNT(*)
FROM sys.procedures
WHERE name IN (
    'sp_InventarioIndividual_GetBySerialNumber',
    'sp_Asignaciones_GetByInventarioId', 
    'sp_StockGeneral_GetAll',
    'sp_Report_StockAlerts'
);

PRINT '✅ Stored Procedures optimizados: ' + CAST(@sp_count AS VARCHAR);

PRINT '';
PRINT '🎉 VERIFICACIÓN COMPLETADA!';
PRINT '========================';
PRINT '';
PRINT '📋 PRÓXIMOS PASOS:';
PRINT '1. Reiniciar backend para activar caché';
PRINT '2. Probar performance en frontend';
PRINT '3. Monitorear logs de caché';
PRINT '4. Verificar métricas de usuario';
PRINT '';
PRINT '🎯 OBJETIVOS DE PERFORMANCE:';
PRINT '- Dashboard: < 3 segundos';
PRINT '- Búsquedas: < 1 segundo';
PRINT '- Reportes: < 5 segundos';
PRINT '- Hit rate caché: > 70%'; 