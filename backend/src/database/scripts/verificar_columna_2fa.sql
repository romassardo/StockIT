USE StockIT;
GO

-- Ver todas las columnas de la tabla Asignaciones
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH
FROM 
    INFORMATION_SCHEMA.COLUMNS
WHERE 
    TABLE_NAME = 'Asignaciones'
ORDER BY 
    ORDINAL_POSITION;
GO