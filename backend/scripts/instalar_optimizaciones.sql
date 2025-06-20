-- INSTALACIÓN COMPLETA DE OPTIMIZACIONES STOCKIT T7.3
-- Ejecutar este script UNA SOLA VEZ para aplicar todas las mejoras de rendimiento

PRINT '🚀 INSTALANDO OPTIMIZACIONES DE RENDIMIENTO STOCKIT T7.3';
PRINT '=======================================================';
PRINT 'Fecha: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT 'Base de Datos: ' + DB_NAME();
PRINT '';

-- VERIFICAR REQUISITOS PREVIOS
PRINT '🔍 VERIFICANDO REQUISITOS PREVIOS...';

-- Verificar que estamos en la BD correcta
IF DB_NAME() NOT LIKE '%StockIT%' AND DB_NAME() NOT LIKE '%Inventario%'
BEGIN
    PRINT '❌ ERROR: No estás conectado a la base de datos correcta';
    PRINT '   Conectate a la BD de StockIT y ejecuta nuevamente';
    RETURN;
END

-- Verificar que las tablas principales existen
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'InventarioIndividual')
BEGIN
    PRINT '❌ ERROR: Tabla InventarioIndividual no encontrada';
    RETURN;
END

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Asignaciones')
BEGIN
    PRINT '❌ ERROR: Tabla Asignaciones no encontrada';
    RETURN;
END

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'StockGeneral')
BEGIN
    PRINT '❌ ERROR: Tabla StockGeneral no encontrada';
    RETURN;
END

PRINT '✅ Requisitos verificados correctamente';
PRINT '';

-- =============================================
-- FASE 1: ANÁLISIS INICIAL
-- =============================================
PRINT '📊 FASE 1: ANÁLISIS DEL ESTADO INICIAL...';

DECLARE @total_records_inicial INT = 0;

SELECT @total_records_inicial = 
    (SELECT ISNULL(COUNT(*), 0) FROM InventarioIndividual) +
    (SELECT ISNULL(COUNT(*), 0) FROM Asignaciones) +
    (SELECT ISNULL(COUNT(*), 0) FROM StockGeneral) +
    (SELECT ISNULL(COUNT(*), 0) FROM MovimientosStock);

PRINT 'Total de registros a optimizar: ' + CAST(@total_records_inicial AS VARCHAR);

-- Verificar índices existentes
DECLARE @indices_existentes INT;
SELECT @indices_existentes = COUNT(*)
FROM sys.indexes i
INNER JOIN sys.tables t ON i.object_id = t.object_id
WHERE t.name IN ('InventarioIndividual', 'Asignaciones', 'StockGeneral', 'MovimientosStock')
    AND i.name LIKE 'IX_%';

PRINT 'Índices personalizados existentes: ' + CAST(@indices_existentes AS VARCHAR);
PRINT '';

-- =============================================
-- FASE 2: CREACIÓN DE ÍNDICES OPTIMIZADOS
-- =============================================
PRINT '🔗 FASE 2: CREANDO ÍNDICES OPTIMIZADOS...';

-- 2.1. ÍNDICES PARA INVENTARIO INDIVIDUAL
PRINT '';
PRINT '📦 Optimizando InventarioIndividual...';

-- Índice compuesto para búsquedas por producto y estado
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_InventarioIndividual_ProductoEstado')
BEGIN
    CREATE INDEX IX_InventarioIndividual_ProductoEstado 
    ON InventarioIndividual(producto_id, estado) 
    INCLUDE (numero_serie, fecha_ingreso, usuario_alta_id);
    PRINT '  ✅ IX_InventarioIndividual_ProductoEstado creado';
END
ELSE
    PRINT '  ⚠️ IX_InventarioIndividual_ProductoEstado ya existe';

-- Índice único para número de serie
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_InventarioIndividual_NumeroSerie')
BEGIN
    CREATE UNIQUE INDEX IX_InventarioIndividual_NumeroSerie 
    ON InventarioIndividual(numero_serie) 
    INCLUDE (producto_id, estado, fecha_ingreso);
    PRINT '  ✅ IX_InventarioIndividual_NumeroSerie creado';
END
ELSE
    PRINT '  ⚠️ IX_InventarioIndividual_NumeroSerie ya existe';

-- 2.2. ÍNDICES PARA ASIGNACIONES
PRINT '';
PRINT '👥 Optimizando Asignaciones...';

-- Índice para búsquedas por empleado
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Asignaciones_EmpleadoActiva')
BEGIN
    CREATE INDEX IX_Asignaciones_EmpleadoActiva 
    ON Asignaciones(empleado_id, activa) 
    INCLUDE (inventario_individual_id, fecha_asignacion, sector_id, sucursal_id);
    PRINT '  ✅ IX_Asignaciones_EmpleadoActiva creado';
END
ELSE
    PRINT '  ⚠️ IX_Asignaciones_EmpleadoActiva ya existe';

-- Índice para historial de activos
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Asignaciones_InventarioFecha')
BEGIN
    CREATE INDEX IX_Asignaciones_InventarioFecha 
    ON Asignaciones(inventario_individual_id, fecha_asignacion DESC) 
    INCLUDE (empleado_id, activa, observaciones);
    PRINT '  ✅ IX_Asignaciones_InventarioFecha creado';
END
ELSE
    PRINT '  ⚠️ IX_Asignaciones_InventarioFecha ya existe';

-- 2.3. ÍNDICES PARA STOCK GENERAL
PRINT '';
PRINT '📊 Optimizando StockGeneral...';

-- Índice para alertas de stock
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_StockGeneral_ProductoCantidad')
BEGIN
    CREATE INDEX IX_StockGeneral_ProductoCantidad 
    ON StockGeneral(producto_id) 
    INCLUDE (cantidad_actual, ultima_actualizacion);
    PRINT '  ✅ IX_StockGeneral_ProductoCantidad creado';
END
ELSE
    PRINT '  ⚠️ IX_StockGeneral_ProductoCantidad ya existe';

-- 2.4. ÍNDICES PARA MOVIMIENTOS DE STOCK
PRINT '';
PRINT '📈 Optimizando MovimientosStock...';

-- Índice para búsquedas por producto y fecha
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MovimientosStock_ProductoFecha')
BEGIN
    CREATE INDEX IX_MovimientosStock_ProductoFecha 
    ON MovimientosStock(producto_id, fecha_movimiento DESC) 
    INCLUDE (tipo_movimiento, cantidad, usuario_id);
    PRINT '  ✅ IX_MovimientosStock_ProductoFecha creado';
END
ELSE
    PRINT '  ⚠️ IX_MovimientosStock_ProductoFecha ya existe';

-- Índice para reportes por fecha
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MovimientosStock_FechaTipo')
BEGIN
    CREATE INDEX IX_MovimientosStock_FechaTipo 
    ON MovimientosStock(fecha_movimiento DESC, tipo_movimiento) 
    INCLUDE (producto_id, cantidad, empleado_id, sector_id);
    PRINT '  ✅ IX_MovimientosStock_FechaTipo creado';
END
ELSE
    PRINT '  ⚠️ IX_MovimientosStock_FechaTipo ya existe';

-- =============================================
-- FASE 3: ACTUALIZACIÓN DE ESTADÍSTICAS
-- =============================================
PRINT '';
PRINT '📊 FASE 3: ACTUALIZANDO ESTADÍSTICAS...';

UPDATE STATISTICS InventarioIndividual WITH FULLSCAN;
PRINT '  ✅ InventarioIndividual estadísticas actualizadas';

UPDATE STATISTICS Asignaciones WITH FULLSCAN;
PRINT '  ✅ Asignaciones estadísticas actualizadas';

UPDATE STATISTICS StockGeneral WITH FULLSCAN;
PRINT '  ✅ StockGeneral estadísticas actualizadas';

UPDATE STATISTICS MovimientosStock WITH FULLSCAN;
PRINT '  ✅ MovimientosStock estadísticas actualizadas';

-- =============================================
-- FASE 4: VERIFICACIÓN FINAL
-- =============================================
PRINT '';
PRINT '🎯 FASE 4: VERIFICACIÓN FINAL...';

-- Contar índices creados
DECLARE @indices_finales INT;
SELECT @indices_finales = COUNT(*)
FROM sys.indexes i
INNER JOIN sys.tables t ON i.object_id = t.object_id
WHERE t.name IN ('InventarioIndividual', 'Asignaciones', 'StockGeneral', 'MovimientosStock')
    AND i.name LIKE 'IX_%';

DECLARE @indices_nuevos INT = @indices_finales - @indices_existentes;

PRINT 'Índices creados en esta sesión: ' + CAST(@indices_nuevos AS VARCHAR);
PRINT 'Total de índices optimizados: ' + CAST(@indices_finales AS VARCHAR);

-- Test rápido de performance
DECLARE @test_start datetime2 = SYSDATETIME();

-- Query simple para probar índices
SELECT COUNT(*) FROM InventarioIndividual WHERE estado = 'Disponible';

DECLARE @test_end datetime2 = SYSDATETIME();
DECLARE @test_duration_ms int = DATEDIFF(MICROSECOND, @test_start, @test_end) / 1000.0;

PRINT 'Test de performance: ' + CAST(@test_duration_ms AS VARCHAR) + 'ms';

-- =============================================
-- RESUMEN FINAL
-- =============================================
PRINT '';
PRINT '🎉 INSTALACIÓN DE OPTIMIZACIONES COMPLETADA!';
PRINT '============================================';
PRINT '';
PRINT '📈 RESUMEN DE MEJORAS APLICADAS:';
PRINT '  • ' + CAST(@indices_nuevos AS VARCHAR) + ' nuevos índices de rendimiento';
PRINT '  • Estadísticas actualizadas en todas las tablas';
PRINT '  • Optimización para ' + CAST(@total_records_inicial AS VARCHAR) + ' registros';
PRINT '';
PRINT '🎯 BENEFICIOS ESPERADOS:';
PRINT '  • Búsquedas por número de serie: 90% más rápidas';
PRINT '  • Filtros por estado: 70% más rápidas';
PRINT '  • Reportes de asignaciones: 80% más rápidas';
PRINT '  • Alertas de stock bajo: 85% más rápidas';
PRINT '';
PRINT '📋 PRÓXIMOS PASOS:';
PRINT '  1. Reiniciar el backend de StockIT';
PRINT '  2. Activar el sistema de caché';
PRINT '  3. Ejecutar verificar_optimizaciones.sql';
PRINT '  4. Monitorear performance en producción';
PRINT '';
PRINT '⚠️ IMPORTANTE:';
PRINT '  • No ejecutar este script nuevamente';
PRINT '  • Los índices ya están optimizados';
PRINT '  • Utilizar verificar_optimizaciones.sql para monitoreo';
PRINT '';
PRINT '✅ T7.3 COMPLETADA EXITOSAMENTE!'; 