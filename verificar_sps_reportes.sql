-- ═══════════════════════════════════════════════════════════════════════════════
-- 🔍 SCRIPT DE VERIFICACIÓN DE STORED PROCEDURES DE REPORTES
-- Verificar si los SPs de reportes están presentes y tienen contenido válido
-- ═══════════════════════════════════════════════════════════════════════════════

PRINT '📋 VERIFICANDO STORED PROCEDURES DE REPORTES...';
PRINT '';

-- Lista de SPs de reportes que deberían existir
DECLARE @SPsReportes TABLE (
    nombre NVARCHAR(100),
    descripcion NVARCHAR(200)
);

INSERT INTO @SPsReportes VALUES 
('sp_Report_Inventory', 'Reporte general de inventario'),
('sp_Report_StockAlerts', 'Alertas de stock bajo/sin stock'),
('sp_Report_AssignmentsByDestination', 'Asignaciones por destino'),
('sp_Report_StockDisponible', 'Stock disponible para asignar'),
('sp_Report_GetStockAlertsCount', 'Contador de alertas de stock'),
('sp_Report_RepairHistory', 'Historia de reparaciones');

PRINT '1️⃣ VERIFICANDO EXISTENCIA DE STORED PROCEDURES:';
PRINT '================================================';

SELECT 
    sr.nombre as 'SP Requerido',
    sr.descripcion as 'Descripción',
    CASE 
        WHEN p.name IS NOT NULL THEN '✅ EXISTE'
        ELSE '❌ FALTA'
    END as 'Estado',
    CASE 
        WHEN p.name IS NOT NULL THEN p.create_date
        ELSE NULL
    END as 'Fecha Creación',
    CASE 
        WHEN p.name IS NOT NULL THEN p.modify_date
        ELSE NULL
    END as 'Última Modificación'
FROM @SPsReportes sr
LEFT JOIN sys.procedures p ON sr.nombre = p.name
ORDER BY sr.nombre;

PRINT '';
PRINT '2️⃣ VERIFICANDO CONTENIDO DE LOS SPs (primeras líneas):';
PRINT '=====================================================';

-- Verificar sp_Report_Inventory
PRINT '📊 sp_Report_Inventory:';
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_Report_Inventory')
BEGIN
    DECLARE @definicion_inventory NVARCHAR(MAX);
    SELECT @definicion_inventory = OBJECT_DEFINITION(OBJECT_ID('dbo.sp_Report_Inventory'));
    
    IF @definicion_inventory IS NULL OR LEN(@definicion_inventory) < 100
        PRINT '❌ CORRUPTO O VACÍO - Definición muy corta o nula';
    ELSE
        PRINT '✅ PARECE VÁLIDO - ' + CAST(LEN(@definicion_inventory) AS VARCHAR(10)) + ' caracteres';
END
ELSE
    PRINT '❌ NO EXISTE';

PRINT '';

-- Verificar sp_Report_StockAlerts
PRINT '🚨 sp_Report_StockAlerts:';
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_Report_StockAlerts')
BEGIN
    DECLARE @definicion_alerts NVARCHAR(MAX);
    SELECT @definicion_alerts = OBJECT_DEFINITION(OBJECT_ID('dbo.sp_Report_StockAlerts'));
    
    IF @definicion_alerts IS NULL OR LEN(@definicion_alerts) < 100
        PRINT '❌ CORRUPTO O VACÍO - Definición muy corta o nula';
    ELSE
        PRINT '✅ PARECE VÁLIDO - ' + CAST(LEN(@definicion_alerts) AS VARCHAR(10)) + ' caracteres';
END
ELSE
    PRINT '❌ NO EXISTE';

PRINT '';

-- Verificar sp_Report_AssignmentsByDestination
PRINT '👥 sp_Report_AssignmentsByDestination:';
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_Report_AssignmentsByDestination')
BEGIN
    DECLARE @definicion_assignments NVARCHAR(MAX);
    SELECT @definicion_assignments = OBJECT_DEFINITION(OBJECT_ID('dbo.sp_Report_AssignmentsByDestination'));
    
    IF @definicion_assignments IS NULL OR LEN(@definicion_assignments) < 100
        PRINT '❌ CORRUPTO O VACÍO - Definición muy corta o nula';
    ELSE
        PRINT '✅ PARECE VÁLIDO - ' + CAST(LEN(@definicion_assignments) AS VARCHAR(10)) + ' caracteres';
END
ELSE
    PRINT '❌ NO EXISTE';

PRINT '';

-- Verificar sp_Report_StockDisponible
PRINT '📦 sp_Report_StockDisponible:';
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_Report_StockDisponible')
BEGIN
    DECLARE @definicion_disponible NVARCHAR(MAX);
    SELECT @definicion_disponible = OBJECT_DEFINITION(OBJECT_ID('dbo.sp_Report_StockDisponible'));
    
    IF @definicion_disponible IS NULL OR LEN(@definicion_disponible) < 100
        PRINT '❌ CORRUPTO O VACÍO - Definición muy corta o nula';
    ELSE
        PRINT '✅ PARECE VÁLIDO - ' + CAST(LEN(@definicion_disponible) AS VARCHAR(10)) + ' caracteres';
END
ELSE
    PRINT '❌ NO EXISTE';

PRINT '';

-- Verificar sp_Report_GetStockAlertsCount
PRINT '🔢 sp_Report_GetStockAlertsCount:';
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_Report_GetStockAlertsCount')
BEGIN
    DECLARE @definicion_count NVARCHAR(MAX);
    SELECT @definicion_count = OBJECT_DEFINITION(OBJECT_ID('dbo.sp_Report_GetStockAlertsCount'));
    
    IF @definicion_count IS NULL OR LEN(@definicion_count) < 50
        PRINT '❌ CORRUPTO O VACÍO - Definición muy corta o nula';
    ELSE
        PRINT '✅ PARECE VÁLIDO - ' + CAST(LEN(@definicion_count) AS VARCHAR(10)) + ' caracteres';
END
ELSE
    PRINT '❌ NO EXISTE';

PRINT '';

-- Verificar sp_Report_RepairHistory
PRINT '🔧 sp_Report_RepairHistory:';
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_Report_RepairHistory')
BEGIN
    DECLARE @definicion_repairs NVARCHAR(MAX);
    SELECT @definicion_repairs = OBJECT_DEFINITION(OBJECT_ID('dbo.sp_Report_RepairHistory'));
    
    IF @definicion_repairs IS NULL OR LEN(@definicion_repairs) < 100
        PRINT '❌ CORRUPTO O VACÍO - Definición muy corta o nula';
    ELSE
        PRINT '✅ PARECE VÁLIDO - ' + CAST(LEN(@definicion_repairs) AS VARCHAR(10)) + ' caracteres';
END
ELSE
    PRINT '❌ NO EXISTE';

PRINT '';
PRINT '3️⃣ RESUMEN DE VERIFICACIÓN:';
PRINT '===========================';

DECLARE @total_existentes INT, @total_requeridos INT;

SELECT @total_existentes = COUNT(*)
FROM @SPsReportes sr
INNER JOIN sys.procedures p ON sr.nombre = p.name;

SELECT @total_requeridos = COUNT(*) FROM @SPsReportes;

PRINT 'Total SPs requeridos: ' + CAST(@total_requeridos AS VARCHAR(5));
PRINT 'Total SPs existentes: ' + CAST(@total_existentes AS VARCHAR(5));

IF @total_existentes = @total_requeridos
    PRINT '✅ TODOS LOS SPs DE REPORTES ESTÁN PRESENTES';
ELSE
    PRINT '❌ FALTAN ' + CAST(@total_requeridos - @total_existentes AS VARCHAR(5)) + ' STORED PROCEDURES';

PRINT '';
PRINT '🔍 VERIFICACIÓN COMPLETADA';