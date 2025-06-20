-- BACKUP con permisos correctos - OPCIÓN SEGURA
-- Este script usa carpetas donde SQL Server SÍ tiene permisos

-- Verificar dónde está instalado SQL Server y usar esa carpeta
DECLARE @BackupPath NVARCHAR(500);
DECLARE @Comando NVARCHAR(1000);

-- Buscar la carpeta de datos de SQL Server
SELECT @BackupPath = SUBSTRING(physical_name, 1, CHARINDEX(N'master.mdf', LOWER(physical_name)) - 1)
FROM master.sys.master_files 
WHERE database_id = 1 AND file_id = 1;

-- Construir la ruta completa para el backup
SET @BackupPath = @BackupPath + 'StockIT_Backup.bak';

PRINT 'Creando backup en: ' + @BackupPath;

-- Hacer el backup en la carpeta de SQL Server (donde SÍ tenemos permisos)
BACKUP DATABASE [StockIT] 
TO DISK = @BackupPath
WITH 
    FORMAT, 
    INIT,
    NAME = 'StockIT-Backup-Completo',
    DESCRIPTION = 'Backup de StockIT para migración';

PRINT '✅ Backup creado exitosamente en: ' + @BackupPath;
PRINT '';
PRINT '📋 INSTRUCCIONES:';
PRINT '1. Copia este archivo desde la ruta mostrada arriba';
PRINT '2. Ponlo en una carpeta fácil (Escritorio, Documentos)';
PRINT '3. Llévalo a tu PC del trabajo';
PRINT '';

-- Mostrar la ruta exacta para que sea fácil encontrarlo
PRINT '🔍 Para encontrar el archivo:';
PRINT '   - Abre el Explorador de Windows';
PRINT '   - Ve a: ' + SUBSTRING(@BackupPath, 1, LEN(@BackupPath) - 19); -- Quitar el nombre del archivo
PRINT '   - Busca: StockIT_Backup.bak'; 