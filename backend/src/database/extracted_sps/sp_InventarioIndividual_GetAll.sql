CREATE PROCEDURE [dbo].[sp_InventarioIndividual_GetAll]
    @estado NVARCHAR(20) = NULL,
    @categoria_id INT = NULL,
    @search NVARCHAR(255) = NULL,
    @activos_only BIT = 1,
    @PageNumber INT = 1,
    @PageSize INT = 28
AS
BEGIN
    SET NOCOUNT ON;

    IF @PageNumber < 1 SET @PageNumber = 1;
    IF @PageSize < 1 SET @PageSize = 1;
    IF @PageSize > 100 SET @PageSize = 100;

    SELECT
        ii.id,
        ii.producto_id,
        p.marca AS producto_marca,
        p.modelo AS producto_modelo,
        p.descripcion AS producto_descripcion,
        c.nombre AS categoria_nombre,
        c.id AS categoria_id,
        ii.numero_serie,
        ii.estado,
        ii.fecha_ingreso,
        ii.fecha_baja,
        ii.motivo_baja,
        ii.fecha_creacion,
        ii.fecha_modificacion,
        COUNT(*) OVER() AS TotalRows
    FROM
        InventarioIndividual ii
    INNER JOIN
        Productos p ON ii.producto_id = p.id
    INNER JOIN
        Categorias c ON p.categoria_id = c.id
    WHERE
        (
            -- Si se especifica un estado, ese filtro tiene prioridad
            (@estado IS NOT NULL AND ii.estado COLLATE Latin1_General_CI_AI = @estado COLLATE Latin1_General_CI_AI)
            OR
            -- Si no se especifica un estado, aplica la lÃ³gica por defecto
            (
                @estado IS NULL 
                AND ii.estado != N'Asignado'
                AND (@activos_only = 0 OR ii.estado != N'Dado de Baja')
            )
        )
        AND (@categoria_id IS NULL OR p.categoria_id = @categoria_id)
        AND (@search IS NULL OR (
            ii.numero_serie LIKE '%' + @search + '%'
            OR p.marca LIKE '%' + @search + '%'
            OR p.modelo LIKE '%' + @search + '%'
            OR c.nombre LIKE '%' + @search + '%'
            OR ii.estado LIKE '%' + @search + '%'
        ))
    ORDER BY
        ii.fecha_creacion DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;
