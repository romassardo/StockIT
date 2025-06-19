USE StockIT;
GO

-- =============================================
-- Author:      Cascade
-- Create date: 2025-05-31
-- Description: Crea un nuevo registro de reparación para un ítem de inventario individual.
--              Actualiza el estado del ítem en InventarioIndividual a 'En Reparación'.
-- =============================================
CREATE PROCEDURE dbo.sp_Repair_Create
    @inventario_individual_id INT,
    @descripcion_problema NVARCHAR(MAX),
    @usuario_envia_id INT,
    @proveedor_reparacion NVARCHAR(100) = NULL,
    @costo_reparacion_estimado DECIMAL(10, 2) = NULL, -- Usaremos el campo costo_reparacion para el estimado inicial si se provee
    @observaciones NVARCHAR(MAX) = NULL,
    @NuevaReparacionID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @ErrorSeverity INT;
    DECLARE @ErrorState INT;

    DECLARE @producto_id INT;
    DECLARE @usa_numero_serie BIT;
    DECLARE @estado_actual_inventario NVARCHAR(50);
    DECLARE @log_details NVARCHAR(MAX);

    BEGIN TRY
        -- Validar que el usuario que envía existe y está activo
        IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE id = @usuario_envia_id AND activo = 1)
        BEGIN
            RAISERROR('El usuario que envía la reparación no existe o no está activo.', 16, 1);
            RETURN;
        END

        -- Validar que el ítem de inventario individual existe
        SELECT 
            @producto_id = ii.producto_id,
            @estado_actual_inventario = ii.estado
        FROM dbo.InventarioIndividual ii
        WHERE ii.id = @inventario_individual_id;

        IF @producto_id IS NULL
        BEGIN
            RAISERROR('El ítem de inventario individual especificado no existe.', 16, 1);
            RETURN;
        END

        -- Validar que el producto asociado usa número de serie
        SELECT @usa_numero_serie = p.usa_numero_serie
        FROM dbo.Productos p
        WHERE p.id = @producto_id;

        IF @usa_numero_serie = 0
        BEGIN
            RAISERROR('El producto asociado al ítem de inventario no es reparable (no usa número de serie).', 16, 1);
            RETURN;
        END

        -- Validar el estado actual del ítem de inventario
        IF @estado_actual_inventario != 'Disponible'
        BEGIN
            RAISERROR('El ítem de inventario debe estar en estado ''Disponible'' para ser enviado a reparación. Estado actual: %s.', 16, 1, @estado_actual_inventario);
            RETURN;
        END
        
        -- Iniciar Transacción
        BEGIN TRANSACTION;

        -- Insertar el nuevo registro de reparación
        INSERT INTO dbo.Reparaciones (
            inventario_individual_id,
            descripcion_problema,
            usuario_envia_id,
            proveedor_reparacion,
            costo_reparacion, -- Se usa para el costo estimado en la creación
            observaciones,
            estado_reparacion, -- Estado inicial
            fecha_ingreso_reparacion
        )
        VALUES (
            @inventario_individual_id,
            @descripcion_problema,
            @usuario_envia_id,
            @proveedor_reparacion,
            @costo_reparacion_estimado,
            @observaciones,
            'Enviado',         -- Estado inicial según flujo definido
            GETDATE()
        );

        SET @NuevaReparacionID = SCOPE_IDENTITY();

        -- Actualizar el estado del ítem en InventarioIndividual
        UPDATE dbo.InventarioIndividual
        SET estado = 'En Reparación'
        WHERE id = @inventario_individual_id;

        -- Registrar en LogsActividad
        SET @log_details = CONCAT('Nueva reparación creada con ID: ', @NuevaReparacionID, 
                                ' para InventarioIndividualID: ', @inventario_individual_id, 
                                '. Problema: ', @descripcion_problema, 
                                '. Estado del ítem actualizado a En Reparación.');

        INSERT INTO dbo.LogsActividad (
            usuario_id,
            operacion,
            tabla_afectada,
            registro_id,
            detalles
        )
        VALUES (
            @usuario_envia_id,
            'INSERT',
            'Reparaciones',
            @NuevaReparacionID,
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
