import { Response } from 'express';
import { DatabaseConnection } from '../utils/database';
import { logger } from '../utils/logger';
import { AuthRequest } from '../types/auth.types';
import { cacheService } from '../services/cache.service';

/**
 * Interfaces para las respuestas del dashboard
 */

// Estadísticas generales del sistema
interface SystemStats {
  TotalUsuariosActivos: number;
  TotalCategoriasActivas: number;
  TotalProductosDistintosActivos: number;
  TotalItemsInventarioIndividual: number;
  ItemsDisponiblesInventarioIndividual: number;
  ItemsAsignadosInventarioIndividual: number;
  ItemsEnReparacionInventarioIndividual: number;
  ItemsBajaInventarioIndividual: number;
  ProductosEnStockGeneralDistintos: number;
  TotalUnidadesStockGeneral: number;
  TotalAsignacionesActivas: number;
  TotalReparacionesActivas: number;
}

interface StockAlert {
  ProductoID: number;
  Marca: string;
  Modelo: string;
  Descripcion: string;
  CategoriaID: number;
  CategoriaNombre: string;
  CantidadActual: number;
  StockMinimo: number;
  Porcentaje: number;
}

interface RecentActivity {
  ID: number;
  UsuarioID: number;
  UsuarioNombre: string;
  TablaAfectada: string;
  Accion: string;
  RegistroID: number;
  Descripcion: string;
  FechaHora: string;
  IPAddress: string;
}

/**
 * Controlador para el Dashboard
 */
export class DashboardController {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
    logger.info('DashboardController inicializado');
  }

  /**
   * Obtiene estadísticas generales del sistema para el dashboard
   */
  public getSystemStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // 🚀 VERIFICAR CACHÉ PRIMERO (5 minutos TTL)
      const cacheKey = 'dashboard_system_stats';
      const cachedStats = await cacheService.get<SystemStats>(cacheKey);
      
      if (cachedStats) {
        logger.info('Estadísticas del dashboard servidas desde caché');
        res.status(200).json({
          success: true,
          data: cachedStats,
          source: 'cache'
        });
        return;
      }

      // Consultas directas a la base de datos
      logger.info('Obteniendo estadísticas del dashboard');
      
      // 1. Total de empleados activos (más relevante que usuarios)
      const employeesQuery = `SELECT COUNT(id) AS TotalEmpleadosActivos 
                              FROM Empleados 
                              WHERE activo = 1`;
      const employeesResult = await this.db.executeQuery(employeesQuery);
      
      // 2. Total de categorías activas
      const categoriesQuery = `SELECT COUNT(id) AS TotalCategoriasActivas 
                               FROM Categorias 
                               WHERE activo = 1`;
      const categoriesResult = await this.db.executeQuery(categoriesQuery);
      
      // 3. Total de productos distintos activos
      const productsQuery = `SELECT COUNT(id) AS TotalProductosDistintosActivos 
                             FROM Productos 
                             WHERE activo = 1`;
      const productsResult = await this.db.executeQuery(productsQuery);
      
      // 4. Inventario Individual
      const inventoryQuery = `
        SELECT 
          COUNT(id) AS TotalItemsInventarioIndividual,
          SUM(CASE WHEN estado = 'Disponible' THEN 1 ELSE 0 END) AS ItemsDisponiblesInventarioIndividual,
          SUM(CASE WHEN estado = 'Asignado' THEN 1 ELSE 0 END) AS ItemsAsignadosInventarioIndividual,
          SUM(CASE WHEN estado = 'En Reparación' THEN 1 ELSE 0 END) AS ItemsEnReparacionInventarioIndividual,
          SUM(CASE WHEN estado = 'Dado de Baja' THEN 1 ELSE 0 END) AS ItemsBajaInventarioIndividual
        FROM InventarioIndividual
      `;
      const inventoryResult = await this.db.executeQuery(inventoryQuery);
      
      // 5. Stock General
      const stockQuery = `
        SELECT 
          COUNT(DISTINCT producto_id) AS ProductosEnStockGeneralDistintos
        FROM StockGeneral
        WHERE cantidad_actual > 0`;
      const stockResult = await this.db.executeQuery(stockQuery);
      
      const totalUnitsQuery = `
        SELECT 
          SUM(CAST(cantidad_actual AS SIGNED)) AS TotalUnidadesStockGeneral
        FROM StockGeneral`;
      const totalUnitsResult = await this.db.executeQuery(totalUnitsQuery);
      
      // 6. Total de asignaciones activas
      const assignmentsQuery = `
        SELECT 
          COUNT(id) AS TotalAsignacionesActivas
        FROM Asignaciones 
        WHERE activa = 1`;
      const assignmentsResult = await this.db.executeQuery(assignmentsQuery);
      
      // 7. Total de reparaciones activas
      const repairsQuery = `
        SELECT 
          COUNT(id) AS TotalReparacionesActivas
        FROM Reparaciones 
        WHERE estado IN ('En Reparación')`;
      const repairsResult = await this.db.executeQuery(repairsQuery);
      
      // Combinar todos los resultados
      const [employeesData] = employeesResult;
      const [categoriesData] = categoriesResult;
      const [productsData] = productsResult;
      const [inventoryData] = inventoryResult;
      const [stockData] = stockResult;
      const [totalUnitsData] = totalUnitsResult;
      const [assignmentsData] = assignmentsResult;
      const [repairsData] = repairsResult;
      
      const stats: SystemStats = {
        TotalUsuariosActivos: employeesData[0]?.TotalEmpleadosActivos || 0,
        TotalCategoriasActivas: categoriesData[0]?.TotalCategoriasActivas || 0,
        TotalProductosDistintosActivos: productsData[0]?.TotalProductosDistintosActivos || 0,
        TotalItemsInventarioIndividual: inventoryData[0]?.TotalItemsInventarioIndividual || 0,
        ItemsDisponiblesInventarioIndividual: inventoryData[0]?.ItemsDisponiblesInventarioIndividual || 0,
        ItemsAsignadosInventarioIndividual: inventoryData[0]?.ItemsAsignadosInventarioIndividual || 0,
        ItemsEnReparacionInventarioIndividual: inventoryData[0]?.ItemsEnReparacionInventarioIndividual || 0,
        ItemsBajaInventarioIndividual: inventoryData[0]?.ItemsBajaInventarioIndividual || 0,
        ProductosEnStockGeneralDistintos: stockData[0]?.ProductosEnStockGeneralDistintos || 0,
        TotalUnidadesStockGeneral: totalUnitsData[0]?.TotalUnidadesStockGeneral || 0,
        TotalAsignacionesActivas: assignmentsData[0]?.TotalAsignacionesActivas || 0,
        TotalReparacionesActivas: repairsData[0]?.TotalReparacionesActivas || 0
      };
      
      logger.info('Estadísticas del dashboard obtenidas exitosamente');
      
      // 🚀 GUARDAR EN CACHÉ (5 minutos)
      await cacheService.set(cacheKey, stats, 5 * 60 * 1000);
      res.status(200).json({
        success: true,
        data: stats
      });
      
    } catch (error: any) {
      logger.error(`Error al obtener estadísticas del sistema: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas del sistema',
        error: error.message
      });
    }
  };

  /**
   * Obtiene alertas de stock bajo
   */
  public getStockAlerts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // Consulta directa a la base de datos
      logger.info('Obteniendo alertas de stock');
      
      const query = `
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
            END AS SIGNED
          ) AS Porcentaje
        FROM 
          Productos p
          INNER JOIN StockGeneral sg ON p.id = sg.producto_id
          INNER JOIN Categorias c ON p.categoria_id = c.id
        WHERE 
          p.activo = 1
          AND (sg.cantidad_actual <= p.stock_minimo)
        ORDER BY 
          Porcentaje ASC
      `;
      
      const result = await this.db.executeQuery(query);
      
      const [data] = result;
      
      logger.info('Alertas de stock obtenidas exitosamente');
      res.status(200).json({
        success: true,
        data: data || []
      });
      
    } catch (error: any) {
      logger.error(`Error al obtener alertas de stock: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        message: 'Error al obtener alertas de stock',
        error: error.message
      });
    }
  };

  /**
   * Obtiene actividad reciente del sistema
   */
  public getRecentActivity = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { limit = 10 } = req.query;
      const limitNum = Math.min(parseInt(limit as string, 10) || 10, 50); // Máximo 50 registros
      
      const query = `
        SELECT
          la.id AS ID,
          la.usuario_id AS UsuarioID,
          u.nombre AS UsuarioNombre,
          la.tabla_afectada AS TablaAfectada,
          la.accion AS Accion,
          la.registro_id AS RegistroID,
          la.descripcion AS Descripcion,
          la.fecha_hora AS FechaHora,
          la.ip_address AS IPAddress
        FROM 
          LogsActividad la
          LEFT JOIN Usuarios u ON la.usuario_id = u.id
        ORDER BY 
          la.fecha_hora DESC
        LIMIT ?
      `;
      
      const result = await this.db.executeQuery(query, [limitNum]);
      
      const [data] = result;
      
      res.status(200).json({
        success: true,
        data: data || []
      });
      
    } catch (error: any) {
      logger.error(`Error al obtener actividad reciente: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        message: 'Error al obtener actividad reciente',
        error: error.message
      });
    }
  };

  /**
   * Obtiene KPIs principales del inventario
   */
  public getInventoryKPIs = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // KPIs a obtener:
      // 1. Porcentaje de productos con stock bajo
      // 2. Tasa de utilización de equipos (asignados vs. disponibles)
      // 3. Tiempo promedio de reparación
      // 4. Tasa de rotación de inventario

      // 1. Porcentaje de productos con stock bajo
      const lowStockQuery = `
        SELECT
          COUNT(*) AS TotalProductos,
          SUM(CASE WHEN sg.cantidad_actual <= p.stock_minimo THEN 1 ELSE 0 END) AS ProductosBajoStock
        FROM
          Productos p
          INNER JOIN StockGeneral sg ON p.id = sg.producto_id
        WHERE
          p.activo = 1
      `;
      const lowStockResult = await this.db.executeQuery(lowStockQuery);

      // 2. Tasa de utilización de equipos
      const utilizationQuery = `
        SELECT
          COUNT(*) AS TotalEquipos,
          SUM(CASE WHEN estado = 'Asignado' THEN 1 ELSE 0 END) AS EquiposAsignados
        FROM
          InventarioIndividual
        WHERE
          estado IN ('Disponible', 'Asignado')
      `;
      const utilizationResult = await this.db.executeQuery(utilizationQuery);

      // 3. Tiempo promedio de reparación (en días, para reparaciones completadas en el último mes)
      const repairTimeQuery = `
        SELECT
          AVG(DATEDIFF(fecha_retorno, fecha_envio)) AS TiempoPromedioReparacion
        FROM
          Reparaciones
        WHERE
          estado = 'Completado'
          AND fecha_retorno IS NOT NULL
          AND fecha_retorno >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
      `;
      const repairTimeResult = await this.db.executeQuery(repairTimeQuery);

      // 4. Tasa de rotación (movimientos por día en el último mes)
      const rotationRateQuery = `
        SELECT
          COUNT(*) AS TotalMovimientos,
          COUNT(DISTINCT DATE(fecha_movimiento)) AS DiasConMovimientos
        FROM
          MovimientosStock
        WHERE
          fecha_movimiento >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
      `;
      const rotationRateResult = await this.db.executeQuery(rotationRateQuery);

      // Calcular los KPIs
      const [lowStockData] = lowStockResult;
      const [utilizationData] = utilizationResult;
      const [repairTimeData] = repairTimeResult;
      const [rotationRateData] = rotationRateResult;

      const lowStockInfo = lowStockData[0];
      const utilizationInfo = utilizationData[0];
      const repairTimeInfo = repairTimeData[0];
      const rotationRateInfo = rotationRateData[0];

      const lowStockPercentage = lowStockInfo.TotalProductos > 0
        ? (lowStockInfo.ProductosBajoStock / lowStockInfo.TotalProductos) * 100
        : 0;

      const utilizationRate = utilizationInfo.TotalEquipos > 0
        ? (utilizationInfo.EquiposAsignados / utilizationInfo.TotalEquipos) * 100
        : 0;

      const avgRepairTime = repairTimeInfo.TiempoPromedioReparacion || 0;

      const rotationRate = rotationRateInfo.DiasConMovimientos > 0
        ? rotationRateInfo.TotalMovimientos / rotationRateInfo.DiasConMovimientos
        : 0;

      const kpis = {
        lowStockPercentage: parseFloat(lowStockPercentage.toFixed(2)),
        utilizationRate: parseFloat(utilizationRate.toFixed(2)),
        avgRepairTime: parseFloat(avgRepairTime.toFixed(1)),
        rotationRate: parseFloat(rotationRate.toFixed(2))
      };

      res.status(200).json({
        success: true,
        data: kpis
      });
    
    } catch (error: any) {
      logger.error(`Error al obtener KPIs de inventario: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        message: 'Error al obtener KPIs de inventario',
        error: error.message
      });
    }
  };
}
