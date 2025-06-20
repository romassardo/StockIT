-- =============================================
-- Script para verificar estructura de tabla Categorias
-- =============================================

USE StockIT;
GO

PRINT '🔍 VERIFICANDO ESTRUCTURA DE LA TABLA Categorias...';
PRINT '';

-- 1. Verificar si la tabla existe
IF OBJECT_ID('Categorias', 'U') IS NOT NULL
BEGIN
    PRINT '✅ La tabla Categorias existe';
    PRINT '';
    
    -- 2. Mostrar estructura de la tabla
    PRINT '📋 ESTRUCTURA DE LA TABLA:';
    SELECT 
        c.COLUMN_NAME as 'Columna',
        c.DATA_TYPE as 'Tipo',
        c.IS_NULLABLE as 'Permite NULL',
        c.COLUMN_DEFAULT as 'Valor por defecto',
        CASE 
            WHEN pk.COLUMN_NAME IS NOT NULL THEN 'SÍ'
            ELSE 'NO'
        END as 'Es Primary Key'
    FROM INFORMATION_SCHEMA.COLUMNS c
    LEFT JOIN (
        SELECT ku.COLUMN_NAME
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
        INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
            ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
        WHERE tc.TABLE_NAME = 'Categorias' 
          AND tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
    ) pk ON c.COLUMN_NAME = pk.COLUMN_NAME
    WHERE c.TABLE_NAME = 'Categorias'
    ORDER BY c.ORDINAL_POSITION;
    
    PRINT '';
    
    -- 3. Mostrar datos existentes
    PRINT '📊 DATOS ACTUALES EN LA TABLA (primeros 10 registros):';
    SELECT TOP 10 * FROM Categorias ORDER BY id;
    
    PRINT '';
    
    -- 4. Contar registros
    DECLARE @total_registros INT = (SELECT COUNT(*) FROM Categorias);
    PRINT '📈 Total de registros: ' + CAST(@total_registros AS NVARCHAR);
    
END
ELSE
BEGIN
    PRINT '❌ La tabla Categorias NO existe';
    
    -- Buscar tablas similares
    PRINT '';
    PRINT '🔍 Buscando tablas similares...';
    SELECT TABLE_NAME as 'Tablas que contienen "categ"'
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_NAME LIKE '%categ%'
       OR TABLE_NAME LIKE '%Categ%';
END

PRINT '';
PRINT '🎯 Análisis completado!'; 