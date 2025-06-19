USE StockIT;
GO

-- =============================================
-- Author:      Cascade
-- Create date: 2025-05-31
-- Description: Registra el retorno de un dispositivo enviado a reparación.
--              Actualiza el estado del dispositivo en InventarioIndividual según el resultado.
-- =============================================
CREATE PROCEDURE dbo.sp_Repair_Complete
    @reparacion_id INT,
    @estado_reparacion NVARCHAR(20), -- 'Reparado' o 'Sin Reparación'
    @solucion_descripcion NVARCHAR(MAX),
    @usuario_recibe_id INT,
    @observaciones NVARCHAR(MAX) = NULL,
    @motivo_baja NVARCHAR(MAX) = NULL -- Requerido si estado_reparacion = 'Sin Reparación'
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @ErrorSeverity INT;
    DECLARE @ErrorState INT;
    
    DECLARE @inventario_individual_id INT;
    DECLARE @estado_actual NVARCHAR(20);
    DECLARE @log_details NVARCHAR(MAX);
    DECLARE @estado_final_inventario NVARCHAR(20);

    BEGIN TRY
        -- Validar que el usuario que recibe existe y está activo
        IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE id = @usuario_recibe_id AND activo = 1)
        BEGIN
            RAISERROR('El usuario que recibe la reparación no existe o no está activo.', 16, 1);
            RETURN;
        END

        -- Validar el estado de reparación proporcionado
        IF @estado_reparacion NOT IN ('Reparado', 'Sin Reparación')
        BEGIN
            RAISERROR('Estado de reparación inválido. Debe ser ''Reparado'' o ''Sin Reparación''.', 16, 1);
            RETURN;
        END

        -- Validar motivo de baja para dispositivos no reparados
        IF @estado_reparacion = 'Sin Reparación' AND (@motivo_baja IS NULL OR LEN(TRIM(@motivo_baja)) < 5)
        BEGIN
            RAISERROR('Para dispositivos no reparados, debe proporcionar un motivo de baja válido (mínimo 5 caracteres).', 16, 1);
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
            RAISERROR('La reparación debe estar en estado ''En Reparación'' para ser completada. Estado actual: %s.', 16, 1, @estado_actual);
            RETURN;
        END

        -- Determinar el estado final del inventario según el resultado de la reparación
        IF @estado_reparacion = 'Reparado'
            SET @estado_final_inventario = 'Disponible';
        ELSE -- 'Sin Reparación'
            SET @estado_final_inventario = 'Dado de Baja';

        -- Iniciar Transacción
        BEGIN TRANSACTION;

        -- Actualizar el registro de reparación
        UPDATE dbo.Reparaciones
        SET 
            estado = @estado_reparacion,
            solucion_descripcion = @solucion_descripcion,
            usuario_recibe_id = @usuario_recibe_id,
            fecha_retorno = GETDATE(),
            fecha_modificacion = GETDATE()
        WHERE id = @reparacion_id;

        -- Actualizar el estado del ítem en InventarioIndividual
        UPDATE dbo.InventarioIndividual
        SET 
            estado = @estado_final_inventario,
            motivo_baja = CASE WHEN @estado_reparacion = 'Sin Reparación' THEN @motivo_baja ELSE NULL END
        WHERE id = @inventario_individual_id;

        -- Registrar en LogsActividad
        SET @log_details = CONCAT('Reparación ID: ', @reparacion_id, 
                                ' completada con estado: ', @estado_reparacion, 
                                '. InventarioIndividualID: ', @inventario_individual_id, 
                                '. Estado del ítem actualizado a: ', @estado_final_inventario);

        INSERT INTO dbo.LogsActividad (
            usuario_id,
            tabla_afectada,
            accion,
            registro_id,
            descripcion
        )
        VALUES (
            @usuario_recibe_id,
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
