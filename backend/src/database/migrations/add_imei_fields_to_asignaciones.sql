-- =============================================
-- Migración: Agregar campos IMEI1 e IMEI2 a tabla Asignaciones
-- Author:      StockIT Dev Team
-- Create date: 2025-01-14
-- Description: Agregar campos IMEI1 e IMEI2 para celulares en la tabla Asignaciones
-- =============================================
USE StockIT;
GO

-- Verificar si las columnas ya existen antes de agregarlas
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Asignaciones' AND COLUMN_NAME = 'imei_1')
BEGIN
    ALTER TABLE Asignaciones 
    ADD imei_1 NVARCHAR(20);
    PRINT N'Campo imei_1 agregado a la tabla Asignaciones.';
END
ELSE
BEGIN
    PRINT N'Campo imei_1 ya existe en la tabla Asignaciones.';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Asignaciones' AND COLUMN_NAME = 'imei_2')
BEGIN
    ALTER TABLE Asignaciones 
    ADD imei_2 NVARCHAR(20);
    PRINT N'Campo imei_2 agregado a la tabla Asignaciones.';
END
ELSE
BEGIN
    PRINT N'Campo imei_2 ya existe en la tabla Asignaciones.';
END

-- Verificar que se agregaron correctamente
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Asignaciones' 
AND COLUMN_NAME IN ('imei_1', 'imei_2')
ORDER BY COLUMN_NAME;

PRINT N'Migración completada exitosamente.';
GO 