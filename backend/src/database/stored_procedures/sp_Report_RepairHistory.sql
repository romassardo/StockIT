-- =============================================
-- Stored Procedure: sp_Report_RepairHistory
-- Descripción: Reporte completo de historia de reparaciones con paginación y filtros
-- Autor: Sistema StockIT
-- Fecha: 2025-01-09
-- =============================================

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_Report_RepairHistory')
    DROP PROCEDURE dbo.sp_Report_RepairHistory
GO

CREATE PROCEDURE dbo.sp_Report_RepairHistory
    @FechaDesde DATE = NULL,
    @FechaHasta DATE = NULL,
    @Estado NVARCHAR(20) = NULL,
    @Proveedor NVARCHAR(100) = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validar parámetros
    IF @PageNumber < 1 SET @PageNumber = 1;
    IF @PageSize < 1 OR @PageSize > 100 SET @PageSize = 20;
    
    -- Calcular offset
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    
    -- Query principal con filtros y paginación
    WITH RepairHistoryCTE AS (
        SELECT 
            r.id AS reparacion_id,
            ii.numero_serie,
            p.marca,
            p.modelo,
            c.nombre AS categoria,
            r.fecha_envio,
            r.fecha_retorno,
            r.proveedor,
            r.problema_descripcion,
            r.solucion_descripcion,
            r.estado,
            u_envia.nombre + ' ' + u_envia.apellido AS usuario_envia,
            CASE 
                WHEN u_recibe.nombre IS NOT NULL 
                THEN u_recibe.nombre + ' ' + u_recibe.apellido 
                ELSE NULL 
            END AS usuario_recibe,
            CASE 
                WHEN r.fecha_retorno IS NOT NULL 
                THEN DATEDIFF(day, r.fecha_envio, r.fecha_retorno)
                ELSE DATEDIFF(day, r.fecha_envio, GETDATE())
            END AS dias_reparacion,
            -- Conteo total para paginación
            COUNT(*) OVER() AS TotalRows
        FROM 
            Reparaciones r
            INNER JOIN InventarioIndividual ii ON r.inventario_individual_id = ii.id
            INNER JOIN Productos p ON ii.producto_id = p.id
            INNER JOIN Categorias c ON p.categoria_id = c.id
            INNER JOIN Usuarios u_envia ON r.usuario_envia_id = u_envia.id
            LEFT JOIN Usuarios u_recibe ON r.usuario_recibe_id = u_recibe.id
        WHERE 
            (@FechaDesde IS NULL OR r.fecha_envio >= @FechaDesde)
            AND (@FechaHasta IS NULL OR r.fecha_envio <= @FechaHasta)
            AND (@Estado IS NULL OR r.estado = @Estado)
            AND (@Proveedor IS NULL OR r.proveedor LIKE '%' + @Proveedor + '%')
    )
    SELECT 
        reparacion_id,
        numero_serie,
        marca,
        modelo,
        categoria,
        fecha_envio,
        fecha_retorno,
        proveedor,
        problema_descripcion,
        solucion_descripcion,
        estado,
        usuario_envia,
        usuario_recibe,
        dias_reparacion,
        TotalRows
    FROM RepairHistoryCTE
    ORDER BY fecha_envio DESC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END
GO

-- Conceder permisos
GRANT EXECUTE ON dbo.sp_Report_RepairHistory TO [public];
GO

PRINT 'Stored procedure sp_Report_RepairHistory creado exitosamente';