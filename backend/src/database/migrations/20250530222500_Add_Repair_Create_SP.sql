/*
Migración para agregar el Stored Procedure sp_Repair_Create
Fecha: 30/05/2025
*/

-- Procedimiento para crear una nueva reparación
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_Repair_Create')
    DROP PROCEDURE dbo.sp_Repair_Create
GO

CREATE PROCEDURE dbo.sp_Repair_Create
    @inventario_individual_id INT,
    @descripcion_problema NVARCHAR(MAX),
    @usuario_envia_id INT,
    @proveedor NVARCHAR(100) = NULL,
    @NuevaReparacionID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @producto_id INT;
    DECLARE @estado_actual NVARCHAR(20);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verificar que el ítem de inventario existe
        SELECT 
            @producto_id = ii.producto_id,
            @estado_actual = ii.estado
        FROM 
            InventarioIndividual ii
        WHERE 
            ii.id = @inventario_individual_id;
            
        IF @producto_id IS NULL
        BEGIN
            RAISERROR('El ítem de inventario especificado no existe', 16, 1);
            RETURN;
        END
        
        -- Verificar que el estado actual permite enviar a reparación
        IF @estado_actual <> 'Disponible'
        BEGIN
            RAISERROR('El ítem debe estar en estado "Disponible" para enviarlo a reparación', 16, 1);
            RETURN;
        END
        
        -- Crear registro de reparación
        INSERT INTO dbo.Reparaciones (
            inventario_individual_id,
            fecha_envio,
            problema_descripcion,
            proveedor,
            estado,
            usuario_envia_id,
            fecha_creacion
        )
        VALUES (
            @inventario_individual_id,
            GETDATE(),
            @descripcion_problema,
            @proveedor,
            'Enviado',
            @usuario_envia_id,
            GETDATE()
        );
        
        -- Obtener el ID de la reparación creada
        SET @NuevaReparacionID = SCOPE_IDENTITY();
        
        -- Actualizar estado del inventario
        UPDATE InventarioIndividual
        SET 
            estado = 'En Reparación',
            fecha_modificacion = GETDATE()
        WHERE 
            id = @inventario_individual_id;
            
        -- Registrar la actividad
        INSERT INTO dbo.LogsActividad (
            usuario_id,
            tabla_afectada,
            accion,
            registro_id,
            descripcion
        )
        VALUES (
            @usuario_envia_id,
            'Reparaciones',
            'INSERT',
            @NuevaReparacionID,
            CONCAT('{"inventario_id":', @inventario_individual_id, ',"problema":"', @descripcion_problema, '"}')
        );
            
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO
