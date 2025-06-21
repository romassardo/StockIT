-- ═══════════════════════════════════════════════════════════════════════════════
-- 🧪 PRUEBA SIMPLE DE STORED PROCEDURES DE REPORTES
-- ═══════════════════════════════════════════════════════════════════════════════

PRINT '🧪 PROBANDO SPs DE REPORTES...';
PRINT '';

-- ═══════════════════════════════════════════════════════════════════════════════
PRINT '1️⃣ PROBANDO sp_Report_GetStockAlertsCount:';
PRINT '==========================================';
EXEC sp_Report_GetStockAlertsCount;
PRINT '';

-- ═══════════════════════════════════════════════════════════════════════════════
PRINT '2️⃣ PROBANDO sp_Report_StockAlerts (primeras 3 filas):';
PRINT '=====================================================';
EXEC sp_Report_StockAlerts @PageNumber = 1, @PageSize = 3;
PRINT '';

-- ═══════════════════════════════════════════════════════════════════════════════
PRINT '3️⃣ PROBANDO sp_Report_StockDisponible (primeras 3 filas):';
PRINT '========================================================';
EXEC sp_Report_StockDisponible @PageNumber = 1, @PageSize = 3;
PRINT '';

-- ═══════════════════════════════════════════════════════════════════════════════
PRINT '4️⃣ VERIFICANDO DATOS BASE:';
PRINT '==========================';

PRINT 'Productos activos:';
SELECT COUNT(*) AS total_productos FROM Productos WHERE activo = 1;

PRINT 'Inventario Individual por estado:';
SELECT estado, COUNT(*) AS cantidad 
FROM InventarioIndividual 
GROUP BY estado 
ORDER BY estado;

PRINT 'Stock General con inventario:';
SELECT COUNT(*) AS productos_con_stock 
FROM StockGeneral 
WHERE cantidad_actual > 0;

PRINT 'Asignaciones por estado:';
SELECT estado, COUNT(*) AS cantidad 
FROM Asignaciones 
GROUP BY estado 
ORDER BY estado;

PRINT '';
PRINT '✅ PRUEBAS COMPLETADAS';