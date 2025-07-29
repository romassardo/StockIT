-- =============================================
-- Description: Obtiene una lista de todas las categorías con filtros
-- =============================================
DROP PROCEDURE IF EXISTS sp_Categoria_GetAll;

DELIMITER //

CREATE PROCEDURE sp_Categoria_GetAll(
    IN p_activo BOOLEAN,
    IN p_incluir_padre BOOLEAN
)
BEGIN
    SELECT
        c.id,
        c.nombre,
        c.categoria_padre_id,
        CASE 
            WHEN c.categoria_padre_id IS NOT NULL THEN cp.nombre 
            ELSE NULL 
        END AS categoria_padre_nombre,
        c.requiere_serie,
        c.permite_asignacion,
        c.permite_reparacion,
        c.activo,
        c.fecha_creacion,
        c.fecha_modificacion,
        -- Contar productos en esta categoría
        (SELECT COUNT(*) FROM Productos p WHERE p.categoria_id = c.id AND p.activo = 1) AS total_productos
    FROM
        Categorias c
    LEFT JOIN
        Categorias cp ON c.categoria_padre_id = cp.id
    WHERE
        (p_activo IS NULL OR c.activo = p_activo)
        AND (p_incluir_padre = TRUE OR c.categoria_padre_id IS NULL)
    ORDER BY
        c.nombre ASC;
END //

DELIMITER ;
