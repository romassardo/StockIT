CREATE OR ALTER PROCEDURE sp_Changelog_Delete
    @id INT,
    @usuario_id INT  -- Usuario que ejecuta la operación
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar que el registro exista
        IF NOT EXISTS (SELECT 1 FROM Changelog WHERE id = @id)
        BEGIN
            THROW 50000, 'El registro de changelog no existe', 1;
            RETURN;
        END
        
        -- Obtener información del registro para el log
        DECLARE @version NVARCHAR(20), @tipo_cambio NVARCHAR(20);
        SELECT 
            @version = version,
            @tipo_cambio = tipo_cambio
        FROM Changelog WHERE id = @id;
        
        -- Eliminar el registro
        DELETE FROM Changelog WHERE id = @id;
        
        -- Registrar la operación en LogsActividad
        INSERT INTO LogsActividad (usuario_id, tabla_afectada, accion, registro_id, descripcion, fecha_hora)
        VALUES (@usuario_id, 'Changelog', 'DELETE', @id, 
                CONCAT('{"version":"', @version, '","tipo_cambio":"', @tipo_cambio, '"}'), GETDATE());
        
        COMMIT TRANSACTION;
        
        -- Confirmar eliminación exitosa
        SELECT 1 AS success;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        THROW;
    END CATCH
END;