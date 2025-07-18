-- =============================================
-- Description: Obtiene una lista paginada de todas las reparaciones activas ('En Reparación').
-- =============================================
DROP PROCEDURE IF EXISTS sp_Repair_GetActive;

DELIMITER //

CREATE PROCEDURE sp_Repair_GetActive(
    IN p_PageNumber INT,
    IN p_PageSize INT,
    IN p_proveedor VARCHAR(100)
)
BEGIN
    DECLARE v_offset INT;
    DECLARE v_page_size INT;

    SET v_page_size = IF(p_PageSize < 1 OR p_PageSize IS NULL, 10, LEAST(p_PageSize, 100));
    SET v_offset = (IF(p_PageNumber < 1 OR p_PageNumber IS NULL, 1, p_PageNumber) - 1) * v_page_size;

    SELECT
        Rep.id AS reparacion_id,
        Rep.inventario_individual_id,
        InvInd.numero_serie,
        Prod.marca AS producto_marca,
        Prod.modelo AS producto_modelo,
        Rep.fecha_envio,
        Rep.proveedor,
        Rep.problema_descripcion,
        Rep.usuario_envia_id,
        UsrEnv.nombre AS usuario_envia_nombre,
        COUNT(*) OVER() AS TotalRows
    FROM
        Reparaciones AS Rep
    INNER JOIN
        InventarioIndividual AS InvInd ON Rep.inventario_individual_id = InvInd.id
    INNER JOIN
        Productos AS Prod ON InvInd.producto_id = Prod.id
    INNER JOIN
        Usuarios AS UsrEnv ON Rep.usuario_envia_id = UsrEnv.id
    WHERE
        Rep.estado = 'En Reparación'
        AND (p_proveedor IS NULL OR Rep.proveedor LIKE CONCAT('%', p_proveedor, '%'))
    ORDER BY
        Rep.fecha_envio DESC
    LIMIT v_page_size OFFSET v_offset;

END //

DELIMITER ; 