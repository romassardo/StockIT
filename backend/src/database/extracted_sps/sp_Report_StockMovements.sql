
CREATE PROCEDURE sp_Report_StockMovements
    @tipo_movimiento NVARCHAR(20) = NULL,
    @fecha_desde DATE = NULL,
    @fecha_hasta DATE = NULL,
    @producto NVARCHAR(100) = NULL,
    @usuario NVARCHAR(100) = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 25
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Ajustar fechas para incluir todo el día
    IF @fecha_hasta IS NOT NULL
        SET @fecha_hasta = DATEADD(DAY, 1, @fecha_hasta);
    
    -- Conteo total para paginación
    DECLARE @TotalRecords INT;
    SELECT @TotalRecords = COUNT(*)
    FROM MovimientosStock ms
        INNER JOIN Productos p ON ms.producto_id = p.id
        INNER JOIN Categorias c ON p.categoria_id = c.id
        INNER JOIN Usuarios u ON ms.usuario_id = u.id
        LEFT JOIN Empleados e ON ms.empleado_id = e.id
        LEFT JOIN Sectores s ON ms.sector_id = s.id
        LEFT JOIN Sucursales su ON ms.sucursal_id = su.id
    WHERE 
        (@tipo_movimiento IS NULL OR ms.tipo_movimiento = @tipo_movimiento)
        AND (@fecha_desde IS NULL OR ms.fecha_movimiento >= @fecha_desde)
        AND (@fecha_hasta IS NULL OR ms.fecha_movimiento < @fecha_hasta)
        AND (@producto IS NULL OR 
             p.marca LIKE '%' + @producto + '%' OR 
             p.modelo LIKE '%' + @producto + '%' OR
             c.nombre LIKE '%' + @producto + '%')
        AND (@usuario IS NULL OR u.nombre LIKE '%' + @usuario + '%');
    
    -- Consulta principal con paginación
    SELECT 
        ms.id AS movimiento_id,
        p.marca + ' ' + p.modelo AS producto,
        c.nombre AS categoria,
        ms.tipo_movimiento,
        ms.cantidad,
        ms.fecha_movimiento,
        ms.motivo,
        ms.observaciones,
        CASE 
            WHEN ms.empleado_id IS NOT NULL THEN e.nombre + ' ' + e.apellido
            WHEN ms.sector_id IS NOT NULL THEN s.nombre
            WHEN ms.sucursal_id IS NOT NULL THEN su.nombre
            ELSE 'Sin destino'
        END AS destino,
        CASE 
            WHEN ms.empleado_id IS NOT NULL THEN 'Empleado'
            WHEN ms.sector_id IS NOT NULL THEN 'Sector'
            WHEN ms.sucursal_id IS NOT NULL THEN 'Sucursal'
            ELSE 'Sin destino'
        END AS tipo_destino,
        u.nombre AS usuario_nombre,
        -- Calcular stock anterior y actual
        CASE 
            WHEN ms.tipo_movimiento = 'Entrada' THEN 
                ISNULL((SELECT sg.cantidad_actual FROM StockGeneral sg WHERE sg.producto_id = ms.producto_id), 0) - ms.cantidad
            ELSE -- Salida
                ISNULL((SELECT sg.cantidad_actual FROM StockGeneral sg WHERE sg.producto_id = ms.producto_id), 0) + ms.cantidad
        END AS stock_anterior,
        ISNULL((SELECT sg.cantidad_actual FROM StockGeneral sg WHERE sg.producto_id = ms.producto_id), 0) AS stock_actual,
        @TotalRecords AS TotalRecords
    FROM 
        MovimientosStock ms
        INNER JOIN Productos p ON ms.producto_id = p.id
        INNER JOIN Categorias c ON p.categoria_id = c.id
        INNER JOIN Usuarios u ON ms.usuario_id = u.id
        LEFT JOIN Empleados e ON ms.empleado_id = e.id
        LEFT JOIN Sectores s ON ms.sector_id = s.id
        LEFT JOIN Sucursales su ON ms.sucursal_id = su.id
    WHERE 
        (@tipo_movimiento IS NULL OR ms.tipo_movimiento = @tipo_movimiento)
        AND (@fecha_desde IS NULL OR ms.fecha_movimiento >= @fecha_desde)
        AND (@fecha_hasta IS NULL OR ms.fecha_movimiento < @fecha_hasta)
        AND (@producto IS NULL OR 
             p.marca LIKE '%' + @producto + '%' OR 
             p.modelo LIKE '%' + @producto + '%' OR
             c.nombre LIKE '%' + @producto + '%')
        AND (@usuario IS NULL OR u.nombre LIKE '%' + @usuario + '%')
    ORDER BY 
        ms.fecha_movimiento DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;
