CREATE PROCEDURE sp_Changelog_Create
    @version NVARCHAR(20),
    @descripcion NVARCHAR(MAX),
    @tipo_cambio NVARCHAR(20),
    @usuario_id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        IF @version IS NULL OR LEN(TRIM(@version)) = 0
        BEGIN
            THROW 50000, 'La versión es obligatoria', 1;
        END
        IF @descripcion IS NULL OR LEN(TRIM(@descripcion)) = 0
        BEGIN
            THROW 50001, 'La descripción es obligatoria', 1;
        END
        IF @tipo_cambio IS NULL OR LEN(TRIM(@tipo_cambio)) = 0
        BEGIN
            THROW 50002, 'El tipo de cambio es obligatorio', 1;
        END
        IF @tipo_cambio NOT IN (N'Nueva Funcionalidad', N'Mejora', N'Corrección', N'Otro')
        BEGIN
            THROW 50003, 'Tipo de cambio inválido. Valores permitidos: Nueva Funcionalidad, Mejora, Corrección, Otro', 1;
        END
        INSERT INTO Changelog (version, descripcion, tipo_cambio, usuario_id, fecha_cambio)
        VALUES (@version, @descripcion, @tipo_cambio, @usuario_id, GETDATE());
        DECLARE @new_id INT = SCOPE_IDENTITY();
        INSERT INTO LogsActividad (usuario_id, tabla_afectada, accion, registro_id, descripcion, fecha_hora)
        VALUES (@usuario_id, 'Changelog', 'INSERT', @new_id, 
                CONCAT('{"version":"', @version, '","tipo_cambio":"', @tipo_cambio, '"}'), GETDATE());
        COMMIT TRANSACTION;
        SELECT @new_id AS id;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;