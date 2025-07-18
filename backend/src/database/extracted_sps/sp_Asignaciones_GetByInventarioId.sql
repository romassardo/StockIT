
CREATE PROCEDURE dbo.sp_Asignaciones_GetByInventarioId
    @inventario_individual_id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        Asig.id AS asignacion_id,
        Asig.inventario_individual_id,
        InvInd.numero_serie, -- Útil para referencia
        Prod.modelo AS producto_modelo,
        Cat.nombre AS producto_categoria,
        Asig.empleado_id,
        Emp.nombre AS empleado_nombre,
        Emp.apellido AS empleado_apellido,
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
        -- Campos específicos
        Asig.password_encriptacion,
        Asig.numero_telefono,
        Asig.cuenta_gmail,
        Asig.password_gmail,
        Asig.codigo_2fa_whatsapp
    FROM
        dbo.Asignaciones AS Asig
    INNER JOIN
        dbo.InventarioIndividual AS InvInd ON Asig.inventario_individual_id = InvInd.id
    INNER JOIN
        dbo.Productos AS Prod ON InvInd.producto_id = Prod.id
    INNER JOIN
        dbo.Categorias AS Cat ON Prod.categoria_id = Cat.id
    LEFT JOIN
        dbo.Empleados AS Emp ON Asig.empleado_id = Emp.id
    LEFT JOIN
        dbo.Sectores AS Sec ON Asig.sector_id = Sec.id
    LEFT JOIN
        dbo.Sucursales AS Suc ON Asig.sucursal_id = Suc.id
    LEFT JOIN
        dbo.Usuarios AS UsrAsig ON Asig.usuario_asigna_id = UsrAsig.id
    LEFT JOIN
        dbo.Usuarios AS UsrRec ON Asig.usuario_recibe_id = UsrRec.id -- Usualmente es el usuario que registra la devolución
    WHERE
        Asig.inventario_individual_id = @inventario_individual_id
    ORDER BY
        Asig.fecha_asignacion DESC; -- Mostrar el historial más reciente primero
END
