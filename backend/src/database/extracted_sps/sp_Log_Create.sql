
CREATE PROCEDURE dbo.sp_Log_Create
    @UsuarioId INT = NULL,
    @TablaAfectada VARCHAR(100) = NULL,
    @Operacion VARCHAR(50), -- Parámetro de entrada, coincide con el backend
    @RegistroId INT = NULL,
    @Descripcion TEXT = NULL,
    @IpAddress VARCHAR(45) = NULL,
    @UserAgent VARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        INSERT INTO dbo.LogsActividad (
            usuario_id,
            tabla_afectada,
            accion, -- Columna en la tabla LogsActividad
            registro_id,
            descripcion,
            ip_address,
            user_agent
            -- fecha_operacion usará su valor DEFAULT GETDATE()
        )
        VALUES (
            @UsuarioId,
            @TablaAfectada,
            @Operacion, -- Valor del parámetro @Operacion que se inserta en la columna 'accion'
            @RegistroId,
            @Descripcion,
            @IpAddress,
            @UserAgent
        );
    END TRY
    BEGIN CATCH
        -- En un sistema de producción, aquí se podría loggear el error a una tabla diferente
        -- o usar RAISERROR para notificar. Por simplicidad, solo imprimimos.
        PRINT 'Error en sp_Log_Create: ' + ERROR_MESSAGE();
        -- Considerar si se debe relanzar el error o no, dependiendo de la criticidad.
        -- Por ahora, no se relanza para no afectar la operación principal que llamó al log.
    END CATCH
END
