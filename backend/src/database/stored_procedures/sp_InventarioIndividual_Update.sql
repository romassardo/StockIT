-- =============================================
-- Author:      StockIT Dev Team
-- Create date: 27/05/2025
-- Description: Actualizar información de un ítem de inventario individual
-- =============================================
USE StockIT;
GO

-- Verificar si el procedimiento ya existe y eliminarlo
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_InventarioIndividual_Update')
BEGIN
    DROP PROCEDURE sp_InventarioIndividual_Update;
    PRINT N'Procedimiento sp_InventarioIndividual_Update eliminado para su recreación.';
END
GO

CREATE PROCEDURE sp_InventarioIndividual_Update
    @inventario_id INT,
    @numero_serie NVARCHAR(100) = NULL,
    @fecha_compra DATE = NULL,
    @fecha_garantia DATE = NULL,
    @observaciones NVARCHAR(MAX) = NULL,
    @usuario_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @error_msg NVARCHAR(500);
    DECLARE @producto_id INT;
    DECLARE @estado_actual NVARCHAR(20);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar que el ítem existe
        IF NOT EXISTS (SELECT 1 FROM InventarioIndividual WHERE id = @inventario_id)
        BEGIN
            SET @error_msg = N'El ítem de inventario no existe';
            THROW 50004, @error_msg, 1;
        END
        
        -- Obtener datos actuales
        SELECT 
            @producto_id = producto_id,
            @estado_actual = estado
        FROM 
            InventarioIndividual 
        WHERE 
            id = @inventario_id;
        
        -- Validar que no esté asignado o en reparación
        IF @estado_actual IN (N'Asignado', N'En Reparación')
        BEGIN
            SET @error_msg = N'No se puede modificar un ítem que está ' + @estado_actual;
            THROW 50006, @error_msg, 1;
        END
        
        -- Validar que el número de serie no existe (si cambió y no es NULL)
        IF @numero_serie IS NOT NULL AND EXISTS (
            SELECT 1 
            FROM InventarioIndividual 
            WHERE numero_serie = @numero_serie 
            AND id != @inventario_id
        )
        BEGIN
            SET @error_msg = N'El número de serie ''' + @numero_serie + ''' ya existe en otro ítem.';
            THROW 50007, @error_msg, 1;
        END
        
        -- Actualizar inventario individual
        UPDATE InventarioIndividual
        SET 
            numero_serie = ISNULL(@numero_serie, numero_serie),
            fecha_compra = @fecha_compra,
            fecha_garantia = @fecha_garantia,
            observaciones = @observaciones,
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
            N'UPDATE', 
            @inventario_id, 
            CONCAT(N'Actualización de inventario individual. ID: ', @inventario_id, 
                   N', N/S: ', ISNULL(@numero_serie, (SELECT numero_serie FROM InventarioIndividual WHERE id = @inventario_id)),
                   N', FechaCompra: ', CONVERT(NVARCHAR, @fecha_compra, 23),
                   N', FechaGarantia: ', CONVERT(NVARCHAR, @fecha_garantia, 23),
                   N', Observaciones: ', ISNULL(@observaciones, '')
                  ),
            GETDATE()
        );
        
        COMMIT TRANSACTION;
        
        -- Retornar el ítem actualizado
        SELECT 
            ii.id,
            ii.producto_id,
            p.nombre AS producto_nombre,
            p.usa_numero_serie,
            c.id AS categoria_id,
            c.nombre AS categoria_nombre,
            ii.numero_serie,
            ii.estado,
            ii.fecha_compra,
            ii.fecha_garantia,
            ii.observaciones,
            ii.fecha_creacion,
            ii.fecha_modificacion
        FROM InventarioIndividual ii
        JOIN Productos p ON ii.producto_id = p.id
        JOIN Categorias c ON p.categoria_id = c.id
        WHERE ii.id = @inventario_id;
        
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

PRINT N'Procedimiento sp_InventarioIndividual_Update creado exitosamente.';
GO