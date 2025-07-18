
CREATE PROCEDURE sp_StockGeneral_Update
    @stock_id INT,
    @ubicacion NVARCHAR(100) = NULL,
    @observaciones NVARCHAR(MAX) = NULL,
    @usuario_id INT,
    @mensaje NVARCHAR(500) = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @error_msg NVARCHAR(500);
    DECLARE @producto_id INT;
    DECLARE @ubicacion_anterior NVARCHAR(100);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar que el stock existe
        IF NOT EXISTS (SELECT 1 FROM StockGeneral WHERE id = @stock_id)
        BEGIN
            SET @error_msg = N'El registro de stock no existe';
            THROW 50001, @error_msg, 1;
        END
        
        -- Obtener informaciÃ³n actual
        SELECT 
            @producto_id = producto_id,
            @ubicacion_anterior = ubicacion
        FROM StockGeneral 
        WHERE id = @stock_id;
        
        -- Actualizar stock
        UPDATE StockGeneral
        SET ubicacion = ISNULL(@ubicacion, ubicacion),
            ultima_actualizacion = GETDATE()
        WHERE id = @stock_id;
        
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
            @stock_id, 
            CONCAT(N'ActualizaciÃ³n de stock. Producto ID: ', @producto_id, 
                  N', UbicaciÃ³n anterior: ', ISNULL(@ubicacion_anterior, N'Sin ubicaciÃ³n'), 
                  N', Nueva ubicaciÃ³n: ', ISNULL(@ubicacion, N'Sin cambios'),
                  CASE WHEN @observaciones IS NOT NULL THEN CONCAT(N', Observaciones: ', @observaciones) ELSE N'' END),
            GETDATE()
        );
        
        COMMIT TRANSACTION;
        
        -- Asignar valores a parÃ¡metros de salida
        SET @mensaje = N'InformaciÃ³n de stock actualizada exitosamente';
        
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
