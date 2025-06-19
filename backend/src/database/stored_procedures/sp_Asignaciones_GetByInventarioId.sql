-- =============================================
-- Author:      StockIT Dev Team
-- Create date: 02/01/2025
-- Description: Obtener historial de asignaciones para un ítem de inventario individual
-- =============================================
USE StockIT;
GO

-- Verificar si el procedimiento ya existe y eliminarlo
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_Asignaciones_GetByInventarioId')
BEGIN
    DROP PROCEDURE sp_Asignaciones_GetByInventarioId;
    PRINT N'Procedimiento sp_Asignaciones_GetByInventarioId eliminado para su recreación.';
END
GO

CREATE PROCEDURE sp_Asignaciones_GetByInventarioId
    @inventario_individual_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Verificar que el ítem de inventario existe
    IF NOT EXISTS (SELECT 1 FROM InventarioIndividual WHERE id = @inventario_individual_id)
    BEGIN
        RAISERROR(N'El ítem de inventario no existe', 16, 1);
        RETURN;
    END
    
    SELECT 
        a.id AS asignacion_id,
        a.inventario_individual_id,
        a.fecha_asignacion,
        a.fecha_devolucion,
        a.observaciones,
        a.password_encriptacion,
        a.numero_telefono,
        a.cuenta_gmail,
        a.password_gmail,
        a.codigo_2fa_whatsapp,
        a.activa,
        
        -- Información del destino de la asignación
        CASE 
            WHEN a.empleado_id IS NOT NULL THEN 'Empleado'
            WHEN a.sector_id IS NOT NULL THEN 'Sector'
            WHEN a.sucursal_id IS NOT NULL THEN 'Sucursal'
            ELSE 'Desconocido'
        END AS tipo_destino,
        
        -- Nombre del destino
        CASE 
            WHEN a.empleado_id IS NOT NULL THEN CONCAT(e.nombre, ' ', e.apellido)
            WHEN a.sector_id IS NOT NULL THEN s.nombre
            WHEN a.sucursal_id IS NOT NULL THEN su.nombre
            ELSE 'Desconocido'
        END AS destino_nombre,
        
        -- IDs de destino
        a.empleado_id,
        a.sector_id,
        a.sucursal_id,
        
        -- Información de usuarios que gestionaron la asignación
        ua.nombre AS usuario_asigna_nombre,
        ur.nombre AS usuario_recibe_nombre,
        a.usuario_asigna_id,
        a.usuario_recibe_id,
        
        -- Información del inventario
        ii.numero_serie,
        p.marca AS producto_marca,
        p.modelo AS producto_modelo,
        c.nombre AS categoria_nombre,
        
        -- Duración de la asignación
        CASE 
            WHEN a.fecha_devolucion IS NOT NULL THEN 
                DATEDIFF(day, a.fecha_asignacion, a.fecha_devolucion)
            ELSE 
                DATEDIFF(day, a.fecha_asignacion, GETDATE())
        END AS dias_asignado
        
    FROM 
        Asignaciones a
    INNER JOIN 
        InventarioIndividual ii ON a.inventario_individual_id = ii.id
    INNER JOIN 
        Productos p ON ii.producto_id = p.id
    INNER JOIN 
        Categorias c ON p.categoria_id = c.id
    INNER JOIN 
        Usuarios ua ON a.usuario_asigna_id = ua.id
    LEFT JOIN 
        Usuarios ur ON a.usuario_recibe_id = ur.id
    LEFT JOIN 
        Empleados e ON a.empleado_id = e.id
    LEFT JOIN 
        Sectores s ON a.sector_id = s.id
    LEFT JOIN 
        Sucursales su ON a.sucursal_id = su.id
    WHERE 
        a.inventario_individual_id = @inventario_individual_id
    ORDER BY 
        a.fecha_asignacion DESC;
END;
GO

PRINT N'Procedimiento sp_Asignaciones_GetByInventarioId creado exitosamente.';
GO 