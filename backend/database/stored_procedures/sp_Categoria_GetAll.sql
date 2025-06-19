-- =============================================
-- Author:      Cascade
-- Create date: 2025-05-30
-- Description: Obtiene todas las categorías con paginación y filtros.
--              Versión simplificada SIN parámetro OUTPUT.
-- =============================================
CREATE OR ALTER PROCEDURE dbo.sp_Categoria_GetAll
    @activo_filter TINYINT = 2, -- 0: Inactivas, 1: Activas, 2: Todas (default)
    @PageNumber INT = 1,
    @PageSize INT = 10,
    @SortBy NVARCHAR(50) = 'nombre',
    @SortOrder NVARCHAR(4) = 'ASC'
AS
BEGIN
    SET NOCOUNT ON;

    -- Validaciones
    IF UPPER(@SortOrder) NOT IN ('ASC', 'DESC') SET @SortOrder = 'ASC';
    IF LOWER(@SortBy) NOT IN ('id', 'nombre', 'activo', 'fecha_creacion') SET @SortBy = 'nombre';

    -- CTE para la consulta principal y el conteo total
    WITH CategoryCTE AS (
        SELECT
            c.id,
            c.nombre,
            c.categoria_padre_id,
            cp.nombre AS categoria_padre_nombre,
            c.requiere_serie,
            c.permite_asignacion,
            c.permite_reparacion,
            c.activo,
            c.fecha_creacion,
            -- Conteo total sobre el conjunto de datos filtrado
            COUNT(*) OVER() AS TotalRows
        FROM
            dbo.Categorias c
        LEFT JOIN
            dbo.Categorias cp ON c.categoria_padre_id = cp.id
        WHERE
            (@activo_filter = 2 OR c.activo = @activo_filter)
    )
    -- Seleccionar los resultados paginados
    SELECT
        *
    FROM
        CategoryCTE
    ORDER BY
        CASE WHEN @SortBy = 'id' AND @SortOrder = 'ASC' THEN id END ASC,
        CASE WHEN @SortBy = 'id' AND @SortOrder = 'DESC' THEN id END DESC,
        CASE WHEN @SortBy = 'nombre' AND @SortOrder = 'ASC' THEN nombre END ASC,
        CASE WHEN @SortBy = 'nombre' AND @SortOrder = 'DESC' THEN nombre END DESC,
        CASE WHEN @SortBy = 'activo' AND @SortOrder = 'ASC' THEN activo END ASC,
        CASE WHEN @SortBy = 'activo' AND @SortOrder = 'DESC' THEN activo END DESC,
        CASE WHEN @SortBy = 'fecha_creacion' AND @SortOrder = 'ASC' THEN fecha_creacion END ASC,
        CASE WHEN @SortBy = 'fecha_creacion' AND @SortOrder = 'DESC' THEN fecha_creacion END DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;

END;
GO 