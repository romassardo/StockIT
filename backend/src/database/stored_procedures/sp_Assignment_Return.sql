-- sp_Assignment_Return.sql
CREATE PROCEDURE sp_Assignment_Return
    @assignment_id INT,
    @observaciones NVARCHAR(1000) = NULL,
    @usuario_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @inventario_id INT;
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @ErrorSeverity INT;
    DECLARE @ErrorState INT;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Obtener información de la asignación activa
        SELECT @inventario_id = inventario_individual_id
        FROM Asignaciones 
        WHERE id = @assignment_id AND activa = 1;
        
        IF @inventario_id IS NULL
        BEGIN
            RAISERROR('Asignación no encontrada o ya devuelta', 16, 1);
            RETURN;
        END
        
        -- Actualizar asignación (marcar como inactiva y registrar devolución)
        UPDATE Asignaciones 
        SET activa = 0,
            fecha_devolucion = GETDATE(),
            usuario_recibe_id = @usuario_id,
            fecha_modificacion = GETDATE(),
            observaciones = CASE 
                WHEN @observaciones IS NOT NULL THEN CONCAT(ISNULL(observaciones, ''), ' | DEVOLUCIÓN: ', @observaciones)
                ELSE observaciones
            END
        WHERE id = @assignment_id;
        
        -- Actualizar estado del inventario individual
        UPDATE InventarioIndividual 
        SET estado = 'Disponible', 
            fecha_modificacion = GETDATE()
        WHERE id = @inventario_id;
        
        -- Log de actividad con formato JSON correcto
        INSERT INTO LogsActividad (usuario_id, tabla_afectada, accion, registro_id, descripcion)
        VALUES (@usuario_id, 'Asignaciones', 'UPDATE', @assignment_id,
                '{"activa":0,"fecha_devolucion":"' + CONVERT(NVARCHAR, GETDATE(), 121) + '"}');
        
        COMMIT TRANSACTION;
        
        SELECT 'Devolución registrada exitosamente' as message;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        SELECT @ErrorMessage = ERROR_MESSAGE(),
               @ErrorSeverity = ERROR_SEVERITY(),
               @ErrorState = ERROR_STATE();
               
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END;
GO