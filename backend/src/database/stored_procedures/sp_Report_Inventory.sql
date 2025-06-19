CREATE PROCEDURE dbo.sp_Report_Inventory
    @TipoInventario NVARCHAR(20) = NULL, -- 'Individual', 'General', NULL para ambos
    @Estado NVARCHAR(20) = NULL,         -- Estado para InventarioIndividual, NULL para todos
    @CategoriaID INT = NULL,             -- ID de categoría, NULL para todas
    @FechaDesde DATE = NULL,             -- Fecha de compra desde, NULL para todas
    @FechaHasta DATE = NULL,             -- Fecha de compra hasta, NULL para todas
    @PageNumber INT = 1,
    @PageSize INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @SkipRows INT = (@PageNumber - 1) * @PageSize;
    
    -- Crear tabla temporal para unificar los datos de ambos inventarios
    CREATE TABLE #TempInventario (
        ID INT,
        TipoInventario NVARCHAR(20),
        ProductoID INT,
        ProductoNombre NVARCHAR(100),
        ProductoCategoria NVARCHAR(50),
        CategoriaID INT,
        NumeroSerie NVARCHAR(100) NULL,
        Estado NVARCHAR(20) NULL,
        Cantidad INT NULL,
        Ubicacion NVARCHAR(100) NULL,
        FechaCompra DATE NULL,
        FechaGarantia DATE NULL,
        DiasRestantesGarantia INT NULL,
        FechaCreacion DATETIME,
        UltimaModificacion DATETIME NULL
    );
    
    -- Información de inventario individual (con número de serie)
    IF @TipoInventario IS NULL OR @TipoInventario = 'Individual'
    BEGIN
        INSERT INTO #TempInventario (
            ID, TipoInventario, ProductoID, ProductoNombre, ProductoCategoria, CategoriaID,
            NumeroSerie, Estado, Cantidad, Ubicacion, FechaCompra, FechaGarantia,
            DiasRestantesGarantia, FechaCreacion, UltimaModificacion
        )
        SELECT 
            i.id, 
            'Individual' AS TipoInventario,
            i.producto_id,
            p.nombre AS ProductoNombre,
            c.nombre AS ProductoCategoria,
            c.id AS CategoriaID,
            i.numero_serie,
            i.estado,
            1 AS Cantidad, -- Siempre 1 para inventario individual
            NULL AS Ubicacion, -- No tiene ubicación en esta tabla
            i.fecha_compra,
            i.fecha_garantia,
            CASE 
                WHEN i.fecha_garantia IS NULL THEN NULL
                WHEN GETDATE() > i.fecha_garantia THEN 0
                ELSE DATEDIFF(day, GETDATE(), i.fecha_garantia)
            END AS DiasRestantesGarantia,
            i.fecha_creacion,
            i.fecha_modificacion AS UltimaModificacion
        FROM 
            InventarioIndividual i
            INNER JOIN Productos p ON i.producto_id = p.id
            INNER JOIN Categorias c ON p.categoria_id = c.id
        WHERE 
            (@Estado IS NULL OR i.estado = @Estado)
            AND (@CategoriaID IS NULL OR c.id = @CategoriaID)
            AND (@FechaDesde IS NULL OR i.fecha_compra >= @FechaDesde)
            AND (@FechaHasta IS NULL OR i.fecha_compra <= @FechaHasta);
    END

    -- Información de stock general (sin número de serie)
    IF @TipoInventario IS NULL OR @TipoInventario = 'General'
    BEGIN
        INSERT INTO #TempInventario (
            ID, TipoInventario, ProductoID, ProductoNombre, ProductoCategoria, CategoriaID,
            NumeroSerie, Estado, Cantidad, Ubicacion, FechaCompra, FechaGarantia,
            DiasRestantesGarantia, FechaCreacion, UltimaModificacion
        )
        SELECT 
            sg.id, 
            'General' AS TipoInventario,
            sg.producto_id,
            p.nombre AS ProductoNombre,
            c.nombre AS ProductoCategoria,
            c.id AS CategoriaID,
            NULL AS NumeroSerie, -- Stock general no tiene número de serie
            CASE 
                WHEN sg.cantidad_actual = 0 THEN 'Sin Stock'
                WHEN sg.cantidad_actual < p.stock_minimo THEN 'Stock Bajo'
                ELSE 'Disponible'
            END AS Estado,
            sg.cantidad_actual AS Cantidad,
            sg.ubicacion,
            NULL AS FechaCompra, -- Stock general no tiene fecha de compra individual
            NULL AS FechaGarantia, -- Stock general no tiene garantía individual
            NULL AS DiasRestantesGarantia,
            sg.fecha_creacion,
            sg.fecha_modificacion AS UltimaModificacion
        FROM 
            StockGeneral sg
            INNER JOIN Productos p ON sg.producto_id = p.id
            INNER JOIN Categorias c ON p.categoria_id = c.id
        WHERE 
            (@CategoriaID IS NULL OR c.id = @CategoriaID)
            AND (@Estado IS NULL OR 
                (@Estado = 'Sin Stock' AND sg.cantidad_actual = 0) OR
                (@Estado = 'Stock Bajo' AND sg.cantidad_actual < p.stock_minimo) OR
                (@Estado = 'Disponible' AND sg.cantidad_actual >= p.stock_minimo)
            );
    END

    -- Obtener el recuento total para la paginación
    DECLARE @TotalRows INT;
    SELECT @TotalRows = COUNT(*) FROM #TempInventario;
    
    -- Devolver los resultados paginados
    SELECT 
        ID,
        TipoInventario,
        ProductoID,
        ProductoNombre,
        ProductoCategoria,
        NumeroSerie,
        Estado,
        Cantidad,
        Ubicacion,
        FechaCompra,
        FechaGarantia,
        DiasRestantesGarantia,
        FechaCreacion,
        UltimaModificacion,
        @TotalRows AS TotalRows
    FROM 
        #TempInventario
    ORDER BY 
        TipoInventario, ProductoNombre, ID
    OFFSET @SkipRows ROWS
    FETCH NEXT @PageSize ROWS ONLY;
    
    -- Limpiar tabla temporal
    DROP TABLE #TempInventario;
END;
