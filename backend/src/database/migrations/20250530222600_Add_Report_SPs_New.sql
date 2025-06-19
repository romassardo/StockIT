/*
Migración para agregar Stored Procedures de Reportes
Fecha: 30/05/2025
*/

-- Procedimiento para reportes de inventario
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_Report_Inventory')
    DROP PROCEDURE dbo.sp_Report_Inventory
GO

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
        FechaIngreso DATE NULL,
        FechaModificacion DATETIME NULL
    );
    
    -- Información de inventario individual (con número de serie)
    IF @TipoInventario IS NULL OR @TipoInventario = 'Individual'
    BEGIN
        INSERT INTO #TempInventario (
            ID, TipoInventario, ProductoID, ProductoNombre, ProductoCategoria, CategoriaID,
            NumeroSerie, Estado, FechaIngreso, FechaModificacion
        )
        SELECT 
            ii.id,
            'Individual',
            p.id,
            p.nombre,
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
            ID, TipoInventario, ProductoID, ProductoNombre, ProductoCategoria, CategoriaID,
            Cantidad, FechaModificacion
        )
        SELECT 
            sg.id,
            'General',
            p.id,
            p.nombre,
            c.nombre,
            c.id,
            sg.cantidad_actual,
            sg.fecha_ultima_actualizacion
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
        ProductoNombre,
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
        ProductoCategoria, ProductoNombre, TipoInventario
    OFFSET @SkipRows ROWS FETCH NEXT @PageSize ROWS ONLY;
    
    -- Limpiar tabla temporal
    DROP TABLE #TempInventario;
END
GO

-- Procedimiento para reportes de asignaciones por destino
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_Report_AssignmentsByDestination')
    DROP PROCEDURE dbo.sp_Report_AssignmentsByDestination
GO

CREATE PROCEDURE dbo.sp_Report_AssignmentsByDestination
    @TipoDestino NVARCHAR(20) = NULL, -- 'Empleado', 'Sector', 'Sucursal', NULL para todos
    @DestinoID INT = NULL,            -- ID específico del destino, NULL para todos
    @Estado NVARCHAR(20) = NULL,      -- Estado de asignación, NULL para todos
    @FechaDesde DATE = NULL,          -- Fecha de asignación desde, NULL para todas
    @FechaHasta DATE = NULL,          -- Fecha de asignación hasta, NULL para todas
    @PageNumber INT = 1,
    @PageSize INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @SkipRows INT = (@PageNumber - 1) * @PageSize;
    DECLARE @TotalRows INT;
    
    -- Contar total de filas para paginación
    SELECT @TotalRows = COUNT(*)
    FROM Asignaciones a
    WHERE 
        (@TipoDestino IS NULL OR a.tipo_asignacion = @TipoDestino)
        AND (@DestinoID IS NULL OR 
            (a.tipo_asignacion = 'Empleado' AND a.empleado_id = @DestinoID) OR
            (a.tipo_asignacion = 'Sector' AND a.sector_id = @DestinoID) OR
            (a.tipo_asignacion = 'Sucursal' AND a.sucursal_id = @DestinoID)
        )
        AND (@Estado IS NULL OR a.estado = @Estado)
        AND (@FechaDesde IS NULL OR a.fecha_asignacion >= @FechaDesde)
        AND (@FechaHasta IS NULL OR a.fecha_asignacion <= @FechaHasta);
    
    -- Obtener resultados paginados
    SELECT 
        a.id AS AsignacionID,
        a.tipo_asignacion AS TipoDestino,
        
        -- Información de destino
        CASE 
            WHEN a.tipo_asignacion = 'Empleado' THEN e.nombre + ' ' + e.apellido
            WHEN a.tipo_asignacion = 'Sector' THEN s.nombre
            WHEN a.tipo_asignacion = 'Sucursal' THEN suc.nombre
            ELSE 'Desconocido'
        END AS DestinoNombre,
        
        -- ID de destino
        CASE 
            WHEN a.tipo_asignacion = 'Empleado' THEN a.empleado_id
            WHEN a.tipo_asignacion = 'Sector' THEN a.sector_id
            WHEN a.tipo_asignacion = 'Sucursal' THEN a.sucursal_id
            ELSE NULL
        END AS DestinoID,
        
        -- Información de ítem
        CASE 
            WHEN a.inventario_id IS NOT NULL THEN 'Individual'
            ELSE 'General'
        END AS TipoInventario,
        
        CASE 
            WHEN a.inventario_id IS NOT NULL THEN ii.numero_serie
            ELSE NULL
        END AS NumeroSerie,
        
        p.id AS ProductoID,
        p.nombre AS ProductoNombre,
        
        CASE 
            WHEN a.inventario_id IS NULL THEN a.cantidad
            ELSE 1
        END AS Cantidad,
        
        a.fecha_asignacion,
        a.fecha_devolucion,
        a.estado,
        u_asigna.nombre AS UsuarioAsigna,
        u_recibe.nombre AS UsuarioRecibe,
        @TotalRows AS TotalRows
    FROM 
        Asignaciones a
        LEFT JOIN InventarioIndividual ii ON a.inventario_id = ii.id
        LEFT JOIN Productos p ON (a.inventario_id IS NOT NULL AND ii.producto_id = p.id) OR (a.producto_id = p.id)
        LEFT JOIN Empleados e ON a.empleado_id = e.id
        LEFT JOIN Sectores s ON a.sector_id = s.id
        LEFT JOIN Sucursales suc ON a.sucursal_id = suc.id
        LEFT JOIN Usuarios u_asigna ON a.usuario_asigna_id = u_asigna.id
        LEFT JOIN Usuarios u_recibe ON a.usuario_recibe_id = u_recibe.id
    WHERE 
        (@TipoDestino IS NULL OR a.tipo_asignacion = @TipoDestino)
        AND (@DestinoID IS NULL OR 
            (a.tipo_asignacion = 'Empleado' AND a.empleado_id = @DestinoID) OR
            (a.tipo_asignacion = 'Sector' AND a.sector_id = @DestinoID) OR
            (a.tipo_asignacion = 'Sucursal' AND a.sucursal_id = @DestinoID)
        )
        AND (@Estado IS NULL OR a.estado = @Estado)
        AND (@FechaDesde IS NULL OR a.fecha_asignacion >= @FechaDesde)
        AND (@FechaHasta IS NULL OR a.fecha_asignacion <= @FechaHasta)
    ORDER BY 
        a.fecha_asignacion DESC
    OFFSET @SkipRows ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO

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
        ProductoNombre NVARCHAR(100),
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
            ProductoID, ProductoNombre, CategoriaID, CategoriaNombre, 
            StockActual, StockMinimo, Deficit, UltimaActualizacion, TipoAlerta
        )
        SELECT 
            p.id,
            p.nombre,
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
            ProductoID, ProductoNombre, CategoriaID, CategoriaNombre, 
            StockActual, StockMinimo, Deficit, UltimaActualizacion, TipoAlerta
        )
        SELECT 
            p.id,
            p.nombre,
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
            sg.fecha_ultima_actualizacion,
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
        ProductoNombre,
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
