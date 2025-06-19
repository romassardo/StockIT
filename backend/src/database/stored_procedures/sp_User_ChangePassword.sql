-- =============================================
-- Author:      StockIT Dev Team
-- Create date: 27/05/2025
-- Description: Cambiar contraseña de un usuario
-- =============================================
USE StockIT;
GO

-- Verificar si el procedimiento ya existe y eliminarlo
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_User_ChangePassword')
BEGIN
    DROP PROCEDURE sp_User_ChangePassword;
    PRINT N'Procedimiento sp_User_ChangePassword eliminado para su recreación.';
END
GO

CREATE PROCEDURE sp_User_ChangePassword
    @user_id INT,
    @new_password_hash NVARCHAR(255),
    @usuario_ejecutor_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @error_msg NVARCHAR(500);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verificar que el usuario existe
        IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE id = @user_id)
        BEGIN
            SET @error_msg = N'Usuario no encontrado';
            THROW 50003, @error_msg, 1;
        END
        
        -- Actualizar contraseña
        UPDATE Usuarios
        SET 
            password_hash = @new_password_hash
        WHERE id = @user_id;
        
        -- Log de actividad (sin incluir valores de contraseñas por seguridad)
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
            N'Cambio de contraseña de usuario',
            GETDATE()
        );
        
        COMMIT TRANSACTION;
        
        SELECT N'Contraseña actualizada exitosamente' AS mensaje;
        
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

PRINT N'Procedimiento sp_User_ChangePassword creado exitosamente.';
GO