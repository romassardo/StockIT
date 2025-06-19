-- =============================================
-- Author:      StockIT Dev Team  
-- Create date: Enero 2025
-- Description: Obtener todas las categorías con estructura jerárquica
-- =============================================
USE StockIT;
GO

IF OBJECT_ID('sp_Categoria_GetAll', 'P') IS NOT NULL
    DROP PROCEDURE sp_Categoria_GetAll;
GO

CREATE PROCEDURE sp_Categoria_GetAll
    @incluir_inactivas BIT = 0,
    @PageNumber INT = 1,
    @PageSize INT = 50
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validación de parámetros
    IF @PageNumber < 1 SET @PageNumber = 1;
    IF @PageSize < 1 SET @PageSize = 1;
    IF @PageSize > 100 SET @PageSize = 100;
    
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    
    WITH CategoriasJerarquia AS (
        -- Categorías padre (nivel 0)
        SELECT 
            c.id,
            c.nombre,
            c.categoria_padre_id,
            c.requiere_serie,
            c.permite_asignacion,
            c.permite_reparacion,
            c.activo,
            c.fecha_creacion,
            c.fecha_modificacion,
            CAST(NULL AS NVARCHAR(100)) AS padre_nombre,
            0 AS nivel,
            CAST(c.nombre AS NVARCHAR(500)) AS ruta_completa,
            -- Contar productos que usan esta categoría
            (SELECT COUNT(*) FROM Productos p WHERE p.categoria_id = c.id) AS productos_count
        FROM Categorias c
        WHERE c.categoria_padre_id IS NULL
        
        UNION ALL
        
        -- Categorías hijas (recursivo)
        SELECT 
            c.id,
            c.nombre,
            c.categoria_padre_id,
            c.requiere_serie,
            c.permite_asignacion,
            c.permite_reparacion,
            c.activo,
            c.fecha_creacion,
            c.fecha_modificacion,
            ch.nombre AS padre_nombre,
            ch.nivel + 1 AS nivel,
            CAST(ch.ruta_completa + ' > ' + c.nombre AS NVARCHAR(500)) AS ruta_completa,
            (SELECT COUNT(*) FROM Productos p WHERE p.categoria_id = c.id) AS productos_count
        FROM Categorias c
        INNER JOIN CategoriasJerarquia ch ON c.categoria_padre_id = ch.id
    )
    
    SELECT 
        id,
        nombre,
        categoria_padre_id,
        padre_nombre,
        requiere_serie,
        permite_asignacion,
        permite_reparacion,
        activo,
        nivel,
        ruta_completa,
        productos_count,
        fecha_creacion,
        fecha_modificacion,
        COUNT(*) OVER() AS TotalRows
    FROM CategoriasJerarquia
    WHERE (@incluir_inactivas = 1 OR activo = 1)
    ORDER BY nivel, nombre
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
    
END;
GO

PRINT N'Stored procedure sp_Categoria_GetAll creado exitosamente.'; 