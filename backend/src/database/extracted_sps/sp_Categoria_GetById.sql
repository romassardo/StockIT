
-- =============================================
-- Author:      Cascade
-- Create date: 2025-05-30
-- Description: Obtiene una categorÃ­a especÃ­fica por su ID.
-- =============================================
CREATE PROCEDURE dbo.sp_Categoria_GetById
    @id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        c.id,
        c.nombre,
        c.categoria_padre_id,
        cp.nombre AS categoria_padre_nombre,
        c.requiere_serie,
        c.permite_asignacion,
        c.permite_reparacion,
        c.activo,
        c.fecha_creacion
    FROM
        dbo.Categorias c
    LEFT JOIN
        dbo.Categorias cp ON c.categoria_padre_id = cp.id
    WHERE
        c.id = @id;

    -- Verificar si la categorÃ­a existe
    IF @@ROWCOUNT = 0
    BEGIN
        RAISERROR('CategorÃ­a no encontrada.', 16, 1);
        RETURN;
    END
END;
