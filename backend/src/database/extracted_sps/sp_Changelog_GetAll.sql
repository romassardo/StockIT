CREATE PROCEDURE sp_Changelog_GetAll
    @version NVARCHAR(20) = NULL,
    @tipo_cambio NVARCHAR(20) = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    IF @PageNumber < 1
        SET @PageNumber = 1;
    IF @PageSize < 1
        SET @PageSize = 10;
    SELECT c.id, c.version, c.fecha_cambio, c.descripcion, c.tipo_cambio, c.usuario_id,
           u.nombre AS nombre_usuario,
           COUNT(*) OVER() AS TotalRows
    FROM Changelog c
    LEFT JOIN Usuarios u ON c.usuario_id = u.id
    WHERE (@version IS NULL OR c.version = @version)
      AND (@tipo_cambio IS NULL OR c.tipo_cambio = @tipo_cambio)
    ORDER BY c.fecha_cambio DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;