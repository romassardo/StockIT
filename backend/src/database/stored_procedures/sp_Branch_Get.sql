-- =============================================
-- Autor:      StockIT
-- Fecha:      27/05/2025
-- Descripción: Obtiene una sucursal por su ID
-- =============================================
CREATE OR ALTER PROCEDURE sp_Branch_Get
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        id,
        nombre,
        activo
    FROM Sucursales
    WHERE id = @id;
    
    -- Si no se encuentra la sucursal
    IF @@ROWCOUNT = 0
    BEGIN
        THROW 50022, 'Sucursal no encontrada', 1;
    END
END;
GO