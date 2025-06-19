-- =============================================
-- Author:      StockIT Dev Team
-- Create date: 27/05/2025
-- Description: Actualizar el estado de un ítem de inventario individual
-- =============================================
USE StockIT;
GO

-- Verificar si el procedimiento ya existe y eliminarlo
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_InventarioIndividual_UpdateEstado')
BEGIN
    DROP PROCEDURE sp_InventarioIndividual_UpdateEstado;
    PRINT N'Procedimiento sp_InventarioIndividual_UpdateEstado eliminado para su recreación.';
END
GO

CREATE PROCEDURE sp_InventarioIndividual_UpdateEstado
    @inventario_id INT,
    @nuevo_estado NVARCHAR(20),
    @motivo NVARCHAR(MAX) = NULL,
    @usuario_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @error_msg NVARCHAR(500);
    DECLARE @estado_actual NVARCHAR(20);
    DECLARE @asignacion_activa BIT = 0;
    DECLARE @reparacion_activa BIT = 0;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar que el ítem existe
        IF NOT EXISTS (SELECT 1 FROM InventarioIndividual WHERE id = @inventario_id)
        BEGIN
            SET @error_msg = N'El ítem de inventario no existe';
            THROW 50004, @error_msg, 1;
        END
        
        -- Obtener estado actual
        SELECT @estado_actual = estado
        FROM InventarioIndividual 
        WHERE id = @inventario_id;
        
        -- Validar que el nuevo estado sea válido
        IF @nuevo_estado NOT IN (N'Disponible', N'Asignado', N'En Reparación', N'Dado de Baja')
        BEGIN
            SET @error_msg = N'Estado no válido. Los estados permitidos son: Disponible, Asignado, En Reparación, Dado de Baja';
            THROW 50008, @error_msg, 1;
        END
        
        -- Verificar si tiene asignación activa
        SELECT @asignacion_activa = 
            CASE WHEN EXISTS (
                SELECT 1 FROM Asignaciones 
                WHERE inventario_individual_id = @inventario_id AND activa = 1
            ) THEN 1 ELSE 0 END;
        
        -- Verificar si tiene reparación activa
        SELECT @reparacion_activa = 
            CASE WHEN EXISTS (
                SELECT 1 FROM Reparaciones 
                WHERE inventario_individual_id = @inventario_id AND estado = N'En Reparación'
            ) THEN 1 ELSE 0 END;
        
        -- Validar reglas de cambio de estado
        IF @estado_actual = N'Asignado' AND @nuevo_estado NOT IN (N'Disponible', N'En Reparación')
        BEGIN
            SET @error_msg = N'Un ítem Asignado solo puede cambiar a Disponible o En Reparación';
            THROW 50009, @error_msg, 1;
        END
        
        IF @estado_actual = N'En Reparación' AND @nuevo_estado NOT IN (N'Disponible', N'Asignado', N'Dado de Baja')
        BEGIN
            SET @error_msg = N'Un ítem En Reparación solo puede cambiar a Disponible, Asignado o Dado de Baja';
            THROW 50010, @error_msg, 1;
        END
        
        IF @nuevo_estado = N'Asignado' AND @asignacion_activa = 0
        BEGIN
            SET @error_msg = N'No se puede cambiar a estado Asignado sin una asignación activa';
            THROW 50011, @error_msg, 1;
        END
        
        IF @nuevo_estado = N'En Reparación' AND @reparacion_activa = 0
        BEGIN
            SET @error_msg = N'No se puede cambiar a estado En Reparación sin una reparación activa';
            THROW 50012, @error_msg, 1;
        END
        
        -- Actualizar estado
        UPDATE InventarioIndividual
        SET 
            estado = @nuevo_estado,
            fecha_baja = CASE WHEN @nuevo_estado = N'Dado de Baja' THEN GETDATE() ELSE fecha_baja END,
            motivo_baja = CASE WHEN @nuevo_estado = N'Dado de Baja' THEN @motivo ELSE motivo_baja END,
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
            N'UPDATE_ESTADO', 
            @inventario_id, 
            CONCAT(N'Cambio de estado de inventario. ID: ', @inventario_id, 
                   N', Estado anterior: ', @estado_actual, 
                   N', Nuevo estado: ', @nuevo_estado,
                   CASE WHEN @motivo IS NOT NULL THEN CONCAT(N', Motivo: ', @motivo) ELSE N'' END),
            GETDATE()
        );
        
        COMMIT TRANSACTION;
        
        -- Retornar mensaje de éxito
        SELECT 
            @inventario_id AS id, 
            CONCAT(N'Estado actualizado de "', @estado_actual, N'" a "', @nuevo_estado, N'"') AS mensaje;
        
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
GO

PRINT N'Procedimiento sp_InventarioIndividual_UpdateEstado creado exitosamente.';
GO