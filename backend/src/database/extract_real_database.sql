-- 🔍 SCRIPT MAESTRO: EXTRACCIÓN DE ESTADO REAL DE BASE DE DATOS
-- Objetivo: Obtener TODA la información real de la BD StockIT
-- Uso: Ejecutar en SQL Server Management Studio contra BD real

-- =============================================
-- 1. STORED PROCEDURES REALES EXISTENTES
-- =============================================
SELECT 
    '-- Stored Procedure: ' + ROUTINE_NAME AS Comment,
    ROUTINE_NAME as SP_Name,
    CREATED as Created_Date,
    LAST_ALTERED as Modified_Date,
    ROUTINE_DEFINITION as SP_Definition
FROM INFORMATION_SCHEMA.ROUTINES 
WHERE ROUTINE_TYPE = 'PROCEDURE'
    AND ROUTINE_SCHEMA = 'dbo'
ORDER BY ROUTINE_NAME;

-- =============================================
-- 2. ESTRUCTURA REAL DE TABLAS
-- =============================================
SELECT 
    '-- Table Structure: ' + TABLE_NAME AS Comment,
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    CHARACTER_MAXIMUM_LENGTH,
    NUMERIC_PRECISION,
    NUMERIC_SCALE,
    ORDINAL_POSITION
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'dbo'
    AND TABLE_CATALOG = 'StockIT'
ORDER BY TABLE_NAME, ORDINAL_POSITION;

-- =============================================
-- 3. ÍNDICES REALES
-- =============================================
SELECT 
    '-- Index: ' + i.name AS Comment,
    i.name AS index_name,
    t.name AS table_name,
    i.type_desc,
    i.is_unique,
    i.is_primary_key,
    i.is_disabled
FROM sys.indexes i
INNER JOIN sys.tables t ON i.object_id = t.object_id
WHERE t.schema_id = SCHEMA_ID('dbo')
    AND i.type > 0  -- Excluir heap
ORDER BY t.name, i.name;

-- =============================================
-- 4. FOREIGN KEYS REALES
-- =============================================
SELECT 
    '-- Foreign Key: ' + fk.name AS Comment,
    fk.name AS fk_name,
    tp.name AS parent_table,
    tr.name AS referenced_table,
    cp.name AS parent_column,
    cr.name AS referenced_column,
    fk.delete_referential_action_desc,
    fk.update_referential_action_desc
FROM sys.foreign_keys fk
INNER JOIN sys.tables tp ON fk.parent_object_id = tp.object_id
INNER JOIN sys.tables tr ON fk.referenced_object_id = tr.object_id
INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
INNER JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
INNER JOIN sys.columns cr ON fkc.referenced_object_id = cr.object_id AND fkc.referenced_column_id = cr.column_id
ORDER BY tp.name, fk.name;

-- =============================================
-- 5. VERIFICACIÓN DE SPs ESPECÍFICOS DE STOCKIT
-- =============================================
-- Lista de SPs que sabemos que deberían existir según el código
DECLARE @expected_sps TABLE (sp_name NVARCHAR(255))
INSERT INTO @expected_sps VALUES 
    ('sp_User_GetByEmail'),
    ('sp_User_ChangePassword'),
    ('sp_Log_Create'),
    ('sp_Assignment_Create'),
    ('sp_Assignment_Cancel'),
    ('sp_Assignment_Return'),
    ('sp_InventarioIndividual_Create'),
    ('sp_InventarioIndividual_GetAll'),
    ('sp_StockGeneral_GetAll'),
    ('sp_StockGeneral_Entry'),
    ('sp_StockGeneral_Exit'),
    ('sp_Report_Inventory'),
    ('sp_Report_AssignmentsByDestination'),
    ('sp_Report_StockAlerts'),
    ('sp_Repair_Create'),
    ('sp_Repair_Complete'),
    ('sp_Repair_Cancel');

-- Verificar cuáles existen realmente
SELECT 
    esp.sp_name AS Expected_SP,
    CASE 
        WHEN r.ROUTINE_NAME IS NOT NULL THEN 'EXISTS'
        ELSE 'MISSING'
    END AS Status,
    r.CREATED,
    r.LAST_ALTERED
FROM @expected_sps esp
LEFT JOIN INFORMATION_SCHEMA.ROUTINES r 
    ON esp.sp_name = r.ROUTINE_NAME 
    AND r.ROUTINE_TYPE = 'PROCEDURE'
ORDER BY Status DESC, esp.sp_name;
