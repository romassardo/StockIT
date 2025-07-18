CREATE PROCEDURE dbo.sp_Repair_Create
    @inventario_individual_id INT,
    @descripcion_problema NVARCHAR(MAX),
    @usuario_envia_id INT,
    @proveedor NVARCHAR(100) = NULL, -- Mantenemos el parámetro como opcional a nivel de SP, pero el form lo hará obligatorio
    @NuevaReparacionID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @producto_id INT;
    DECLARE @estado_actual NVARCHAR(20);

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Verificar que el ítem de inventario existe
        SELECT
            @producto_id = ii.producto_id,
            @estado_actual = ii.estado
        FROM
            InventarioIndividual ii
        WHERE
            ii.id = @inventario_individual_id;

        IF @producto_id IS NULL
        BEGIN
            RAISERROR('El ítem de inventario especificado no existe.', 16, 1);
            IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Verificar que el estado actual permite enviar a reparación (CAMBIO AQUÍ)
        IF @estado_actual NOT IN ('Disponible', 'Asignado') -- MODIFICADO
        BEGIN
            RAISERROR('El ítem debe estar en estado "Disponible" o "Asignado" para enviarlo a reparación.', 16, 1); -- MENSAJE MODIFICADO
            IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Crear registro de reparación
        INSERT INTO dbo.Reparaciones (
            inventario_individual_id,
            fecha_envio,
            problema_descripcion,
            proveedor,
            estado, -- CAMBIO AQUÍ
            usuario_envia_id,
            fecha_creacion -- Asumo que esta columna existe, como en el SP original
        )
        VALUES (
            @inventario_individual_id,
            GETDATE(), -- Fecha de envío automática
            @descripcion_problema,
            @proveedor,
            'En Reparación', -- ESTADO MODIFICADO
            @usuario_envia_id,
            GETDATE() -- Fecha de creación automática
        );

        -- Obtener el ID de la reparación creada
        SET @NuevaReparacionID = SCOPE_IDENTITY();

        -- Actualizar estado del inventario
        UPDATE InventarioIndividual
        SET
            estado = 'En Reparación', -- El estado del activo también cambia a 'En Reparación'
            fecha_modificacion = GETDATE()
        WHERE
            id = @inventario_individual_id;

        -- Registrar la actividad
        INSERT INTO dbo.LogsActividad (
            usuario_id,
            tabla_afectada,
            accion,
            registro_id,
            descripcion
        )
        VALUES (
            @usuario_envia_id,
            'Reparaciones',
            'INSERT',
            @NuevaReparacionID,
            CONCAT('{"accion":"Envío a Reparación", "inventario_id":', @inventario_individual_id, ',"problema":"', @descripcion_problema, '","proveedor":"', ISNULL(@proveedor, 'N/A'), '"}') -- Descripción del log mejorada
        );

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        -- Re-lanzar el error original para que sea manejado por el cliente
        THROW;
    END CATCH
END
