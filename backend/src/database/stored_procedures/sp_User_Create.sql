-- =============================================
-- Author:      StockIT Dev Team
-- Create date: 27/05/2025
-- Description: Crear un nuevo usuario en el sistema
-- =============================================
USE StockIT;
GO

-- Verificar si el procedimiento ya existe y eliminarlo
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_User_Create')
BEGIN
    DROP PROCEDURE sp_User_Create;
    PRINT 'Procedimiento sp_User_Create eliminado para su recreación.';
END
GO

CREATE PROCEDURE sp_User_Create
    @nombre NVARCHAR(100),
    @email NVARCHAR(100),
    @password_hash NVARCHAR(255),
    @rol NVARCHAR(20),
    @usuario_ejecutor_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @user_id INT;
    DECLARE @error_msg NVARCHAR(500);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validaciones
        IF EXISTS (SELECT 1 FROM Usuarios WHERE email = @email)
        BEGIN
            SET @error_msg = N'El email ya existe en el sistema';
            THROW 50001, @error_msg, 1;
        END
        
        IF NOT (@rol IN (N'admin', N'usuario'))
        BEGIN
            SET @error_msg = N'El rol debe ser "admin" o "usuario"';
            THROW 50002, @error_msg, 1;
        END
        
        -- Insertar usuario
        INSERT INTO Usuarios (nombre, email, password_hash, rol, activo, fecha_creacion)
        VALUES (@nombre, @email, @password_hash, @rol, 1, GETDATE());
        
        SET @user_id = SCOPE_IDENTITY();
        
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
            N'INSERT', 
            @user_id, 
            CONCAT(N'Creación de usuario: ', @nombre, N' (', @email, N') con rol: ', @rol),
            GETDATE()
        );
        
        COMMIT TRANSACTION;
        
        SELECT @user_id AS id, N'Usuario creado exitosamente' AS mensaje;
        
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

PRINT N'Procedimiento sp_User_Create creado exitosamente.';
GO