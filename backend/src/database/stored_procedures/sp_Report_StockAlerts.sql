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
        ProductoNombre NVARCHAR(100),
        Categoria NVARCHAR(50),
        CategoriaID INT,
        CantidadActual INT,
        StockMinimo INT,
        UmbralPersonalizado INT,
        DiasParaAgotarse INT,
        PromedioSalidaDiaria DECIMAL(10,2),
        UltimoMovimiento DATETIME,
        TipoAlerta NVARCHAR(20)
    );
    
    -- Insertar productos sin stock (cantidad = 0)
    IF @IncluirSinStock = 1
    BEGIN
        INSERT INTO #TempAlerts (
            ProductoID, ProductoNombre, Categoria, CategoriaID, 
            CantidadActual, StockMinimo, UmbralPersonalizado,
            DiasParaAgotarse, PromedioSalidaDiaria, UltimoMovimiento, TipoAlerta
        )
        SELECT 
            p.id AS ProductoID,
            CONCAT(p.marca, ' ', p.modelo) AS ProductoNombre,
            c.nombre AS Categoria,
            c.id AS CategoriaID,
            sg.cantidad_actual AS CantidadActual,
            p.stock_minimo AS StockMinimo,
            ISNULL(@UmbralPersonalizado, p.stock_minimo) AS UmbralPersonalizado,
            0 AS DiasParaAgotarse, -- 0 días porque ya está agotado
            (
                SELECT 
                    ISNULL(AVG(CAST(m.cantidad AS DECIMAL(10,2))), 0)
                FROM 
                    MovimientosStock m 
                WHERE 
                    m.producto_id = p.id 
                    AND m.tipo_movimiento = 'Salida'
                    AND m.fecha_movimiento >= DATEADD(day, -30, GETDATE())
            ) AS PromedioSalidaDiaria,
            (
                SELECT TOP 1 
                    m.fecha_movimiento
                FROM 
                    MovimientosStock m 
                WHERE 
                    m.producto_id = p.id
                ORDER BY 
                    m.fecha_movimiento DESC
            ) AS UltimoMovimiento,
            'Sin Stock' AS TipoAlerta
        FROM 
            StockGeneral sg
            INNER JOIN Productos p ON sg.producto_id = p.id
            INNER JOIN Categorias c ON p.categoria_id = c.id
        WHERE 
            sg.cantidad_actual = 0
            AND p.usa_numero_serie = 0 -- Solo productos sin número de serie
            AND p.activo = 1 -- Solo productos activos
            AND (@CategoriaID IS NULL OR c.id = @CategoriaID);
    END
    
    -- Insertar productos con stock bajo (cantidad < stock_minimo o umbral personalizado)
    IF @IncluirStockBajo = 1
    BEGIN
        INSERT INTO #TempAlerts (
            ProductoID, ProductoNombre, Categoria, CategoriaID, 
            CantidadActual, StockMinimo, UmbralPersonalizado,
            DiasParaAgotarse, PromedioSalidaDiaria, UltimoMovimiento, TipoAlerta
        )
        SELECT 
            p.id AS ProductoID,
            CONCAT(p.marca, ' ', p.modelo) AS ProductoNombre,
            c.nombre AS Categoria,
            c.id AS CategoriaID,
            sg.cantidad_actual AS CantidadActual,
            p.stock_minimo AS StockMinimo,
            ISNULL(@UmbralPersonalizado, p.stock_minimo) AS UmbralPersonalizado,
            CASE 
                WHEN prom.salida_diaria = 0 THEN 999 -- Si no hay salidas, poner un valor alto
                ELSE CAST(sg.cantidad_actual / NULLIF(prom.salida_diaria, 0) AS INT)
            END AS DiasParaAgotarse,
            prom.salida_diaria AS PromedioSalidaDiaria,
            ulti.ultimo_mov AS UltimoMovimiento,
            'Stock Bajo' AS TipoAlerta
        FROM 
            StockGeneral sg
            INNER JOIN Productos p ON sg.producto_id = p.id
            INNER JOIN Categorias c ON p.categoria_id = c.id
            OUTER APPLY (
                SELECT 
                    ISNULL(AVG(CAST(m.cantidad AS DECIMAL(10,2))), 0) AS salida_diaria
                FROM 
                    MovimientosStock m 
                WHERE 
                    m.producto_id = p.id 
                    AND m.tipo_movimiento = 'Salida'
                    AND m.fecha_movimiento >= DATEADD(day, -30, GETDATE())
            ) prom
            OUTER APPLY (
                SELECT TOP 1 
                    m.fecha_movimiento AS ultimo_mov
                FROM 
                    MovimientosStock m 
                WHERE 
                    m.producto_id = p.id
                ORDER BY 
                    m.fecha_movimiento DESC
            ) ulti
        WHERE 
            sg.cantidad_actual > 0 -- Excluir los que ya están sin stock
            AND sg.cantidad_actual < ISNULL(@UmbralPersonalizado, p.stock_minimo) -- Por debajo del umbral
            AND p.usa_numero_serie = 0 -- Solo productos sin número de serie
            AND p.activo = 1 -- Solo productos activos
            AND (@CategoriaID IS NULL OR c.id = @CategoriaID);
    END
    
    -- Obtener recuento total para paginación
    DECLARE @TotalRows INT;
    SELECT @TotalRows = COUNT(*) FROM #TempAlerts;
    
    -- Calcular estadísticas agregadas antes de la paginación
    DECLARE @TotalSinStock INT, @TotalStockBajo INT, @TotalAlertas INT;
    DECLARE @MinimosDiasParaAgotarse INT, @PromedioDiasParaAgotarse DECIMAL(10,2);
    
    SELECT 
        @TotalSinStock = COUNT(CASE WHEN TipoAlerta = 'Sin Stock' THEN 1 END),
        @TotalStockBajo = COUNT(CASE WHEN TipoAlerta = 'Stock Bajo' THEN 1 END),
        @TotalAlertas = COUNT(*),
        @MinimosDiasParaAgotarse = MIN(DiasParaAgotarse),
        @PromedioDiasParaAgotarse = AVG(CAST(DiasParaAgotarse AS DECIMAL(10,2)))
    FROM 
        #TempAlerts;
    
    -- Devolver los resultados paginados
    SELECT 
        ProductoID,
        ProductoNombre,
        Categoria,
        CategoriaID,
        CantidadActual,
        StockMinimo,
        UmbralPersonalizado,
        DiasParaAgotarse,
        PromedioSalidaDiaria,
        UltimoMovimiento,
        TipoAlerta,
        @TotalRows AS TotalRows
    FROM 
        #TempAlerts
    ORDER BY 
        CASE TipoAlerta 
            WHEN 'Sin Stock' THEN 1 
            WHEN 'Stock Bajo' THEN 2 
            ELSE 3 
        END,
        DiasParaAgotarse,
        ProductoNombre
    OFFSET @SkipRows ROWS
    FETCH NEXT @PageSize ROWS ONLY;
    
    -- Limpiar tabla temporal
    DROP TABLE #TempAlerts;
    
    -- Devolver estadísticas agregadas como segundo recordset
    SELECT 
        'Resumen' AS ReportType,
        @TotalSinStock AS TotalSinStock,
        @TotalStockBajo AS TotalStockBajo,
        @TotalAlertas AS TotalAlertas,
        @MinimosDiasParaAgotarse AS MinimosDiasParaAgotarse,
        @PromedioDiasParaAgotarse AS PromedioDiasParaAgotarse;
END;
