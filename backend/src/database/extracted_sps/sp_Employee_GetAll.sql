-- =============================================
-- Description: Obtiene todos los empleados, con filtro opcional por estado activo.
-- =============================================

DROP PROCEDURE IF EXISTS sp_Employee_GetAll;

DELIMITER //

CREATE PROCEDURE sp_Employee_GetAll(
    IN p_activo_only BOOLEAN -- 1 para solo activos, 0 para todos
)
BEGIN
    SELECT 
        id,
        nombre,
        apellido,
        CONCAT(nombre, ' ', apellido) as nombre_completo,
        activo
    FROM Empleados
    WHERE 
        (p_activo_only = 0) OR (activo = p_activo_only)
    ORDER BY apellido, nombre;
END //

DELIMITER ;