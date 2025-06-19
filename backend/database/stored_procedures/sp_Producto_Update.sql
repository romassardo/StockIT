-- =============================================
-- SP: sp_Producto_Update
-- Descripción: Actualizar producto con validaciones críticas de inventario existente
-- Uso: Edición de productos desde administración
-- Autor: Sistema StockIT
-- Fecha: 2024-06-18
-- =============================================

CREATE PROCEDURE [dbo].[sp_Producto_Update]
    @id INT,
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
        IF @id IS NULL OR @id <= 0
            RAISERROR('id es requerido y debe ser válido', 16, 1);
            
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
        
        -- Verificar que el producto existe
        IF NOT EXISTS (SELECT 1 FROM Productos WHERE id = @id)
            RAISERROR('El producto especificado no existe', 16, 1);
        
        -- Verificar que la categoría existe y está activa
        IF NOT EXISTS (SELECT 1 FROM Categorias WHERE id = @categoria_id AND activo = 1)
            RAISERROR('La categoría especificada no existe o está inactiva', 16, 1);
        
        -- Verificar que el usuario existe
        IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE id = @usuario_id AND activo = 1)
            RAISERROR('El usuario especificado no existe o está inactivo', 16, 1);
        
        -- Obtener datos actuales del producto
        DECLARE @usa_numero_serie_actual BIT;
        DECLARE @marca_actual NVARCHAR(50);
        DECLARE @modelo_actual NVARCHAR(100);
        
        SELECT @usa_numero_serie_actual = usa_numero_serie,
               @marca_actual = marca,
               @modelo_actual = modelo
        FROM Productos 
        WHERE id = @id;
        
        -- VALIDACIÓN CRÍTICA: No permitir cambiar usa_numero_serie si hay inventario existente
        IF @usa_numero_serie != @usa_numero_serie_actual
        BEGIN
            -- Verificar si hay inventario individual (para productos serializados)
            IF @usa_numero_serie_actual = 1 AND EXISTS (SELECT 1 FROM InventarioIndividual WHERE producto_id = @id)
                RAISERROR('No se puede cambiar usa_numero_serie: el producto tiene inventario individual existente', 16, 1);
            
            -- Verificar si hay stock general (para productos no serializados)
            IF @usa_numero_serie_actual = 0 AND EXISTS (SELECT 1 FROM StockGeneral WHERE producto_id = @id AND cantidad_actual > 0)
                RAISERROR('No se puede cambiar usa_numero_serie: el producto tiene stock general existente', 16, 1);
        END
        
        -- Verificar duplicados (misma marca y modelo, excluyendo el producto actual)
        IF EXISTS (SELECT 1 FROM Productos WHERE marca = @marca AND modelo = @modelo AND activo = 1 AND id != @id)
            RAISERROR('Ya existe otro producto activo con la misma marca y modelo', 16, 1);
        
        -- Actualizar producto
        UPDATE Productos SET
            categoria_id = @categoria_id,
            marca = @marca,
            modelo = @modelo,
            descripcion = @descripcion,
            stock_minimo = @stock_minimo,
            usa_numero_serie = @usa_numero_serie
        WHERE id = @id;
        
        -- Si el producto cambió de no-serializado a serializado, eliminar entrada de StockGeneral
        IF @usa_numero_serie_actual = 0 AND @usa_numero_serie = 1
        BEGIN
            DELETE FROM StockGeneral WHERE producto_id = @id;
        END
        
        -- Si el producto cambió de serializado a no-serializado, crear entrada en StockGeneral
        IF @usa_numero_serie_actual = 1 AND @usa_numero_serie = 0
        BEGIN
            INSERT INTO StockGeneral (
                producto_id,
                cantidad_actual,
                ultima_actualizacion,
                ubicacion
            ) VALUES (
                @id,
                0,
                GETDATE(),
                'Almacén Principal'
            );
        END
        
        -- Registrar log de actividad
        DECLARE @cambios NVARCHAR(MAX) = '';
        
        IF @marca != @marca_actual OR @modelo != @modelo_actual
            SET @cambios = @cambios + 'Producto: ' + @marca_actual + ' ' + @modelo_actual + ' → ' + @marca + ' ' + @modelo + '; ';
        
        IF @usa_numero_serie != @usa_numero_serie_actual
            SET @cambios = @cambios + 'Usa serie: ' + 
                          CASE WHEN @usa_numero_serie_actual = 1 THEN 'Sí' ELSE 'No' END + ' → ' +
                          CASE WHEN @usa_numero_serie = 1 THEN 'Sí' ELSE 'No' END + '; ';
        
        IF @cambios = '' SET @cambios = 'Producto actualizado';
        
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
            'UPDATE',
            @id,
            @cambios,
            GETDATE()
        );
        
        COMMIT TRANSACTION;
        
        -- Retornar el producto actualizado
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
        WHERE p.id = @id;
        
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