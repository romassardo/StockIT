-- Consulta para ver todas las categorías con información completa
-- Incluyendo nombres de categorías padre y estructura jerárquica

USE StockIT;
GO

-- Consulta básica con nombres de categorías padre
SELECT 
    c.id AS 'ID',
    c.nombre AS 'Nombre Categoría',
    c.categoria_padre_id AS 'ID Padre',
    cp.nombre AS 'Categoría Padre',
    c.requiere_serie AS 'Requiere Serie',
    c.permite_asignacion AS 'Permite Asignación',
    c.permite_reparacion AS 'Permite Reparación',
    c.activo AS 'Activo',
    c.fecha_creacion AS 'Fecha Creación'
FROM Categorias c
LEFT JOIN Categorias cp ON c.categoria_padre_id = cp.id
ORDER BY 
    CASE WHEN c.categoria_padre_id IS NULL THEN c.nombre END,  -- Primero las principales
    cp.nombre,  -- Luego por padre
    c.nombre;   -- Finalmente por nombre de subcategoría

PRINT '--- Consulta básica completada ---';

-- Consulta avanzada con ruta completa (como el stored procedure)
WITH CategoriasJerarquia AS (
    -- Base: categorías principales (sin padre)
    SELECT 
        c.id,
        c.nombre,
        c.categoria_padre_id,
        c.requiere_serie,
        c.permite_asignacion,
        c.permite_reparacion,
        c.activo,
        c.fecha_creacion,
        CAST(NULL AS NVARCHAR(255)) AS padre_nombre,
        0 AS nivel,
        CAST(c.nombre AS NVARCHAR(MAX)) AS ruta_completa
    FROM Categorias c
    WHERE c.categoria_padre_id IS NULL
    
    UNION ALL
    
    -- Recursión: subcategorías
    SELECT 
        c.id,
        c.nombre,
        c.categoria_padre_id,
        c.requiere_serie,
        c.permite_asignacion,
        c.permite_reparacion,
        c.activo,
        c.fecha_creacion,
        CAST(ch.nombre AS NVARCHAR(255)) AS padre_nombre,
        ch.nivel + 1 AS nivel,
        CAST(ch.ruta_completa + ' > ' + c.nombre AS NVARCHAR(MAX)) AS ruta_completa
    FROM Categorias c
    INNER JOIN CategoriasJerarquia ch ON c.categoria_padre_id = ch.id
)
SELECT 
    id AS 'ID',
    nombre AS 'Nombre',
    categoria_padre_id AS 'ID Padre',
    padre_nombre AS 'Nombre Padre',
    nivel AS 'Nivel',
    ruta_completa AS 'Ruta Completa',
    CASE WHEN requiere_serie = 1 THEN 'Sí' ELSE 'No' END AS 'Req. Serie',
    CASE WHEN permite_asignacion = 1 THEN 'Sí' ELSE 'No' END AS 'Permite Asign.',
    CASE WHEN permite_reparacion = 1 THEN 'Sí' ELSE 'No' END AS 'Permite Rep.',
    CASE WHEN activo = 1 THEN 'Activo' ELSE 'Inactivo' END AS 'Estado'
FROM CategoriasJerarquia
ORDER BY ruta_completa
OPTION (MAXRECURSION 10);

PRINT '--- Consulta jerárquica completada ---';
GO 