-- ═══════════════════════════════════════════════════════════════════════════════
-- 🧪 PRUEBAS INDIVIDUALES DE STORED PROCEDURES DE REPORTES
-- Para detectar qué está causando datos erróneos en las tablas
-- ═══════════════════════════════════════════════════════════════════════════════

PRINT '🧪 PROBANDO STORED PROCEDURES DE REPORTES INDIVIDUALMENTE...';
PRINT '';

-- ═══════════════════════════════════════════════════════════════════════════════
PRINT '1️⃣ PROBANDO sp_Report_GetStockAlertsCount:';
PRINT '==========================================';
BEGIN TRY
    EXEC sp_Report_GetStockAlertsCount;
    PRINT '✅ sp_Report_GetStockAlertsCount ejecutado correctamente';
EXCEPTION TRY_CATCH
    PRINT '❌ ERROR en sp_Report_GetStockAlertsCount:';
    PRINT ERROR_MESSAGE();
END CATCH

PRINT '';

-- ═══════════════════════════════════════════════════════════════════════════════
PRINT '2️⃣ PROBANDO sp_Report_StockAlerts (primeras 5 filas):';
PRINT '=====================================================';
BEGIN TRY
    EXEC sp_Report_StockAlerts @PageNumber = 1, @PageSize = 5;
    PRINT '✅ sp_Report_StockAlerts ejecutado correctamente';
EXCEPTION TRY_CATCH
    PRINT '❌ ERROR en sp_Report_StockAlerts:';
    PRINT ERROR_MESSAGE();
END CATCH

PRINT '';

-- ═══════════════════════════════════════════════════════════════════════════════
PRINT '3️⃣ PROBANDO sp_Report_StockDisponible (primeras 5 filas):';
PRINT '========================================================';
BEGIN TRY
    EXEC sp_Report_StockDisponible @PageNumber = 1, @PageSize = 5;
    PRINT '✅ sp_Report_StockDisponible ejecutado correctamente';
EXCEPTION TRY_CATCH
    PRINT '❌ ERROR en sp_Report_StockDisponible:';
    PRINT ERROR_MESSAGE();
END CATCH

PRINT '';

-- ═══════════════════════════════════════════════════════════════════════════════
PRINT '4️⃣ PROBANDO sp_Report_Inventory (primeras 5 filas):';
PRINT '==================================================';
BEGIN TRY
    EXEC sp_Report_Inventory @PageNumber = 1, @PageSize = 5;
    PRINT '✅ sp_Report_Inventory ejecutado correctamente';
EXCEPTION TRY_CATCH
    PRINT '❌ ERROR en sp_Report_Inventory:';
    PRINT ERROR_MESSAGE();
END CATCH

PRINT '';

-- ═══════════════════════════════════════════════════════════════════════════════
PRINT '5️⃣ PROBANDO sp_Report_AssignmentsByDestination (Empleados):';
PRINT '=========================================================';
BEGIN TRY
    EXEC sp_Report_AssignmentsByDestination @TipoDestino = 'Empleado', @PageNumber = 1, @PageSize = 5;
    PRINT '✅ sp_Report_AssignmentsByDestination ejecutado correctamente';
EXCEPTION TRY_CATCH
    PRINT '❌ ERROR en sp_Report_AssignmentsByDestination:';
    PRINT ERROR_MESSAGE();
END CATCH

PRINT '';

-- ═══════════════════════════════════════════════════════════════════════════════
PRINT '6️⃣ PROBANDO sp_Report_RepairHistory (primeras 5 filas):';
PRINT '======================================================';
BEGIN TRY
    EXEC sp_Report_RepairHistory @PageNumber = 1, @PageSize = 5;
    PRINT '✅ sp_Report_RepairHistory ejecutado correctamente';
EXCEPTION TRY_CATCH
    PRINT '❌ ERROR en sp_Report_RepairHistory:';
    PRINT ERROR_MESSAGE();
END CATCH

PRINT '';

-- ═══════════════════════════════════════════════════════════════════════════════
PRINT '🔍 VERIFICANDO DATOS BASE DEL SISTEMA:';
PRINT '======================================';

PRINT 'Productos en el sistema:';
SELECT COUNT(*) AS total_productos FROM Productos WHERE activo = 1;

PRINT 'Inventario Individual (con serie):';
SELECT estado, COUNT(*) AS cantidad FROM InventarioIndividual GROUP BY estado;

PRINT 'Stock General:';
SELECT COUNT(*) AS productos_con_stock FROM StockGeneral WHERE cantidad_actual > 0;

PRINT 'Asignaciones activas:';
SELECT COUNT(*) AS asignaciones_activas FROM Asignaciones WHERE estado = 'Activa';

PRINT 'Reparaciones:';
SELECT estado, COUNT(*) AS cantidad FROM Reparaciones GROUP BY estado;

PRINT '';
PRINT '✅ PRUEBAS COMPLETADAS';