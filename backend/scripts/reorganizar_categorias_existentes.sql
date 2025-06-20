-- =============================================
-- Script para reorganizar categorías existentes en StockIT
-- Basado en estructura real de la tabla y datos existentes
-- =============================================

USE StockIT;
GO

PRINT '🚀 Reorganizando categorías existentes en StockIT...';

-- =============================================
-- 1. CREAR CATEGORÍAS PADRE PRINCIPALES
-- =============================================

PRINT '📁 Creando categorías padre principales...';

-- COMPUTADORAS
IF NOT EXISTS (SELECT 1 FROM Categorias WHERE nombre = 'COMPUTADORAS' AND categoria_padre_id IS NULL)
BEGIN
    INSERT INTO Categorias (nombre, categoria_padre_id, requiere_serie, permite_asignacion, permite_reparacion, activo, fecha_creacion)
    VALUES ('COMPUTADORAS', NULL, 0, 0, 0, 1, GETDATE());
    PRINT '✅ Categoría padre COMPUTADORAS creada';
END
ELSE
    PRINT '⚠️ Categoría COMPUTADORAS ya existe';

-- CELULARES (ya existe, solo verificamos)
IF EXISTS (SELECT 1 FROM Categorias WHERE nombre = 'Celulares' AND categoria_padre_id IS NULL)
BEGIN
    -- Actualizar a mayúsculas para consistencia
    UPDATE Categorias 
    SET nombre = 'CELULARES', requiere_serie = 1, permite_asignacion = 1, permite_reparacion = 1
    WHERE nombre = 'Celulares' AND categoria_padre_id IS NULL;
    PRINT '✅ Categoría CELULARES actualizada';
END

-- PERIFÉRICOS
IF NOT EXISTS (SELECT 1 FROM Categorias WHERE nombre = 'PERIFÉRICOS' AND categoria_padre_id IS NULL)
BEGIN
    INSERT INTO Categorias (nombre, categoria_padre_id, requiere_serie, permite_asignacion, permite_reparacion, activo, fecha_creacion)
    VALUES ('PERIFÉRICOS', NULL, 0, 0, 0, 1, GETDATE());
    PRINT '✅ Categoría padre PERIFÉRICOS creada';
END

-- CONSUMIBLES (ya existe, verificamos)
IF EXISTS (SELECT 1 FROM Categorias WHERE nombre = 'Consumibles' AND categoria_padre_id IS NULL)
BEGIN
    UPDATE Categorias 
    SET nombre = 'CONSUMIBLES'
    WHERE nombre = 'Consumibles' AND categoria_padre_id IS NULL;
    PRINT '✅ Categoría CONSUMIBLES actualizada';
END

-- COMPONENTES (ya existe, verificamos)
IF EXISTS (SELECT 1 FROM Categorias WHERE nombre = 'Componentes' AND categoria_padre_id IS NULL)
BEGIN
    UPDATE Categorias 
    SET nombre = 'COMPONENTES'
    WHERE nombre = 'Componentes' AND categoria_padre_id IS NULL;
    PRINT '✅ Categoría COMPONENTES actualizada';
END

-- =============================================
-- 2. REORGANIZAR CATEGORÍAS EXISTENTES
-- =============================================

PRINT '🔧 Reorganizando categorías existentes bajo categorías padre...';

-- Obtener IDs de las categorías padre
DECLARE @computadoras_id INT = (SELECT id FROM Categorias WHERE nombre = 'COMPUTADORAS' AND categoria_padre_id IS NULL);
DECLARE @celulares_id INT = (SELECT id FROM Categorias WHERE nombre = 'CELULARES' AND categoria_padre_id IS NULL);
DECLARE @perifericos_id INT = (SELECT id FROM Categorias WHERE nombre = 'PERIFÉRICOS' AND categoria_padre_id IS NULL);
DECLARE @consumibles_id INT = (SELECT id FROM Categorias WHERE nombre = 'CONSUMIBLES' AND categoria_padre_id IS NULL);
DECLARE @componentes_id INT = (SELECT id FROM Categorias WHERE nombre = 'COMPONENTES' AND categoria_padre_id IS NULL);

-- Mover Notebooks bajo COMPUTADORAS
UPDATE Categorias 
SET categoria_padre_id = @computadoras_id, requiere_serie = 1, permite_asignacion = 1, permite_reparacion = 1
WHERE nombre = 'Notebooks' AND categoria_padre_id IS NULL;
PRINT '✅ Notebooks movido bajo COMPUTADORAS';

-- Mover Desktops bajo COMPUTADORAS  
UPDATE Categorias 
SET categoria_padre_id = @computadoras_id, requiere_serie = 0, permite_asignacion = 0, permite_reparacion = 0
WHERE nombre = 'Desktops' AND categoria_padre_id IS NULL;
PRINT '✅ Desktops movido bajo COMPUTADORAS';

-- Mover Monitores bajo PERIFÉRICOS
UPDATE Categorias 
SET categoria_padre_id = @perifericos_id
WHERE nombre = 'Monitores' AND categoria_padre_id IS NULL;
PRINT '✅ Monitores movido bajo PERIFÉRICOS';

-- Mover Accesorios bajo PERIFÉRICOS (cambiar nombre)
UPDATE Categorias 
SET categoria_padre_id = @perifericos_id, nombre = 'Accesorios Varios'
WHERE nombre = 'Accesorios' AND categoria_padre_id IS NULL;
PRINT '✅ Accesorios movido bajo PERIFÉRICOS';

-- Mover Teclados bajo PERIFÉRICOS
UPDATE Categorias 
SET categoria_padre_id = @perifericos_id
WHERE nombre = 'Teclados' AND categoria_padre_id IS NULL;
PRINT '✅ Teclados movido bajo PERIFÉRICOS';

-- Mover Mouse bajo PERIFÉRICOS
UPDATE Categorias 
SET categoria_padre_id = @perifericos_id
WHERE nombre = 'Mouse' AND categoria_padre_id IS NULL;
PRINT '✅ Mouse movido bajo PERIFÉRICOS';

-- =============================================
-- 3. CREAR SUBCATEGORÍAS FALTANTES
-- =============================================

PRINT '➕ Creando subcategorías faltantes...';

-- Subcategorías de COMPUTADORAS
IF NOT EXISTS (SELECT 1 FROM Categorias WHERE nombre = 'Raspberry Pi' AND categoria_padre_id = @computadoras_id)
BEGIN
    INSERT INTO Categorias (nombre, categoria_padre_id, requiere_serie, permite_asignacion, permite_reparacion, activo, fecha_creacion)
    VALUES ('Raspberry Pi', @computadoras_id, 0, 0, 0, 1, GETDATE());
    PRINT '✅ Raspberry Pi creado bajo COMPUTADORAS';
END

-- Subcategorías de PERIFÉRICOS
DECLARE @perifericos_faltantes TABLE (nombre NVARCHAR(100));
INSERT INTO @perifericos_faltantes VALUES 
    ('Kit Teclado/Mouse'),
    ('Auriculares'),
    ('Webcams'),
    ('Televisores'),
    ('Impresoras'),
    ('Scanners');

DECLARE @nombre_periferico NVARCHAR(100);
DECLARE perifericos_cursor CURSOR FOR SELECT nombre FROM @perifericos_faltantes;

OPEN perifericos_cursor;
FETCH NEXT FROM perifericos_cursor INTO @nombre_periferico;

WHILE @@FETCH_STATUS = 0
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Categorias WHERE nombre = @nombre_periferico AND categoria_padre_id = @perifericos_id)
    BEGIN
        INSERT INTO Categorias (nombre, categoria_padre_id, requiere_serie, permite_asignacion, permite_reparacion, activo, fecha_creacion)
        VALUES (@nombre_periferico, @perifericos_id, 0, 0, 0, 1, GETDATE());
        PRINT '✅ ' + @nombre_periferico + ' creado bajo PERIFÉRICOS';
    END
    
    FETCH NEXT FROM perifericos_cursor INTO @nombre_periferico;
END

CLOSE perifericos_cursor;
DEALLOCATE perifericos_cursor;

-- Subcategorías de CONSUMIBLES
DECLARE @consumibles_faltantes TABLE (nombre NVARCHAR(100));
INSERT INTO @consumibles_faltantes VALUES 
    ('Cables'),
    ('Pilas'),
    ('Toner'),
    ('Drum'),
    ('Cargadores'),
    ('Papel'),
    ('CD/DVD');

DECLARE @nombre_consumible NVARCHAR(100);
DECLARE consumibles_cursor CURSOR FOR SELECT nombre FROM @consumibles_faltantes;

OPEN consumibles_cursor;
FETCH NEXT FROM consumibles_cursor INTO @nombre_consumible;

WHILE @@FETCH_STATUS = 0
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Categorias WHERE nombre = @nombre_consumible AND categoria_padre_id = @consumibles_id)
    BEGIN
        INSERT INTO Categorias (nombre, categoria_padre_id, requiere_serie, permite_asignacion, permite_reparacion, activo, fecha_creacion)
        VALUES (@nombre_consumible, @consumibles_id, 0, 0, 0, 1, GETDATE());
        PRINT '✅ ' + @nombre_consumible + ' creado bajo CONSUMIBLES';
    END
    
    FETCH NEXT FROM consumibles_cursor INTO @nombre_consumible;
END

CLOSE consumibles_cursor;
DEALLOCATE consumibles_cursor;

-- Subcategorías de COMPONENTES
DECLARE @componentes_faltantes TABLE (nombre NVARCHAR(100));
INSERT INTO @componentes_faltantes VALUES 
    ('Memorias RAM'),
    ('Discos Externos'),
    ('Discos SSD/NVMe'),
    ('Discos HDD'),
    ('Placas de Video'),
    ('Motherboards'),
    ('Fuentes de Alimentación'),
    ('Procesadores'),
    ('Adaptadores USB Varios');

DECLARE @nombre_componente NVARCHAR(100);
DECLARE componentes_cursor CURSOR FOR SELECT nombre FROM @componentes_faltantes;

OPEN componentes_cursor;
FETCH NEXT FROM componentes_cursor INTO @nombre_componente;

WHILE @@FETCH_STATUS = 0
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Categorias WHERE nombre = @nombre_componente AND categoria_padre_id = @componentes_id)
    BEGIN
        INSERT INTO Categorias (nombre, categoria_padre_id, requiere_serie, permite_asignacion, permite_reparacion, activo, fecha_creacion)
        VALUES (@nombre_componente, @componentes_id, 0, 0, 0, 1, GETDATE());
        PRINT '✅ ' + @nombre_componente + ' creado bajo COMPONENTES';
    END
    
    FETCH NEXT FROM componentes_cursor INTO @nombre_componente;
END

CLOSE componentes_cursor;
DEALLOCATE componentes_cursor;

-- =============================================
-- 4. VERIFICACIÓN FINAL
-- =============================================

PRINT '';
PRINT '🔍 VERIFICACIÓN FINAL - Estructura reorganizada:';
PRINT '';

-- Mostrar estructura jerárquica
WITH CategoriaJerarquia AS (
    -- Categorías padre
    SELECT 
        id,
        nombre,
        categoria_padre_id,
        CAST(nombre AS NVARCHAR(255)) AS ruta_completa,
        0 as nivel,
        requiere_serie,
        permite_asignacion,
        permite_reparacion
    FROM Categorias 
    WHERE categoria_padre_id IS NULL AND activo = 1
    
    UNION ALL
    
    -- Subcategorías
    SELECT 
        c.id,
        c.nombre,
        c.categoria_padre_id,
        CAST(cj.ruta_completa + ' > ' + c.nombre AS NVARCHAR(255)) AS ruta_completa,
        cj.nivel + 1,
        c.requiere_serie,
        c.permite_asignacion,
        c.permite_reparacion
    FROM Categorias c
    INNER JOIN CategoriaJerarquia cj ON c.categoria_padre_id = cj.id
    WHERE c.activo = 1
)
SELECT 
    CASE 
        WHEN nivel = 0 THEN '📁 ' + nombre + ' (PADRE)'
        WHEN nivel = 1 THEN '  └── ' + nombre
        ELSE REPLICATE('    ', nivel-1) + '└── ' + nombre
    END AS estructura,
    CASE 
        WHEN requiere_serie = 1 THEN '🔢 Serie'
        ELSE '📦 Stock'
    END AS manejo,
    CASE 
        WHEN permite_asignacion = 1 THEN '👤 Asign'
        ELSE '❌'
    END AS asignable,
    CASE 
        WHEN permite_reparacion = 1 THEN '🔧 Repar'
        ELSE '❌'
    END AS reparable
FROM CategoriaJerarquia
ORDER BY nivel, nombre;

-- Estadísticas
DECLARE @total_categorias INT = (SELECT COUNT(*) FROM Categorias WHERE activo = 1);
DECLARE @categorias_padre INT = (SELECT COUNT(*) FROM Categorias WHERE categoria_padre_id IS NULL AND activo = 1);
DECLARE @subcategorias INT = (SELECT COUNT(*) FROM Categorias WHERE categoria_padre_id IS NOT NULL AND activo = 1);

PRINT '';
PRINT '📊 ESTADÍSTICAS:';
PRINT '   • Total categorías: ' + CAST(@total_categorias AS NVARCHAR);
PRINT '   • Categorías padre: ' + CAST(@categorias_padre AS NVARCHAR);
PRINT '   • Subcategorías: ' + CAST(@subcategorias AS NVARCHAR);
PRINT '';
PRINT '✅ ¡Reorganización completada! El dropdown debería funcionar ahora.'; 