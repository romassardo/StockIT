-- =============================================
-- Author:      StockIT Dev Team  
-- Create date: Enero 2025
-- Description: Actualizar producto existente
-- =============================================
USE StockIT;
GO

IF OBJECT_ID('sp_Producto_Update', 'P') IS NOT NULL
    DROP PROCEDURE sp_Producto_Update;
GO

CREATE PROCEDURE sp_Producto_Update
    @id INT,
    @categoria_id INT,
    @marca NVARCHAR(50),
    @modelo NVARCHAR(100),
    @descripcion NTEXT = NULL,
    @stock_minimo INT = 0,
    @usa_numero_serie BIT = 0,
    @usuario_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validaciones obligatorias
        IF @marca IS NULL OR LTRIM(RTRIM(@marca)) = ''
        BEGIN
            RAISERROR('La marca del producto es obligatoria', 16, 1);
            RETURN;
        END
        
        IF @modelo IS NULL OR LTRIM(RTRIM(@modelo)) = ''
        BEGIN
            RAISERROR('El modelo del producto es obligatorio', 16, 1);
            RETURN;
        END
        
        -- Verificar que el producto existe
        IF NOT EXISTS (SELECT 1 FROM Productos WHERE id = @id)
        BEGIN
            RAISERROR('El producto especificado no existe', 16, 1);
            RETURN;
        END
        
        -- Verificar que la categoría existe y está activa
        IF NOT EXISTS (SELECT 1 FROM Categorias WHERE id = @categoria_id AND activo = 1)
        BEGIN
            RAISERROR('La categoría especificada no existe o está inactiva', 16, 1);
            RETURN;
        END
        
        -- Verificar que la combinación marca-modelo no existe en otro producto
        IF EXISTS (SELECT 1 FROM Productos WHERE marca = @marca AND modelo = @modelo AND id != @id AND activo = 1)
        BEGIN
            RAISERROR('Ya existe otro producto con esta marca y modelo', 16, 1);
            RETURN;
        END
        
        -- Validar stock mínimo
        IF @stock_minimo < 0
        BEGIN
            RAISERROR('El stock mínimo no puede ser negativo', 16, 1);
            RETURN;
        END
        
        -- Obtener estado actual del producto
        DECLARE @usa_serie_actual BIT;
        DECLARE @categoria_actual INT;
        
        SELECT @usa_serie_actual = usa_numero_serie, @categoria_actual = categoria_id
        FROM Productos 
        WHERE id = @id;
        
        -- Obtener configuraciones de la nueva categoría
        DECLARE @categoria_requiere_serie BIT;
        DECLARE @categoria_permite_asignacion BIT;
        
        SELECT 
            @categoria_requiere_serie = requiere_serie,
            @categoria_permite_asignacion = permite_asignacion
        FROM Categorias 
        WHERE id = @categoria_id;
        
        -- Si la categoría requiere serie, forzar usa_numero_serie = 1
        IF @categoria_requiere_serie = 1 AND @usa_numero_serie = 0
        BEGIN
            SET @usa_numero_serie = 1;
        END
        
        -- Validación crítica: NO permitir cambiar usa_numero_serie si ya hay inventario
        IF @usa_serie_actual != @usa_numero_serie
        BEGIN
            -- Si cambia de serie a no-serie, verificar que no haya inventario individual
            IF @usa_serie_actual = 1 AND @usa_numero_serie = 0
            BEGIN
                IF EXISTS (SELECT 1 FROM InventarioIndividual WHERE producto_id = @id)
                BEGIN
                    RAISERROR('No se puede cambiar a "sin número de serie" porque ya existe inventario individual registrado', 16, 1);
                    RETURN;
                END
            END
            
            -- Si cambia de no-serie a serie, verificar que no haya stock general
            IF @usa_serie_actual = 0 AND @usa_numero_serie = 1
            BEGIN
                IF EXISTS (SELECT 1 FROM StockGeneral WHERE producto_id = @id AND cantidad_actual > 0)
                BEGIN
                    RAISERROR('No se puede cambiar a "con número de serie" porque ya existe stock general registrado', 16, 1);
                    RETURN;
                END
            END
        END
        
        -- Actualizar el producto
        UPDATE Productos SET
            categoria_id = @categoria_id,
            marca = @marca,
            modelo = @modelo,
            descripcion = @descripcion,
            stock_minimo = @stock_minimo,
            usa_numero_serie = @usa_numero_serie,
            fecha_modificacion = GETDATE()
        WHERE id = @id;
        
        -- Si cambió a no-serie y no existe entrada en StockGeneral, crearla
        IF @usa_numero_serie = 0 AND NOT EXISTS (SELECT 1 FROM StockGeneral WHERE producto_id = @id)
        BEGIN
            INSERT INTO StockGeneral (producto_id, cantidad_actual, ultima_actualizacion)
            VALUES (@id, 0, GETDATE());
        END
        
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
            'Productos', 
            'UPDATE', 
            @id, 
            CONCAT('Producto actualizado: ', @marca, ' ', @modelo), 
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

PRINT N'Stored procedure sp_Producto_Update creado exitosamente.'; 