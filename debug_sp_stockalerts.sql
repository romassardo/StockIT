-- ═══════════════════════════════════════════════════════════════════════════════
-- 🔍 DEBUG ESPECÍFICO DE sp_Report_StockAlerts
-- Para entender por qué Producto y Categoría aparecen vacíos
-- ═══════════════════════════════════════════════════════════════════════════════

PRINT '🔍 DEBUGGEANDO sp_Report_StockAlerts...';
PRINT '';

-- ═══════════════════════════════════════════════════════════════════════════════
PRINT '1️⃣ EJECUTANDO sp_Report_StockAlerts CON DEBUG:';
PRINT '===============================================';
EXEC sp_Report_StockAlerts @PageNumber = 1, @PageSize = 3;

PRINT '';

-- ═══════════════════════════════════════════════════════════════════════════════
PRINT '2️⃣ VERIFICANDO DATOS DIRECTOS DE LAS TABLAS:';
PRINT '============================================';

PRINT 'Productos con stock bajo (query manual):';
SELECT TOP 3
    p.id AS ProductoID,
    CONCAT(p.marca, ' ', p.modelo) AS ProductoNombre,
    c.nombre AS Categoria,
    c.id AS CategoriaID,
    sg.cantidad_actual AS CantidadActual,
    p.stock_minimo AS StockMinimo,
    'Stock Bajo' AS TipoAlerta
FROM 
    StockGeneral sg
    INNER JOIN Productos p ON sg.producto_id = p.id
    INNER JOIN Categorias c ON p.categoria_id = c.id
WHERE 
    sg.cantidad_actual < p.stock_minimo
    AND p.usa_numero_serie = 0
    AND p.activo = 1;

PRINT '';

-- ═══════════════════════════════════════════════════════════════════════════════
PRINT '3️⃣ VERIFICANDO ESTRUCTURA DE RESPUESTA DEL SP:';
PRINT '==============================================';

PRINT 'Campos devueltos por sp_Report_StockAlerts:';
SELECT 
    COLUMN_NAME as 'Campo',
    DATA_TYPE as 'Tipo'
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'StockGeneral'
ORDER BY ORDINAL_POSITION;

PRINT '';
PRINT '✅ DEBUG COMPLETADO';