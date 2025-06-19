-- =============================================
-- Author:      StockIT Dev Team  
-- Create date: Enero 2025
-- Description: Crear nuevo producto en el catálogo
-- =============================================
USE StockIT;
GO

IF OBJECT_ID('sp_Producto_Create', 'P') IS NOT NULL
    DROP PROCEDURE sp_Producto_Create;
GO

CREATE PROCEDURE sp_Producto_Create
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
        
        -- Verificar que la categoría existe y está activa
        IF NOT EXISTS (SELECT 1 FROM Categorias WHERE id = @categoria_id AND activo = 1)
        BEGIN
            RAISERROR('La categoría especificada no existe o está inactiva', 16, 1);
            RETURN;
        END
        
        -- Verificar que la combinación marca-modelo no existe
        IF EXISTS (SELECT 1 FROM Productos WHERE marca = @marca AND modelo = @modelo AND activo = 1)
        BEGIN
            RAISERROR('Ya existe un producto con esta marca y modelo', 16, 1);
            RETURN;
        END
        
        -- Validar stock mínimo
        IF @stock_minimo < 0
        BEGIN
            RAISERROR('El stock mínimo no puede ser negativo', 16, 1);
            RETURN;
        END
        
        -- Obtener configuraciones de la categoría para validaciones adicionales
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
        
        -- Crear el producto
        DECLARE @producto_id INT;
        
        INSERT INTO Productos (
            categoria_id,
            marca,
            modelo,
            descripcion,
            stock_minimo,
            usa_numero_serie,
            activo,
            fecha_creacion
        )
        VALUES (
            @categoria_id,
            @marca,
            @modelo,
            @descripcion,
            @stock_minimo,
            @usa_numero_serie,
            1,
            GETDATE()
        );
        
        SET @producto_id = SCOPE_IDENTITY();
        
        -- Si el producto NO usa número de serie, crear entrada inicial en StockGeneral
        IF @usa_numero_serie = 0
        BEGIN
            INSERT INTO StockGeneral (producto_id, cantidad_actual, ultima_actualizacion)
            VALUES (@producto_id, 0, GETDATE());
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
            'INSERT', 
            @producto_id, 
            CONCAT('Nuevo producto creado: ', @marca, ' ', @modelo), 
            GETDATE()
        );
        
        COMMIT TRANSACTION;
        
        -- Retornar el producto creado con información de categoría
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
        WHERE p.id = @producto_id;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

PRINT N'Stored procedure sp_Producto_Create creado exitosamente.'; 