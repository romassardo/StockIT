-- =============================================
-- Author:      StockIT Dev Team
-- Create date: 27/05/2025
-- Description: Actualizar información de un usuario
-- =============================================
USE StockIT;
GO

-- Verificar si el procedimiento ya existe y eliminarlo
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_User_Update')
BEGIN
    DROP PROCEDURE sp_User_Update;
    PRINT N'Procedimiento sp_User_Update eliminado para su recreación.';
END
GO

CREATE PROCEDURE sp_User_Update
    @user_id INT,
    @nombre NVARCHAR(100),
    @email NVARCHAR(100),
    @rol NVARCHAR(20),
    @usuario_ejecutor_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @old_values NVARCHAR(MAX);
    DECLARE @error_msg NVARCHAR(500);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verificar que el usuario existe
        IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE id = @user_id)
        BEGIN
            SET @error_msg = N'Usuario no encontrado';
            THROW 50003, @error_msg, 1;
        END
        
        -- Verificar que el email no existe para otro usuario
        IF EXISTS (SELECT 1 FROM Usuarios WHERE email = @email AND id != @user_id)
        BEGIN
            SET @error_msg = N'El email ya está en uso por otro usuario';
            THROW 50004, @error_msg, 1;
        END
        
        -- Validar el rol
        IF NOT (@rol IN (N'admin', N'usuario'))
        BEGIN
            SET @error_msg = N'El rol debe ser "admin" o "usuario"';
            THROW 50002, @error_msg, 1;
        END
        
        -- Guardar datos antiguos para el log
        SELECT @old_values = CONCAT(
            N'nombre: ', nombre, 
            N', email: ', email, 
            N', rol: ', rol
        )
        FROM Usuarios
        WHERE id = @user_id;
        
        -- Actualizar usuario
        UPDATE Usuarios
        SET 
            nombre = @nombre,
            email = @email,
            rol = @rol
        WHERE id = @user_id;
        
        -- Log de actividad usando la estructura correcta de la tabla
        INSERT INTO LogsActividad (
            usuario_id, 
            tabla_afectada, 
            accion, 
            registro_id, 
            descripcion, 
            fecha_hora
        )
        VALUES (
            @usuario_ejecutor_id, 
            N'Usuarios', 
            N'UPDATE', 
            @user_id, 
            CONCAT(N'Actualización de usuario. Valores anteriores: [', @old_values, N']. Valores nuevos: [nombre: ', @nombre, N', email: ', @email, N', rol: ', @rol, N']'),
            GETDATE()
        );
        
        COMMIT TRANSACTION;
        
        SELECT N'Usuario actualizado exitosamente' AS mensaje;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        DECLARE @error_message NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @error_severity INT = ERROR_SEVERITY();
        DECLARE @error_state INT = ERROR_STATE();
        
        RAISERROR(@error_message, @error_severity, @error_state);
    END CATCH
END;
GO

PRINT N'Procedimiento sp_User_Update creado exitosamente.';
GO