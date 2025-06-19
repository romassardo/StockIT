-- =============================================
-- Author:      Gemini
-- Create date: 13/07/2024
-- Description: Obtiene todos los empleados con paginación,
--              respetando un filtro opcional de estado.
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_Employee_GetAll]
    @activo_only BIT = 1,
    @PageNumber INT = 1,
    @PageSize INT = 10,
    @TotalItems INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Contar el total de items que cumplen el criterio
    SELECT @TotalItems = COUNT(id)
    FROM Empleados
    WHERE (@activo_only = 0 OR activo = 1);

    -- 2. Devolver los registros de la página solicitada
    SELECT
        id,
        nombre,
        apellido,
        CONCAT(nombre, ' ', apellido) as nombre_completo,
        activo
    FROM
        Empleados
    WHERE 
        (@activo_only = 0 OR activo = 1)
    ORDER BY
        apellido, nombre
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;

END
GO