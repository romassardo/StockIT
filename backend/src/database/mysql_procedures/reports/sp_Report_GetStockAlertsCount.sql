DELIMITER $$

CREATE PROCEDURE `sp_Report_GetStockAlertsCount`()
BEGIN
    -- Este procedimiento devuelve el número total de productos
    -- que están por debajo o igual a su stock mínimo.
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- Manejo de errores: simplemente se relanza el error.
        RESIGNAL;
    END;

    SELECT 
        COUNT(*) AS TotalAlerts
    FROM 
        StockGeneral sg
    JOIN 
        Productos p ON sg.producto_id = p.id
    WHERE 
        sg.cantidad_actual <= p.stock_minimo
        AND p.stock_minimo > 0;
        
END$$

DELIMITER ; 