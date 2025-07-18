
CREATE PROCEDURE dbo.sp_Reparaciones_GetByInventarioId
    @inventario_individual_id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        Rep.id AS reparacion_id, -- Asumo que la tabla Reparaciones tiene una columna 'id' como PK
        Rep.inventario_individual_id,
        InvInd.numero_serie, 
        Prod.modelo AS producto_modelo,
        Cat.nombre AS producto_categoria,
        Rep.fecha_envio,
        Rep.fecha_retorno,
        Rep.proveedor,
        Rep.problema_descripcion,
        Rep.solucion_descripcion,
        Rep.estado AS estado_reparacion, -- Renombrado para evitar colisión si 'estado' es palabra reservada o confusa
        Rep.usuario_envia_id,
        UsrEnv.nombre AS usuario_envia_nombre,
        Rep.usuario_recibe_id,
        UsrRec.nombre AS usuario_recibe_nombre,
        Rep.fecha_creacion,
        Rep.fecha_modificacion
    FROM
        dbo.Reparaciones AS Rep
    INNER JOIN
        dbo.InventarioIndividual AS InvInd ON Rep.inventario_individual_id = InvInd.id
    INNER JOIN
        dbo.Productos AS Prod ON InvInd.producto_id = Prod.id
    INNER JOIN
        dbo.Categorias AS Cat ON Prod.categoria_id = Cat.id
    LEFT JOIN
        dbo.Usuarios AS UsrEnv ON Rep.usuario_envia_id = UsrEnv.id
    LEFT JOIN
        dbo.Usuarios AS UsrRec ON Rep.usuario_recibe_id = UsrRec.id 
    WHERE
        Rep.inventario_individual_id = @inventario_individual_id
    ORDER BY
        Rep.fecha_envio DESC; -- O Rep.fecha_creacion DESC, según prefieras para el orden
END
