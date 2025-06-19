-- =============================================
-- Autor: Claude AI
-- Fecha de creación: 2025-01-18
-- Descripción: Obtener estadísticas de usuarios del sistema
-- =============================================

DROP PROCEDURE IF EXISTS sp_User_GetStats;
GO

CREATE PROCEDURE sp_User_GetStats
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT 
            COUNT(*) AS total,
            SUM(CASE WHEN rol = 'admin' THEN 1 ELSE 0 END) AS admins,
            SUM(CASE WHEN rol = 'usuario' THEN 1 ELSE 0 END) AS usuarios,
            SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) AS activos,
            SUM(CASE WHEN activo = 0 THEN 1 ELSE 0 END) AS inactivos
        FROM Usuarios;
        
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO