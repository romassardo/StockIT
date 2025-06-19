-- =============================================
-- Autor:      StockIT
-- Fecha:      27/05/2025
-- Descripción: Crea un nuevo sector
-- =============================================
CREATE OR ALTER PROCEDURE sp_Sector_Create
    @nombre VARCHAR(100),
    @activo BIT = 1,
    @usuario_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @sector_id INT;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validaciones
        IF LEN(@nombre) = 0
        BEGIN
            THROW 50010, 'El nombre del sector es obligatorio', 1;
        END
        
        -- Validar si ya existe un sector con el mismo nombre
        IF EXISTS (SELECT 1 FROM Sectores WHERE nombre = @nombre)
        BEGIN
            THROW 50011, 'Ya existe un sector con ese nombre', 1;
        END
        
        -- Insertar sector
        INSERT INTO Sectores (nombre, activo)
        VALUES (@nombre, @activo);
        
        SET @sector_id = SCOPE_IDENTITY();
        
        -- Registro de actividad
        INSERT INTO LogsActividad (
            usuario_id, 
            tabla_afectada, 
            accion, 
            registro_id, 
            descripcion
        )
        VALUES (
            @usuario_id, 
            'Sectores', 
            'INSERT', 
            @sector_id, 
            CONCAT('{"nombre":"', @nombre, '","activo":', CAST(@activo AS VARCHAR(1)), '}')
        );
        
        COMMIT TRANSACTION;
        
        -- Retornar resultado
        SELECT 
            @sector_id AS id, 
            'Sector creado exitosamente' AS mensaje;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        -- Capturar detalles del error
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END;
GO