-- sp_Assignment_Create.sql
-- Stored Procedure para crear asignaciones
CREATE OR ALTER PROCEDURE sp_Assignment_Create
    @inventario_individual_id INT,
    @empleado_id INT = NULL,
    @sector_id INT = NULL,
    @sucursal_id INT = NULL,
    @observaciones NVARCHAR(1000) = NULL,
    @password_encriptacion NVARCHAR(255) = NULL,
    @numero_telefono NVARCHAR(20) = NULL,
    @cuenta_gmail NVARCHAR(100) = NULL,
    @password_gmail NVARCHAR(255) = NULL,
    @codigo_2fa_whatsapp NVARCHAR(50) = NULL,
    @imei_1 NVARCHAR(20) = NULL,
    @imei_2 NVARCHAR(20) = NULL,
    @usuario_asigna_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @assignment_id INT;
    DECLARE @current_estado NVARCHAR(20);
    DECLARE @categoria_nombre NVARCHAR(100);
    DECLARE @error_message NVARCHAR(500);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar lógica de asignación: Empleado+Sector O Empleado+Sucursal O solo Sucursal
        IF @empleado_id IS NULL AND @sucursal_id IS NULL
        BEGIN
            SET @error_message = 'Debe seleccionar un empleado o una sucursal';
            RAISERROR(@error_message, 16, 1);
            RETURN;
        END
        
        IF @empleado_id IS NOT NULL AND @sector_id IS NOT NULL AND @sucursal_id IS NOT NULL
        BEGIN
            SET @error_message = 'Un empleado no puede estar en sector y sucursal a la vez';
            RAISERROR(@error_message, 16, 1);
            RETURN;
        END
        
        IF @sector_id IS NOT NULL AND @empleado_id IS NULL
        BEGIN
            SET @error_message = 'Si selecciona un sector, debe asignar a un empleado';
            RAISERROR(@error_message, 16, 1);
            RETURN;
        END
        
        -- Validar que el item existe y está disponible
        SELECT @current_estado = ii.estado, @categoria_nombre = c.nombre
        FROM InventarioIndividual ii
        INNER JOIN Productos p ON ii.producto_id = p.id
        INNER JOIN Categorias c ON p.categoria_id = c.id
        WHERE ii.id = @inventario_individual_id;
        
        IF @current_estado IS NULL
        BEGIN
            SET @error_message = 'Item de inventario no encontrado';
            RAISERROR(@error_message, 16, 1);
            RETURN;
        END
        
        IF @current_estado != 'Disponible'
        BEGIN
            SET @error_message = 'El item no está disponible. Estado actual: ' + @current_estado;
            RAISERROR(@error_message, 16, 1);
            RETURN;
        END
        
        -- Validaciones específicas por categoría cuando se asigna a empleado
        IF @empleado_id IS NOT NULL
        BEGIN
            IF @categoria_nombre LIKE '%Notebook%' AND (@password_encriptacion IS NULL OR @password_encriptacion = '')
            BEGIN
                SET @error_message = 'La contraseña de encriptación es obligatoria para notebooks';
                RAISERROR(@error_message, 16, 1);
                RETURN;
            END
            
            IF @categoria_nombre LIKE '%Celular%'
            BEGIN
                IF @numero_telefono IS NULL OR @numero_telefono = ''
                BEGIN
                    SET @error_message = 'El número de teléfono es obligatorio para celulares';
                    RAISERROR(@error_message, 16, 1);
                    RETURN;
                END
                
                IF @cuenta_gmail IS NULL OR @cuenta_gmail = ''
                BEGIN
                    SET @error_message = 'La cuenta Gmail es obligatoria para celulares';
                    RAISERROR(@error_message, 16, 1);
                    RETURN;
                END
                
                IF @password_gmail IS NULL OR @password_gmail = ''
                BEGIN
                    SET @error_message = 'La contraseña Gmail es obligatoria para celulares';
                    RAISERROR(@error_message, 16, 1);
                    RETURN;
                END
                
                IF @codigo_2fa_whatsapp IS NULL OR @codigo_2fa_whatsapp = ''
                BEGIN
                    SET @error_message = 'El código 2FA WhatsApp es obligatorio para celulares';
                    RAISERROR(@error_message, 16, 1);
                    RETURN;
                END
                
                IF @imei_1 IS NULL OR @imei_1 = ''
                BEGIN
                    SET @error_message = 'El IMEI 1 es obligatorio para celulares';
                    RAISERROR(@error_message, 16, 1);
                    RETURN;
                END
            END
        END
        
        -- Crear asignación
        INSERT INTO Asignaciones (
            inventario_individual_id, 
            empleado_id, 
            sector_id, 
            sucursal_id,
            fecha_asignacion,
            usuario_asigna_id,
            observaciones,
            password_encriptacion,
            numero_telefono,
            cuenta_gmail,
            password_gmail,
            codigo_2fa_whatsapp,
            imei_1,
            imei_2,
            activa
        )
        VALUES (
            @inventario_individual_id,
            @empleado_id,
            @sector_id,
            @sucursal_id,
            GETDATE(),
            @usuario_asigna_id,
            @observaciones,
            @password_encriptacion,
            @numero_telefono,
            @cuenta_gmail,
            @password_gmail,
            @codigo_2fa_whatsapp,
            @imei_1,
            @imei_2,
            1
        );
        
        SET @assignment_id = SCOPE_IDENTITY();
        
        -- Actualizar estado del inventario individual
        UPDATE InventarioIndividual 
        SET estado = 'Asignado', 
            fecha_modificacion = GETDATE()
        WHERE id = @inventario_individual_id;
        
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
            @usuario_asigna_id, 
            'Asignaciones', 
            'CREATE', 
            @assignment_id,
            'Asignación creada para inventario ID: ' + CAST(@inventario_individual_id AS NVARCHAR(10)),
            GETDATE()
        );
        
        COMMIT TRANSACTION;
        
        -- Retornar resultado exitoso
        SELECT 
            @assignment_id as assignment_id, 
            'Asignación creada exitosamente' as message,
            1 as success;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END;
GO