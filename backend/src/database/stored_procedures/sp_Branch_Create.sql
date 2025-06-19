-- =============================================
-- Autor:      StockIT
-- Fecha:      27/05/2025
-- Descripción: Crea una nueva sucursal
-- =============================================
CREATE OR ALTER PROCEDURE sp_Branch_Create
    @nombre VARCHAR(100),
    @activo BIT = 1,
    @usuario_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @branch_id INT;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validaciones
        IF LEN(@nombre) = 0
        BEGIN
            THROW 50020, 'El nombre de la sucursal es obligatorio', 1;
        END
        
        -- Validar si ya existe una sucursal con el mismo nombre
        IF EXISTS (SELECT 1 FROM Sucursales WHERE nombre = @nombre)
        BEGIN
            THROW 50021, 'Ya existe una sucursal con ese nombre', 1;
        END
        
        -- Insertar sucursal
        INSERT INTO Sucursales (nombre, activo)
        VALUES (@nombre, @activo);
        
        SET @branch_id = SCOPE_IDENTITY();
        
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
            'Sucursales', 
            'INSERT', 
            @branch_id, 
            CONCAT('{"nombre":"', @nombre, '","activo":', CAST(@activo AS VARCHAR(1)), '}')
        );
        
        COMMIT TRANSACTION;
        
        -- Retornar resultado
        SELECT 
            @branch_id AS id, 
            'Sucursal creada exitosamente' AS mensaje;
        
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