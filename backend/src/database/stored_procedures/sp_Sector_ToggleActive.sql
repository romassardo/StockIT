-- =============================================
-- Autor:      StockIT
-- Fecha:      27/05/2025
-- Descripción: Activa o desactiva un sector
-- =============================================
CREATE OR ALTER PROCEDURE sp_Sector_ToggleActive
    @id INT,
    @activo BIT,
    @usuario_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validaciones
        IF NOT EXISTS (SELECT 1 FROM Sectores WHERE id = @id)
        BEGIN
            THROW 50016, 'Sector no encontrado', 1;
        END
        
        -- Verificar si el sector ya tiene el estado solicitado
        IF EXISTS (SELECT 1 FROM Sectores WHERE id = @id AND activo = @activo)
        BEGIN
            THROW 50017, 'El sector ya tiene ese estado', 1;
        END
        
        -- Actualizar estado
        UPDATE Sectores 
        SET activo = @activo
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
            CONCAT('Cambio de estado: activo = ', CAST(@activo AS VARCHAR(1)))
        );
        
        COMMIT TRANSACTION;
        
        -- Retornar resultado
        SELECT 
            @id AS id, 
            CASE WHEN @activo = 1 
                THEN 'Sector activado exitosamente' 
                ELSE 'Sector desactivado exitosamente' 
            END AS mensaje;
        
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