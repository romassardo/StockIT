-- =============================================
-- Description: Obtiene el historial de asignaciones para un ítem de inventario específico.
-- =============================================
DROP PROCEDURE IF EXISTS sp_Asignaciones_GetByInventarioId;

DELIMITER //

CREATE PROCEDURE sp_Asignaciones_GetByInventarioId(
    IN p_inventario_individual_id INT
)
BEGIN
    SELECT
        Asig.id AS asignacion_id,
        Asig.inventario_individual_id,
        InvInd.numero_serie,
        Prod.modelo AS producto_modelo,
        Cat.nombre AS producto_categoria,
        Asig.empleado_id,
        CONCAT(Emp.nombre, ' ', Emp.apellido) AS empleado_nombre,
        Asig.sector_id,
        Sec.nombre AS sector_nombre,
        Asig.sucursal_id,
        Suc.nombre AS sucursal_nombre,
        Asig.fecha_asignacion,
        Asig.fecha_devolucion,
        Asig.usuario_asigna_id,
        UsrAsig.nombre AS usuario_asigna_nombre,
        Asig.usuario_recibe_id,
        UsrRec.nombre AS usuario_recibe_nombre,
        Asig.observaciones,
        Asig.password_encriptacion,
        Asig.numero_telefono,
        Asig.cuenta_gmail,
        Asig.password_gmail,
        Asig.codigo_2fa_whatsapp
    FROM
        Asignaciones AS Asig
    INNER JOIN
        InventarioIndividual AS InvInd ON Asig.inventario_individual_id = InvInd.id
    INNER JOIN
        Productos AS Prod ON InvInd.producto_id = Prod.id
    INNER JOIN
        Categorias AS Cat ON Prod.categoria_id = Cat.id
    LEFT JOIN
        Empleados AS Emp ON Asig.empleado_id = Emp.id
    LEFT JOIN
        Sectores AS Sec ON Asig.sector_id = Sec.id
    LEFT JOIN
        Sucursales AS Suc ON Asig.sucursal_id = Suc.id
    LEFT JOIN
        Usuarios AS UsrAsig ON Asig.usuario_asigna_id = UsrAsig.id
    LEFT JOIN
        Usuarios AS UsrRec ON Asig.usuario_recibe_id = UsrRec.id
    WHERE
        Asig.inventario_individual_id = p_inventario_individual_id
    ORDER BY
        Asig.fecha_asignacion DESC;
END //

DELIMITER ; 