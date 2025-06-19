-- =============================================
-- Autor:      StockIT
-- Fecha:      27/05/2025
-- Descripción: Obtiene todos los sectores con filtros opcionales
-- =============================================
CREATE OR ALTER PROCEDURE sp_Sector_GetAll
    @activo_only BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        id,
        nombre,
        activo
    FROM Sectores
    WHERE (@activo_only = 0 OR activo = 1)
    ORDER BY nombre;
END;
GO