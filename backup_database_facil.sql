-- LA VERSIÓN MÁS FÁCIL - Solo ejecuta esto
-- El archivo se guardará en la carpeta de SQL Server

BACKUP DATABASE [StockIT] 
TO DISK = N'C:\Program Files\Microsoft SQL Server\MSSQL15.SQLEXPRESS\MSSQL\Backup\StockIT_Backup.bak'
WITH FORMAT, INIT;

PRINT '✅ BACKUP COMPLETADO!';
PRINT '';
PRINT '📂 El archivo está en:';
PRINT 'C:\Program Files\Microsoft SQL Server\MSSQL15.SQLEXPRESS\MSSQL\Backup\StockIT_Backup.bak';
PRINT '';
PRINT '🔍 CÓMO ENCONTRARLO:';
PRINT '1. Abre el Explorador de Windows';
PRINT '2. En la barra de direcciones escribe: C:\Program Files\Microsoft SQL Server\MSSQL15.SQLEXPRESS\MSSQL\Backup';
PRINT '3. Presiona Enter';
PRINT '4. Busca el archivo: StockIT_Backup.bak';
PRINT '5. Cópialo a tu Escritorio o USB';
PRINT '';
PRINT '🚀 ¡Listo para llevar al trabajo!'; 