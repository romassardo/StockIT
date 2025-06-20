-- ANÁLISIS DE RENDIMIENTO STOCKIT
-- Ejecutar en SQL Server Management Studio para ver el estado actual

PRINT '🔍 ANALIZANDO RENDIMIENTO DE STOCKIT...';
PRINT '==========================================';

-- 1. Verificar estadísticas de las tablas principales
PRINT '';
PRINT '📊 ESTADÍSTICAS DE TABLAS PRINCIPALES:';

SELECT 
    t.name AS Tabla,
    p.rows AS TotalRegistros,
    CAST(ROUND(((SUM(a.used_pages) * 8) / 1024.00), 2) AS NUMERIC(36, 2)) AS TamañoMB
FROM sys.tables t
INNER JOIN sys.indexes i ON t.OBJECT_ID = i.object_id
INNER JOIN sys.partitions p ON i.object_id = p.OBJECT_ID AND i.index_id = p.index_id
INNER JOIN sys.allocation_units a ON p.partition_id = a.container_id
WHERE t.name IN ('InventarioIndividual', 'Asignaciones', 'StockGeneral', 'MovimientosStock', 'Productos', 'Usuarios')
GROUP BY t.name, p.rows
ORDER BY p.rows DESC;

-- 2. Verificar índices existentes
PRINT '';
PRINT '🔗 ÍNDICES EXISTENTES:';

SELECT 
    t.name AS Tabla,
    i.name AS Indice,
    i.type_desc AS TipoIndice,
    CASE WHEN i.is_primary_key = 1 THEN 'PK' 
         WHEN i.is_unique = 1 THEN 'UNIQUE' 
         ELSE 'NORMAL' END AS Categoria
FROM sys.tables t
INNER JOIN sys.indexes i ON t.object_id = i.object_id
WHERE t.name IN ('InventarioIndividual', 'Asignaciones', 'StockGeneral', 'MovimientosStock')
    AND i.index_id > 0  -- Excluir heap
ORDER BY t.name, i.name;

-- 3. Verificar fragmentación de índices
PRINT '';
PRINT '🧩 FRAGMENTACIÓN DE ÍNDICES:';

SELECT 
    OBJECT_NAME(ps.object_id) AS Tabla,
    i.name AS Indice,
    CAST(ps.avg_fragmentation_in_percent AS DECIMAL(5,2)) AS FragmentacionPorcentaje,
    ps.page_count AS TotalPaginas,
    CASE 
        WHEN ps.avg_fragmentation_in_percent > 30 THEN '🔴 CRÍTICO'
        WHEN ps.avg_fragmentation_in_percent > 10 THEN '🟡 ATENCIÓN'
        ELSE '🟢 BUENO'
    END AS Estado
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ps
INNER JOIN sys.indexes i ON ps.object_id = i.object_id AND ps.index_id = i.index_id
WHERE ps.page_count > 100  -- Solo índices con más de 100 páginas
ORDER BY ps.avg_fragmentation_in_percent DESC;

-- 4. Queries más ejecutados (si hay plan cache)
PRINT '';
PRINT '📈 ESTADÍSTICAS DE QUERIES MÁS USADAS:';

SELECT TOP 10
    SUBSTRING(qt.text, (qs.statement_start_offset/2)+1,
        ((CASE qs.statement_end_offset
            WHEN -1 THEN DATALENGTH(qt.text)
            ELSE qs.statement_end_offset
        END - qs.statement_start_offset)/2)+1) AS Query,
    qs.execution_count AS VecesEjecutado,
    CAST(qs.total_elapsed_time / 1000000.0 AS DECIMAL(8,2)) AS TiempoTotalSegundos,
    CAST(qs.total_elapsed_time / qs.execution_count / 1000000.0 AS DECIMAL(8,4)) AS TiempoPromedioSegundos
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt
WHERE qt.text LIKE '%InventarioIndividual%' 
   OR qt.text LIKE '%Asignaciones%'
   OR qt.text LIKE '%StockGeneral%'
ORDER BY qs.execution_count DESC;

PRINT '';
PRINT '✅ ANÁLISIS COMPLETADO';
PRINT '==========================================';
PRINT 'Revisa los resultados para identificar áreas de mejora:'
PRINT '- Fragmentación > 10%: Necesita reorganización'
PRINT '- Fragmentación > 30%: Necesita reconstrucción'
PRINT '- Queries lentos: Candidatos para optimización'; 