/*
Migración para agregar el Stored Procedure sp_Report_AssignmentsByDestination
Fecha: 30/05/2025
*/

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
        p.marca AS ProductoMarca,
        p.descripcion AS ProductoModelo,
        
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
