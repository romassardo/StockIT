-- =============================================
-- Description: Obtiene estadísticas sobre los usuarios.
-- =============================================

DROP PROCEDURE IF EXISTS sp_User_GetStats;

DELIMITER //

CREATE PROCEDURE sp_User_GetStats()
BEGIN
    SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN rol = 'admin' THEN 1 ELSE 0 END) AS admins,
        SUM(CASE WHEN rol = 'usuario' THEN 1 ELSE 0 END) AS usuarios,
        SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) AS activos,
        SUM(CASE WHEN activo = 0 THEN 1 ELSE 0 END) AS inactivos
    FROM Usuarios;
END //

DELIMITER ;
