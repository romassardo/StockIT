-- =============================================
-- Author:      StockIT Dev Team  
-- Create date: Enero 2025
-- Description: Activar/desactivar producto con validaciones
-- =============================================
USE StockIT;
GO

IF OBJECT_ID('sp_Producto_ToggleActive', 'P') IS NOT NULL
    DROP PROCEDURE sp_Producto_ToggleActive;
GO

CREATE PROCEDURE sp_Producto_ToggleActive
    @id INT,
    @usuario_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @current_status BIT;
        DECLARE @marca NVARCHAR(50);
        DECLARE @modelo NVARCHAR(100);
        DECLARE @usa_numero_serie BIT;
        
        -- Obtener información actual del producto
        SELECT 
            @current_status = activo, 
            @marca = marca, 
            @modelo = modelo,
            @usa_numero_serie = usa_numero_serie
        FROM Productos 
        WHERE id = @id;
        
        IF @marca IS NULL
        BEGIN
            RAISERROR('El producto especificado no existe', 16, 1);
            RETURN;
        END
        
        -- Si se va a desactivar, verificar que no tenga inventario activo
        IF @current_status = 1
        BEGIN
            -- Para productos con número de serie
            IF @usa_numero_serie = 1
            BEGIN
                -- Verificar que no tenga activos en estados activos
                IF EXISTS (
                    SELECT 1 FROM InventarioIndividual 
                    WHERE producto_id = @id 
                    AND estado IN ('Disponible', 'Asignado', 'En Reparación')
                )
                BEGIN
                    RAISERROR('No se puede desactivar un producto que tiene activos en inventario individual activos (Disponible, Asignado o En Reparación)', 16, 1);
                    RETURN;
                END
            END
            ELSE
            BEGIN
                -- Verificar que no tenga stock general
                IF EXISTS (
                    SELECT 1 FROM StockGeneral 
                    WHERE producto_id = @id 
                    AND cantidad_actual > 0
                )
                BEGIN
                    RAISERROR('No se puede desactivar un producto que tiene stock general disponible', 16, 1);
                    RETURN;
                END
            END
        END
        
        -- Cambiar estado
        DECLARE @new_status BIT = CASE WHEN @current_status = 1 THEN 0 ELSE 1 END;
        
        UPDATE Productos 
        SET activo = @new_status,
            fecha_modificacion = GETDATE()
        WHERE id = @id;
        
        -- Log de actividad
        DECLARE @accion NVARCHAR(50) = CASE WHEN @new_status = 1 THEN 'ACTIVATE' ELSE 'DEACTIVATE' END;
        DECLARE @descripcion NVARCHAR(500) = CONCAT('Producto ', CASE WHEN @new_status = 1 THEN 'activado' ELSE 'desactivado' END, ': ', @marca, ' ', @modelo);
        
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
            'Productos', 
            @accion, 
            @id, 
            @descripcion, 
            GETDATE()
        );
        
        COMMIT TRANSACTION;
        
        -- Retornar el producto actualizado con información de categoría
        SELECT 
            p.id,
            p.categoria_id,
            c.nombre AS categoria_nombre,
            p.marca,
            p.modelo,
            p.descripcion,
            p.stock_minimo,
            p.usa_numero_serie,
            p.activo,
            p.fecha_creacion,
            p.fecha_modificacion
        FROM Productos p
        INNER JOIN Categorias c ON p.categoria_id = c.id
        WHERE p.id = @id;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

PRINT N'Stored procedure sp_Producto_ToggleActive creado exitosamente.'; 