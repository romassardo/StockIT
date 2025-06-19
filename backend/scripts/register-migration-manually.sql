-- Script para registrar manualmente la migración de los SPs del Dashboard
-- Ejecutar este script directamente en SQL Server Management Studio después de aplicar el SP

-- Verificar si la migración ya existe
IF NOT EXISTS (
    SELECT 1 FROM [dbo].[MigracionesDB] 
    WHERE [nombre_archivo] = '017_sps_dashboard_metrics_final_fix.sql'
)
BEGIN
    -- Insertar registro de la migración aplicada manualmente
    INSERT INTO [dbo].[MigracionesDB] (
        [nombre_archivo],
        [fecha_aplicacion],
        [aplicada_por]
    )
    VALUES (
        '017_sps_dashboard_metrics_final_fix.sql',
        GETDATE(),
        'Aplicación manual por usuario'
    );
    
    PRINT 'Migración 017_sps_dashboard_metrics_final_fix.sql registrada correctamente.';
END
ELSE
BEGIN
    PRINT 'La migración 017_sps_dashboard_metrics_final_fix.sql ya estaba registrada.';
END;
