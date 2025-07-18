
CREATE PROCEDURE sp_DEBUG_FINAL
    @producto_id INT,
    @cantidad INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @stock_anterior INT = 0;
    DECLARE @stock_nuevo INT = 0;
    DECLARE @stock_id_local INT;
    
    PRINT 'INICIO DEBUG';
    
    -- Verificar si existe el producto en StockGeneral
    IF EXISTS (SELECT 1 FROM StockGeneral WHERE producto_id = @producto_id)
    BEGIN
        PRINT 'PRODUCTO EXISTE EN STOCK';
        
        -- OBTENER STOCK ACTUAL ANTES DEL UPDATE
        SELECT @stock_anterior = cantidad_actual, @stock_id_local = id
        FROM StockGeneral
        WHERE producto_id = @producto_id;
        
        PRINT 'STOCK ANTERIOR: ' + CAST(@stock_anterior AS NVARCHAR(10));
        
        -- CALCULAR NUEVO STOCK
        SET @stock_nuevo = @stock_anterior + @cantidad;
        
        PRINT 'STOCK CALCULADO: ' + CAST(@stock_nuevo AS NVARCHAR(10));
        
        -- ACTUALIZAR CON EL VALOR CALCULADO
        UPDATE StockGeneral
        SET cantidad_actual = @stock_nuevo
        WHERE producto_id = @producto_id;
        
        PRINT 'UPDATE EJECUTADO';
        
        -- VERIFICAR RESULTADO
        DECLARE @stock_real INT;
        SELECT @stock_real = cantidad_actual FROM StockGeneral WHERE producto_id = @producto_id;
        
        PRINT 'STOCK REAL DESPUÃ‰S: ' + CAST(@stock_real AS NVARCHAR(10));
        
    END
    ELSE
    BEGIN
        PRINT 'PRODUCTO NO EXISTE - CREANDO NUEVO';
    END
    
    PRINT 'FIN DEBUG';
    
END;
