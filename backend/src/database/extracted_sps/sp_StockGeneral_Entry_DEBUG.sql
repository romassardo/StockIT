
CREATE PROCEDURE sp_StockGeneral_Entry_DEBUG
    @producto_id INT,
    @cantidad INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @stock_antes INT = 0;
    DECLARE @stock_despues INT = 0;
    DECLARE @rowcount_check INT = 0;
    
    -- Obtener stock antes
    SELECT @stock_antes = ISNULL(cantidad_actual, 0)
    FROM StockGeneral
    WHERE producto_id = @producto_id;
    
    SET @rowcount_check = @@ROWCOUNT;
    
    PRINT 'STOCK ANTES: ' + CAST(@stock_antes AS NVARCHAR(10));
    PRINT 'ROWCOUNT: ' + CAST(@rowcount_check AS NVARCHAR(10));
    
    -- UPDATE simple
    UPDATE StockGeneral
    SET cantidad_actual = cantidad_actual + @cantidad
    WHERE producto_id = @producto_id;
    
    PRINT 'UPDATE EJECUTADO';
    
    -- Obtener stock despuÃ©s
    SELECT @stock_despues = cantidad_actual
    FROM StockGeneral
    WHERE producto_id = @producto_id;
    
    PRINT 'STOCK DESPUES: ' + CAST(@stock_despues AS NVARCHAR(10));
    PRINT 'DIFERENCIA: ' + CAST(@stock_despues - @stock_antes AS NVARCHAR(10));
    PRINT 'ESPERADO: ' + CAST(@cantidad AS NVARCHAR(10));
    
END;
