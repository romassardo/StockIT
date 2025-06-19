/*
Migración para agregar el Stored Procedure sp_Report_StockAlerts
Fecha: 30/05/2025
*/

-- Procedimiento para reportes de alertas de stock
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_Report_StockAlerts')
    DROP PROCEDURE dbo.sp_Report_StockAlerts
GO

CREATE PROCEDURE dbo.sp_Report_StockAlerts
    @CategoriaID INT = NULL,           -- ID de categoría, NULL para todas
    @UmbralPersonalizado INT = NULL,   -- Si se quiere un umbral diferente al stock_minimo
    @IncluirSinStock BIT = 1,          -- 1 para incluir productos sin stock (cantidad = 0)
    @IncluirStockBajo BIT = 1,         -- 1 para incluir productos con stock bajo (cantidad < stock_minimo)
    @PageNumber INT = 1,
    @PageSize INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @SkipRows INT = (@PageNumber - 1) * @PageSize;
    
    -- Crear tabla temporal para los resultados
    CREATE TABLE #TempAlerts (
        ProductoID INT,
        ProductoMarca NVARCHAR(100),
        ProductoModelo NVARCHAR(100),
        CategoriaID INT,
        CategoriaNombre NVARCHAR(50),
        StockActual INT,
        StockMinimo INT,
        Deficit INT,
        UltimaActualizacion DATETIME,
        TipoAlerta NVARCHAR(20)
    );
    
    -- Insertar productos sin stock (cantidad = 0)
    IF @IncluirSinStock = 1
    BEGIN
        INSERT INTO #TempAlerts (
            ProductoID, ProductoMarca, ProductoModelo, CategoriaID, CategoriaNombre, 
            StockActual, StockMinimo, Deficit, UltimaActualizacion, TipoAlerta
        )
        SELECT 
            p.id,
            p.marca,
            p.descripcion,
            c.id,
            c.nombre,
            0, -- Sin stock
            p.stock_minimo,
            p.stock_minimo, -- El déficit es igual al stock mínimo
            NULL, -- No hay fecha de actualización
            'Sin Stock'
        FROM 
            Productos p
            INNER JOIN Categorias c ON p.categoria_id = c.id
            LEFT JOIN StockGeneral sg ON p.id = sg.producto_id
        WHERE 
            sg.id IS NULL -- No existe en StockGeneral
            AND p.usa_numero_serie = 0 -- Solo para productos sin número de serie
            AND (@CategoriaID IS NULL OR c.id = @CategoriaID)
            AND p.activo = 1;
    END
    
    -- Insertar productos con stock bajo
    IF @IncluirStockBajo = 1
    BEGIN
        INSERT INTO #TempAlerts (
            ProductoID, ProductoMarca, ProductoModelo, CategoriaID, CategoriaNombre, 
            StockActual, StockMinimo, Deficit, UltimaActualizacion, TipoAlerta
        )
        SELECT 
            p.id,
            p.marca,
            p.descripcion,
            c.id,
            c.nombre,
            sg.cantidad_actual,
            CASE 
                WHEN @UmbralPersonalizado IS NOT NULL THEN @UmbralPersonalizado
                ELSE p.stock_minimo
            END,
            CASE 
                WHEN @UmbralPersonalizado IS NOT NULL THEN @UmbralPersonalizado - sg.cantidad_actual
                ELSE p.stock_minimo - sg.cantidad_actual
            END,
            sg.ultima_actualizacion,
            'Stock Bajo'
        FROM 
            StockGeneral sg
            INNER JOIN Productos p ON sg.producto_id = p.id
            INNER JOIN Categorias c ON p.categoria_id = c.id
        WHERE 
            sg.cantidad_actual > 0 -- Tiene stock pero bajo
            AND sg.cantidad_actual < CASE 
                                        WHEN @UmbralPersonalizado IS NOT NULL THEN @UmbralPersonalizado
                                        ELSE p.stock_minimo
                                    END
            AND (@CategoriaID IS NULL OR c.id = @CategoriaID)
            AND p.activo = 1;
    END
    
    -- Obtener total de filas para paginación
    DECLARE @TotalRows INT;
    SELECT @TotalRows = COUNT(*) FROM #TempAlerts;
    
    -- Devolver los resultados paginados
    SELECT 
        ProductoID,
        ProductoMarca,
        ProductoModelo,
        CategoriaID,
        CategoriaNombre,
        StockActual,
        StockMinimo,
        Deficit,
        UltimaActualizacion,
        TipoAlerta,
        @TotalRows AS TotalRows
    FROM 
        #TempAlerts
    ORDER BY 
        TipoAlerta, Deficit DESC
    OFFSET @SkipRows ROWS FETCH NEXT @PageSize ROWS ONLY;
    
    -- Limpiar tabla temporal
    DROP TABLE #TempAlerts;
END
GO
