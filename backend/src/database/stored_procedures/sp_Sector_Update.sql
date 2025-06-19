-- =============================================
-- Autor:      StockIT
-- Fecha:      27/05/2025
-- Descripción: Actualiza información de un sector
-- =============================================
CREATE OR ALTER PROCEDURE sp_Sector_Update
    @id INT,
    @nombre VARCHAR(100),
    @usuario_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validaciones
        IF NOT EXISTS (SELECT 1 FROM Sectores WHERE id = @id)
        BEGIN
            THROW 50013, 'Sector no encontrado', 1;
        END
        
        IF LEN(@nombre) = 0
        BEGIN
            THROW 50014, 'El nombre del sector es obligatorio', 1;
        END
        
        -- Validar si ya existe otro sector con el mismo nombre
        IF EXISTS (SELECT 1 FROM Sectores WHERE nombre = @nombre AND id != @id)
        BEGIN
            THROW 50015, 'Ya existe otro sector con ese nombre', 1;
        END
        
        -- Obtener datos antiguos para el log
        DECLARE @old_data NVARCHAR(MAX);
        SELECT @old_data = CONCAT('{"nombre":"', nombre, '"}')
        FROM Sectores WHERE id = @id;
        
        -- Actualizar sector
        UPDATE Sectores 
        SET nombre = @nombre
        WHERE id = @id;
        
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
            'UPDATE', 
            @id, 
            CONCAT('Anterior: ', @old_data, ' - Nuevo: {"nombre":"', @nombre, '"}')
        );
        
        COMMIT TRANSACTION;
        
        -- Retornar resultado
        SELECT 
            @id AS id, 
            'Sector actualizado exitosamente' AS mensaje;
        
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