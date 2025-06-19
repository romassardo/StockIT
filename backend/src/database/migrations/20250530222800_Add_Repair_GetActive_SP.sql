/*
Migración para agregar el Stored Procedure sp_Repair_GetActive
Fecha: 30/05/2025
*/

-- Procedimiento para obtener reparaciones activas
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_Repair_GetActive')
    DROP PROCEDURE dbo.sp_Repair_GetActive
GO

CREATE PROCEDURE dbo.sp_Repair_GetActive
    @Proveedor NVARCHAR(100) = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    
    SELECT 
        r.id AS reparacion_id,
        ii.numero_serie,
        p.id AS producto_id,
        p.marca AS producto_marca,
        p.descripcion AS producto_modelo,
        c.nombre AS producto_categoria,
        r.fecha_envio,
        r.proveedor,
        r.problema_descripcion,
        r.estado,
        u_envia.nombre AS usuario_envia_nombre,
        r.usuario_envia_id,
        DATEDIFF(day, r.fecha_envio, GETDATE()) AS dias_en_reparacion,
        COUNT(*) OVER() AS TotalRows
    FROM 
        Reparaciones r
        INNER JOIN InventarioIndividual ii ON r.inventario_individual_id = ii.id
        INNER JOIN Productos p ON ii.producto_id = p.id
        INNER JOIN Categorias c ON p.categoria_id = c.id
        INNER JOIN Usuarios u_envia ON r.usuario_envia_id = u_envia.id
    WHERE 
        r.estado = 'Enviado'
        AND (@Proveedor IS NULL OR r.proveedor LIKE '%' + @Proveedor + '%')
    ORDER BY 
        r.fecha_envio DESC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END
GO
