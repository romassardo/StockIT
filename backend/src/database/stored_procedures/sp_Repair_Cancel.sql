USE StockIT;
GO

-- =============================================
-- Author:      Cascade
-- Create date: 2025-05-31
-- Description: Cancela una reparación en curso y restaura el estado del dispositivo
--              a 'Disponible'.
-- =============================================
CREATE PROCEDURE dbo.sp_Repair_Cancel
    @reparacion_id INT,
    @motivo_cancelacion NVARCHAR(MAX),
    @usuario_id INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @ErrorSeverity INT;
    DECLARE @ErrorState INT;
    
    DECLARE @inventario_individual_id INT;
    DECLARE @estado_actual NVARCHAR(20);
    DECLARE @log_details NVARCHAR(MAX);

    BEGIN TRY
        -- Validar que el usuario existe y está activo
        IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE id = @usuario_id AND activo = 1)
        BEGIN
            RAISERROR('El usuario no existe o no está activo.', 16, 1);
            RETURN;
        END

        -- Validar motivo de cancelación
        IF @motivo_cancelacion IS NULL OR LEN(TRIM(@motivo_cancelacion)) < 5
        BEGIN
            RAISERROR('Debe proporcionar un motivo de cancelación válido (mínimo 5 caracteres).', 16, 1);
            RETURN;
        END

        -- Obtener información de la reparación
        SELECT 
            @inventario_individual_id = r.inventario_individual_id,
            @estado_actual = r.estado
        FROM dbo.Reparaciones r
        WHERE r.id = @reparacion_id;

        IF @inventario_individual_id IS NULL
        BEGIN
            RAISERROR('La reparación especificada no existe.', 16, 1);
            RETURN;
        END

        -- Validar que la reparación esté en estado 'En Reparación'
        IF @estado_actual != 'En Reparación'
        BEGIN
            RAISERROR('Solo se pueden cancelar reparaciones en estado ''En Reparación''. Estado actual: %s.', 16, 1, @estado_actual);
            RETURN;
        END

        -- Iniciar Transacción
        BEGIN TRANSACTION;

        -- Actualizar el registro de reparación
        UPDATE dbo.Reparaciones
        SET 
            estado = 'Cancelado',
            fecha_retorno = GETDATE(),
            solucion_descripcion = CONCAT('CANCELACIÓN: ', @motivo_cancelacion),
            fecha_modificacion = GETDATE()
        WHERE id = @reparacion_id;

        -- Actualizar el estado del ítem en InventarioIndividual
        UPDATE dbo.InventarioIndividual
        SET 
            estado = 'Disponible'
        WHERE id = @inventario_individual_id;

        -- Registrar en LogsActividad
        SET @log_details = CONCAT('Reparación ID: ', @reparacion_id, 
                                ' cancelada. InventarioIndividualID: ', @inventario_individual_id, 
                                '. Motivo: ', @motivo_cancelacion,
                                '. Estado del ítem restaurado a Disponible.');

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
            @log_details
        );

        -- Confirmar Transacción
        COMMIT TRANSACTION;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        SELECT 
            @ErrorMessage = ERROR_MESSAGE(),
            @ErrorSeverity = ERROR_SEVERITY(),
            @ErrorState = ERROR_STATE();

        RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH;
END;
GO
