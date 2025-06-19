-- =============================================
-- Autor:      StockIT (Cascade)
-- Fecha:      30/05/2025
-- Descripción: Actualiza sp_Sector_GetAll para soportar paginación y ordenamiento
-- =============================================

-- Actualiza el SP para añadir paginación y ordenamiento
CREATE OR ALTER PROCEDURE sp_Sector_GetAll
    @ActivoOnly BIT = 1,
    @PageNumber INT = 1,
    @PageSize INT = 10,
    @SortBy NVARCHAR(50) = 'nombre',
    @SortOrder NVARCHAR(4) = 'ASC'
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validar parámetros de paginación
    IF @PageNumber < 1 SET @PageNumber = 1;
    IF @PageSize < 1 SET @PageSize = 10;
    IF @PageSize > 100 SET @PageSize = 100; -- Limitar tamaño de página
    
    -- Validar parámetros de ordenamiento
    IF @SortBy NOT IN ('id', 'nombre', 'descripcion', 'responsable_email', 'activo', 'fecha_creacion')
        SET @SortBy = 'nombre';
    
    IF @SortOrder NOT IN ('ASC', 'DESC')
        SET @SortOrder = 'ASC';
    
    -- Construir consulta dinámica para ordenamiento flexible
    DECLARE @SQL NVARCHAR(MAX);
    DECLARE @Params NVARCHAR(MAX);
    DECLARE @Where NVARCHAR(MAX) = ' WHERE (@ActivoOnly = 0 OR activo = 1) ';
    
    -- Consulta para contar total de registros
    SET @SQL = 'SELECT COUNT(*) AS TotalRows FROM Sectores ' + @Where;
    SET @Params = '@ActivoOnly BIT';
    
    -- Tabla temporal para resultados de conteo
    CREATE TABLE #TempCount (TotalRows INT);
    
    -- Ejecutar consulta de conteo
    INSERT INTO #TempCount (TotalRows)
    EXEC sp_executesql @SQL, @Params, @ActivoOnly = @ActivoOnly;
    
    -- Construir consulta principal con paginación y ordenamiento
    SET @SQL = 'SELECT s.*, c.TotalRows
                FROM Sectores s
                CROSS JOIN #TempCount c ' +
                @Where +
                ' ORDER BY ' + QUOTENAME(@SortBy) + ' ' + @SortOrder + ' 
                OFFSET ' + CAST((@PageNumber - 1) * @PageSize AS NVARCHAR) + ' ROWS 
                FETCH NEXT ' + CAST(@PageSize AS NVARCHAR) + ' ROWS ONLY;';
    
    -- Ejecutar consulta principal
    EXEC sp_executesql @SQL, @Params, @ActivoOnly = @ActivoOnly;
    
    -- Limpiar recursos
    DROP TABLE #TempCount;
END;
GO
