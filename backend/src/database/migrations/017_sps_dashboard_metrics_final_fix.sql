-- Dashboard metrics - Stored Procedures
-- Version: Final Fix que soluciona problemas de columnas inexistentes

/****** Object: StoredProcedure [dbo].[sp_Dashboard_GetSystemStats] ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Drop the stored procedure if it already exists
IF EXISTS (
  SELECT *
  FROM sys.objects
  WHERE object_id = OBJECT_ID(N'[dbo].[sp_Dashboard_GetSystemStats]')
  AND type in (N'P')
)
BEGIN
  DROP PROCEDURE [dbo].[sp_Dashboard_GetSystemStats]
END
GO

-- Create the stored procedure
CREATE PROCEDURE [dbo].[sp_Dashboard_GetSystemStats]
AS
BEGIN
  SET NOCOUNT ON;
  
  DECLARE @TotalUsuariosActivos INT;
  DECLARE @TotalCategoriasActivas INT;
  DECLARE @TotalProductosDistintosActivos INT;
  DECLARE @TotalItemsInventarioIndividual INT;
  DECLARE @ItemsDisponiblesInventarioIndividual INT;
  DECLARE @ItemsAsignadosInventarioIndividual INT;
  DECLARE @ItemsEnReparacionInventarioIndividual INT;
  DECLARE @ItemsBajaInventarioIndividual INT;
  DECLARE @ProductosEnStockGeneralDistintos INT;
  DECLARE @TotalUnidadesStockGeneral BIGINT;
  DECLARE @TotalAsignacionesActivas INT;
  DECLARE @TotalReparacionesActivas INT;
  
  -- Total usuarios activos
  SELECT @TotalUsuariosActivos = COUNT(id)
  FROM dbo.Usuarios
  WHERE activo = 1;
  
  -- Total categorías activas
  SELECT @TotalCategoriasActivas = COUNT(id)
  FROM dbo.Categorias
  WHERE activo = 1;
  
  -- Total productos distintos activos
  SELECT @TotalProductosDistintosActivos = COUNT(id)
  FROM dbo.Productos
  WHERE activo = 1;
  
  -- Estadísticas de inventario individual
  SELECT 
    @TotalItemsInventarioIndividual = COUNT(*),
    @ItemsDisponiblesInventarioIndividual = SUM(CASE WHEN estado = 'Disponible' THEN 1 ELSE 0 END),
    @ItemsAsignadosInventarioIndividual = SUM(CASE WHEN estado = 'Asignado' THEN 1 ELSE 0 END),
    @ItemsEnReparacionInventarioIndividual = SUM(CASE WHEN estado = 'En Reparación' THEN 1 ELSE 0 END),
    @ItemsBajaInventarioIndividual = SUM(CASE WHEN estado = 'Dado de Baja' THEN 1 ELSE 0 END)
  FROM dbo.InventarioIndividual;
  
  -- Productos distintos con stock > 0 en stock general
  SELECT @ProductosEnStockGeneralDistintos = COUNT(DISTINCT producto_id)
  FROM dbo.StockGeneral
  WHERE cantidad_actual > 0;
  
  -- Total unidades en stock general
  SELECT @TotalUnidadesStockGeneral = SUM(CAST(cantidad_actual AS BIGINT))
  FROM dbo.StockGeneral;
  
  -- Total asignaciones activas
  SELECT @TotalAsignacionesActivas = COUNT(id)
  FROM dbo.Asignaciones
  WHERE activa = 1;
  
  -- Total reparaciones activas (estado = Enviado o Recibido)
  SELECT @TotalReparacionesActivas = COUNT(id)
  FROM dbo.Reparaciones
  WHERE estado IN ('Enviado', 'Recibido');
  
  -- Retornar todos los resultados
  SELECT
    @TotalUsuariosActivos AS TotalUsuariosActivos,
    @TotalCategoriasActivas AS TotalCategoriasActivas,
    @TotalProductosDistintosActivos AS TotalProductosDistintosActivos,
    @TotalItemsInventarioIndividual AS TotalItemsInventarioIndividual,
    @ItemsDisponiblesInventarioIndividual AS ItemsDisponiblesInventarioIndividual,
    @ItemsAsignadosInventarioIndividual AS ItemsAsignadosInventarioIndividual,
    @ItemsEnReparacionInventarioIndividual AS ItemsEnReparacionInventarioIndividual,
    @ItemsBajaInventarioIndividual AS ItemsBajaInventarioIndividual,
    @ProductosEnStockGeneralDistintos AS ProductosEnStockGeneralDistintos,
    @TotalUnidadesStockGeneral AS TotalUnidadesStockGeneral,
    @TotalAsignacionesActivas AS TotalAsignacionesActivas,
    @TotalReparacionesActivas AS TotalReparacionesActivas;
END
GO

-- También agregamos un SP para obtener alertas de stock bajo
IF EXISTS (
  SELECT *
  FROM sys.objects
  WHERE object_id = OBJECT_ID(N'[dbo].[sp_Dashboard_GetStockAlerts]')
  AND type in (N'P')
)
BEGIN
  DROP PROCEDURE [dbo].[sp_Dashboard_GetStockAlerts]
END
GO

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
GO
