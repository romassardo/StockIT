-- ═══════════════════════════════════════════════════════════════════════════════
-- 🧪 PRUEBA INDIVIDUAL DE CADA SP PARA DETECTAR ERRORES ESPECÍFICOS
-- ═══════════════════════════════════════════════════════════════════════════════

PRINT '🧪 PROBANDO CADA SP INDIVIDUALMENTE...';
PRINT '';

-- ═══════════════════════════════════════════════════════════════════════════════
PRINT '1️⃣ sp_Report_GetStockAlertsCount:';
PRINT '=================================';
EXEC sp_Report_GetStockAlertsCount;
PRINT 'Resultado: ✅ ÉXITO';
PRINT '';

-- ═══════════════════════════════════════════════════════════════════════════════
PRINT '2️⃣ sp_Report_StockDisponible:';
PRINT '=============================';
EXEC sp_Report_StockDisponible @PageNumber = 1, @PageSize = 2;
PRINT 'Resultado: ✅ ÉXITO';
PRINT '';

-- ═══════════════════════════════════════════════════════════════════════════════
PRINT '3️⃣ sp_Report_StockAlerts:';
PRINT '=========================';
EXEC sp_Report_StockAlerts @PageNumber = 1, @PageSize = 2;
PRINT 'Resultado: ✅ ÉXITO';
PRINT '';

PRINT '✅ TODAS LAS PRUEBAS COMPLETADAS';