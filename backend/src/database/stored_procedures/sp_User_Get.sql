-- =============================================
-- Author:      StockIT Dev Team
-- Create date: 27/05/2025
-- Description: Obtener información de un usuario específico
-- =============================================
USE StockIT;
GO

-- Verificar si el procedimiento ya existe y eliminarlo
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_User_Get')
BEGIN
    DROP PROCEDURE sp_User_Get;
    PRINT N'Procedimiento sp_User_Get eliminado para su recreación.';
END
GO

CREATE PROCEDURE sp_User_Get
    @user_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validar que el usuario existe
    IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE id = @user_id)
    BEGIN
        THROW 50003, N'Usuario no encontrado', 1;
        RETURN;
    END
    
    -- Obtener información del usuario
    SELECT 
        id,
        nombre,
        email,
        password_hash,
        rol,
        activo,
        fecha_creacion,
        ultimo_acceso
    FROM Usuarios
    WHERE id = @user_id;
END;
GO

PRINT N'Procedimiento sp_User_Get creado exitosamente.';
GO