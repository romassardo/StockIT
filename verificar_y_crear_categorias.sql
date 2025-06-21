-- =============================================
-- Script para verificar y crear categorías básicas en StockIT
-- Author: Assistant  
-- Create date: Enero 2025
-- =============================================
USE StockIT;
GO

PRINT N'=== VERIFICANDO ESTADO ACTUAL DE CATEGORÍAS ===';

-- 1. Verificar si existen categorías
SELECT 
    COUNT(*) as TotalCategorias,
    SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) as CategoriasActivas
FROM Categorias;

-- 2. Mostrar categorías existentes
PRINT N'Categorías existentes:';
SELECT 
    id,
    nombre,
    categoria_padre_id,
    requiere_serie,
    permite_asignacion,
    permite_reparacion,
    activo,
    fecha_creacion
FROM Categorias
ORDER BY id;

-- 3. Probar el stored procedure
PRINT N'=== PROBANDO STORED PROCEDURE sp_Categoria_GetAll ===';
EXEC sp_Categoria_GetAll 
    @activo_filter = 1, 
    @PageNumber = 1, 
    @PageSize = 100;

-- 4. Si no hay categorías, crear las básicas del proyecto
IF NOT EXISTS (SELECT 1 FROM Categorias)
BEGIN
    PRINT N'=== NO HAY CATEGORÍAS - CREANDO CATEGORÍAS BÁSICAS ===';
    
    -- Categorías principales (padre)
    INSERT INTO Categorias (nombre, categoria_padre_id, requiere_serie, permite_asignacion, permite_reparacion, activo)
    VALUES 
        ('Computadoras', NULL, 0, 0, 0, 1),
        ('Celulares', NULL, 1, 1, 1, 1),
        ('Periféricos', NULL, 0, 0, 0, 1),
        ('Consumibles', NULL, 0, 0, 0, 1),
        ('Componentes', NULL, 0, 0, 0, 1);

    -- Obtener los IDs de las categorías padre
    DECLARE @ComputadorasId INT = (SELECT id FROM Categorias WHERE nombre = 'Computadoras');
    DECLARE @CelularesId INT = (SELECT id FROM Categorias WHERE nombre = 'Celulares');
    DECLARE @PerifericosId INT = (SELECT id FROM Categorias WHERE nombre = 'Periféricos');
    DECLARE @ConsumiblesId INT = (SELECT id FROM Categorias WHERE nombre = 'Consumibles');
    DECLARE @ComponentesId INT = (SELECT id FROM Categorias WHERE nombre = 'Componentes');

    -- Subcategorías de Computadoras
    INSERT INTO Categorias (nombre, categoria_padre_id, requiere_serie, permite_asignacion, permite_reparacion, activo)
    VALUES 
        ('Desktops', @ComputadorasId, 0, 0, 0, 1),
        ('Notebooks', @ComputadorasId, 1, 1, 1, 1),
        ('Raspberry Pi', @ComputadorasId, 0, 0, 0, 1);

    -- Subcategorías de Periféricos
    INSERT INTO Categorias (nombre, categoria_padre_id, requiere_serie, permite_asignacion, permite_reparacion, activo)
    VALUES 
        ('Teclados', @PerifericosId, 0, 0, 0, 1),
        ('Mouse', @PerifericosId, 0, 0, 0, 1),
        ('Monitores', @PerifericosId, 0, 0, 0, 1),
        ('Impresoras', @PerifericosId, 0, 0, 0, 1),
        ('Webcams', @PerifericosId, 0, 0, 0, 1),
        ('Auriculares', @PerifericosId, 0, 0, 0, 1);

    -- Subcategorías de Consumibles
    INSERT INTO Categorias (nombre, categoria_padre_id, requiere_serie, permite_asignacion, permite_reparacion, activo)
    VALUES 
        ('Cables', @ConsumiblesId, 0, 0, 0, 1),
        ('Pilas', @ConsumiblesId, 0, 0, 0, 1),
        ('Toner', @ConsumiblesId, 0, 0, 0, 1),
        ('Cargadores', @ConsumiblesId, 0, 0, 0, 1);

    -- Subcategorías de Componentes
    INSERT INTO Categorias (nombre, categoria_padre_id, requiere_serie, permite_asignacion, permite_reparacion, activo)
    VALUES 
        ('Memorias RAM', @ComponentesId, 0, 0, 0, 1),
        ('Discos SSD', @ComponentesId, 0, 0, 0, 1),
        ('Discos HDD', @ComponentesId, 0, 0, 0, 1),
        ('Placas de Video', @ComponentesId, 0, 0, 0, 1);

    PRINT N'Categorías básicas creadas exitosamente.';
END
ELSE
BEGIN
    PRINT N'Ya existen categorías en la base de datos.';
END

-- 5. Mostrar el resultado final
PRINT N'=== ESTADO FINAL DE CATEGORÍAS ===';
SELECT 
    COUNT(*) as TotalCategorias,
    SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) as CategoriasActivas
FROM Categorias;

-- 6. Probar nuevamente el stored procedure
PRINT N'=== RESULTADO FINAL DEL STORED PROCEDURE ===';
EXEC sp_Categoria_GetAll 
    @activo_filter = 1, 
    @PageNumber = 1, 
    @PageSize = 100;

PRINT N'=== SCRIPT COMPLETADO ==='; 