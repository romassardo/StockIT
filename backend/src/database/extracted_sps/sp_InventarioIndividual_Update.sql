
CREATE PROCEDURE sp_InventarioIndividual_Update
    @inventario_id INT,
    @numero_serie NVARCHAR(100),
    @motivo_baja NVARCHAR(MAX) = NULL,
    @usuario_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @error_msg NVARCHAR(500);
    DECLARE @producto_id INT;
    DECLARE @estado_actual NVARCHAR(20);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar que el Ã­tem existe
        IF NOT EXISTS (SELECT 1 FROM InventarioIndividual WHERE id = @inventario_id)
        BEGIN
            SET @error_msg = N'El Ã­tem de inventario no existe';
            THROW 50004, @error_msg, 1;
        END
        
        -- Obtener datos actuales
        SELECT 
            @producto_id = producto_id,
            @estado_actual = estado
        FROM 
            InventarioIndividual 
        WHERE 
            id = @inventario_id;
        
        -- Validar que no estÃ© asignado o en reparaciÃ³n
        IF @estado_actual IN (N'Asignado', N'En ReparaciÃ³n')
        BEGIN
            SET @error_msg = N'No se puede modificar un Ã­tem que estÃ¡ ' + @estado_actual;
            THROW 50006, @error_msg, 1;
        END
        
        -- Validar que el nÃºmero de serie no existe (si cambiÃ³)
        IF EXISTS (
            SELECT 1 
            FROM InventarioIndividual 
            WHERE numero_serie = @numero_serie 
            AND id != @inventario_id
        )
        BEGIN
            SET @error_msg = N'El nÃºmero de serie ya existe en otro Ã­tem';
            THROW 50007, @error_msg, 1;
        END
        
        -- Actualizar inventario individual
        UPDATE InventarioIndividual
        SET 
            numero_serie = @numero_serie,
            motivo_baja = @motivo_baja,
            fecha_modificacion = GETDATE()
        WHERE 
            id = @inventario_id;
        
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
            N'InventarioIndividual', 
            N'UPDATE', 
            @inventario_id, 
            CONCAT(N'ActualizaciÃ³n de inventario individual. ID: ', @inventario_id, N', NÃºmero de serie: ', @numero_serie),
            GETDATE()
        );
        
        COMMIT TRANSACTION;
        
        -- Retornar mensaje de Ã©xito
        SELECT 
            @inventario_id AS id, 
            N'Ãtem de inventario individual actualizado exitosamente' AS mensaje;
        
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
