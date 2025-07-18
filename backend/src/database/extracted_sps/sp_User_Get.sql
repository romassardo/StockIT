
CREATE PROCEDURE sp_User_Get
    @user_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validar que el usuario existe
    IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE id = @user_id)
    BEGIN
        THROW 50003, N'Usuario no encontrado', 1;
        RETURN;
    END
    
    -- Obtener informaciÃ³n del usuario
    SELECT 
        id,
        nombre,
        email,
        password_hash,
        rol,
        activo,
        fecha_creacion,
        ultimo_acceso
    FROM Usuarios
    WHERE id = @user_id;
END;
