-- BACKUP SIMPLE de StockIT (3 opciones fáciles)
-- Elige UNA de estas opciones y ejecuta solo esa

-- ===== OPCIÓN 1: Backup al Escritorio (MÁS FÁCIL) =====
BACKUP DATABASE [StockIT] 
TO DISK = 'C:\Users\%USERNAME%\Desktop\StockIT_Backup.bak'
WITH FORMAT, INIT, NAME = 'StockIT-Backup-Escritorio';
PRINT 'Backup creado en tu ESCRITORIO: StockIT_Backup.bak';

/*
-- ===== OPCIÓN 2: Backup en Documentos =====
BACKUP DATABASE [StockIT] 
TO DISK = 'C:\Users\%USERNAME%\Documents\StockIT_Backup.bak'
WITH FORMAT, INIT, NAME = 'StockIT-Backup-Documentos';
PRINT 'Backup creado en DOCUMENTOS: StockIT_Backup.bak';
*/

/*
-- ===== OPCIÓN 3: Backup en Descargas =====
BACKUP DATABASE [StockIT] 
TO DISK = 'C:\Users\%USERNAME%\Downloads\StockIT_Backup.bak'
WITH FORMAT, INIT, NAME = 'StockIT-Backup-Descargas';
PRINT 'Backup creado en DESCARGAS: StockIT_Backup.bak';
*/ 