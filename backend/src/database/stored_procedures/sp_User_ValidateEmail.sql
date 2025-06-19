-- =============================================
-- Autor: Claude AI
-- Fecha de creación: 2025-01-18
-- Descripción: Validar disponibilidad de email para usuarios
-- =============================================

DROP PROCEDURE IF EXISTS sp_User_ValidateEmail;
GO

CREATE PROCEDURE sp_User_ValidateEmail
    @email NVARCHAR(255),
    @exclude_id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @count INT = 0;
    
    BEGIN TRY
        -- Contar usuarios con el mismo email
        SELECT @count = COUNT(*)
        FROM Usuarios
        WHERE email = @email
          AND (@exclude_id IS NULL OR id != @exclude_id);
        
        -- Retornar disponibilidad
        SELECT 
            CASE WHEN @count = 0 THEN 1 ELSE 0 END AS available;
        
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO