-- sp_Assignment_Cancel.sql
CREATE PROCEDURE sp_Assignment_Cancel
    @assignment_id INT,
    @motivo NVARCHAR(1000),
    @usuario_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @inventario_id INT;
    DECLARE @current_estado NVARCHAR(20);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Obtener información de la asignación
        SELECT @inventario_id = inventario_id, @current_estado = estado
        FROM Asignaciones 
        WHERE id = @assignment_id;
        
        IF @inventario_id IS NULL
        BEGIN
            THROW 50025, 'Asignación no encontrada', 1;
        END
        
        IF @current_estado != 'Activa'
        BEGIN
            DECLARE @error_cancel NVARCHAR(200) = CONCAT('No se puede cancelar una asignación que no está activa. Estado actual: ', @current_estado);
            THROW 50026, @error_cancel, 1;
        END
        
        -- Actualizar asignación
        UPDATE Asignaciones 
        SET estado = 'Cancelada',
            fecha_devolucion = GETDATE(),
            usuario_recibe_id = @usuario_id,
            observaciones = CASE 
                WHEN observaciones IS NOT NULL THEN CONCAT(observaciones, ' | CANCELACIÓN: ', @motivo)
                ELSE CONCAT('CANCELACIÓN: ', @motivo)
            END
        WHERE id = @assignment_id;
        
        -- Actualizar estado del inventario
        UPDATE InventarioIndividual 
        SET estado = 'Disponible', fecha_modificacion = GETDATE()
        WHERE id = @inventario_id;
        
        -- Log de actividad
        INSERT INTO LogsActividad (usuario_id, tabla_afectada, operacion, registro_id, valores_nuevos)
        VALUES (@usuario_id, 'Asignaciones', 'UPDATE', @assignment_id,
                '{"estado":"Cancelada","fecha_devolucion":"' + CONVERT(NVARCHAR, GETDATE(), 121) + '","motivo":"' + @motivo + '"}');
        
        COMMIT TRANSACTION;
        
        SELECT 'Asignación cancelada exitosamente' as message;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO