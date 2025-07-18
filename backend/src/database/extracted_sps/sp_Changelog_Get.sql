CREATE PROCEDURE sp_Changelog_Get
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT c.id, c.version, c.fecha_cambio, c.descripcion, c.tipo_cambio, c.usuario_id,
           u.nombre AS nombre_usuario
    FROM Changelog c
    LEFT JOIN Usuarios u ON c.usuario_id = u.id
    WHERE c.id = @id;
END;