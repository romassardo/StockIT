-- =============================================
-- Autor:      StockIT
-- Fecha:      27/05/2025
-- Descripción: Obtiene un sector por su ID
-- =============================================
CREATE OR ALTER PROCEDURE sp_Sector_Get
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        id,
        nombre,
        activo
    FROM Sectores
    WHERE id = @id;
    
    -- Si no se encuentra el sector
    IF @@ROWCOUNT = 0
    BEGIN
        THROW 50012, 'Sector no encontrado', 1;
    END
END;
GO