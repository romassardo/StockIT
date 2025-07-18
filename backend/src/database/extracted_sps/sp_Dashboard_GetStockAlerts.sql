
CREATE PROCEDURE [dbo].[sp_Dashboard_GetStockAlerts]
AS
BEGIN
  SET NOCOUNT ON;
  
  SELECT 
    p.id AS ProductoID,
    p.marca AS Marca,
    p.modelo AS Modelo, 
    p.descripcion AS Descripcion,
    p.categoria_id AS CategoriaID,
    c.nombre AS CategoriaNombre,
    sg.cantidad_actual AS CantidadActual,
    p.stock_minimo AS StockMinimo,
    CAST(
      CASE 
        WHEN p.stock_minimo = 0 THEN 0 
        ELSE (sg.cantidad_actual * 100.0) / p.stock_minimo 
      END AS INT
    ) AS Porcentaje
  FROM 
    Productos p
    INNER JOIN StockGeneral sg ON p.id = sg.producto_id
    INNER JOIN Categorias c ON p.categoria_id = c.id
  WHERE 
    p.activo = 1
    AND (sg.cantidad_actual <= p.stock_minimo)
  ORDER BY 
    Porcentaje ASC;
END
