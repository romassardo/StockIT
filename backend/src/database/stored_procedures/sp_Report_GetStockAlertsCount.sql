-- =============================================
-- Author:      <Author,,Name>
-- Create date: <Create Date,,>
-- Description: Devuelve el número total de productos que están por debajo de su stock mínimo.
-- =============================================
CREATE PROCEDURE sp_Report_GetStockAlertsCount
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        COUNT(*) AS TotalAlerts
    FROM 
        StockGeneral sg
    JOIN 
        Productos p ON sg.producto_id = p.id
    WHERE 
        sg.cantidad_actual <= p.stock_minimo
        AND p.stock_minimo > 0;
END
GO 