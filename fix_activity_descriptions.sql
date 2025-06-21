-- =============================================
-- Script para corregir problemas de codificación UTF-8 en LogsActividad
-- Author: StockIT Dev Team
-- Date: $(Get-Date)
-- =============================================

USE StockIT;
GO

PRINT '🔧 Iniciando corrección de problemas de codificación en LogsActividad...';

-- Backup de seguridad antes de las correcciones
PRINT '📊 Creando backup de LogsActividad...';
IF OBJECT_ID('LogsActividad_Backup_Encoding', 'U') IS NOT NULL
    DROP TABLE LogsActividad_Backup_Encoding;

SELECT * INTO LogsActividad_Backup_Encoding FROM LogsActividad;
PRINT '✅ Backup creado como LogsActividad_Backup_Encoding';

-- Corrección de problemas de codificación UTF-8 comunes
PRINT '🔄 Corrigiendo problemas de codificación...';

UPDATE LogsActividad 
SET descripcion = REPLACE(
    REPLACE(
        REPLACE(
            REPLACE(
                REPLACE(
                    REPLACE(
                        REPLACE(
                            REPLACE(
                                REPLACE(
                                    REPLACE(descripcion, 'ActualizaciÃ³n', 'Actualización'),
                                    'creaciÃ³n', 'creación'),
                                'modificaciÃ³n', 'modificación'),
                            'AsignaciÃ³n', 'Asignación'),
                        'DevoluciÃ³n', 'Devolución'),
                    'ReparaciÃ³n', 'Reparación'),
                'EnvÃ­o', 'Envío'),
            'ubicaciÃ³n', 'ubicación'),
        'estÃ¡', 'está'),
    'soluciÃ³n', 'solución')
WHERE descripcion LIKE '%Ã%';

DECLARE @rowsAffected INT = @@ROWCOUNT;
PRINT CONCAT('✅ ', @rowsAffected, ' registros corregidos por problemas de codificación.');

-- Verificar registros con JSON malformado que podrían necesitar limpieza
PRINT '🔍 Verificando registros con JSON...';

SELECT TOP 10
    id,
    tabla_afectada,
    accion,
    descripcion,
    fecha_hora
FROM LogsActividad 
WHERE descripcion LIKE '{%'
    AND descripcion LIKE '%}%'
    AND LEN(descripcion) > 50
ORDER BY fecha_hora DESC;

PRINT '📊 Mostrando algunos registros con formato JSON (los primeros 10)';

-- Estadísticas finales
PRINT '📈 Estadísticas de LogsActividad:';

SELECT 
    COUNT(*) as TotalRegistros,
    COUNT(CASE WHEN descripcion LIKE '{%}' THEN 1 END) as RegistrosJSON,
    COUNT(CASE WHEN descripcion LIKE '%Ã%' THEN 1 END) as RegistrosConProblemasUTF8,
    COUNT(CASE WHEN LEN(descripcion) > 200 THEN 1 END) as RegistrosLargos,
    MIN(fecha_hora) as PrimerRegistro,
    MAX(fecha_hora) as UltimoRegistro
FROM LogsActividad;

-- Mostrar distribución por tabla afectada
PRINT '📋 Distribución de actividad por tabla:';

SELECT 
    tabla_afectada,
    COUNT(*) as Cantidad,
    COUNT(CASE WHEN descripcion LIKE '{%}' THEN 1 END) as ConJSON,
    MAX(fecha_hora) as UltimaActividad
FROM LogsActividad 
GROUP BY tabla_afectada
ORDER BY Cantidad DESC;

-- Optimizar índices para consultas del dashboard
PRINT '⚡ Optimizando índices para consultas de actividad reciente...';

-- Crear índice compuesto para consultas del dashboard si no existe
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_LogsActividad_Dashboard')
BEGIN
    CREATE NONCLUSTERED INDEX IX_LogsActividad_Dashboard
    ON LogsActividad (fecha_hora DESC, usuario_id, tabla_afectada)
    INCLUDE (accion, registro_id, descripcion, ip_address);
    
    PRINT '✅ Índice IX_LogsActividad_Dashboard creado para optimizar consultas del dashboard';
END
ELSE
BEGIN
    PRINT '✅ Índice IX_LogsActividad_Dashboard ya existe';
END

PRINT '🎉 Corrección de codificación completada exitosamente!';
PRINT '💡 Las mejoras en el frontend ahora formatearán automáticamente las descripciones JSON.';

GO 