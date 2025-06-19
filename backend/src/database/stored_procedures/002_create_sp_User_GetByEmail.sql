IF OBJECT_ID('dbo.sp_User_GetByEmail', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.sp_User_GetByEmail;
END
GO

CREATE PROCEDURE dbo.sp_User_GetByEmail
    @Email VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        id,
        nombre, -- Corregido: usa 'nombre' según tu tabla
        email,
        password_hash,
        rol,
        activo
    FROM
        dbo.Usuarios
    WHERE
        email = @Email AND activo = 1;
END
GO

PRINT 'Stored Procedure sp_User_GetByEmail creado/actualizado exitosamente.';
GO
