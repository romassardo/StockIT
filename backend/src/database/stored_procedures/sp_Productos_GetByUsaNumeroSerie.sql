-- =============================================
-- Author:      StockIT Dev Team
-- Create date: 09/06/2025
-- Description: Obtiene productos filtrando por si usan número de serie o no.
-- =============================================
USE StockIT;
GO

IF OBJECT_ID('sp_Productos_GetByUsaNumeroSerie', 'P') IS NOT NULL
    DROP PROCEDURE sp_Productos_GetByUsaNumeroSerie;
GO

CREATE PROCEDURE sp_Productos_GetByUsaNumeroSerie
    @usa_numero_serie BIT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        p.id,
        p.id as producto_id, -- Alias para compatibilidad con frontend
        p.nombre as nombre_producto,
        p.modelo,
        m.nombre as nombre_marca,
        p.descripcion,
        c.id as categoria_id,
        c.nombre as nombre_categoria,
        p.usa_numero_serie,
        p.activo
    FROM 
        Productos p
    LEFT JOIN 
        Marcas m ON p.marca_id = m.id
    LEFT JOIN
        Categorias c ON p.categoria_id = c.id
    WHERE
        p.usa_numero_serie = @usa_numero_serie
        AND p.activo = 1
    ORDER BY
        m.nombre, p.nombre;
END
GO

PRINT N'Stored procedure sp_Productos_GetByUsaNumeroSerie creado exitosamente.';
GO 