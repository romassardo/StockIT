-- =============================================
-- Author:      StockIT Dev Team  
-- Create date: Enero 2025
-- Description: Obtener todas las categorías con estructura jerárquica, paginación, filtros y ordenamiento dinámico.
-- =============================================
USE StockIT;
GO

IF OBJECT_ID('sp_Categoria_GetAll', 'P') IS NOT NULL
    DROP PROCEDURE sp_Categoria_GetAll;
GO

CREATE PROCEDURE sp_Categoria_GetAll
    @activo_filter INT = 1, -- 1: solo activos, 2: todos (activos e inactivos)
    @PageNumber INT = 1,
    @PageSize INT = 50,
    @SortBy NVARCHAR(100) = 'ruta_completa',
    @SortOrder NVARCHAR(4) = 'ASC'
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validación de parámetros de paginación
    IF @PageNumber < 1 SET @PageNumber = 1;
    IF @PageSize < 1 SET @PageSize = 1;
    IF @PageSize > 500 SET @PageSize = 500; -- Aumentado el límite para selectores
    
    -- Validación de parámetros de ordenamiento
    IF @SortOrder NOT IN ('ASC', 'DESC') SET @SortOrder = 'ASC';
    IF @SortBy NOT IN ('id', 'nombre', 'ruta_completa', 'productos_count', 'activo', 'nivel') SET @SortBy = 'ruta_completa';

    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    
    WITH CategoriasJerarquia AS (
        -- Base de la recursión: categorías padre (nivel 0)
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
            CAST(c.nombre AS NVARCHAR(MAX)) AS ruta_completa,
            (SELECT COUNT(*) FROM Productos p WHERE p.categoria_id = c.id) AS productos_count
        FROM Categorias c
        WHERE c.categoria_padre_id IS NULL
        
        UNION ALL
        
        -- Paso recursivo: categorías hijas
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
            CAST(ch.ruta_completa + ' > ' + c.nombre AS NVARCHAR(MAX)) AS ruta_completa,
            (SELECT COUNT(*) FROM Productos p WHERE p.categoria_id = c.id) AS productos_count
        FROM Categorias c
        INNER JOIN CategoriasJerarquia ch ON c.categoria_padre_id = ch.id
    ),
    -- Contar el total de filas ANTES de paginar
    TotalCount AS (
        SELECT COUNT(*) AS TotalRows FROM CategoriasJerarquia
        WHERE (@activo_filter = 2 OR activo = 1)
    )
    SELECT 
        j.id,
        j.nombre,
        j.categoria_padre_id,
        j.padre_nombre,
        j.requiere_serie,
        j.permite_asignacion,
        j.permite_reparacion,
        j.activo,
        j.nivel,
        j.ruta_completa,
        j.productos_count,
        j.fecha_creacion,
        j.fecha_modificacion,
        (SELECT TotalRows FROM TotalCount) AS TotalRows
    FROM CategoriasJerarquia j
    WHERE (@activo_filter = 2 OR activo = 1) -- 1: solo activos, 2: todos
    ORDER BY
        CASE WHEN @SortBy = 'id' AND @SortOrder = 'ASC' THEN j.id END ASC,
        CASE WHEN @SortBy = 'id' AND @SortOrder = 'DESC' THEN j.id END DESC,
        CASE WHEN @SortBy = 'nombre' AND @SortOrder = 'ASC' THEN j.nombre END ASC,
        CASE WHEN @SortBy = 'nombre' AND @SortOrder = 'DESC' THEN j.nombre END DESC,
        CASE WHEN @SortBy = 'ruta_completa' AND @SortOrder = 'ASC' THEN j.ruta_completa END ASC,
        CASE WHEN @SortBy = 'ruta_completa' AND @SortOrder = 'DESC' THEN j.ruta_completa END DESC,
        CASE WHEN @SortBy = 'productos_count' AND @SortOrder = 'ASC' THEN j.productos_count END ASC,
        CASE WHEN @SortBy = 'productos_count' AND @SortOrder = 'DESC' THEN j.productos_count END DESC,
        CASE WHEN @SortBy = 'activo' AND @SortOrder = 'ASC' THEN j.activo END ASC,
        CASE WHEN @SortBy = 'activo' AND @SortOrder = 'DESC' THEN j.activo END DESC,
        CASE WHEN @SortBy = 'nivel' AND @SortOrder = 'ASC' THEN j.nivel END ASC,
        CASE WHEN @SortBy = 'nivel' AND @SortOrder = 'DESC' THEN j.nivel END DESC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY
    OPTION (MAXRECURSION 0); -- Permitir recursión infinita
    
END;
GO

PRINT N'Stored procedure sp_Categoria_GetAll actualizado exitosamente.';
GO 