-- =============================================
-- Autor:      StockIT
-- Fecha:      27/05/2025
-- Descripción: Obtiene un empleado por su ID
-- =============================================
CREATE OR ALTER PROCEDURE sp_Employee_Get
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        id,
        nombre,
        apellido,
        CONCAT(nombre, ' ', apellido) as nombre_completo,
        activo
    FROM Empleados
    WHERE id = @id;
    
    -- Si no se encuentra el empleado
    IF @@ROWCOUNT = 0
    BEGIN
        THROW 50002, 'Empleado no encontrado', 1;
    END
END;
GO