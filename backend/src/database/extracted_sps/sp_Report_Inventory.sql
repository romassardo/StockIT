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
        ProductoMarca NVARCHAR(100),
        ProductoModelo NVARCHAR(100),
        ProductoCategoria NVARCHAR(50),
        CategoriaID INT,
        NumeroSerie NVARCHAR(100) NULL,
        Estado NVARCHAR(20) NULL,
        Cantidad INT NULL,
        FechaIngreso DATE NULL,
        FechaModificacion DATETIME NULL
    );
    
    -- Información de inventario individual (con número de serie)
    IF @TipoInventario IS NULL OR @TipoInventario = 'Individual'
    BEGIN
        INSERT INTO #TempInventario (
            ID, TipoInventario, ProductoID, ProductoMarca, ProductoModelo, ProductoCategoria, CategoriaID,
            NumeroSerie, Estado, FechaIngreso, FechaModificacion
        )
        SELECT 
            ii.id,
            'Individual',
            p.id,
            p.marca,
            p.descripcion,
            c.nombre,
            c.id,
            ii.numero_serie,
            ii.estado,
            ii.fecha_ingreso,
            ii.fecha_modificacion
        FROM 
            InventarioIndividual ii
            INNER JOIN Productos p ON ii.producto_id = p.id
            INNER JOIN Categorias c ON p.categoria_id = c.id
        WHERE 
            (@Estado IS NULL OR ii.estado = @Estado)
            AND (@CategoriaID IS NULL OR c.id = @CategoriaID)
            AND (@FechaDesde IS NULL OR ii.fecha_ingreso >= @FechaDesde)
            AND (@FechaHasta IS NULL OR ii.fecha_ingreso <= @FechaHasta);
    END
    
    -- Información de stock general (sin número de serie)
    IF @TipoInventario IS NULL OR @TipoInventario = 'General'
    BEGIN
        INSERT INTO #TempInventario (
            ID, TipoInventario, ProductoID, ProductoMarca, ProductoModelo, ProductoCategoria, CategoriaID,
            Cantidad, FechaModificacion
        )
        SELECT 
            sg.id,
            'General',
            p.id,
            p.marca,
            p.descripcion,
            c.nombre,
            c.id,
            sg.cantidad_actual,
            sg.ultima_actualizacion
        FROM 
            StockGeneral sg
            INNER JOIN Productos p ON sg.producto_id = p.id
            INNER JOIN Categorias c ON p.categoria_id = c.id
        WHERE 
            (@CategoriaID IS NULL OR c.id = @CategoriaID);
    END
    
    -- Obtener total de filas para paginación
    DECLARE @TotalRows INT;
    SELECT @TotalRows = COUNT(*) FROM #TempInventario;
    
    -- Devolver resultados paginados
    SELECT 
        ID,
        TipoInventario,
        ProductoID,
        ProductoMarca,
        ProductoModelo,
        ProductoCategoria,
        NumeroSerie,
        Estado,
        Cantidad,
        FechaIngreso,
        FechaModificacion,
        @TotalRows AS TotalRows
    FROM 
        #TempInventario
    ORDER BY 
        ProductoCategoria, ProductoMarca, ProductoModelo, TipoInventario
    OFFSET @SkipRows ROWS FETCH NEXT @PageSize ROWS ONLY;
    
    -- Limpiar tabla temporal
    DROP TABLE #TempInventario;
END