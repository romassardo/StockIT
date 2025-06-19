-- Añade campos IMEI 1 y 2 al procedimiento almacenado de detalles de asignación
IF OBJECT_ID('dbo.sp_Assignment_GetDetailsById', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_Assignment_GetDetailsById;
GO

CREATE PROCEDURE dbo.sp_Assignment_GetDetailsById
    @assignment_id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        A.id AS asignacion_id,
        A.fecha_asignacion,
        A.fecha_devolucion,
        A.observaciones AS asignacion_observaciones,
        A.password_encriptacion,
        A.cuenta_gmail,
        A.password_gmail,
        A.numero_telefono,
        A.codigo_2fa_whatsapp,
        A.imei_1,
        A.imei_2,
        A.activa AS asignacion_activa,
        II.id AS inventario_id,
        II.numero_serie,
        II.estado AS inventario_estado,
        P.id AS producto_id,
        P.marca AS producto_marca,
        P.modelo AS producto_modelo,
        P.descripcion AS producto_descripcion,
        C.id AS categoria_id,
        C.nombre AS categoria_nombre,
        E.id AS empleado_id,
        E.nombre AS empleado_nombre,
        E.apellido AS empleado_apellido,
        S.id AS sector_id,
        S.nombre AS sector_nombre,
        SU.id AS sucursal_id,
        SU.nombre AS sucursal_nombre,
        UA.nombre AS usuario_asigna_nombre,
        UR.nombre AS usuario_recibe_nombre
    FROM Asignaciones A
    JOIN InventarioIndividual II ON A.inventario_individual_id = II.id
    JOIN Productos P ON II.producto_id = P.id
    JOIN Categorias C ON P.categoria_id = C.id
    LEFT JOIN Empleados E ON A.empleado_id = E.id
    LEFT JOIN Sectores S ON A.sector_id = S.id
    LEFT JOIN Sucursales SU ON A.sucursal_id = SU.id
    JOIN Usuarios UA ON A.usuario_asigna_id = UA.id
    LEFT JOIN Usuarios UR ON A.usuario_recibe_id = UR.id
    WHERE A.id = @assignment_id;
END
GO
