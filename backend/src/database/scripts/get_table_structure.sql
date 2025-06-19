USE StockIT;
GO

-- Obtener la estructura de las tablas principales
SELECT 
    t.name AS TableName,
    c.name AS ColumnName,
    ty.name AS DataType,
    c.max_length,
    c.is_nullable
FROM 
    sys.tables t
INNER JOIN 
    sys.columns c ON t.object_id = c.object_id
INNER JOIN 
    sys.types ty ON c.user_type_id = ty.user_type_id
WHERE 
    t.name IN ('InventarioIndividual', 'Asignaciones', 'Productos', 'Categorias', 'Empleados', 'Sectores', 'Sucursales', 'Reparaciones')
ORDER BY 
    t.name, c.column_id;
GO