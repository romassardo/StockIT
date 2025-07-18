-- =============================================
-- Author:      Cascade (Adaptado para MySQL)
-- Create date: Julio 2025
-- Description: Obtiene todas las categorías con paginación y filtros.
-- =============================================

DROP PROCEDURE IF EXISTS sp_Categoria_GetAll;

DELIMITER //

CREATE PROCEDURE sp_Categoria_GetAll(
    IN p_activo_filter TINYINT, -- 0: Inactivas, 1: Activas, 2: Todas
    IN p_PageNumber INT,
    IN p_PageSize INT,
    IN p_SortBy VARCHAR(50),
    IN p_SortOrder VARCHAR(4)
)
BEGIN
    -- Variables para paginación y ordenamiento seguro
    DECLARE v_Offset INT;
    DECLARE v_PageSize INT;
    DECLARE v_SortBy VARCHAR(50);
    DECLARE v_SortOrder VARCHAR(4);
    DECLARE v_activo_filter TINYINT;

    -- Validación y valores por defecto
    SET v_PageNumber = IFNULL(p_PageNumber, 1);
    SET v_PageSize = IFNULL(p_PageSize, 10);
    SET v_Offset = (v_PageNumber - 1) * v_PageSize;
    SET v_SortOrder = IF(UPPER(p_SortOrder) IN ('ASC', 'DESC'), UPPER(p_SortOrder), 'ASC');
    SET v_SortBy = IF(LOWER(p_SortBy) IN ('id', 'nombre', 'activo', 'fecha_creacion'), LOWER(p_SortBy), 'nombre');
    SET v_activo_filter = IF(p_activo_filter IN (0, 1), p_activo_filter, 2);

    -- Construcción de la consulta principal
    SET @sql = CONCAT('
        SELECT
            c.id,
            c.nombre,
            c.categoria_padre_id,
            cp.nombre AS categoria_padre_nombre,
            c.requiere_serie,
            c.permite_asignacion,
            c.permite_reparacion,
            c.activo,
            c.fecha_creacion,
            (SELECT COUNT(*) FROM Categorias WHERE (', v_activo_filter, ' = 2 OR activo = ', v_activo_filter, ')) AS TotalRows
        FROM
            Categorias c
        LEFT JOIN
            Categorias cp ON c.categoria_padre_id = cp.id
        WHERE
            (', v_activo_filter, ' = 2 OR c.activo = ', v_activo_filter, ')
        ORDER BY ',
            v_SortBy, ' ', v_SortOrder,
        ' LIMIT ', v_PageSize, ' OFFSET ', v_Offset, ';'
    );
    
    -- Preparar, ejecutar y limpiar
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

END //

DELIMITER ;
