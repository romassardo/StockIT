
CREATE PROCEDURE sp_StockGeneral_Entry
    @producto_id INT,
    @cantidad INT,
    @motivo NVARCHAR(100),
    @observaciones NVARCHAR(MAX) = NULL,
    @usuario_id INT,
    @movimiento_id INT = NULL OUTPUT,
    @stock_id INT = NULL OUTPUT,
    @stock_actual INT = NULL OUTPUT,
    @mensaje NVARCHAR(500) = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @usa_numero_serie BIT;
    DECLARE @stock_anterior INT = 0;
    DECLARE @stock_nuevo INT = 0;
    DECLARE @error_msg NVARCHAR(500);
    DECLARE @movimiento_id_local INT;
    DECLARE @stock_id_local INT;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar que el producto existe
        IF NOT EXISTS (SELECT 1 FROM Productos WHERE id = @producto_id AND activo = 1)
        BEGIN
            SET @error_msg = N'El producto no existe o estÃ¡ inactivo';
            THROW 50001, @error_msg, 1;
        END
        
        -- Validar que la cantidad es positiva
        IF @cantidad <= 0
        BEGIN
            SET @error_msg = N'La cantidad debe ser mayor a cero';
            THROW 50002, @error_msg, 1;
        END
        
        -- Validar que el producto NO usa nÃºmero de serie
        SELECT @usa_numero_serie = usa_numero_serie 
        FROM Productos 
        WHERE id = @producto_id;
        
        IF @usa_numero_serie = 1
        BEGIN
            SET @error_msg = N'Este producto usa nÃºmero de serie y debe gestionarse por InventarioIndividual';
            THROW 50003, @error_msg, 1;
        END
        
        -- Verificar si existe el producto en StockGeneral
        IF EXISTS (SELECT 1 FROM StockGeneral WHERE producto_id = @producto_id)
        BEGIN
            -- Obtener stock actual antes del UPDATE
            SELECT @stock_anterior = cantidad_actual, @stock_id_local = id
            FROM StockGeneral
            WHERE producto_id = @producto_id;
            
            -- Calcular nuevo stock
            SET @stock_nuevo = @stock_anterior + @cantidad;
            
            -- Actualizar stock
            UPDATE StockGeneral
            SET cantidad_actual = @stock_nuevo,
                ultima_actualizacion = GETDATE()
            WHERE producto_id = @producto_id;
        END
        ELSE
        BEGIN
            -- Crear nuevo registro
            INSERT INTO StockGeneral (producto_id, cantidad_actual, ultima_actualizacion)
            VALUES (@producto_id, @cantidad, GETDATE());
            
            SET @stock_id_local = SCOPE_IDENTITY();
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
            motivo,
            observaciones
        )
        VALUES (
            @producto_id,
            N'Entrada',
            @cantidad,
            GETDATE(),
            @usuario_id,
            @motivo,
            @observaciones
        );
        
        SET @movimiento_id_local = SCOPE_IDENTITY();
        
        -- Log de actividad
        INSERT INTO LogsActividad (
            usuario_id, 
            tabla_afectada, 
            accion, 
            registro_id, 
            descripcion, 
            fecha_hora
        )
        VALUES (
            @usuario_id, 
            N'StockGeneral', 
            N'UPDATE', 
            @stock_id_local, 
            CONCAT(N'Entrada de stock. Producto ID: ', @producto_id, 
                  N', Cantidad: ', @cantidad, 
                  N', Stock anterior: ', @stock_anterior,
                  N', Stock nuevo: ', @stock_nuevo),
            GETDATE()
        );
        
        COMMIT TRANSACTION;
        
        -- Asignar valores a parÃ¡metros de salida
        SET @movimiento_id = @movimiento_id_local;
        SET @stock_id = @stock_id_local;
        SET @stock_actual = @stock_nuevo;
        SET @mensaje = N'Entrada de stock registrada exitosamente';
        
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
