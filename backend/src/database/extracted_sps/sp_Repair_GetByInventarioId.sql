CREATE PROCEDURE dbo.sp_Repair_GetByInventarioId
    @InventarioId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        r.id AS reparacion_id,
        r.fecha_envio,
        r.fecha_retorno,
        r.problema_descripcion,
        r.solucion_descripcion,
        r.estado,
        r.proveedor,
        u_envia.nombre AS usuario_envia,
        u_recibe.nombre AS usuario_recibe,
        DATEDIFF(day, r.fecha_envio, ISNULL(r.fecha_retorno, GETDATE())) AS dias_reparacion
    FROM 
        Reparaciones r
        INNER JOIN Usuarios u_envia ON r.usuario_envia_id = u_envia.id
        LEFT JOIN Usuarios u_recibe ON r.usuario_recibe_id = u_recibe.id
    WHERE 
        r.inventario_individual_id = @InventarioId
    ORDER BY 
        r.fecha_envio DESC;
END