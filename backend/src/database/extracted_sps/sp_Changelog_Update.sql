CREATE PROCEDURE sp_Changelog_Update
    @id INT,
    @version NVARCHAR(20),
    @descripcion NVARCHAR(MAX),
    @tipo_cambio NVARCHAR(20),
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
        IF @version IS NULL OR LEN(TRIM(@version)) = 0
        BEGIN
            THROW 50001, 'La versión es obligatoria', 1;
        END
        IF @descripcion IS NULL OR LEN(TRIM(@descripcion)) = 0
        BEGIN
            THROW 50002, 'La descripción es obligatoria', 1;
        END
        IF @tipo_cambio IS NULL OR LEN(TRIM(@tipo_cambio)) = 0
        BEGIN
            THROW 50003, 'El tipo de cambio es obligatorio', 1;
        END
        IF @tipo_cambio NOT IN (N'Nueva Funcionalidad', N'Mejora', N'Corrección', N'Otro')
        BEGIN
            THROW 50004, 'Tipo de cambio inválido. Valores permitidos: Nueva Funcionalidad, Mejora, Corrección, Otro', 1;
        END
        DECLARE @old_version NVARCHAR(20), @old_tipo_cambio NVARCHAR(20);
        SELECT 
            @old_version = version,
            @old_tipo_cambio = tipo_cambio
        FROM Changelog WHERE id = @id;
        UPDATE Changelog
        SET version = @version,
            descripcion = @descripcion,
            tipo_cambio = @tipo_cambio,
            fecha_cambio = GETDATE()
        WHERE id = @id;
        INSERT INTO LogsActividad (usuario_id, tabla_afectada, accion, registro_id, descripcion, fecha_hora)
        VALUES (@usuario_id, 'Changelog', 'UPDATE', @id, 
                CONCAT('{"old":{"version":"', @old_version, '","tipo_cambio":"', @old_tipo_cambio, 
                '"},"new":{"version":"', @version, '","tipo_cambio":"', @tipo_cambio, '"}}'), GETDATE());
        COMMIT TRANSACTION;
        SELECT 1 AS success;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;