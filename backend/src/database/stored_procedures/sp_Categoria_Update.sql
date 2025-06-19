-- =============================================
-- Author:      StockIT Dev Team  
-- Create date: Enero 2025
-- Description: Actualizar categoría existente
-- =============================================
USE StockIT;
GO

IF OBJECT_ID('sp_Categoria_Update', 'P') IS NOT NULL
    DROP PROCEDURE sp_Categoria_Update;
GO

CREATE PROCEDURE sp_Categoria_Update
    @id INT,
    @nombre NVARCHAR(100),
    @categoria_padre_id INT = NULL,
    @requiere_serie BIT = 0,
    @permite_asignacion BIT = 0,
    @permite_reparacion BIT = 0,
    @usuario_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validaciones
        IF @nombre IS NULL OR LTRIM(RTRIM(@nombre)) = ''
        BEGIN
            RAISERROR('El nombre de la categoría es obligatorio', 16, 1);
            RETURN;
        END
        
        -- Verificar que la categoría existe
        IF NOT EXISTS (SELECT 1 FROM Categorias WHERE id = @id)
        BEGIN
            RAISERROR('La categoría especificada no existe', 16, 1);
            RETURN;
        END
        
        -- Verificar que el nombre no existe en otra categoría
        IF EXISTS (SELECT 1 FROM Categorias WHERE nombre = @nombre AND id != @id AND activo = 1)
        BEGIN
            RAISERROR('Ya existe otra categoría con este nombre', 16, 1);
            RETURN;
        END
        
        -- Si tiene categoría padre, validar que existe y no crea ciclo
        IF @categoria_padre_id IS NOT NULL
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM Categorias WHERE id = @categoria_padre_id AND activo = 1)
            BEGIN
                RAISERROR('La categoría padre especificada no existe o está inactiva', 16, 1);
                RETURN;
            END
            
            -- Prevenir auto-referencia
            IF @categoria_padre_id = @id
            BEGIN
                RAISERROR('Una categoría no puede ser padre de sí misma', 16, 1);
                RETURN;
            END
        END
        
        -- Actualizar la categoría
        UPDATE Categorias SET
            nombre = @nombre,
            categoria_padre_id = @categoria_padre_id,
            requiere_serie = @requiere_serie,
            permite_asignacion = @permite_asignacion,
            permite_reparacion = @permite_reparacion,
            fecha_modificacion = GETDATE()
        WHERE id = @id;
        
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
            'Categorias', 
            'UPDATE', 
            @id, 
            CONCAT('Categoría actualizada: ', @nombre), 
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

PRINT N'Stored procedure sp_Categoria_Update creado exitosamente.'; 