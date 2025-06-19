-- =============================================
-- SP: sp_Producto_Create
-- Descripción: Crear nuevo producto con validaciones e integración automática
-- Uso: Creación de productos desde administración
-- Autor: Sistema StockIT
-- Fecha: 2024-06-18
-- =============================================

CREATE PROCEDURE [dbo].[sp_Producto_Create]
    @categoria_id INT,
    @marca NVARCHAR(50),
    @modelo NVARCHAR(100),
    @descripcion NVARCHAR(MAX) = NULL,
    @stock_minimo INT = 0,
    @usa_numero_serie BIT,
    @usuario_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validaciones de entrada
        IF @categoria_id IS NULL OR @categoria_id <= 0
            RAISERROR('categoria_id es requerido y debe ser válido', 16, 1);
            
        IF @marca IS NULL OR LTRIM(RTRIM(@marca)) = ''
            RAISERROR('marca es requerida', 16, 1);
            
        IF @modelo IS NULL OR LTRIM(RTRIM(@modelo)) = ''
            RAISERROR('modelo es requerido', 16, 1);
            
        IF @stock_minimo < 0
            RAISERROR('stock_minimo no puede ser negativo', 16, 1);
            
        IF @usa_numero_serie IS NULL
            RAISERROR('usa_numero_serie es requerido', 16, 1);
            
        IF @usuario_id IS NULL OR @usuario_id <= 0
            RAISERROR('usuario_id es requerido y debe ser válido', 16, 1);
        
        -- Verificar que la categoría existe y está activa
        IF NOT EXISTS (SELECT 1 FROM Categorias WHERE id = @categoria_id AND activo = 1)
            RAISERROR('La categoría especificada no existe o está inactiva', 16, 1);
        
        -- Verificar que el usuario existe
        IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE id = @usuario_id AND activo = 1)
            RAISERROR('El usuario especificado no existe o está inactivo', 16, 1);
        
        -- Verificar duplicados (misma marca y modelo)
        IF EXISTS (SELECT 1 FROM Productos WHERE marca = @marca AND modelo = @modelo AND activo = 1)
            RAISERROR('Ya existe un producto activo con la misma marca y modelo', 16, 1);
        
        DECLARE @producto_id INT;
        
        -- Insertar producto
        INSERT INTO Productos (
            categoria_id,
            marca,
            modelo,
            descripcion,
            stock_minimo,
            usa_numero_serie,
            activo
        ) VALUES (
            @categoria_id,
            @marca,
            @modelo,
            @descripcion,
            @stock_minimo,
            @usa_numero_serie,
            1
        );
        
        SET @producto_id = SCOPE_IDENTITY();
        
        -- Si el producto NO usa número de serie, crear entrada en StockGeneral
        IF @usa_numero_serie = 0
        BEGIN
            INSERT INTO StockGeneral (
                producto_id,
                cantidad_actual,
                ultima_actualizacion,
                ubicacion
            ) VALUES (
                @producto_id,
                0,
                GETDATE(),
                'Almacén Principal'
            );
        END
        
        -- Registrar log de actividad
        INSERT INTO LogsActividad (
            usuario_id,
            tabla_afectada,
            accion,
            registro_id,
            descripcion,
            fecha_hora
        ) VALUES (
            @usuario_id,
            'Productos',
            'CREATE',
            @producto_id,
            CONCAT('Producto creado: ', @marca, ' ', @modelo, 
                   ' - Usa serie: ', CASE WHEN @usa_numero_serie = 1 THEN 'Sí' ELSE 'No' END),
            GETDATE()
        );
        
        COMMIT TRANSACTION;
        
        -- Retornar el producto creado
        SELECT 
            p.id,
            p.categoria_id,
            c.nombre as categoria_nombre,
            p.marca,
            p.modelo,
            p.descripcion,
            p.stock_minimo,
            p.usa_numero_serie,
            p.activo,
            -- Información de inventario
            CASE 
                WHEN p.usa_numero_serie = 1 THEN
                    (SELECT COUNT(*) FROM InventarioIndividual WHERE producto_id = p.id AND estado = 'Disponible')
                ELSE
                    ISNULL(sg.cantidad_actual, 0)
            END as stock_actual,
            CASE 
                WHEN p.usa_numero_serie = 1 THEN
                    (SELECT COUNT(*) FROM InventarioIndividual WHERE producto_id = p.id)
                ELSE
                    ISNULL(sg.cantidad_actual, 0)
            END as inventario_total
        FROM Productos p
        INNER JOIN Categorias c ON p.categoria_id = c.id
        LEFT JOIN StockGeneral sg ON p.id = sg.producto_id
        WHERE p.id = @producto_id;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END 