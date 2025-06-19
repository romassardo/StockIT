-- =============================================
-- Author:      StockIT Dev Team  
-- Create date: Enero 2025
-- Description: Activar/desactivar categoría
-- =============================================
USE StockIT;
GO

IF OBJECT_ID('sp_Categoria_ToggleActive', 'P') IS NOT NULL
    DROP PROCEDURE sp_Categoria_ToggleActive;
GO

CREATE PROCEDURE sp_Categoria_ToggleActive
    @id INT,
    @usuario_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @current_status BIT;
        DECLARE @nombre NVARCHAR(100);
        
        -- Obtener estado actual
        SELECT @current_status = activo, @nombre = nombre
        FROM Categorias 
        WHERE id = @id;
        
        IF @nombre IS NULL
        BEGIN
            RAISERROR('La categoría especificada no existe', 16, 1);
            RETURN;
        END
        
        -- Si se va a desactivar, verificar que no tenga productos asociados activos
        IF @current_status = 1
        BEGIN
            IF EXISTS (SELECT 1 FROM Productos WHERE categoria_id = @id AND activo = 1)
            BEGIN
                RAISERROR('No se puede desactivar una categoría que tiene productos activos asociados', 16, 1);
                RETURN;
            END
            
            -- Verificar que no tenga categorías hijas activas
            IF EXISTS (SELECT 1 FROM Categorias WHERE categoria_padre_id = @id AND activo = 1)
            BEGIN
                RAISERROR('No se puede desactivar una categoría que tiene subcategorías activas', 16, 1);
                RETURN;
            END
        END
        
        -- Cambiar estado
        DECLARE @new_status BIT = CASE WHEN @current_status = 1 THEN 0 ELSE 1 END;
        
        UPDATE Categorias 
        SET activo = @new_status,
            fecha_modificacion = GETDATE()
        WHERE id = @id;
        
        -- Log de actividad
        DECLARE @accion NVARCHAR(50) = CASE WHEN @new_status = 1 THEN 'ACTIVATE' ELSE 'DEACTIVATE' END;
        DECLARE @descripcion NVARCHAR(500) = CONCAT('Categoría ', CASE WHEN @new_status = 1 THEN 'activada' ELSE 'desactivada' END, ': ', @nombre);
        
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
            'Categorias', 
            @accion, 
            @id, 
            @descripcion, 
            GETDATE()
        );
        
        COMMIT TRANSACTION;
        
        -- Retornar la categoría actualizada
        SELECT 
            id,
            nombre,
            categoria_padre_id,
            requiere_serie,
            permite_asignacion,
            permite_reparacion,
            activo,
            fecha_creacion,
            fecha_modificacion
        FROM Categorias 
        WHERE id = @id;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

PRINT N'Stored procedure sp_Categoria_ToggleActive creado exitosamente.'; 