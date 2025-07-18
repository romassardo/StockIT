CREATE PROCEDURE dbo.sp_LogsActividad_GetByInventarioId
    @inventario_id INT
AS
BEGIN
    SET NOCOUNT ON;

    -- La tabla LogsActividad no tiene una referencia directa a InventarioIndividual.
    -- La relación se hace a través del registro_id y la tabla_afectada.
    -- Buscamos logs donde el registro_id coincida con el id del item de inventario,
    -- o donde coincida con el id de una asignación o reparación de ese item.

    SELECT 
        l.id,
        l.usuario_id,
        l.tabla_afectada,
        l.accion,
        l.registro_id,
        l.descripcion,
        l.fecha_hora,
        u.nombre AS nombre_usuario
    FROM 
        dbo.LogsActividad l
    LEFT JOIN
        dbo.Usuarios u ON l.usuario_id = u.id
    WHERE
        -- Logs directos sobre el item de inventario
        (l.tabla_afectada = 'InventarioIndividual' AND l.registro_id = @inventario_id)
    OR
        -- Logs de asignaciones de este item
        (l.tabla_afectada = 'Asignaciones' AND l.registro_id IN (SELECT id FROM dbo.Asignaciones WHERE inventario_individual_id = @inventario_id))
    OR
        -- Logs de reparaciones de este item
        (l.tabla_afectada = 'Reparaciones' AND l.registro_id IN (SELECT id FROM dbo.Reparaciones WHERE inventario_individual_id = @inventario_id))
    ORDER BY
        l.fecha_hora DESC;
END
