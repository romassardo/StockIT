
CREATE PROCEDURE dbo.sp_Repair_GetActive
    @PageNumber INT = 1,
    @PageSize INT = 10,
    @proveedor NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @PageNumber < 1 SET @PageNumber = 1;
    IF @PageSize < 1 SET @PageSize = 10;
    IF @PageSize > 100 SET @PageSize = 100;

    SELECT
        Rep.id AS reparacion_id,
        Rep.inventario_individual_id,
        InvInd.numero_serie, 
        Prod.marca AS producto_marca,
        Prod.modelo AS producto_modelo,
        Rep.fecha_envio,
        Rep.proveedor,
        Rep.problema_descripcion,
        Rep.usuario_envia_id,
        UsrEnv.nombre AS usuario_envia_nombre,
        COUNT(*) OVER() AS TotalRows
    FROM
        dbo.Reparaciones AS Rep
    INNER JOIN
        dbo.InventarioIndividual AS InvInd ON Rep.inventario_individual_id = InvInd.id
    INNER JOIN
        dbo.Productos AS Prod ON InvInd.producto_id = Prod.id
    INNER JOIN
        dbo.Usuarios AS UsrEnv ON Rep.usuario_envia_id = UsrEnv.id
    WHERE
        Rep.estado = 'En Reparación'
        AND (@proveedor IS NULL OR Rep.proveedor LIKE '%' + @proveedor + '%')
    ORDER BY
        Rep.fecha_envio DESC
    OFFSET (@PageSize * (@PageNumber - 1)) ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;
