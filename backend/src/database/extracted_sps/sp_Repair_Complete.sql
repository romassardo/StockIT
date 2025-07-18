CREATE PROCEDURE dbo.sp_Repair_Complete
    @reparacion_id INT,
    @estado_reparacion NVARCHAR(20),
    @solucion_descripcion NVARCHAR(MAX) = NULL,
    @usuario_recibe_id INT,
    @motivo_baja NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @inventario_id INT;
    DECLARE @estado_actual NVARCHAR(20);
    DECLARE @nuevo_estado_inventario NVARCHAR(20);
    
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
            RAISERROR('Solo se pueden completar reparaciones en estado "Enviado"', 16, 1);
            RETURN;
        END
        
        -- Validar el estado de reparación
        IF @estado_reparacion NOT IN ('Reparado', 'Sin Reparación')
        BEGIN
            RAISERROR('Estado de reparación inválido. Debe ser "Reparado" o "Sin Reparación"', 16, 1);
            RETURN;
        END
        
        -- Determinar nuevo estado para el inventario
        IF @estado_reparacion = 'Reparado'
        BEGIN
            SET @nuevo_estado_inventario = 'Disponible';
            
            IF @solucion_descripcion IS NULL OR LEN(@solucion_descripcion) < 5
            BEGIN
                RAISERROR('Debe proporcionar una descripción de la solución para ítems reparados', 16, 1);
                RETURN;
            END
        END
        ELSE -- 'Sin Reparación'
        BEGIN
            SET @nuevo_estado_inventario = 'Baja';
            
            IF @motivo_baja IS NULL OR LEN(@motivo_baja) < 5
            BEGIN
                RAISERROR('Debe proporcionar un motivo de baja para ítems sin reparación', 16, 1);
                RETURN;
            END
        END
        
        -- Actualizar registro de reparación
        UPDATE dbo.Reparaciones
        SET 
            fecha_retorno = GETDATE(),
            solucion_descripcion = @solucion_descripcion,
            estado = @estado_reparacion,
            usuario_recibe_id = @usuario_recibe_id,
            fecha_modificacion = GETDATE()
        WHERE 
            id = @reparacion_id;
            
        -- Actualizar estado del inventario
        UPDATE InventarioIndividual
        SET 
            estado = @nuevo_estado_inventario,
            fecha_baja = CASE 
                WHEN @nuevo_estado_inventario = 'Baja' THEN GETDATE()
                ELSE NULL
            END,
            motivo_baja = CASE 
                WHEN @nuevo_estado_inventario = 'Baja' THEN @motivo_baja
                ELSE NULL
            END,
            usuario_baja_id = CASE 
                WHEN @nuevo_estado_inventario = 'Baja' THEN @usuario_recibe_id
                ELSE NULL
            END,
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
            @usuario_recibe_id,
            'Reparaciones',
            'UPDATE',
            @reparacion_id,
            CONCAT('{"estado":"', @estado_reparacion, '","inventario_id":', @inventario_id, ',"solucion":"', ISNULL(@solucion_descripcion, ''), '"}')
        );
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END