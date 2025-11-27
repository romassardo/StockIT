DELIMITER //

CREATE PROCEDURE `sp_Branch_GetAll`(
    IN `p_activo_only` BOOLEAN
)
BEGIN
    -- Si p_activo_only es TRUE (1), la condición es `activo = 1`.
    -- Si p_activo_only es FALSE (0), la condición `p_activo_only = 0` es verdadera, por lo que devuelve todos.
    SELECT 
        id,
        nombre,
        activo
    FROM Sucursales
    WHERE 
        activo = p_activo_only OR p_activo_only = 0
    ORDER BY nombre;
END //

DELIMITER ;
