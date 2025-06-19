-- =============================================
-- Author:      StockIT Dev Team  
-- Create date: Enero 2025
-- Description: Crear nueva categoría con soporte padre-hijo
-- =============================================
USE StockIT;
GO

IF OBJECT_ID('sp_Categoria_Create', 'P') IS NOT NULL
    DROP PROCEDURE sp_Categoria_Create;
GO

CREATE PROCEDURE sp_Categoria_Create
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
        
        -- Verificar que el nombre no existe
        IF EXISTS (SELECT 1 FROM Categorias WHERE nombre = @nombre AND activo = 1)
        BEGIN
            RAISERROR('Ya existe una categoría con este nombre', 16, 1);
            RETURN;
        END
        
        -- Si tiene categoría padre, validar que existe
        IF @categoria_padre_id IS NOT NULL
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM Categorias WHERE id = @categoria_padre_id AND activo = 1)
            BEGIN
                RAISERROR('La categoría padre especificada no existe o está inactiva', 16, 1);
                RETURN;
            END
        END
        
        -- Crear la categoría
        DECLARE @categoria_id INT;
        
        INSERT INTO Categorias (
            nombre, 
            categoria_padre_id, 
            requiere_serie, 
            permite_asignacion, 
            permite_reparacion,
            activo,
            fecha_creacion
        )
        VALUES (
            @nombre, 
            @categoria_padre_id, 
            @requiere_serie, 
            @permite_asignacion, 
            @permite_reparacion,
            1,
            GETDATE()
        );
        
        SET @categoria_id = SCOPE_IDENTITY();
        
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
            'INSERT', 
            @categoria_id, 
            CONCAT('Nueva categoría creada: ', @nombre), 
            GETDATE()
        );
        
        COMMIT TRANSACTION;
        
        -- Retornar la categoría creada
        SELECT 
            id,
            nombre,
            categoria_padre_id,
            requiere_serie,
            permite_asignacion,
            permite_reparacion,
            activo,
            fecha_creacion
        FROM Categorias 
        WHERE id = @categoria_id;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

PRINT N'Stored procedure sp_Categoria_Create creado exitosamente.'; 