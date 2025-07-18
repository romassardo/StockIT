-- =============================================
-- Description: Obtiene el historial de reparaciones para un ítem de inventario específico.
-- =============================================
DROP PROCEDURE IF EXISTS sp_Repair_GetByInventarioId;

DELIMITER //

CREATE PROCEDURE sp_Repair_GetByInventarioId(
    IN p_inventario_individual_id INT
)
BEGIN
    SELECT
        Rep.id AS reparacion_id,
        Rep.inventario_individual_id,
        InvInd.numero_serie,
        Prod.modelo AS producto_modelo,
        Cat.nombre AS producto_categoria,
        Rep.fecha_envio,
        Rep.fecha_retorno,
        Rep.proveedor,
        Rep.problema_descripcion,
        Rep.solucion_descripcion,
        Rep.estado AS estado_reparacion,
        Rep.usuario_envia_id,
        UsrEnv.nombre AS usuario_envia_nombre,
        Rep.usuario_recibe_id,
        UsrRec.nombre AS usuario_recibe_nombre,
        Rep.fecha_creacion,
        Rep.fecha_modificacion
    FROM
        Reparaciones AS Rep
    INNER JOIN
        InventarioIndividual AS InvInd ON Rep.inventario_individual_id = InvInd.id
    INNER JOIN
        Productos AS Prod ON InvInd.producto_id = Prod.id
    INNER JOIN
        Categorias AS Cat ON Prod.categoria_id = Cat.id
    LEFT JOIN
        Usuarios AS UsrEnv ON Rep.usuario_envia_id = UsrEnv.id
    LEFT JOIN
        Usuarios AS UsrRec ON Rep.usuario_recibe_id = UsrRec.id
    WHERE
        Rep.inventario_individual_id = p_inventario_individual_id
    ORDER BY
        Rep.fecha_envio DESC;
END //

DELIMITER ; 