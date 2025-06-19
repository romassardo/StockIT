-- =============================================
-- Autor:      StockIT
-- Fecha:      27/05/2025
-- Descripción: Actualiza información de un empleado
-- =============================================
CREATE OR ALTER PROCEDURE sp_Employee_Update
    @id INT,
    @nombre VARCHAR(50),
    @apellido VARCHAR(50),
    @usuario_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validaciones
        IF NOT EXISTS (SELECT 1 FROM Empleados WHERE id = @id)
        BEGIN
            THROW 50003, 'Empleado no encontrado', 1;
        END
        
        IF LEN(@nombre) = 0 OR LEN(@apellido) = 0
        BEGIN
            THROW 50004, 'El nombre y apellido son obligatorios', 1;
        END
        
        -- Obtener datos antiguos para el log
        DECLARE @old_data NVARCHAR(MAX);
        SELECT @old_data = CONCAT('{"nombre":"', nombre, '","apellido":"', apellido, '"}')
        FROM Empleados WHERE id = @id;
        
        -- Actualizar empleado
        UPDATE Empleados 
        SET 
            nombre = @nombre,
            apellido = @apellido
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
            'Empleados', 
            'UPDATE', 
            @id, 
            CONCAT('Anterior: ', @old_data, ' - Nuevo: {"nombre":"', @nombre, '","apellido":"', @apellido, '"}')
        );
        
        COMMIT TRANSACTION;
        
        -- Retornar resultado
        SELECT 
            @id AS id, 
            'Empleado actualizado exitosamente' AS mensaje;
        
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