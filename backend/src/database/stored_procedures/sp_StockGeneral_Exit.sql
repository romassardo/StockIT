-- =============================================
-- Author:      StockIT Dev Team
-- Create date: 27/05/2025
-- Description: Registrar salida de stock (para productos sin número de serie)
-- =============================================
USE StockIT;
GO

-- Verificar si el procedimiento ya existe y eliminarlo
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_StockGeneral_Exit')
BEGIN
    DROP PROCEDURE sp_StockGeneral_Exit;
    PRINT N'Procedimiento sp_StockGeneral_Exit eliminado para su recreación.';
END
GO

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
    DECLARE @current_stock INT = 0;
    DECLARE @stock_minimo INT = 0;
    DECLARE @error_msg NVARCHAR(500);
    DECLARE @movimiento_id_local INT;
    DECLARE @stock_id_local INT;
    DECLARE @destino_count INT = 0;
    DECLARE @destino_tipo NVARCHAR(20);
    DECLARE @destino_id INT;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar que el producto existe
        IF NOT EXISTS (SELECT 1 FROM Productos WHERE id = @producto_id AND activo = 1)
        BEGIN
            SET @error_msg = N'El producto no existe o está inactivo';
            THROW 50001, @error_msg, 1;
        END
        
        -- Validar que la cantidad es positiva
        IF @cantidad <= 0
        BEGIN
            SET @error_msg = N'La cantidad debe ser mayor a cero';
            THROW 50002, @error_msg, 1;
        END
        
        -- Validar longitud del motivo
        IF LEN(RTRIM(LTRIM(@motivo))) < 5
        BEGIN
            SET @error_msg = N'El motivo debe tener al menos 5 caracteres';
            THROW 50011, @error_msg, 1; -- Nuevo código de error para motivo corto
        END
        
        -- Validar que el producto NO usa número de serie
        SELECT @usa_numero_serie = usa_numero_serie, @stock_minimo = stock_minimo
        FROM Productos 
        WHERE id = @producto_id;
        
        IF @usa_numero_serie = 1
        BEGIN
            SET @error_msg = N'Este producto usa número de serie y debe gestionarse por InventarioIndividual';
            THROW 50003, @error_msg, 1;
        END
        
        -- Validar que tiene como máximo un destino (empleado, sector o sucursal)
        IF @empleado_id IS NOT NULL SET @destino_count = @destino_count + 1;
        IF @sector_id IS NOT NULL SET @destino_count = @destino_count + 1;
        IF @sucursal_id IS NOT NULL SET @destino_count = @destino_count + 1;
        
        IF @destino_count > 1
        BEGIN
            SET @error_msg = N'Solo puede especificar un destino: empleado, sector o sucursal';
            THROW 50004, @error_msg, 1;
        END

        IF @destino_count = 0
        BEGIN
            SET @error_msg = N'Debe especificar al menos un destino: empleado, sector o sucursal';
            THROW 50010, @error_msg, 1; -- Usando un nuevo código de error
        END
        
        -- Determinar el tipo y ID del destino
        IF @empleado_id IS NOT NULL
        BEGIN
            SET @destino_tipo = N'Empleado';
            SET @destino_id = @empleado_id;
            
            -- Validar que el empleado existe
            IF NOT EXISTS (SELECT 1 FROM Empleados WHERE id = @empleado_id AND activo = 1)
            BEGIN
                SET @error_msg = N'El empleado no existe o está inactivo';
                THROW 50005, @error_msg, 1;
            END
        END
        ELSE IF @sector_id IS NOT NULL
        BEGIN
            SET @destino_tipo = N'Sector';
            SET @destino_id = @sector_id;
            
            -- Validar que el sector existe
            IF NOT EXISTS (SELECT 1 FROM Sectores WHERE id = @sector_id AND activo = 1)
            BEGIN
                SET @error_msg = N'El sector no existe o está inactivo';
                THROW 50006, @error_msg, 1;
            END
        END
        ELSE IF @sucursal_id IS NOT NULL
        BEGIN
            SET @destino_tipo = N'Sucursal';
            SET @destino_id = @sucursal_id;
            
            -- Validar que la sucursal existe
            IF NOT EXISTS (SELECT 1 FROM Sucursales WHERE id = @sucursal_id AND activo = 1)
            BEGIN
                SET @error_msg = N'La sucursal no existe o está inactiva';
                THROW 50007, @error_msg, 1;
            END
        END
        
        -- Verificar si existe stock suficiente
        SELECT @stock_id_local = id, @current_stock = cantidad_actual
        FROM StockGeneral
        WHERE producto_id = @producto_id;
        
        IF @@ROWCOUNT = 0
        BEGIN
            SET @error_msg = N'No existe registro de stock para este producto';
            THROW 50008, @error_msg, 1;
        END
        
        IF @current_stock < @cantidad
        BEGIN
            SET @error_msg = CONCAT(N'Stock insuficiente. Stock actual: ', @current_stock, N', Cantidad solicitada: ', @cantidad);
            THROW 50009, @error_msg, 1;
        END
        
        -- Actualizar el stock
        UPDATE StockGeneral
        SET cantidad_actual = cantidad_actual - @cantidad,
            ultima_actualizacion = GETDATE()
        WHERE producto_id = @producto_id;
        
        -- Registrar el movimiento
        INSERT INTO MovimientosStock (
            producto_id,
            tipo_movimiento,
            cantidad,
            fecha_movimiento,
            usuario_id,
            empleado_id,
            sector_id,
            sucursal_id,
            motivo,
            observaciones
        )
        VALUES (
            @producto_id,
            N'Salida',
            @cantidad,
            GETDATE(),
            @usuario_id,
            @empleado_id,
            @sector_id,
            @sucursal_id,
            @motivo,
            @observaciones
        );
        
        SET @movimiento_id_local = SCOPE_IDENTITY();
        
        -- Segundo log de actividad para MovimientosStock
        INSERT INTO LogsActividad (
            usuario_id, 
            tabla_afectada, 
            operacion, 
            registro_id, 
            valores_nuevos, -- Asumiendo que descripcion mapea a valores_nuevos
            fecha_operacion
        )
        VALUES (
            @usuario_id, 
            N'MovimientosStock',
            N'INSERT',
            @movimiento_id_local, 
            CONCAT(N'Nueva salida de stock registrada. Movimiento ID: ', @movimiento_id_local,
                  N', Producto ID: ', @producto_id,
                  N', Cantidad: ', @cantidad,
                  N', Destino: ', ISNULL(@destino_tipo, N'Sin destino'), 
                  N', ID destino: ', ISNULL(CAST(@destino_id AS NVARCHAR), N'N/A')),
            GETDATE()
        );
        
        -- Log de actividad para StockGeneral
        INSERT INTO LogsActividad (
            usuario_id, 
            tabla_afectada, 
            operacion, 
            registro_id, 
            valores_nuevos, -- Asumiendo que descripcion mapea a valores_nuevos
            fecha_operacion
        )
        VALUES (
            @usuario_id, 
            N'StockGeneral', 
            N'UPDATE', 
            @stock_id_local, 
            CONCAT(N'Salida de stock. Producto ID: ', @producto_id, 
                  N', Cantidad: ', @cantidad, 
                  N', Stock anterior: ', @current_stock, 
                  N', Stock actual: ', @current_stock - @cantidad,
                  N', Destino: ', ISNULL(@destino_tipo, N'Sin destino'), 
                  N', ID destino: ', ISNULL(CAST(@destino_id AS NVARCHAR), N'N/A')),
            GETDATE()
        );
        
        -- Verificar si quedó por debajo del stock mínimo y generar alerta
        DECLARE @alerta_bajo_stock_local BIT = 0;
        
        IF (@current_stock - @cantidad) < @stock_minimo
        BEGIN
            SET @alerta_bajo_stock_local = 1;
            
            -- Log para alerta de bajo stock
            INSERT INTO LogsActividad (
                usuario_id,
                tabla_afectada,
                operacion, 
                registro_id, 
                valores_nuevos, -- Asumiendo que descripcion mapea a valores_nuevos
                fecha_operacion
            )
            VALUES (
                ISNULL(@usuario_id, -1), 
                N'SystemError',
                N'ERROR',
                0, -- CORREGIDO: Usar 0 para registro_id en caso de error del sistema
                CONCAT(N'Error en SP: ', ISNULL(@ErrorProcedure, 'N/A'), N', Línea: ', ISNULL(CAST(@ErrorLine AS NVARCHAR), 'N/A'), N', Mensaje: ', @ErrorMessage),
                GETDATE()
            );
        END
        
        COMMIT TRANSACTION;
        
        -- Asignar valores a parámetros de salida
        SET @movimiento_id = @movimiento_id_local;
        SET @stock_id = @stock_id_local;
        SET @stock_actual = @current_stock - @cantidad;
        SET @alerta_bajo_stock = @alerta_bajo_stock_local;
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
GO

PRINT N'Procedimiento sp_StockGeneral_Exit creado exitosamente.';
GO
