-- sp_Assignment_Cancel.sql
CREATE   PROCEDURE sp_Assignment_Cancel
    @assignment_id INT,
    @motivo NVARCHAR(1000),
    @usuario_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @inventario_individual_id INT;
    DECLARE @current_activa BIT;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Obtener informaciÃ³n de la asignaciÃ³n
        SELECT @inventario_individual_id = inventario_individual_id, @current_activa = activa
        FROM Asignaciones 
        WHERE id = @assignment_id;
        
        IF @inventario_individual_id IS NULL
        BEGIN
            THROW 50025, 'AsignaciÃ³n no encontrada', 1;
        END
        
        IF @current_activa = 0
        BEGIN
            THROW 50026, 'No se puede cancelar una asignaciÃ³n que no estÃ¡ activa', 1;
        END
        
        -- Actualizar asignaciÃ³n
        UPDATE Asignaciones 
        SET activa = 0,
            fecha_devolucion = GETDATE(),
            usuario_recibe_id = @usuario_id,
            observaciones = CASE 
                WHEN observaciones IS NOT NULL THEN CONCAT(observaciones, ' | CANCELACIÃ“N: ', @motivo)
                ELSE CONCAT('CANCELACIÃ“N: ', @motivo)
            END
        WHERE id = @assignment_id;
        
        -- Actualizar estado del inventario
        UPDATE InventarioIndividual 
        SET estado = 'Disponible', fecha_modificacion = GETDATE()
        WHERE id = @inventario_individual_id;
        
        -- Log de actividad
        INSERT INTO LogsActividad (usuario_id, tabla_afectada, accion, registro_id, descripcion)
        VALUES (@usuario_id, 'Asignaciones', 'UPDATE', @assignment_id,
                '{"activa":"0","fecha_devolucion":"' + CONVERT(NVARCHAR, GETDATE(), 121) + '","motivo":"' + @motivo + '"}');
        
        COMMIT TRANSACTION;
        
        SELECT 'AsignaciÃ³n cancelada exitosamente' as message;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
