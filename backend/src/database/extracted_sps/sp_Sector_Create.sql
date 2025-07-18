-- =============================================
-- Description: Crea un nuevo sector.
-- =============================================

DROP PROCEDURE IF EXISTS sp_Sector_Create;

DELIMITER //

CREATE PROCEDURE sp_Sector_Create(
    IN p_nombre VARCHAR(100),
    IN p_activo BOOLEAN,
    IN p_usuario_id INT
)
BEGIN
    DECLARE v_sector_id INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF p_nombre IS NULL OR TRIM(p_nombre) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El nombre del sector es obligatorio';
    END IF;

    IF EXISTS (SELECT 1 FROM Sectores WHERE nombre = p_nombre) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ya existe un sector con ese nombre';
    END IF;

    START TRANSACTION;

    INSERT INTO Sectores (nombre, activo)
    VALUES (p_nombre, IFNULL(p_activo, 1));

    SET v_sector_id = LAST_INSERT_ID();

    CALL sp_Log_Create(
        p_usuario_id,
        'Sectores',
        'INSERT',
        v_sector_id,
        NULL,
        JSON_OBJECT('nombre', p_nombre, 'activo', IFNULL(p_activo, 1))
    );

    COMMIT;

    SELECT v_sector_id AS id, 'Sector creado exitosamente' AS mensaje;

END //

DELIMITER ;
