-- Script para crear categorías iniciales en StockIT
-- Ejecutar este script directamente en SQL Server Management Studio

USE StockIT;
GO

-- Verificar si ya existen categorías
IF NOT EXISTS (SELECT 1 FROM Categorias WHERE nombre = 'Computadoras')
BEGIN
    PRINT 'Creando categorías iniciales...'
    
    -- Crear categorías principales
    INSERT INTO Categorias (nombre, categoria_padre_id, requiere_serie, permite_asignacion, permite_reparacion, activo, fecha_creacion)
    VALUES 
    ('Computadoras', NULL, 1, 1, 1, 1, GETDATE()),
    ('Periféricos', NULL, 0, 0, 0, 1, GETDATE()),
    ('Consumibles', NULL, 0, 0, 0, 1, GETDATE()),
    ('Componentes', NULL, 0, 0, 0, 1, GETDATE());
    
    -- Obtener IDs de las categorías principales
    DECLARE @ComputadorasId INT = (SELECT id FROM Categorias WHERE nombre = 'Computadoras')
    DECLARE @PerifericosId INT = (SELECT id FROM Categorias WHERE nombre = 'Periféricos')
    DECLARE @ConsumiblesId INT = (SELECT id FROM Categorias WHERE nombre = 'Consumibles')
    DECLARE @ComponentesId INT = (SELECT id FROM Categorias WHERE nombre = 'Componentes')
    
    -- Crear subcategorías de Computadoras
    INSERT INTO Categorias (nombre, categoria_padre_id, requiere_serie, permite_asignacion, permite_reparacion, activo, fecha_creacion)
    VALUES 
    ('Notebooks', @ComputadorasId, 1, 1, 1, 1, GETDATE()),
    ('Desktops', @ComputadorasId, 0, 0, 0, 1, GETDATE()),
    ('Celulares', @ComputadorasId, 1, 1, 1, 1, GETDATE());
    
    -- Crear subcategorías de Periféricos
    INSERT INTO Categorias (nombre, categoria_padre_id, requiere_serie, permite_asignacion, permite_reparacion, activo, fecha_creacion)
    VALUES 
    ('Teclados', @PerifericosId, 0, 0, 0, 1, GETDATE()),
    ('Mouse', @PerifericosId, 0, 0, 0, 1, GETDATE()),
    ('Monitores', @PerifericosId, 0, 0, 0, 1, GETDATE()),
    ('Impresoras', @PerifericosId, 0, 0, 0, 1, GETDATE());
    
    -- Crear subcategorías de Consumibles
    INSERT INTO Categorias (nombre, categoria_padre_id, requiere_serie, permite_asignacion, permite_reparacion, activo, fecha_creacion)
    VALUES 
    ('Cables', @ConsumiblesId, 0, 0, 0, 1, GETDATE()),
    ('Pilas', @ConsumiblesId, 0, 0, 0, 1, GETDATE()),
    ('Toner', @ConsumiblesId, 0, 0, 0, 1, GETDATE());
    
    -- Crear subcategorías de Componentes
    INSERT INTO Categorias (nombre, categoria_padre_id, requiere_serie, permite_asignacion, permite_reparacion, activo, fecha_creacion)
    VALUES 
    ('Memorias RAM', @ComponentesId, 0, 0, 0, 1, GETDATE()),
    ('Discos SSD', @ComponentesId, 0, 0, 0, 1, GETDATE()),
    ('Discos HDD', @ComponentesId, 0, 0, 0, 1, GETDATE());
    
    PRINT 'Categorías iniciales creadas exitosamente.'
END
ELSE
BEGIN
    PRINT 'Ya existen categorías en la base de datos.'
END

-- Mostrar el resultado
SELECT 
    c.id,
    c.nombre,
    c.categoria_padre_id,
    cp.nombre AS padre_nombre,
    c.requiere_serie,
    c.permite_asignacion,
    c.permite_reparacion,
    c.activo
FROM Categorias c
LEFT JOIN Categorias cp ON c.categoria_padre_id = cp.id
ORDER BY 
    CASE WHEN c.categoria_padre_id IS NULL THEN c.nombre END,
    cp.nombre,
    c.nombre;

PRINT 'Script completado.'
GO 