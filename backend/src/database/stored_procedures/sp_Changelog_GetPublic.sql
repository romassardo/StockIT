CREATE OR ALTER PROCEDURE sp_Changelog_GetPublic
    @version NVARCHAR(20) = NULL,
    @tipo_cambio NVARCHAR(20) = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validar parámetros de paginación
    IF @PageNumber < 1
        SET @PageNumber = 1;
    
    IF @PageSize < 1
        SET @PageSize = 10;
    
    -- Consulta con filtros opcionales y paginación para visualización pública
    -- No incluye información sensible como el usuario_id
    SELECT c.id, c.version, c.fecha_cambio, c.descripcion, c.tipo_cambio,
           COUNT(*) OVER() AS TotalRows
    FROM Changelog c
    WHERE (@version IS NULL OR c.version = @version)
      AND (@tipo_cambio IS NULL OR c.tipo_cambio = @tipo_cambio)
    ORDER BY c.fecha_cambio DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;