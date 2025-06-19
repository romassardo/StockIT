-- =============================================
-- Author:      StockIT Dev Team
-- Create date: 27/05/2025
-- Description: Obtener información detallada de un ítem de inventario individual por número de serie
-- =============================================
USE StockIT;
GO

-- Verificar si el procedimiento ya existe y eliminarlo
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_InventarioIndividual_GetBySerialNumber')
BEGIN
    DROP PROCEDURE sp_InventarioIndividual_GetBySerialNumber;
    PRINT N'Procedimiento sp_InventarioIndividual_GetBySerialNumber eliminado para su recreación.';
END
GO

CREATE PROCEDURE sp_InventarioIndividual_GetBySerialNumber
    @numero_serie NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Verificar que el ítem existe
    IF NOT EXISTS (SELECT 1 FROM InventarioIndividual WHERE numero_serie = @numero_serie)
    BEGIN
        THROW 50005, N'No se encontró ningún ítem con ese número de serie', 1;
        RETURN;
    END
    
    -- Obtener información detallada del ítem, incluyendo información del producto
    SELECT 
        ii.id,
        ii.producto_id,
        p.marca AS producto_marca,
        p.modelo AS producto_modelo,
        c.nombre AS categoria_nombre,
        ii.numero_serie,
        ii.estado,
        ii.fecha_ingreso,
        ii.fecha_baja,
        ii.motivo_baja,
        ii.fecha_creacion,
        ii.fecha_modificacion,
        ua.nombre AS usuario_alta_nombre,
        ub.nombre AS usuario_baja_nombre,
        
        -- Información de asignación actual (si está asignado)
        (SELECT TOP 1 a.id 
         FROM Asignaciones a 
         WHERE a.inventario_individual_id = ii.id AND a.activa = 1) AS asignacion_actual_id,
        
        -- Información de reparación actual (si está en reparación)
        (SELECT TOP 1 r.id 
         FROM Reparaciones r 
         WHERE r.inventario_individual_id = ii.id AND r.estado = N'En Reparación') AS reparacion_actual_id
    FROM 
        InventarioIndividual ii
    INNER JOIN 
        Productos p ON ii.producto_id = p.id
    INNER JOIN 
        Categorias c ON p.categoria_id = c.id
    INNER JOIN 
        Usuarios ua ON ii.usuario_alta_id = ua.id
    LEFT JOIN 
        Usuarios ub ON ii.usuario_baja_id = ub.id
    WHERE 
        ii.numero_serie = @numero_serie;
END;
GO

PRINT N'Procedimiento sp_InventarioIndividual_GetBySerialNumber creado exitosamente.';
GO