-- =============================================
-- Author:      StockIT Dev Team
-- Create date: 27/05/2025
-- Description: Obtener listado de todos los ítems de inventario individual
-- =============================================
USE StockIT;
GO

-- Verificar si el procedimiento ya existe y eliminarlo
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_InventarioIndividual_GetAll')
BEGIN
    DROP PROCEDURE sp_InventarioIndividual_GetAll;
    PRINT N'Procedimiento sp_InventarioIndividual_GetAll eliminado para su recreación.';
END
GO

CREATE PROCEDURE [dbo].[sp_InventarioIndividual_GetAll]
    @estado NVARCHAR(20) = NULL,
    @categoria_id INT = NULL,
    @search NVARCHAR(255) = NULL, -- Nuevo parámetro para búsqueda global
    @activos_only BIT = 1,
    @PageNumber INT = 1,
    @PageSize INT = 50 -- Un valor por defecto razonable
AS
BEGIN
    SET NOCOUNT ON;

    -- Validación básica de parámetros de paginación
    IF @PageNumber < 1 SET @PageNumber = 1;
    IF @PageSize < 1 SET @PageSize = 1;
    IF @PageSize > 100 SET @PageSize = 100; -- Limitar el tamaño máximo de página

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
        COUNT(*) OVER() AS TotalRows -- Para obtener el total de filas que coinciden con el filtro
    FROM 
        InventarioIndividual ii
    INNER JOIN 
        Productos p ON ii.producto_id = p.id
    INNER JOIN 
        Categorias c ON p.categoria_id = c.id
    WHERE
        -- EXCLUIR automáticamente items "Asignado" - se manejan en página de Asignaciones
        ii.estado != N'Asignado'
        AND (@estado IS NULL OR ii.estado = @estado)
        AND (@categoria_id IS NULL OR p.categoria_id = @categoria_id)
        AND (@activos_only = 0 OR (ii.estado != N'Dado de Baja'))
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
GO

PRINT N'Procedimiento sp_InventarioIndividual_GetAll creado exitosamente.';
GO