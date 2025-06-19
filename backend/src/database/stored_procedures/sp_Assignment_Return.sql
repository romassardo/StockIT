-- sp_Assignment_Return.sql
CREATE PROCEDURE sp_Assignment_Return
    @assignment_id INT,
    @observaciones NVARCHAR(1000) = NULL,
    @usuario_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @inventario_id INT;
    DECLARE @current_estado NVARCHAR(20);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Obtener información de la asignación
        SELECT @inventario_id = inventario_id
        FROM Asignaciones 
        WHERE id = @assignment_id AND estado = 'Activa';
        
        IF @inventario_id IS NULL
        BEGIN
            THROW 50024, 'Asignación no encontrada o ya devuelta', 1;
        END
        
        -- Actualizar asignación
        UPDATE Asignaciones 
        SET estado = 'Devuelta',
            fecha_devolucion = GETDATE(),
            usuario_recibe_id = @usuario_id,
            observaciones = CASE 
                WHEN @observaciones IS NOT NULL THEN CONCAT(ISNULL(observaciones, ''), ' | DEVOLUCIÓN: ', @observaciones)
                ELSE observaciones
            END
        WHERE id = @assignment_id;
        
        -- Actualizar estado del inventario
        UPDATE InventarioIndividual 
        SET estado = 'Disponible', fecha_modificacion = GETDATE()
        WHERE id = @inventario_id;
        
        -- Log de actividad
        INSERT INTO LogsActividad (usuario_id, tabla_afectada, operacion, registro_id, valores_nuevos)
        VALUES (@usuario_id, 'Asignaciones', 'UPDATE', @assignment_id,
                '{"estado":"Devuelta","fecha_devolucion":"' + CONVERT(NVARCHAR, GETDATE(), 121) + '"}');
        
        COMMIT TRANSACTION;
        
        SELECT 'Devolución registrada exitosamente' as message;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO