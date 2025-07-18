
CREATE PROCEDURE sp_StockGeneral_Entry_SIMPLE
    @producto_id INT,
    @cantidad INT,
    @motivo NVARCHAR(100),
    @usuario_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @stock_anterior INT = 0;
    DECLARE @stock_nuevo INT = 0;
    
    -- Verificar si existe el producto en StockGeneral
    IF EXISTS (SELECT 1 FROM StockGeneral WHERE producto_id = @producto_id)
    BEGIN
        -- OBTENER STOCK ACTUAL
        SELECT @stock_anterior = cantidad_actual
        FROM StockGeneral
        WHERE producto_id = @producto_id;
        
        -- CALCULAR NUEVO STOCK
        SET @stock_nuevo = @stock_anterior + @cantidad;
        
        -- ACTUALIZAR
        UPDATE StockGeneral
        SET cantidad_actual = @stock_nuevo,
            ultima_actualizacion = GETDATE()
        WHERE producto_id = @producto_id;
    END
    ELSE
    BEGIN
        -- CREAR NUEVO REGISTRO
        INSERT INTO StockGeneral (producto_id, cantidad_actual, ultima_actualizacion)
        VALUES (@producto_id, @cantidad, GETDATE());
        
        SET @stock_anterior = 0;
        SET @stock_nuevo = @cantidad;
    END
    
    -- Registrar el movimiento
    INSERT INTO MovimientosStock (
        producto_id,
        tipo_movimiento,
        cantidad,
        fecha_movimiento,
        usuario_id,
        motivo
    )
    VALUES (
        @producto_id,
        N'Entrada',
        @cantidad,
        GETDATE(),
        @usuario_id,
        @motivo
    );
    
END;
