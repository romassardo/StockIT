CREATE OR ALTER PROCEDURE sp_Changelog_Create
    @version NVARCHAR(20),
    @descripcion NVARCHAR(MAX),
    @tipo_cambio NVARCHAR(20),
    @usuario_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validaciones básicas
        IF @version IS NULL OR LEN(TRIM(@version)) = 0
        BEGIN
            THROW 50000, 'La versión es obligatoria', 1;
            RETURN;
        END
        
        IF @descripcion IS NULL OR LEN(TRIM(@descripcion)) = 0
        BEGIN
            THROW 50001, 'La descripción es obligatoria', 1;
            RETURN;
        END
        
        IF @tipo_cambio IS NULL OR LEN(TRIM(@tipo_cambio)) = 0
        BEGIN
            THROW 50002, 'El tipo de cambio es obligatorio', 1;
            RETURN;
        END
        
        -- Verificar que el tipo de cambio sea válido (Nueva Funcionalidad, Mejora, Corrección, Otro)
        IF @tipo_cambio NOT IN (N'Nueva Funcionalidad', N'Mejora', N'Corrección', N'Otro')
        BEGIN
            THROW 50003, 'Tipo de cambio inválido. Valores permitidos: Nueva Funcionalidad, Mejora, Corrección, Otro', 1;
            RETURN;
        END
        
        -- Insertar el registro en la tabla Changelog
        INSERT INTO Changelog (version, descripcion, tipo_cambio, usuario_id, fecha_cambio)
        VALUES (@version, @descripcion, @tipo_cambio, @usuario_id, GETDATE());
        
        -- Obtener el ID del registro insertado
        DECLARE @new_id INT = SCOPE_IDENTITY();
        
        -- Registrar la operación en LogsActividad
        INSERT INTO LogsActividad (usuario_id, tabla_afectada, accion, registro_id, descripcion, fecha_hora)
        VALUES (@usuario_id, 'Changelog', 'INSERT', @new_id, 
                CONCAT('{"version":"', @version, '","tipo_cambio":"', @tipo_cambio, '"}'), GETDATE());
        
        COMMIT TRANSACTION;
        
        -- Retornar el ID del nuevo registro
        SELECT @new_id AS id;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        THROW;
    END CATCH
END;