-- =============================================
-- SP: sp_Producto_ToggleActive
-- Descripción: Activar/desactivar producto con validaciones de dependencias
-- Uso: Activación/desactivación de productos desde administración
-- Autor: Sistema StockIT
-- Fecha: 2024-06-18
-- =============================================

CREATE PROCEDURE [dbo].[sp_Producto_ToggleActive]
    @id INT,
    @usuario_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validaciones de entrada
        IF @id IS NULL OR @id <= 0
            RAISERROR('id es requerido y debe ser válido', 16, 1);
            
        IF @usuario_id IS NULL OR @usuario_id <= 0
            RAISERROR('usuario_id es requerido y debe ser válido', 16, 1);
        
        -- Verificar que el producto existe
        IF NOT EXISTS (SELECT 1 FROM Productos WHERE id = @id)
            RAISERROR('El producto especificado no existe', 16, 1);
        
        -- Verificar que el usuario existe
        IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE id = @usuario_id AND activo = 1)
            RAISERROR('El usuario especificado no existe o está inactivo', 16, 1);
        
        -- Obtener estado actual y datos del producto
        DECLARE @activo_actual BIT;
        DECLARE @marca NVARCHAR(50);
        DECLARE @modelo NVARCHAR(100);
        DECLARE @usa_numero_serie BIT;
        
        SELECT @activo_actual = activo,
               @marca = marca,
               @modelo = modelo,
               @usa_numero_serie = usa_numero_serie
        FROM Productos 
        WHERE id = @id;
        
        -- Si se va a desactivar, verificar dependencias
        IF @activo_actual = 1
        BEGIN
            -- Verificar si hay inventario individual activo (asignado o en reparación)
            IF @usa_numero_serie = 1 AND EXISTS (
                SELECT 1 FROM InventarioIndividual 
                WHERE producto_id = @id 
                AND estado IN ('Asignado', 'En Reparación')
            )
                RAISERROR('No se puede desactivar: el producto tiene activos asignados o en reparación', 16, 1);
            
            -- Verificar si hay stock general disponible
            IF @usa_numero_serie = 0 AND EXISTS (
                SELECT 1 FROM StockGeneral 
                WHERE producto_id = @id 
                AND cantidad_actual > 0
            )
                RAISERROR('No se puede desactivar: el producto tiene stock disponible', 16, 1);
            
            -- Verificar si hay movimientos de stock recientes (últimos 30 días)
            IF EXISTS (
                SELECT 1 FROM MovimientosStock 
                WHERE producto_id = @id 
                AND fecha_movimiento >= DATEADD(DAY, -30, GETDATE())
            )
                RAISERROR('No se puede desactivar: el producto tiene movimientos recientes de stock', 16, 1);
        END
        
        -- Cambiar estado activo
        DECLARE @nuevo_estado BIT = CASE WHEN @activo_actual = 1 THEN 0 ELSE 1 END;
        
        UPDATE Productos SET
            activo = @nuevo_estado
        WHERE id = @id;
        
        -- Registrar log de actividad
        DECLARE @accion NVARCHAR(20) = CASE WHEN @nuevo_estado = 1 THEN 'ACTIVATE' ELSE 'DEACTIVATE' END;
        DECLARE @descripcion NVARCHAR(MAX) = 
            CASE WHEN @nuevo_estado = 1 
                THEN 'Producto activado: ' 
                ELSE 'Producto desactivado: ' 
            END + @marca + ' ' + @modelo;
        
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
            @accion,
            @id,
            @descripcion,
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
            END as inventario_total,
            -- Información de dependencias (para validaciones en frontend)
            CASE 
                WHEN p.usa_numero_serie = 1 THEN
                    (SELECT COUNT(*) FROM InventarioIndividual WHERE producto_id = p.id AND estado IN ('Asignado', 'En Reparación'))
                ELSE
                    0
            END as dependencias_activas
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