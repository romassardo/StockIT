-- =============================================
-- Autor:      StockIT
-- Fecha:      27/05/2025
-- Descripción: Crea un nuevo empleado
-- =============================================
CREATE OR ALTER PROCEDURE sp_Employee_Create
    @nombre VARCHAR(50),
    @apellido VARCHAR(50),
    @activo BIT = 1,
    @usuario_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @employee_id INT;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validaciones
        IF LEN(@nombre) = 0 OR LEN(@apellido) = 0
        BEGIN
            THROW 50001, 'El nombre y apellido son obligatorios', 1;
        END
        
        -- Insertar empleado
        INSERT INTO Empleados (nombre, apellido, activo)
        VALUES (@nombre, @apellido, @activo);
        
        SET @employee_id = SCOPE_IDENTITY();
        
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
            'INSERT', 
            @employee_id, 
            CONCAT('{"nombre":"', @nombre, '","apellido":"', @apellido, '","activo":', CAST(@activo AS VARCHAR(1)), '}')
        );
        
        COMMIT TRANSACTION;
        
        -- Retornar resultado
        SELECT 
            @employee_id AS id, 
            'Empleado creado exitosamente' AS mensaje;
        
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