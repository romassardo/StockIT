-- Script para RESTAURAR la base de datos StockIT en la PC del trabajo
-- Ejecutar este script en SQL Server Management Studio en tu PC del trabajo

-- 1. Verificar que el archivo de backup existe
-- CAMBIAR LA RUTA según donde pusiste el archivo .bak

-- 2. Restaurar la base de datos (ELIGE UNA OPCIÓN)
-- OPCIÓN A: Si el archivo está en el escritorio
RESTORE DATABASE [StockIT] 
FROM DISK = 'C:\Users\%USERNAME%\Desktop\StockIT_Backup.bak'

-- OPCIÓN B: Si el archivo está en otra carpeta, cambiar la ruta:
-- FROM DISK = 'C:\Users\TU_USUARIO\Documents\StockIT_Backup.bak'
-- FROM DISK = 'C:\Users\TU_USUARIO\Downloads\StockIT_Backup.bak'
WITH 
    MOVE 'StockIT' TO 'C:\Program Files\Microsoft SQL Server\MSSQL15.SQLEXPRESS\MSSQL\DATA\StockIT.mdf',
    MOVE 'StockIT_Log' TO 'C:\Program Files\Microsoft SQL Server\MSSQL15.SQLEXPRESS\MSSQL\DATA\StockIT_Log.ldf',
    REPLACE,
    RECOVERY;

PRINT 'Base de datos StockIT restaurada exitosamente.';

-- 3. Verificar que la base de datos esté disponible
USE [StockIT];
SELECT COUNT(*) AS TotalUsuarios FROM Usuarios;
SELECT COUNT(*) AS TotalProductos FROM Productos;

PRINT 'Verificación completada. StockIT está listo para usar.'; 