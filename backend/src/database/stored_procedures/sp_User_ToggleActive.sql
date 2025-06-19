-- =============================================
-- Author:      StockIT Dev Team
-- Create date: 27/05/2025
-- Description: Activar/desactivar un usuario
-- =============================================
USE StockIT;
GO

-- Verificar si el procedimiento ya existe y eliminarlo
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_User_ToggleActive')
BEGIN
    DROP PROCEDURE sp_User_ToggleActive;
    PRINT N'Procedimiento sp_User_ToggleActive eliminado para su recreación.';
END
GO

CREATE PROCEDURE sp_User_ToggleActive
    @user_id INT,
    @usuario_ejecutor_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @current_status BIT;
    DECLARE @new_status BIT;
    DECLARE @error_msg NVARCHAR(500);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verificar que el usuario existe
        SELECT @current_status = activo 
        FROM Usuarios 
        WHERE id = @user_id;
        
        IF @current_status IS NULL
        BEGIN
            SET @error_msg = N'Usuario no encontrado';
            THROW 50003, @error_msg, 1;
        END
        
        -- Cambiar el estado (activar/desactivar)
        SET @new_status = CASE WHEN @current_status = 1 THEN 0 ELSE 1 END;
        
        UPDATE Usuarios 
        SET activo = @new_status
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
            CASE 
                WHEN @new_status = 1 THEN N'Usuario activado'
                ELSE N'Usuario desactivado'
            END,
            GETDATE()
        );
        
        COMMIT TRANSACTION;
        
        SELECT 
            CASE 
                WHEN @new_status = 1 THEN N'Usuario activado exitosamente'
                ELSE N'Usuario desactivado exitosamente'
            END AS mensaje;
        
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

PRINT N'Procedimiento sp_User_ToggleActive creado exitosamente.';
GO