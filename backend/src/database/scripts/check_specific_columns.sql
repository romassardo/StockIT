USE StockIT;
GO

-- Consultar columnas específicas en InventarioIndividual
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    CHARACTER_MAXIMUM_LENGTH
FROM 
    INFORMATION_SCHEMA.COLUMNS 
WHERE 
    TABLE_NAME = 'InventarioIndividual';
GO

-- Consultar columnas específicas en Asignaciones
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    CHARACTER_MAXIMUM_LENGTH
FROM 
    INFORMATION_SCHEMA.COLUMNS 
WHERE 
    TABLE_NAME = 'Asignaciones';
GO

-- Consultar estado de inventario
SELECT TOP 5 * FROM InventarioIndividual;
GO

-- Consultar estado de asignaciones
SELECT TOP 5 * FROM Asignaciones;
GO