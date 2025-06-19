/*
Migración para agregar Stored Procedures de Reparaciones
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

-- Procedimiento para completar una reparación
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_Repair_Complete')
    DROP PROCEDURE dbo.sp_Repair_Complete
GO

CREATE PROCEDURE dbo.sp_Repair_Complete
    @reparacion_id INT,
    @estado_reparacion NVARCHAR(20),
    @solucion_descripcion NVARCHAR(MAX) = NULL,
    @usuario_recibe_id INT,
    @motivo_baja NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @inventario_id INT;
    DECLARE @estado_actual NVARCHAR(20);
    DECLARE @nuevo_estado_inventario NVARCHAR(20);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verificar que la reparación existe y está en estado "Enviado"
        SELECT 
            @inventario_id = r.inventario_individual_id,
            @estado_actual = r.estado
        FROM 
            Reparaciones r
        WHERE 
            r.id = @reparacion_id;
            
        IF @inventario_id IS NULL
        BEGIN
            RAISERROR('La reparación especificada no existe', 16, 1);
            RETURN;
        END
        
        IF @estado_actual <> 'Enviado'
        BEGIN
            RAISERROR('Solo se pueden completar reparaciones en estado "Enviado"', 16, 1);
            RETURN;
        END
        
        -- Validar el estado de reparación
        IF @estado_reparacion NOT IN ('Reparado', 'Sin Reparación')
        BEGIN
            RAISERROR('Estado de reparación inválido. Debe ser "Reparado" o "Sin Reparación"', 16, 1);
            RETURN;
        END
        
        -- Determinar nuevo estado para el inventario
        IF @estado_reparacion = 'Reparado'
        BEGIN
            SET @nuevo_estado_inventario = 'Disponible';
            
            IF @solucion_descripcion IS NULL OR LEN(@solucion_descripcion) < 5
            BEGIN
                RAISERROR('Debe proporcionar una descripción de la solución para ítems reparados', 16, 1);
                RETURN;
            END
        END
        ELSE -- 'Sin Reparación'
        BEGIN
            SET @nuevo_estado_inventario = 'Baja';
            
            IF @motivo_baja IS NULL OR LEN(@motivo_baja) < 5
            BEGIN
                RAISERROR('Debe proporcionar un motivo de baja para ítems sin reparación', 16, 1);
                RETURN;
            END
        END
        
        -- Actualizar registro de reparación
        UPDATE dbo.Reparaciones
        SET 
            fecha_retorno = GETDATE(),
            solucion_descripcion = @solucion_descripcion,
            estado = @estado_reparacion,
            usuario_recibe_id = @usuario_recibe_id,
            fecha_modificacion = GETDATE()
        WHERE 
            id = @reparacion_id;
            
        -- Actualizar estado del inventario
        UPDATE InventarioIndividual
        SET 
            estado = @nuevo_estado_inventario,
            fecha_baja = CASE 
                WHEN @nuevo_estado_inventario = 'Baja' THEN GETDATE()
                ELSE NULL
            END,
            motivo_baja = CASE 
                WHEN @nuevo_estado_inventario = 'Baja' THEN @motivo_baja
                ELSE NULL
            END,
            usuario_baja_id = CASE 
                WHEN @nuevo_estado_inventario = 'Baja' THEN @usuario_recibe_id
                ELSE NULL
            END,
            fecha_modificacion = GETDATE()
        WHERE 
            id = @inventario_id;
            
        -- Registrar actividad
        INSERT INTO dbo.LogsActividad (
            usuario_id,
            tabla_afectada,
            accion,
            registro_id,
            descripcion
        )
        VALUES (
            @usuario_recibe_id,
            'Reparaciones',
            'UPDATE',
            @reparacion_id,
            CONCAT('{"estado":"', @estado_reparacion, '","inventario_id":', @inventario_id, ',"solucion":"', ISNULL(@solucion_descripcion, ''), '"}')
        );
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- Procedimiento para cancelar una reparación
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_Repair_Cancel')
    DROP PROCEDURE dbo.sp_Repair_Cancel
GO

CREATE PROCEDURE dbo.sp_Repair_Cancel
    @reparacion_id INT,
    @motivo_cancelacion NVARCHAR(MAX),
    @usuario_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @inventario_id INT;
    DECLARE @estado_actual NVARCHAR(20);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verificar que la reparación existe y está en estado "Enviado"
        SELECT 
            @inventario_id = r.inventario_individual_id,
            @estado_actual = r.estado
        FROM 
            Reparaciones r
        WHERE 
            r.id = @reparacion_id;
            
        IF @inventario_id IS NULL
        BEGIN
            RAISERROR('La reparación especificada no existe', 16, 1);
            RETURN;
        END
        
        IF @estado_actual <> 'Enviado'
        BEGIN
            RAISERROR('Solo se pueden cancelar reparaciones en estado "Enviado"', 16, 1);
            RETURN;
        END
        
        IF @motivo_cancelacion IS NULL OR LEN(@motivo_cancelacion) < 5
        BEGIN
            RAISERROR('Debe proporcionar un motivo de cancelación válido', 16, 1);
            RETURN;
        END
        
        -- Actualizar registro de reparación
        UPDATE dbo.Reparaciones
        SET 
            estado = 'Cancelado',
            fecha_retorno = GETDATE(),
            solucion_descripcion = CONCAT('Cancelado: ', @motivo_cancelacion),
            usuario_recibe_id = @usuario_id,
            fecha_modificacion = GETDATE()
        WHERE 
            id = @reparacion_id;
            
        -- Actualizar estado del inventario (volver a disponible)
        UPDATE InventarioIndividual
        SET 
            estado = 'Disponible',
            fecha_modificacion = GETDATE()
        WHERE 
            id = @inventario_id;
            
        -- Registrar actividad
        INSERT INTO dbo.LogsActividad (
            usuario_id,
            tabla_afectada,
            accion,
            registro_id,
            descripcion
        )
        VALUES (
            @usuario_id,
            'Reparaciones',
            'UPDATE',
            @reparacion_id,
            CONCAT('{"estado":"Cancelado","inventario_id":', @inventario_id, ',"motivo":"', @motivo_cancelacion, '"}')
        );
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- Procedimiento para obtener reparaciones activas
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_Repair_GetActive')
    DROP PROCEDURE dbo.sp_Repair_GetActive
GO

CREATE PROCEDURE dbo.sp_Repair_GetActive
    @Proveedor NVARCHAR(100) = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    
    SELECT 
        r.id AS reparacion_id,
        ii.numero_serie,
        p.id AS producto_id,
        p.nombre AS producto_marca,
        p.descripcion AS producto_modelo,
        c.nombre AS producto_categoria,
        r.fecha_envio,
        r.proveedor,
        r.problema_descripcion,
        r.estado,
        u_envia.nombre AS usuario_envia_nombre,
        r.usuario_envia_id,
        DATEDIFF(day, r.fecha_envio, GETDATE()) AS dias_en_reparacion,
        COUNT(*) OVER() AS TotalRows
    FROM 
        Reparaciones r
        INNER JOIN InventarioIndividual ii ON r.inventario_individual_id = ii.id
        INNER JOIN Productos p ON ii.producto_id = p.id
        INNER JOIN Categorias c ON p.categoria_id = c.id
        INNER JOIN Usuarios u_envia ON r.usuario_envia_id = u_envia.id
    WHERE 
        r.estado = 'Enviado'
        AND (@Proveedor IS NULL OR r.proveedor LIKE '%' + @Proveedor + '%')
    ORDER BY 
        r.fecha_envio DESC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END
GO

-- Procedimiento para obtener detalle de reparación
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_Repair_GetById')
    DROP PROCEDURE dbo.sp_Repair_GetById
GO

CREATE PROCEDURE dbo.sp_Repair_GetById
    @ReparacionID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        r.id AS reparacion_id,
        r.fecha_envio,
        r.fecha_retorno,
        r.problema_descripcion,
        r.solucion_descripcion,
        r.estado,
        r.proveedor,
        u_envia.nombre AS usuario_envia,
        u_recibe.nombre AS usuario_recibe,
        DATEDIFF(day, r.fecha_envio, ISNULL(r.fecha_retorno, GETDATE())) AS dias_reparacion
    FROM 
        Reparaciones r
        INNER JOIN Usuarios u_envia ON r.usuario_envia_id = u_envia.id
        LEFT JOIN Usuarios u_recibe ON r.usuario_recibe_id = u_recibe.id
    WHERE 
        r.id = @ReparacionID;
END
GO

-- Procedimiento para obtener historial de reparaciones por inventario
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_Repair_GetByInventarioId')
    DROP PROCEDURE dbo.sp_Repair_GetByInventarioId
GO

CREATE PROCEDURE dbo.sp_Repair_GetByInventarioId
    @InventarioId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        r.id AS reparacion_id,
        r.fecha_envio,
        r.fecha_retorno,
        r.problema_descripcion,
        r.solucion_descripcion,
        r.estado,
        r.proveedor,
        u_envia.nombre AS usuario_envia,
        u_recibe.nombre AS usuario_recibe,
        DATEDIFF(day, r.fecha_envio, ISNULL(r.fecha_retorno, GETDATE())) AS dias_reparacion
    FROM 
        Reparaciones r
        INNER JOIN Usuarios u_envia ON r.usuario_envia_id = u_envia.id
        LEFT JOIN Usuarios u_recibe ON r.usuario_recibe_id = u_recibe.id
    WHERE 
        r.inventario_individual_id = @InventarioId
    ORDER BY 
        r.fecha_envio DESC;
END
GO
