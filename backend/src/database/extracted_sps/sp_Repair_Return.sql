
-- Ahora, creamos el procedimiento con la corrección
CREATE PROCEDURE dbo.sp_Repair_Return
    @reparacion_id INT,
    @solucion_descripcion VARCHAR(MAX), -- CORRECCIÓN: Cambiado de TEXT a VARCHAR(MAX)
    @estado_final_reparacion VARCHAR(20), -- 'Reparado' o 'Sin Reparación'
    @usuario_recibe_id INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON; -- Asegura que la transacción se revierta si hay un error

    -- Validaciones de entrada
    IF @reparacion_id IS NULL OR @usuario_recibe_id IS NULL
    BEGIN
        RAISERROR('ID de reparación y de usuario no pueden ser nulos.', 16, 1);
        RETURN;
    END

    IF @estado_final_reparacion NOT IN ('Reparado', 'Sin Reparación')
    BEGIN
        RAISERROR('El estado final de la reparación debe ser "Reparado" o "Sin Reparación".', 16, 1);
        RETURN;
    END

    DECLARE @inventario_id INT;
    DECLARE @estado_actual_reparacion VARCHAR(20);
    DECLARE @estado_final_inventario VARCHAR(20);
    DECLARE @log_descripcion VARCHAR(MAX);

    BEGIN TRY
        -- Obtener datos de la reparación y bloquear la fila para evitar concurrencia
        SELECT 
            @inventario_id = inventario_individual_id,
            @estado_actual_reparacion = estado
        FROM dbo.Reparaciones WITH (UPDLOCK, HOLDLOCK)
        WHERE id = @reparacion_id;

        IF @inventario_id IS NULL
        BEGIN
            RAISERROR('La reparación especificada no existe.', 16, 1);
            RETURN;
        END

        IF @estado_actual_reparacion <> 'En Reparación'
        BEGIN
            RAISERROR('Esta reparación no está actualmente activa. Ya ha sido procesada.', 16, 1);
            RETURN;
        END

        BEGIN TRANSACTION;

        -- 1. Actualizar la tabla de Reparaciones
        UPDATE dbo.Reparaciones
        SET 
            fecha_retorno = GETDATE(),
            solucion_descripcion = @solucion_descripcion,
            estado = @estado_final_reparacion,
            usuario_recibe_id = @usuario_recibe_id
        WHERE 
            id = @reparacion_id;

        -- 2. Determinar y actualizar el estado del item en InventarioIndividual
        IF @estado_final_reparacion = 'Reparado'
        BEGIN
            SET @estado_final_inventario = 'Disponible';
        END
        ELSE -- 'Sin Reparación'
        BEGIN
            SET @estado_final_inventario = 'Dado de Baja';
        END

        UPDATE dbo.InventarioIndividual
        SET 
            estado = @estado_final_inventario,
            -- Si se da de baja, registrar el motivo y la fecha
            motivo_baja = CASE WHEN @estado_final_inventario = 'Dado de Baja' THEN @solucion_descripcion ELSE motivo_baja END,
            fecha_baja = CASE WHEN @estado_final_inventario = 'Dado de Baja' THEN GETDATE() ELSE fecha_baja END,
            usuario_baja_id = CASE WHEN @estado_final_inventario = 'Dado de Baja' THEN @usuario_recibe_id ELSE usuario_baja_id END
        WHERE 
            id = @inventario_id;

        -- 3. Registrar en el Log de Actividad
        SET @log_descripcion = FORMATMESSAGE('{"accion": "Retorno de Reparación", "reparacion_id": %d, "estado_reparacion": "%s", "estado_inventario": "%s", "solucion": "%s"}', 
                                              @reparacion_id, @estado_final_reparacion, @estado_final_inventario, @solucion_descripcion);

        INSERT INTO dbo.LogsActividad (usuario_id, tabla_afectada, accion, registro_id, descripcion)
        VALUES (@usuario_recibe_id, 'Reparaciones', 'Retorno', @reparacion_id, @log_descripcion);

        COMMIT TRANSACTION;

        -- Devolver el item actualizado para confirmación
        SELECT * FROM dbo.InventarioIndividual WHERE id = @inventario_id;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        -- Re-lanzar el error para que sea capturado por el controlador del backend
        THROW;
    END CATCH
END
