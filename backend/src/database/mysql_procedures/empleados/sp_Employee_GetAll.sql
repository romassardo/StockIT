DELIMITER //

CREATE PROCEDURE `sp_Employee_GetAll`(
    IN `p_activo_only` BOOLEAN,
    IN `p_pageNumber` INT,
    IN `p_pageSize` INT
)
BEGIN
    DECLARE v_offset INT;
    DECLARE v_total_items INT;

    -- Calcular el total de items para la paginación
    SELECT COUNT(*)
    INTO v_total_items
    FROM Empleados
    WHERE (p_activo_only = 0) OR (activo = p_activo_only);

    -- Calcular el offset
    SET v_offset = (p_pageNumber - 1) * p_pageSize;

    -- Consulta principal para obtener los empleados paginados
    SELECT 
        e.id,
        e.nombre,
        e.apellido,
        CONCAT(e.nombre, ' ', e.apellido) as nombre_completo,
        e.activo,
        v_total_items AS TotalItems -- Devolver el total de items en cada fila
    FROM Empleados e
    WHERE 
        (p_activo_only = 0) OR (e.activo = p_activo_only)
    ORDER BY e.apellido, e.nombre
    LIMIT v_offset, p_pageSize;

END //

DELIMITER ;
