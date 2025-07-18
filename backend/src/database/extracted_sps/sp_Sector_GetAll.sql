-- =============================================
-- Description: Obtiene todos los sectores, con filtro opcional por estado activo.
-- =============================================

DROP PROCEDURE IF EXISTS sp_Sector_GetAll;

DELIMITER //

CREATE PROCEDURE sp_Sector_GetAll(
    IN p_activo_only BOOLEAN -- 1 para solo activos, 0 para todos
)
BEGIN
    SELECT 
        id,
        nombre,
        activo
    FROM Sectores
    WHERE (p_activo_only = 0 OR activo = 1)
    ORDER BY nombre;
END //

DELIMITER ;
