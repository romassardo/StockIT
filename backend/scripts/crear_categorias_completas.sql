-- =============================================
-- Script para crear estructura completa de categorías StockIT
-- Basado en: proyecto-inventario-it.md secciones 3 y 4
-- Fecha: Enero 2025
-- =============================================

USE StockIT;
GO

PRINT '🚀 Iniciando creación de estructura de categorías StockIT...';

-- =============================================
-- 1. CATEGORÍAS PADRE PRINCIPALES
-- =============================================

PRINT '📁 Creando categorías padre principales...';

-- Verificar si ya existen para no duplicar
IF NOT EXISTS (SELECT 1 FROM Categorias WHERE nombre = 'COMPUTADORAS' AND categoria_padre_id IS NULL)
BEGIN
    INSERT INTO Categorias (nombre, categoria_padre_id, requiere_serie, permite_asignacion, permite_reparacion, activo, fecha_creacion)
    VALUES ('COMPUTADORAS', NULL, 0, 0, 0, 1, GETDATE());
    PRINT '✅ Categoría padre COMPUTADORAS creada';
END
ELSE
    PRINT '⚠️ Categoría COMPUTADORAS ya existe';

IF NOT EXISTS (SELECT 1 FROM Categorias WHERE nombre = 'CELULARES' AND categoria_padre_id IS NULL)
BEGIN
    INSERT INTO Categorias (nombre, categoria_padre_id, requiere_serie, permite_asignacion, permite_reparacion, activo, fecha_creacion)
    VALUES ('CELULARES', NULL, 1, 1, 1, 1, GETDATE());
    PRINT '✅ Categoría padre CELULARES creada';
END
ELSE
    PRINT '⚠️ Categoría CELULARES ya existe';

IF NOT EXISTS (SELECT 1 FROM Categorias WHERE nombre = 'PERIFÉRICOS' AND categoria_padre_id IS NULL)
BEGIN
    INSERT INTO Categorias (nombre, categoria_padre_id, requiere_serie, permite_asignacion, permite_reparacion, activo, fecha_creacion)
    VALUES ('PERIFÉRICOS', NULL, 0, 0, 0, 1, GETDATE());
    PRINT '✅ Categoría padre PERIFÉRICOS creada';
END
ELSE
    PRINT '⚠️ Categoría PERIFÉRICOS ya existe';

IF NOT EXISTS (SELECT 1 FROM Categorias WHERE nombre = 'CONSUMIBLES' AND categoria_padre_id IS NULL)
BEGIN
    INSERT INTO Categorias (nombre, categoria_padre_id, requiere_serie, permite_asignacion, permite_reparacion, activo, fecha_creacion)
    VALUES ('CONSUMIBLES', NULL, 0, 0, 0, 1, GETDATE());
    PRINT '✅ Categoría padre CONSUMIBLES creada';
END
ELSE
    PRINT '⚠️ Categoría CONSUMIBLES ya existe';

IF NOT EXISTS (SELECT 1 FROM Categorias WHERE nombre = 'COMPONENTES' AND categoria_padre_id IS NULL)
BEGIN
    INSERT INTO Categorias (nombre, categoria_padre_id, requiere_serie, permite_asignacion, permite_reparacion, activo, fecha_creacion)
    VALUES ('COMPONENTES', NULL, 0, 0, 0, 1, GETDATE());
    PRINT '✅ Categoría padre COMPONENTES creada';
END
ELSE
    PRINT '⚠️ Categoría COMPONENTES ya existe';

-- =============================================
-- 2. SUBCATEGORÍAS - COMPUTADORAS
-- =============================================

PRINT '💻 Creando subcategorías de COMPUTADORAS...';

DECLARE @computadoras_id INT = (SELECT id FROM Categorias WHERE nombre = 'COMPUTADORAS' AND categoria_padre_id IS NULL);

-- Desktops (manejo por stock)
IF NOT EXISTS (SELECT 1 FROM Categorias WHERE nombre = 'Desktops' AND categoria_padre_id = @computadoras_id)
BEGIN
    INSERT INTO Categorias (nombre, categoria_padre_id, requiere_serie, permite_asignacion, permite_reparacion, activo, fecha_creacion)
    VALUES ('Desktops', @computadoras_id, 0, 0, 0, 1, GETDATE());
    PRINT '✅ Subcategoría Desktops creada';
END

-- Notebooks (seguimiento individual con serie)
IF NOT EXISTS (SELECT 1 FROM Categorias WHERE nombre = 'Notebooks' AND categoria_padre_id = @computadoras_id)
BEGIN
    INSERT INTO Categorias (nombre, categoria_padre_id, requiere_serie, permite_asignacion, permite_reparacion, activo, fecha_creacion)
    VALUES ('Notebooks', @computadoras_id, 1, 1, 1, 1, GETDATE());
    PRINT '✅ Subcategoría Notebooks creada';
END

-- Raspberry Pi (manejo por stock)
IF NOT EXISTS (SELECT 1 FROM Categorias WHERE nombre = 'Raspberry Pi' AND categoria_padre_id = @computadoras_id)
BEGIN
    INSERT INTO Categorias (nombre, categoria_padre_id, requiere_serie, permite_asignacion, permite_reparacion, activo, fecha_creacion)
    VALUES ('Raspberry Pi', @computadoras_id, 0, 0, 0, 1, GETDATE());
    PRINT '✅ Subcategoría Raspberry Pi creada';
END

-- =============================================
-- 3. SUBCATEGORÍAS - PERIFÉRICOS
-- =============================================

PRINT '🖱️ Creando subcategorías de PERIFÉRICOS...';

DECLARE @perifericos_id INT = (SELECT id FROM Categorias WHERE nombre = 'PERIFÉRICOS' AND categoria_padre_id IS NULL);

-- Lista de periféricos según documentación
DECLARE @perifericos_subcats TABLE (nombre NVARCHAR(100));
INSERT INTO @perifericos_subcats VALUES 
    ('Teclados'),
    ('Mouse'),
    ('Kit Teclado/Mouse'),
    ('Auriculares'),
    ('Webcams'),
    ('Monitores'),
    ('Televisores'),
    ('Impresoras'),
    ('Scanners');

DECLARE @nombre_periferico NVARCHAR(100);
DECLARE perifericos_cursor CURSOR FOR SELECT nombre FROM @perifericos_subcats;

OPEN perifericos_cursor;
FETCH NEXT FROM perifericos_cursor INTO @nombre_periferico;

WHILE @@FETCH_STATUS = 0
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Categorias WHERE nombre = @nombre_periferico AND categoria_padre_id = @perifericos_id)
    BEGIN
        INSERT INTO Categorias (nombre, categoria_padre_id, requiere_serie, permite_asignacion, permite_reparacion, activo, fecha_creacion)
        VALUES (@nombre_periferico, @perifericos_id, 0, 0, 0, 1, GETDATE());
        PRINT '✅ Subcategoría ' + @nombre_periferico + ' creada';
    END
    
    FETCH NEXT FROM perifericos_cursor INTO @nombre_periferico;
END

CLOSE perifericos_cursor;
DEALLOCATE perifericos_cursor;

-- =============================================
-- 4. SUBCATEGORÍAS - CONSUMIBLES
-- =============================================

PRINT '📦 Creando subcategorías de CONSUMIBLES...';

DECLARE @consumibles_id INT = (SELECT id FROM Categorias WHERE nombre = 'CONSUMIBLES' AND categoria_padre_id IS NULL);

DECLARE @consumibles_subcats TABLE (nombre NVARCHAR(100));
INSERT INTO @consumibles_subcats VALUES 
    ('Cables'),
    ('Pilas'),
    ('Toner'),
    ('Drum'),
    ('Cargadores'),
    ('Papel'),
    ('CD/DVD');

DECLARE @nombre_consumible NVARCHAR(100);
DECLARE consumibles_cursor CURSOR FOR SELECT nombre FROM @consumibles_subcats;

OPEN consumibles_cursor;
FETCH NEXT FROM consumibles_cursor INTO @nombre_consumible;

WHILE @@FETCH_STATUS = 0
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Categorias WHERE nombre = @nombre_consumible AND categoria_padre_id = @consumibles_id)
    BEGIN
        INSERT INTO Categorias (nombre, categoria_padre_id, requiere_serie, permite_asignacion, permite_reparacion, activo, fecha_creacion)
        VALUES (@nombre_consumible, @consumibles_id, 0, 0, 0, 1, GETDATE());
        PRINT '✅ Subcategoría ' + @nombre_consumible + ' creada';
    END
    
    FETCH NEXT FROM consumibles_cursor INTO @nombre_consumible;
END

CLOSE consumibles_cursor;
DEALLOCATE consumibles_cursor;

-- =============================================
-- 5. SUBCATEGORÍAS - COMPONENTES
-- =============================================

PRINT '🔧 Creando subcategorías de COMPONENTES...';

DECLARE @componentes_id INT = (SELECT id FROM Categorias WHERE nombre = 'COMPONENTES' AND categoria_padre_id IS NULL);

DECLARE @componentes_subcats TABLE (nombre NVARCHAR(100));
INSERT INTO @componentes_subcats VALUES 
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
DECLARE componentes_cursor CURSOR FOR SELECT nombre FROM @componentes_subcats;

OPEN componentes_cursor;
FETCH NEXT FROM componentes_cursor INTO @nombre_componente;

WHILE @@FETCH_STATUS = 0
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Categorias WHERE nombre = @nombre_componente AND categoria_padre_id = @componentes_id)
    BEGIN
        INSERT INTO Categorias (nombre, categoria_padre_id, requiere_serie, permite_asignacion, permite_reparacion, activo, fecha_creacion)
        VALUES (@nombre_componente, @componentes_id, 0, 0, 0, 1, GETDATE());
        PRINT '✅ Subcategoría ' + @nombre_componente + ' creada';
    END
    
    FETCH NEXT FROM componentes_cursor INTO @nombre_componente;
END

CLOSE componentes_cursor;
DEALLOCATE componentes_cursor;

-- =============================================
-- 6. VERIFICACIÓN FINAL
-- =============================================

PRINT '';
PRINT '🔍 VERIFICACIÓN FINAL - Estructura de categorías creada:';
PRINT '';

-- Mostrar estructura jerárquica completa
WITH CategoriaJerarquia AS (
    -- Categorías padre (nivel 0)
    SELECT 
        id,
        nombre,
        categoria_padre_id,
        CAST(nombre AS NVARCHAR(255)) AS ruta_completa,
        0 as nivel
    FROM Categorias 
    WHERE categoria_padre_id IS NULL AND activo = 1
    
    UNION ALL
    
    -- Subcategorías (nivel 1+)
    SELECT 
        c.id,
        c.nombre,
        c.categoria_padre_id,
        CAST(cj.ruta_completa + ' > ' + c.nombre AS NVARCHAR(255)) AS ruta_completa,
        cj.nivel + 1
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
        WHEN requiere_serie = 1 THEN '🔢 Con Serie'
        ELSE '📦 Por Stock'
    END AS tipo_manejo,
    CASE 
        WHEN permite_asignacion = 1 THEN '👤 Asignable'
        ELSE '❌ No Asignable'
    END AS asignacion,
    CASE 
        WHEN permite_reparacion = 1 THEN '🔧 Reparable'
        ELSE '❌ No Reparable'
    END AS reparacion
FROM CategoriaJerarquia
ORDER BY nivel, nombre;

PRINT '';
PRINT '✅ Estructura de categorías StockIT creada exitosamente según especificaciones del proyecto!';
PRINT '';

-- Estadísticas finales
DECLARE @total_categorias INT = (SELECT COUNT(*) FROM Categorias WHERE activo = 1);
DECLARE @categorias_padre INT = (SELECT COUNT(*) FROM Categorias WHERE categoria_padre_id IS NULL AND activo = 1);
DECLARE @subcategorias INT = (SELECT COUNT(*) FROM Categorias WHERE categoria_padre_id IS NOT NULL AND activo = 1);

PRINT '📊 ESTADÍSTICAS FINALES:';
PRINT '   • Total de categorías activas: ' + CAST(@total_categorias AS NVARCHAR);
PRINT '   • Categorías padre: ' + CAST(@categorias_padre AS NVARCHAR);
PRINT '   • Subcategorías: ' + CAST(@subcategorias AS NVARCHAR);
PRINT '';
PRINT '🎯 El dropdown de "Categoría Padre" ahora debería mostrar las 5 categorías principales!'; 