-- Verificar que existan todos los stored procedures necesarios para reparaciones
USE StockIT;
GO

-- Verificar si existen los SPs
SELECT 
    name AS 'StoredProcedure',
    create_date,
    modify_date
FROM sys.objects 
WHERE type = 'P' 
    AND name IN (
        'sp_Repair_GetActive',
        'sp_Repair_Create', 
        'sp_Repair_Return',
        'sp_Repair_Complete',
        'sp_Repair_Cancel'
    )
ORDER BY name;

-- Ver estructura de la tabla Reparaciones
PRINT '--- Estructura de tabla Reparaciones ---';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Reparaciones'
ORDER BY ORDINAL_POSITION;

-- Ver algunas reparaciones de muestra
PRINT '--- Muestra de reparaciones existentes ---';
SELECT TOP 5 
    id,
    inventario_individual_id,
    fecha_envio,
    fecha_retorno,
    proveedor,
    estado,
    usuario_envia_id
FROM Reparaciones
ORDER BY fecha_envio DESC;