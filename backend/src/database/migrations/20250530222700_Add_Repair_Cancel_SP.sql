/*
Migración para agregar el Stored Procedure sp_Repair_Cancel
Fecha: 30/05/2025
*/

-- Procedimiento para cancelar una reparación
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_Repair_Cancel')
    DROP PROCEDURE dbo.sp_Repair_Cancel
GO

CREATE PROCEDURE dbo.sp_Repair_Cancel
    @reparacion_id INT,
    @motivo_cancelacion NVARCHAR(MAX),
    @usuario_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @inventario_id INT;
    DECLARE @estado_actual NVARCHAR(20);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verificar que la reparación existe y está en estado "Enviado"
        SELECT 
            @inventario_id = r.inventario_individual_id,
            @estado_actual = r.estado
        FROM 
            Reparaciones r
        WHERE 
            r.id = @reparacion_id;
            
        IF @inventario_id IS NULL
        BEGIN
            RAISERROR('La reparación especificada no existe', 16, 1);
            RETURN;
        END
        
        IF @estado_actual <> 'Enviado'
        BEGIN
            RAISERROR('Solo se pueden cancelar reparaciones en estado "Enviado"', 16, 1);
            RETURN;
        END
        
        IF @motivo_cancelacion IS NULL OR LEN(@motivo_cancelacion) < 5
        BEGIN
            RAISERROR('Debe proporcionar un motivo de cancelación válido', 16, 1);
            RETURN;
        END
        
        -- Actualizar registro de reparación
        UPDATE dbo.Reparaciones
        SET 
            estado = 'Cancelado',
            fecha_retorno = GETDATE(),
            solucion_descripcion = CONCAT('Cancelado: ', @motivo_cancelacion),
            usuario_recibe_id = @usuario_id,
            fecha_modificacion = GETDATE()
        WHERE 
            id = @reparacion_id;
            
        -- Actualizar estado del inventario (volver a disponible)
        UPDATE InventarioIndividual
        SET 
            estado = 'Disponible',
            fecha_modificacion = GETDATE()
        WHERE 
            id = @inventario_id;
            
        -- Registrar actividad
        INSERT INTO dbo.LogsActividad (
            usuario_id,
            tabla_afectada,
            accion,
            registro_id,
            descripcion
        )
        VALUES (
            @usuario_id,
            'Reparaciones',
            'UPDATE',
            @reparacion_id,
            CONCAT('{"estado":"Cancelado","inventario_id":', @inventario_id, ',"motivo":"', @motivo_cancelacion, '"}')
        );
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO
