-- =============================================
-- Description: Crea múltiples ítems de inventario individual a partir de una lista CSV de números de serie.
-- =============================================
DROP PROCEDURE IF EXISTS sp_InventarioIndividual_BatchCreate;

DELIMITER //

CREATE PROCEDURE sp_InventarioIndividual_BatchCreate(
    IN p_producto_id INT,
    IN p_numeros_serie_csv TEXT,
    IN p_usuario_alta_id INT
)
BEGIN
    DECLARE v_csv TEXT DEFAULT p_numeros_serie_csv;
    DECLARE v_single_serie VARCHAR(100);
    DECLARE v_delimiter_pos INT;
    DECLARE v_creados_count INT DEFAULT 0;
    DECLARE v_duplicados_list TEXT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        DROP TEMPORARY TABLE IF EXISTS SeriesTemp;
        DROP TEMPORARY TABLE IF EXISTS Duplicados;
        DROP TEMPORARY TABLE IF EXISTS Nuevos;
        DROP TEMPORARY TABLE IF EXISTS InsertedLogs;
        RESIGNAL;
    END;

    -- 1. Validar producto
    IF NOT EXISTS (SELECT 1 FROM Productos WHERE id = p_producto_id AND usa_numero_serie = 1 AND activo = 1) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El producto especificado no existe, no está activo o no usa números de serie.';
    END IF;

    -- Crear tablas temporales
    CREATE TEMPORARY TABLE SeriesTemp (numero_serie VARCHAR(100) PRIMARY KEY);
    CREATE TEMPORARY TABLE Duplicados (numero_serie VARCHAR(100));
    CREATE TEMPORARY TABLE Nuevos (numero_serie VARCHAR(100));
    CREATE TEMPORARY TABLE InsertedLogs (id INT, numero_serie VARCHAR(100));

    -- 2. Parsear CSV y llenar SeriesTemp
    SET v_csv = CONCAT(p_numeros_serie_csv, ',');
    WHILE LENGTH(v_csv) > 0 DO
        SET v_delimiter_pos = INSTR(v_csv, ',');
        SET v_single_serie = UPPER(TRIM(SUBSTRING(v_csv, 1, v_delimiter_pos - 1)));
        SET v_csv = SUBSTRING(v_csv, v_delimiter_pos + 1);

        IF v_single_serie != '' AND NOT EXISTS (SELECT 1 FROM SeriesTemp WHERE numero_serie = v_single_serie) THEN
            INSERT INTO SeriesTemp (numero_serie) VALUES (v_single_serie);
        END IF;
    END WHILE;
    
    START TRANSACTION;

    -- 3. Identificar duplicados en el sistema
    INSERT INTO Duplicados (numero_serie)
    SELECT st.numero_serie FROM SeriesTemp st JOIN InventarioIndividual ii ON st.numero_serie = ii.numero_serie;

    -- 4. Identificar nuevos
    INSERT INTO Nuevos (numero_serie)
    SELECT st.numero_serie FROM SeriesTemp st LEFT JOIN Duplicados d ON st.numero_serie = d.numero_serie WHERE d.numero_serie IS NULL;

    -- 5. Insertar nuevos registros
    INSERT INTO InventarioIndividual (producto_id, numero_serie, estado, usuario_alta_id, fecha_ingreso, fecha_creacion)
    SELECT p_producto_id, n.numero_serie, 'Disponible', p_usuario_alta_id, NOW(), NOW()
    FROM Nuevos n;

    SET v_creados_count = ROW_COUNT();

    -- 6. Capturar los IDs recién insertados para el log
    INSERT INTO InsertedLogs (id, numero_serie)
    SELECT ii.id, ii.numero_serie
    FROM InventarioIndividual ii
    JOIN Nuevos n ON ii.numero_serie = n.numero_serie;
    
    -- 7. Insertar logs de actividad
    INSERT INTO LogsActividad (usuario_id, tabla_afectada, accion, registro_id, detalles_new)
    SELECT p_usuario_alta_id, 'InventarioIndividual', 'INSERT_BATCH', il.id, JSON_OBJECT('numero_serie', il.numero_serie)
    FROM InsertedLogs il;

    -- 8. Obtener lista de duplicados
    SELECT GROUP_CONCAT(numero_serie SEPARATOR ', ') INTO v_duplicados_list FROM Duplicados;

    COMMIT;
    
    -- 9. Devolver el resumen
    SELECT v_creados_count AS Creados, v_duplicados_list AS Duplicados;

    -- Limpieza de tablas temporales
    DROP TEMPORARY TABLE IF EXISTS SeriesTemp;
    DROP TEMPORARY TABLE IF EXISTS Duplicados;
    DROP TEMPORARY TABLE IF EXISTS Nuevos;
    DROP TEMPORARY TABLE IF EXISTS InsertedLogs;

END //

DELIMITER ; 