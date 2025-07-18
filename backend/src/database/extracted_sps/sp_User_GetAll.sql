-- =============================================
-- Description: Obtiene todos los usuarios con paginación, filtros y ordenamiento.
-- =============================================

DROP PROCEDURE IF EXISTS sp_User_GetAll;

DELIMITER //

CREATE PROCEDURE sp_User_GetAll(
    IN p_page INT,
    IN p_pageSize INT,
    IN p_search VARCHAR(255),
    IN p_rol VARCHAR(50),
    IN p_activo BOOLEAN
)
BEGIN
    DECLARE v_offset INT;
    DECLARE v_query VARCHAR(4000);
    DECLARE v_count_query VARCHAR(4000);

    SET v_offset = (p_page - 1) * p_pageSize;

    SET @sql = '
        FROM Usuarios
        WHERE (? IS NULL OR ? = '''' OR nombre LIKE ? OR email LIKE ?)
          AND (? IS NULL OR ? = '''' OR rol = ?)
          AND (? IS NULL OR activo = ?)';

    SET @count_sql = CONCAT('SELECT COUNT(*) INTO @totalRecords ', @sql);
    SET @main_sql = CONCAT('SELECT *, @totalRecords AS TotalRecords ', @sql, ' ORDER BY nombre LIMIT ?, ?');

    -- Parámetros para la consulta principal y de conteo
    SET @p_search_param = CONCAT('%', p_search, '%');
    
    -- Preparar y ejecutar la consulta de conteo
    PREPARE count_stmt FROM @count_sql;
    EXECUTE count_stmt USING p_search, p_search, @p_search_param, @p_search_param, p_rol, p_rol, p_rol, p_activo, p_activo;
    DEALLOCATE PREPARE count_stmt;

    -- Preparar y ejecutar la consulta principal
    PREPARE main_stmt FROM @main_sql;
    EXECUTE main_stmt USING p_search, p_search, @p_search_param, @p_search_param, p_rol, p_rol, p_rol, p_activo, p_activo, v_offset, p_pageSize;
    DEALLOCATE PREPARE main_stmt;

END //

DELIMITER ;
