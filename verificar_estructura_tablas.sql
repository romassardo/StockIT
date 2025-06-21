-- ═══════════════════════════════════════════════════════════════════════════════
-- 🔍 VERIFICAR ESTRUCTURA REAL DE LAS TABLAS PARA REPORTES
-- ═══════════════════════════════════════════════════════════════════════════════

PRINT '🔍 VERIFICANDO ESTRUCTURA DE TABLAS CRÍTICAS...';
PRINT '';

-- ═══════════════════════════════════════════════════════════════════════════════
PRINT '1️⃣ ESTRUCTURA DE LA TABLA ASIGNACIONES:';
PRINT '=======================================';
SELECT 
    COLUMN_NAME as 'Nombre_Columna',
    DATA_TYPE as 'Tipo_Dato',
    IS_NULLABLE as 'Permite_NULL',
    CHARACTER_MAXIMUM_LENGTH as 'Longitud_Max'
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Asignaciones'
ORDER BY ORDINAL_POSITION;

PRINT '';

-- ═══════════════════════════════════════════════════════════════════════════════
PRINT '2️⃣ ESTRUCTURA DE LA TABLA INVENTARIOINDIVIDUAL:';
PRINT '================================================';
SELECT 
    COLUMN_NAME as 'Nombre_Columna',
    DATA_TYPE as 'Tipo_Dato',
    IS_NULLABLE as 'Permite_NULL',
    CHARACTER_MAXIMUM_LENGTH as 'Longitud_Max'
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'InventarioIndividual'
ORDER BY ORDINAL_POSITION;

PRINT '';

-- ═══════════════════════════════════════════════════════════════════════════════
PRINT '3️⃣ ESTRUCTURA DE LA TABLA STOCKGENERAL:';
PRINT '======================================';
SELECT 
    COLUMN_NAME as 'Nombre_Columna',
    DATA_TYPE as 'Tipo_Dato',
    IS_NULLABLE as 'Permite_NULL',
    CHARACTER_MAXIMUM_LENGTH as 'Longitud_Max'
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'StockGeneral'
ORDER BY ORDINAL_POSITION;

PRINT '';

-- ═══════════════════════════════════════════════════════════════════════════════
PRINT '4️⃣ ESTRUCTURA DE LA TABLA REPARACIONES:';
PRINT '=======================================';
SELECT 
    COLUMN_NAME as 'Nombre_Columna',
    DATA_TYPE as 'Tipo_Dato',
    IS_NULLABLE as 'Permite_NULL',
    CHARACTER_MAXIMUM_LENGTH as 'Longitud_Max'
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Reparaciones'
ORDER BY ORDINAL_POSITION;

PRINT '';

-- ═══════════════════════════════════════════════════════════════════════════════
PRINT '5️⃣ CONTEO SIMPLE DE REGISTROS:';
PRINT '==============================';

PRINT 'Total de productos activos:';
SELECT COUNT(*) as total FROM Productos WHERE activo = 1;

PRINT 'Total en InventarioIndividual:';
SELECT COUNT(*) as total FROM InventarioIndividual;

PRINT 'Total en StockGeneral:';
SELECT COUNT(*) as total FROM StockGeneral;

PRINT 'Total en Asignaciones:';
SELECT COUNT(*) as total FROM Asignaciones;

PRINT 'Total en Reparaciones:';
SELECT COUNT(*) as total FROM Reparaciones;

PRINT '';
PRINT '✅ VERIFICACIÓN ESTRUCTURAL COMPLETADA';