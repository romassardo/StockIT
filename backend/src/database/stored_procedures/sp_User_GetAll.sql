-- =============================================
-- Autor: Claude AI
-- Fecha de creación: 2025-01-18
-- Descripción: Obtener listado de usuarios con paginación y filtros
-- =============================================

DROP PROCEDURE IF EXISTS sp_User_GetAll;
GO

CREATE PROCEDURE sp_User_GetAll
    @page INT = 1,
    @pageSize INT = 25,
    @search NVARCHAR(255) = '',
    @rol NVARCHAR(50) = '',
    @activo BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @offset INT = (@page - 1) * @pageSize;
    
    BEGIN TRY
        -- Construir query dinámico con filtros
        WITH FilteredUsers AS (
            SELECT 
                id,
                nombre,
                email,
                rol,
                activo,
                fecha_creacion,
                ultimo_acceso,
                COUNT(*) OVER() AS TotalRecords
            FROM Usuarios
            WHERE (@search = '' OR nombre LIKE '%' + @search + '%' OR email LIKE '%' + @search + '%')
              AND (@rol = '' OR rol = @rol)
              AND (@activo IS NULL OR activo = @activo)
        )
        SELECT *
        FROM FilteredUsers
        ORDER BY nombre
        OFFSET @offset ROWS
        FETCH NEXT @pageSize ROWS ONLY;
        
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO