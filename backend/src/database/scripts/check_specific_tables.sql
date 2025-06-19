USE StockIT;
GO

-- Obtener la estructura detallada de la tabla Asignaciones
SELECT 
    c.name AS ColumnName,
    t.name AS DataType,
    c.max_length AS MaxLength,
    c.is_nullable AS IsNullable
FROM 
    sys.columns c
JOIN 
    sys.types t ON c.user_type_id = t.user_type_id
WHERE 
    c.object_id = OBJECT_ID('Asignaciones')
ORDER BY 
    c.column_id;
GO

-- Obtener la estructura detallada de la tabla Empleados
SELECT 
    c.name AS ColumnName,
    t.name AS DataType,
    c.max_length AS MaxLength,
    c.is_nullable AS IsNullable
FROM 
    sys.columns c
JOIN 
    sys.types t ON c.user_type_id = t.user_type_id
WHERE 
    c.object_id = OBJECT_ID('Empleados')
ORDER BY 
    c.column_id;
GO

-- Verificar los primeros registros de Asignaciones para entender la estructura de datos
SELECT TOP 5 * FROM Asignaciones;
GO

-- Verificar los primeros registros de Empleados para entender la estructura de datos
SELECT TOP 5 * FROM Empleados;
GO