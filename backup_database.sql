-- Script para hacer BACKUP de la base de datos StockIT
-- Ejecutar este script en SQL Server Management Studio en tu PC de casa

-- PASO PREVIO: Crear la carpeta donde guardar el backup
EXEC xp_cmdshell 'mkdir C:\Temp', NO_OUTPUT;

-- 1. Backup completo de la base de datos  
BACKUP DATABASE [StockIT] 
TO DISK = 'C:\Temp\StockIT_Backup.bak'
WITH 
    FORMAT, 
    INIT,
    NAME = 'StockIT-Full Database Backup',
    DESCRIPTION = 'Backup completo de StockIT para migración',
    COMPRESSION;

PRINT 'Backup de StockIT creado exitosamente en C:\Temp\StockIT_Backup.bak';

-- 2. Verificar el backup
RESTORE VERIFYONLY 
FROM DISK = 'C:\Temp\StockIT_Backup.bak';

PRINT 'Verificación del backup completada.'; 