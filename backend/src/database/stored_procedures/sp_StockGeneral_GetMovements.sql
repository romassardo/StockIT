-- =============================================
-- Author:      StockIT Dev Team
-- Create date: 27/05/2025
-- Description: Obtener historial de movimientos de stock
-- =============================================
USE StockIT;
GO

-- Verificar si el procedimiento ya existe y eliminarlo
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_StockGeneral_GetMovements')
BEGIN
    DROP PROCEDURE sp_StockGeneral_GetMovements;
    PRINT N'Procedimiento sp_StockGeneral_GetMovements eliminado para su recreación.';
END
GO

CREATE PROCEDURE sp_StockGeneral_GetMovements
    @producto_id INT = NULL,
    @tipo_movimiento NVARCHAR(20) = NULL,
    @empleado_id INT = NULL,
    @sector_id INT = NULL,
    @sucursal_id INT = NULL,
    @fecha_desde DATE = NULL,
    @fecha_hasta DATE = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 50
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Ajustar fechas para incluir todo el día
    IF @fecha_hasta IS NOT NULL
        SET @fecha_hasta = DATEADD(DAY, 1, @fecha_hasta);
    
    -- Calcular stock anterior y actual para cada movimiento
    SELECT 
        ms.id AS movimiento_id,
        ms.producto_id,
        p.marca AS nombre_marca,
        p.modelo AS nombre_producto,
        c.nombre AS categoria,
        ms.tipo_movimiento,
        ms.cantidad,
        ms.fecha_movimiento,
        ms.motivo,
        ms.observaciones,
        e.nombre + N' ' + e.apellido AS empleado_nombre,
        s.nombre AS sector_nombre,
        su.nombre AS sucursal_nombre,
        u.nombre AS usuario_nombre,
        CASE 
            WHEN ms.tipo_movimiento = 'Entrada' THEN 
                ISNULL((SELECT sg.cantidad_actual FROM StockGeneral sg WHERE sg.producto_id = ms.producto_id), 0) - ms.cantidad
            ELSE -- Salida
                ISNULL((SELECT sg.cantidad_actual FROM StockGeneral sg WHERE sg.producto_id = ms.producto_id), 0) + ms.cantidad
        END AS stock_anterior,
        ISNULL((SELECT sg.cantidad_actual FROM StockGeneral sg WHERE sg.producto_id = ms.producto_id), 0) AS stock_actual,
        CASE 
            WHEN ms.empleado_id IS NOT NULL THEN N'Empleado'
            WHEN ms.sector_id IS NOT NULL THEN N'Sector'
            WHEN ms.sucursal_id IS NOT NULL THEN N'Sucursal'
            ELSE N'Sin destino'
        END AS tipo_destino,
        CASE 
            WHEN ms.empleado_id IS NOT NULL THEN ms.empleado_id
            WHEN ms.sector_id IS NOT NULL THEN ms.sector_id
            WHEN ms.sucursal_id IS NOT NULL THEN ms.sucursal_id
            ELSE NULL
        END AS destino_id
    FROM 
        MovimientosStock ms
        INNER JOIN Productos p ON ms.producto_id = p.id
        INNER JOIN Categorias c ON p.categoria_id = c.id
        INNER JOIN Usuarios u ON ms.usuario_id = u.id
        LEFT JOIN Empleados e ON ms.empleado_id = e.id
        LEFT JOIN Sectores s ON ms.sector_id = s.id
        LEFT JOIN Sucursales su ON ms.sucursal_id = su.id
    WHERE 
        (@producto_id IS NULL OR ms.producto_id = @producto_id)
        AND (@tipo_movimiento IS NULL OR ms.tipo_movimiento = @tipo_movimiento)
        AND (@empleado_id IS NULL OR ms.empleado_id = @empleado_id)
        AND (@sector_id IS NULL OR ms.sector_id = @sector_id)
        AND (@sucursal_id IS NULL OR ms.sucursal_id = @sucursal_id)
        AND (@fecha_desde IS NULL OR ms.fecha_movimiento >= @fecha_desde)
        AND (@fecha_hasta IS NULL OR ms.fecha_movimiento < @fecha_hasta)
    ORDER BY 
        ms.fecha_movimiento DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;
GO

PRINT N'Procedimiento sp_StockGeneral_GetMovements creado exitosamente.';
GO
