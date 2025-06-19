USE StockIT;
GO

-- Ver valores distintos de 'estado' en InventarioIndividual
SELECT DISTINCT estado FROM InventarioIndividual;
GO

-- Ver valores distintos de 'activa' en Asignaciones
SELECT DISTINCT activa FROM Asignaciones;
GO

-- Ver valores distintos de 'tipo_asignacion' en Asignaciones
SELECT DISTINCT tipo_asignacion FROM Asignaciones;
GO

-- Ver todos los valores de 'password_encriptacion' en Asignaciones
SELECT TOP 10 id, password_encriptacion, cuenta_gmail, numero_telefono FROM Asignaciones WHERE password_encriptacion IS NOT NULL OR cuenta_gmail IS NOT NULL OR numero_telefono IS NOT NULL;
GO

-- Ver los procedimientos almacenados que manejan búsquedas
SELECT name 
FROM sys.procedures 
WHERE name LIKE '%Search%' OR name LIKE '%Find%' OR name LIKE '%Buscar%' OR name LIKE '%Get%By%';
GO