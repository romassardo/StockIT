CREATE PROCEDURE sp_Changelog_Delete
    @id INT,
    @usuario_id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        IF NOT EXISTS (SELECT 1 FROM Changelog WHERE id = @id)
        BEGIN
            THROW 50000, 'El registro de changelog no existe', 1;
        END
        DECLARE @version NVARCHAR(20), @tipo_cambio NVARCHAR(20);
        SELECT 
            @version = version,
            @tipo_cambio = tipo_cambio
        FROM Changelog WHERE id = @id;
        DELETE FROM Changelog WHERE id = @id;
        INSERT INTO LogsActividad (usuario_id, tabla_afectada, accion, registro_id, descripcion, fecha_hora)
        VALUES (@usuario_id, 'Changelog', 'DELETE', @id, 
                CONCAT('{"version":"', @version, '","tipo_cambio":"', @tipo_cambio, '"}'), GETDATE());
        COMMIT TRANSACTION;
        SELECT 1 AS success;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;