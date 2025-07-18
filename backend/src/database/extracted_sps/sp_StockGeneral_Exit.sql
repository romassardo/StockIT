CREATE PROCEDURE sp_StockGeneral_Exit
    @producto_id INT,
    @cantidad INT,
    @motivo NVARCHAR(100),
    @empleado_id INT = NULL,
    @sector_id INT = NULL,
    @sucursal_id INT = NULL,
    @observaciones NVARCHAR(MAX) = NULL,
    @usuario_id INT,
    @movimiento_id INT = NULL OUTPUT,
    @stock_id INT = NULL OUTPUT,
    @stock_actual INT = NULL OUTPUT,
    @alerta_bajo_stock BIT = NULL OUTPUT,
    @mensaje NVARCHAR(500) = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @usa_numero_serie BIT;
    DECLARE @stock_anterior INT = 0;
    DECLARE @stock_nuevo INT = 0;
    DECLARE @stock_minimo INT = 0;
    DECLARE @error_msg NVARCHAR(500);
    DECLARE @movimiento_id_local INT;
    DECLARE @stock_id_local INT;
    DECLARE @destino_count INT = 0;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validaciones existentes...
        IF NOT EXISTS (SELECT 1 FROM Productos WHERE id = @producto_id AND activo = 1)
        BEGIN
            SET @error_msg = N'El producto no existe o estÃ¡ inactivo';
            THROW 50001, @error_msg, 1;
        END
        
        IF @cantidad <= 0
        BEGIN
            SET @error_msg = N'La cantidad debe ser mayor a cero';
            THROW 50002, @error_msg, 1;
        END
        
        SELECT @usa_numero_serie = usa_numero_serie, @stock_minimo = stock_minimo
        FROM Productos 
        WHERE id = @producto_id;
        
        IF @usa_numero_serie = 1
        BEGIN
            SET @error_msg = N'Este producto usa nÃºmero de serie y debe gestionarse por InventarioIndividual';
            THROW 50003, @error_msg, 1;
        END
        
        -- Validar destinos...
        IF @empleado_id IS NOT NULL SET @destino_count = @destino_count + 1;
        IF @sector_id IS NOT NULL SET @destino_count = @destino_count + 1;
        IF @sucursal_id IS NOT NULL SET @destino_count = @destino_count + 1;
        
        IF @destino_count > 1
        BEGIN
            SET @error_msg = N'Solo puede especificar un destino';
            THROW 50004, @error_msg, 1;
        END

        IF @destino_count = 0
        BEGIN
            SET @error_msg = N'Debe especificar al menos un destino';
            THROW 50010, @error_msg, 1;
        END
        
        -- âœ… CORRECCIÃ“N APLICANDO LÃ“GICA DEL SP DE ENTRADA:
        -- Obtener stock actual antes del UPDATE (igual que en sp_StockGeneral_Entry)
        SELECT @stock_anterior = cantidad_actual, @stock_id_local = id
        FROM StockGeneral
        WHERE producto_id = @producto_id;
        
        IF @stock_id_local IS NULL
        BEGIN
            SET @error_msg = N'No existe registro de stock para este producto';
            THROW 50008, @error_msg, 1;
        END
        
        IF @stock_anterior < @cantidad
        BEGIN
            SET @error_msg = CONCAT(N'Stock insuficiente. Stock actual: ', @stock_anterior, N', Cantidad solicitada: ', @cantidad);
            THROW 50009, @error_msg, 1;
        END
        
        -- âœ… Calcular nuevo stock (igual que en entrada pero restando)
        SET @stock_nuevo = @stock_anterior - @cantidad;
        
        -- âœ… Actualizar stock usando el valor calculado (igual que en entrada)
        UPDATE StockGeneral
        SET cantidad_actual = @stock_nuevo,
            ultima_actualizacion = GETDATE()
        WHERE producto_id = @producto_id;
        
        -- Registrar movimiento
        INSERT INTO MovimientosStock (
            producto_id, tipo_movimiento, cantidad, fecha_movimiento, usuario_id,
            empleado_id, sector_id, sucursal_id, motivo, observaciones
        )
        VALUES (
            @producto_id, N'Salida', @cantidad, GETDATE(), @usuario_id,
            @empleado_id, @sector_id, @sucursal_id, @motivo, @observaciones
        );
        
        SET @movimiento_id_local = SCOPE_IDENTITY();
        
        COMMIT TRANSACTION;
        
        -- âœ… Asignar valores a parÃ¡metros de salida (igual que en entrada)
        SET @movimiento_id = @movimiento_id_local;
        SET @stock_id = @stock_id_local;
        SET @stock_actual = @stock_nuevo;
        SET @mensaje = N'Salida de stock registrada exitosamente';
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        DECLARE @error_message NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @error_severity INT = ERROR_SEVERITY();
        DECLARE @error_state INT = ERROR_STATE();
        
        RAISERROR(@error_message, @error_severity, @error_state);
    END CATCH
END;