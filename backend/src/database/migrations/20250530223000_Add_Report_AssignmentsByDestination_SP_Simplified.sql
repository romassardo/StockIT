/*
Migración para agregar el Stored Procedure sp_Report_AssignmentsByDestination (Versión simplificada)
Fecha: 30/05/2025
*/

-- Procedimiento para reportes de asignaciones por destino
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_Report_AssignmentsByDestination')
    DROP PROCEDURE dbo.sp_Report_AssignmentsByDestination
GO

CREATE PROCEDURE dbo.sp_Report_AssignmentsByDestination
    @TipoDestino NVARCHAR(20) = NULL, -- 'Empleado', 'Sector', 'Sucursal', NULL para todos
    @DestinoID INT = NULL,            -- ID específico del destino, NULL para todos
    @Activa BIT = NULL,               -- 1 para asignaciones activas, 0 para inactivas, NULL para todas
    @FechaDesde DATE = NULL,          -- Fecha de asignación desde, NULL para todas
    @FechaHasta DATE = NULL,          -- Fecha de asignación hasta, NULL para todas
    @PageNumber INT = 1,
    @PageSize INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @SkipRows INT = (@PageNumber - 1) * @PageSize;
    DECLARE @TotalRows INT;
    
    -- Crear tabla temporal para unificar los resultados con el tipo de destino determinado
    CREATE TABLE #TempAsignaciones (
        AsignacionID INT,
        TipoDestino NVARCHAR(20),
        DestinoID INT,
        DestinoNombre NVARCHAR(200),
        InventarioID INT,
        NumeroSerie NVARCHAR(100),
        ProductoID INT,
        ProductoMarca NVARCHAR(100),
        ProductoModelo NVARCHAR(100),
        FechaAsignacion DATETIME,
        FechaDevolucion DATETIME,
        Activa BIT,
        UsuarioAsigna NVARCHAR(100),
        UsuarioRecibe NVARCHAR(100)
    );
    
    -- Insertar asignaciones a empleados
    IF @TipoDestino IS NULL OR @TipoDestino = 'Empleado'
    BEGIN
        INSERT INTO #TempAsignaciones (
            AsignacionID, TipoDestino, DestinoID, DestinoNombre,
            InventarioID, NumeroSerie, ProductoID, ProductoMarca, ProductoModelo,
            FechaAsignacion, FechaDevolucion, Activa, UsuarioAsigna, UsuarioRecibe
        )
        SELECT 
            a.id,
            'Empleado',
            a.empleado_id,
            e.nombre + ' ' + e.apellido,
            a.inventario_individual_id,
            ii.numero_serie,
            p.id,
            p.marca,
            p.descripcion,
            a.fecha_asignacion,
            a.fecha_devolucion,
            a.activa,
            u_asigna.nombre,
            u_recibe.nombre
        FROM 
            Asignaciones a
            INNER JOIN Empleados e ON a.empleado_id = e.id
            INNER JOIN InventarioIndividual ii ON a.inventario_individual_id = ii.id
            INNER JOIN Productos p ON ii.producto_id = p.id
            INNER JOIN Usuarios u_asigna ON a.usuario_asigna_id = u_asigna.id
            LEFT JOIN Usuarios u_recibe ON a.usuario_recibe_id = u_recibe.id
        WHERE 
            a.empleado_id IS NOT NULL
            AND (@DestinoID IS NULL OR a.empleado_id = @DestinoID)
            AND (@Activa IS NULL OR a.activa = @Activa)
            AND (@FechaDesde IS NULL OR a.fecha_asignacion >= @FechaDesde)
            AND (@FechaHasta IS NULL OR a.fecha_asignacion <= @FechaHasta);
    END
    
    -- Insertar asignaciones a sectores
    IF @TipoDestino IS NULL OR @TipoDestino = 'Sector'
    BEGIN
        INSERT INTO #TempAsignaciones (
            AsignacionID, TipoDestino, DestinoID, DestinoNombre,
            InventarioID, NumeroSerie, ProductoID, ProductoMarca, ProductoModelo,
            FechaAsignacion, FechaDevolucion, Activa, UsuarioAsigna, UsuarioRecibe
        )
        SELECT 
            a.id,
            'Sector',
            a.sector_id,
            s.nombre,
            a.inventario_individual_id,
            ii.numero_serie,
            p.id,
            p.marca,
            p.descripcion,
            a.fecha_asignacion,
            a.fecha_devolucion,
            a.activa,
            u_asigna.nombre,
            u_recibe.nombre
        FROM 
            Asignaciones a
            INNER JOIN Sectores s ON a.sector_id = s.id
            INNER JOIN InventarioIndividual ii ON a.inventario_individual_id = ii.id
            INNER JOIN Productos p ON ii.producto_id = p.id
            INNER JOIN Usuarios u_asigna ON a.usuario_asigna_id = u_asigna.id
            LEFT JOIN Usuarios u_recibe ON a.usuario_recibe_id = u_recibe.id
        WHERE 
            a.sector_id IS NOT NULL
            AND (@DestinoID IS NULL OR a.sector_id = @DestinoID)
            AND (@Activa IS NULL OR a.activa = @Activa)
            AND (@FechaDesde IS NULL OR a.fecha_asignacion >= @FechaDesde)
            AND (@FechaHasta IS NULL OR a.fecha_asignacion <= @FechaHasta);
    END
    
    -- Insertar asignaciones a sucursales
    IF @TipoDestino IS NULL OR @TipoDestino = 'Sucursal'
    BEGIN
        INSERT INTO #TempAsignaciones (
            AsignacionID, TipoDestino, DestinoID, DestinoNombre,
            InventarioID, NumeroSerie, ProductoID, ProductoMarca, ProductoModelo,
            FechaAsignacion, FechaDevolucion, Activa, UsuarioAsigna, UsuarioRecibe
        )
        SELECT 
            a.id,
            'Sucursal',
            a.sucursal_id,
            suc.nombre,
            a.inventario_individual_id,
            ii.numero_serie,
            p.id,
            p.marca,
            p.descripcion,
            a.fecha_asignacion,
            a.fecha_devolucion,
            a.activa,
            u_asigna.nombre,
            u_recibe.nombre
        FROM 
            Asignaciones a
            INNER JOIN Sucursales suc ON a.sucursal_id = suc.id
            INNER JOIN InventarioIndividual ii ON a.inventario_individual_id = ii.id
            INNER JOIN Productos p ON ii.producto_id = p.id
            INNER JOIN Usuarios u_asigna ON a.usuario_asigna_id = u_asigna.id
            LEFT JOIN Usuarios u_recibe ON a.usuario_recibe_id = u_recibe.id
        WHERE 
            a.sucursal_id IS NOT NULL
            AND (@DestinoID IS NULL OR a.sucursal_id = @DestinoID)
            AND (@Activa IS NULL OR a.activa = @Activa)
            AND (@FechaDesde IS NULL OR a.fecha_asignacion >= @FechaDesde)
            AND (@FechaHasta IS NULL OR a.fecha_asignacion <= @FechaHasta);
    END
    
    -- Obtener total de filas para paginación
    SELECT @TotalRows = COUNT(*) FROM #TempAsignaciones;
    
    -- Devolver resultados paginados
    SELECT 
        AsignacionID,
        TipoDestino,
        DestinoID,
        DestinoNombre,
        InventarioID,
        NumeroSerie,
        ProductoID,
        ProductoMarca,
        ProductoModelo,
        FechaAsignacion,
        FechaDevolucion,
        Activa,
        UsuarioAsigna,
        UsuarioRecibe,
        @TotalRows AS TotalRows
    FROM 
        #TempAsignaciones
    ORDER BY 
        FechaAsignacion DESC
    OFFSET @SkipRows ROWS FETCH NEXT @PageSize ROWS ONLY;
    
    -- Limpiar tabla temporal
    DROP TABLE #TempAsignaciones;
END
GO
