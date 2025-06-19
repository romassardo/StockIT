USE StockIT;
GO

-- Listar todas las tablas de la base de datos
SELECT 
    name AS NombreTabla,
    SCHEMA_NAME(schema_id) AS Esquema
FROM 
    sys.tables
ORDER BY 
    name;
GO

-- Listar todos los procedimientos almacenados existentes
SELECT 
    name AS NombreProcedimiento,
    SCHEMA_NAME(schema_id) AS Esquema,
    create_date AS FechaCreacion,
    modify_date AS FechaModificacion
FROM 
    sys.procedures
ORDER BY 
    name;
GO

-- Examinar las tablas principales para el módulo de búsqueda
-- Tabla InventarioIndividual - estructura completa
SELECT 
    c.name AS ColumnName,
    t.name AS DataType,
    c.max_length AS MaxLength,
    c.is_nullable AS IsNullable,
    c.is_identity AS IsIdentity,
    ISNULL(ep.value, 'Sin descripción') AS Descripcion
FROM 
    sys.columns c
JOIN 
    sys.types t ON c.user_type_id = t.user_type_id
LEFT JOIN 
    sys.extended_properties ep ON ep.major_id = c.object_id AND ep.minor_id = c.column_id AND ep.name = 'MS_Description'
WHERE 
    c.object_id = OBJECT_ID('InventarioIndividual')
ORDER BY 
    c.column_id;
GO

-- Tabla Asignaciones - estructura completa
SELECT 
    c.name AS ColumnName,
    t.name AS DataType,
    c.max_length AS MaxLength,
    c.is_nullable AS IsNullable,
    c.is_identity AS IsIdentity,
    ISNULL(ep.value, 'Sin descripción') AS Descripcion
FROM 
    sys.columns c
JOIN 
    sys.types t ON c.user_type_id = t.user_type_id
LEFT JOIN 
    sys.extended_properties ep ON ep.major_id = c.object_id AND ep.minor_id = c.column_id AND ep.name = 'MS_Description'
WHERE 
    c.object_id = OBJECT_ID('Asignaciones')
ORDER BY 
    c.column_id;
GO

-- Ver muestra de datos de InventarioIndividual
SELECT TOP 10 * FROM InventarioIndividual;
GO

-- Ver muestra de datos de Asignaciones
SELECT TOP 10 * FROM Asignaciones;
GO

-- Revisar procedimientos existentes para búsqueda
SELECT 
    OBJECT_NAME(id) AS NombreProcedimiento,
    OBJECT_DEFINITION(id) AS DefinicionProcedimiento
FROM 
    sysobjects
WHERE 
    xtype = 'P' 
    AND OBJECT_NAME(id) LIKE '%Search%' OR OBJECT_NAME(id) LIKE '%Buscar%' OR OBJECT_NAME(id) LIKE '%Get%';
GO

-- Revisar claves primarias y relaciones de claves foráneas de estas tablas
SELECT 
    OBJECT_NAME(fk.parent_object_id) AS TablaOrigen,
    COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS ColumnaOrigen,
    OBJECT_NAME(fk.referenced_object_id) AS TablaDestino,
    COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) AS ColumnaDestino
FROM 
    sys.foreign_keys fk
INNER JOIN 
    sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
WHERE 
    OBJECT_NAME(fk.parent_object_id) IN ('InventarioIndividual', 'Asignaciones')
    OR OBJECT_NAME(fk.referenced_object_id) IN ('InventarioIndividual', 'Asignaciones');
GO