-- =============================================
-- Author:      StockIT Dev Team
-- Create date: 27/05/2025
-- Description: Crear un nuevo ítem de inventario individual (solo para notebooks y celulares)
-- =============================================
USE StockIT;
GO

-- Verificar si el procedimiento ya existe y eliminarlo
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_InventarioIndividual_Create')
BEGIN
    DROP PROCEDURE sp_InventarioIndividual_Create;
    PRINT 'Procedimiento sp_InventarioIndividual_Create eliminado para su recreación.';
END
GO

CREATE PROCEDURE sp_InventarioIndividual_Create
    @producto_id INT,
    @numero_serie NVARCHAR(100),
    @motivo_baja NVARCHAR(MAX) = NULL,
    @usuario_alta_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @inventory_id INT;
    DECLARE @usa_numero_serie BIT;
    DECLARE @error_msg NVARCHAR(500);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar que el producto existe
        IF NOT EXISTS (SELECT 1 FROM Productos WHERE id = @producto_id AND activo = 1)
        BEGIN
            SET @error_msg = N'El producto no existe o está inactivo';
            THROW 50001, @error_msg, 1;
        END
        
        -- Validar que el producto usa número de serie
        SELECT @usa_numero_serie = usa_numero_serie 
        FROM Productos 
        WHERE id = @producto_id;
        
        IF @usa_numero_serie = 0
        BEGIN
            SET @error_msg = N'Este producto no requiere número de serie individual';
            THROW 50002, @error_msg, 1;
        END
        
        -- Validar que el número de serie no existe
        IF EXISTS (SELECT 1 FROM InventarioIndividual WHERE numero_serie = @numero_serie)
        BEGIN
            SET @error_msg = N'El número de serie ya existe en el sistema';
            THROW 50003, @error_msg, 1;
        END
        
        -- Insertar en inventario individual
        INSERT INTO InventarioIndividual (
            producto_id, 
            numero_serie, 
            estado, 
            motivo_baja, 
            usuario_alta_id,
            fecha_ingreso,
            fecha_creacion
        )
        VALUES (
            @producto_id, 
            @numero_serie, 
            N'Disponible', 
            @motivo_baja, 
            @usuario_alta_id,
            GETDATE(),
            GETDATE()
        );
        
        SET @inventory_id = SCOPE_IDENTITY();
        
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
            @usuario_alta_id, 
            N'InventarioIndividual', 
            N'INSERT', 
            @inventory_id, 
            CONCAT(N'Alta de inventario individual. Producto ID: ', @producto_id, N', Numero de serie: ', @numero_serie),
            GETDATE()
        );
        
        COMMIT TRANSACTION;
        
        -- Retornar el ID del inventario creado
        SELECT 
            @inventory_id AS id, 
            N'Ítem de inventario individual creado exitosamente' AS mensaje;
        
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

PRINT N'Procedimiento sp_InventarioIndividual_Create creado exitosamente.';
GO