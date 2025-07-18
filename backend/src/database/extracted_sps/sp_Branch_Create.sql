-- =============================================
-- Description: Crea una nueva sucursal.
-- =============================================

DROP PROCEDURE IF EXISTS sp_Branch_Create;

DELIMITER //

CREATE PROCEDURE sp_Branch_Create(
    IN p_nombre VARCHAR(100),
    IN p_activo BOOLEAN,
    IN p_usuario_id INT
)
BEGIN
    DECLARE v_branch_id INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF p_nombre IS NULL OR TRIM(p_nombre) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El nombre de la sucursal es obligatorio';
    END IF;

    IF EXISTS (SELECT 1 FROM Sucursales WHERE nombre = p_nombre) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ya existe una sucursal con ese nombre';
    END IF;

    START TRANSACTION;

    INSERT INTO Sucursales (nombre, activo)
    VALUES (p_nombre, IFNULL(p_activo, 1));

    SET v_branch_id = LAST_INSERT_ID();

    CALL sp_Log_Create(
        p_usuario_id,
        'Sucursales',
        'INSERT',
        v_branch_id,
        NULL,
        JSON_OBJECT('nombre', p_nombre, 'activo', IFNULL(p_activo, 1))
    );

    COMMIT;

    SELECT v_branch_id AS id, 'Sucursal creada exitosamente' AS mensaje;

END //

DELIMITER ;
