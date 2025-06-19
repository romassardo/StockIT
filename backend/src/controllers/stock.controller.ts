import { Response } from 'express';
import sql from 'mssql';
import { AuthRequest } from '../types/auth.types';
import { logger } from '../utils/logger';
import { DatabaseConnection } from '../utils/database';

// Cache de idempotencia en memoria para evitar duplicados
interface CacheEntry {
  timestamp: number;
  response: any;
  status: number;
}
const idempotencyCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos

// Limpieza periódica de la caché para no consumir memoria indefinidamente
setInterval(() => {
  const now = Date.now();
  idempotencyCache.forEach((entry, key) => {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      idempotencyCache.delete(key);
      console.log(`🧹 Cache-Cleaner: Entrada de idempotencia expirada y eliminada: ${key}`);
    }
  });
}, CACHE_TTL_MS);

export class StockController {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  public addStockEntry = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { producto_id, cantidad, motivo, observaciones } = req.body;
      
      console.log('📤 Procesando entrada de stock:', { producto_id, cantidad, motivo, observaciones });

      // Validaciones básicas
      if (!producto_id || !cantidad || !motivo) {
        res.status(400).json({
          success: false,
          error: 'Producto ID, cantidad y motivo son requeridos'
        });
        return;
      }

      const cantidadNum = parseInt(cantidad);
      if (isNaN(cantidadNum) || cantidadNum <= 0) {
        res.status(400).json({
          success: false,
          error: 'La cantidad debe ser un número positivo'
        });
        return;
      }

      // Ejecutar el stored procedure
      const result = await this.db.executeStoredProcedure<any>(
        'sp_StockGeneral_Entry',
        {
          producto_id: parseInt(producto_id),
          cantidad: cantidadNum,
          motivo: motivo.trim(),
          observaciones: observaciones?.trim() || null,
          usuario_id: req.user!.id
        }
      );

      console.log('✅ Resultado del SP:', result.output);

      res.status(200).json({
        success: true,
        message: result.output.mensaje,
        data: {
          movimientoId: result.output.movimiento_id,
          stockId: result.output.stock_id,
          stockActual: result.output.stock_actual
        }
      });

    } catch (error: any) {
      console.error('❌ Error en addStockEntry:', error);
      logger.error('Error al registrar entrada de stock:', error);
      
      const status = (error.number && error.number >= 50000 && error.number < 60000) ? 400 : 500;
      res.status(status).json({
        success: false,
        error: error.message || 'Error interno del servidor',
        details: {
          sqlErrorCode: error.number,
          procName: error.procName
        }
      });
    }
  };

  public processStockExit = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { 
        producto_id, 
        cantidad, 
        motivo, 
        empleado_id, 
        sector_id, 
        sucursal_id, 
        observaciones
      } = req.body;
      
      console.log('📤 Procesando salida de stock:', { producto_id, cantidad, motivo, empleado_id, sector_id, sucursal_id });

      // Validaciones básicas
      if (!producto_id || !cantidad || !motivo) {
        res.status(400).json({
          success: false,
          error: 'Producto ID, cantidad y motivo son requeridos'
        });
        return;
      }

      const cantidadNum = parseInt(cantidad);
      if (isNaN(cantidadNum) || cantidadNum <= 0) {
        res.status(400).json({
          success: false,
          error: 'La cantidad debe ser un número positivo'
        });
        return;
      }

      // Ejecutar el stored procedure
      const result = await this.db.executeStoredProcedure<any>(
        'sp_StockGeneral_Exit',
        {
          producto_id: parseInt(producto_id),
          cantidad: cantidadNum,
          motivo: motivo.trim(),
          empleado_id: empleado_id ? parseInt(empleado_id) : null,
          sector_id: sector_id ? parseInt(sector_id) : null,
          sucursal_id: sucursal_id ? parseInt(sucursal_id) : null,
          observaciones: observaciones?.trim() || null,
          usuario_id: req.user!.id
        }
      );

      console.log('✅ Resultado del SP:', result.output);

      res.status(200).json({
        success: true,
        message: result.output.mensaje,
        data: {
          movimientoId: result.output.movimiento_id,
          stockId: result.output.stock_id,
          stockActual: result.output.stock_actual,
          alertaBajoStock: result.output.alerta_bajo_stock
        }
      });

    } catch (error: any) {
      console.error('❌ Error en processStockExit:', error);
      logger.error('Error al registrar salida de stock:', error);
      
      const status = (error.number && error.number >= 50000 && error.number < 60000) ? 400 : 500;
      res.status(status).json({
        success: false,
        error: error.message || 'Error interno del servidor',
        details: {
          sqlErrorCode: error.number,
          procName: error.procName
        }
      });
    }
  };

  public getCurrentStock = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      console.log('📊 Obteniendo stock actual...');

      const result = await this.db.executeStoredProcedure<any>(
        'sp_StockGeneral_GetAll',
        {
          categoria_id: null,
          solo_bajo_stock: false,
          producto_id: null
        }
      );
      
      const stockItems = result.recordset || [];
      console.log(`✅ Se encontraron ${stockItems.length} items de stock actual`);

      res.json({
        success: true,
        data: stockItems,
        count: stockItems.length
      });

    } catch (error: any) {
      console.error('❌ Error en getCurrentStock:', error);
      logger.error('Error al obtener stock actual:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Error interno del servidor',
        data: [] 
      });
    }
  };

  public getAllStockItems = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { categoria_id, solo_bajo_stock, producto_id } = req.query;
      console.log('Consultando stock general con parámetros:', { categoria_id, solo_bajo_stock, producto_id });

      const result = await this.db.executeStoredProcedure<any>(
        'sp_StockGeneral_GetAll',
        {
          categoria_id: categoria_id ? Number(categoria_id) : null,
          solo_bajo_stock: solo_bajo_stock === 'true',
          producto_id: producto_id ? Number(producto_id) : null
        }
      );
      
      const stockItems = result.recordset || [];
      console.log(`Se encontraron ${stockItems.length} items de stock`);

      // ENVOLVER LA RESPUESTA EN UN OBJETO
      res.json({
        success: true,
        data: stockItems,
        count: stockItems.length
      });

    } catch (error: any) {
      logger.error('Error al obtener stock general:', error);
      res.status(500).json({ success: false, error: error.message, data: [] });
    }
  };

  public getStockItemById = async (req: AuthRequest, res: Response): Promise<void> => {
    // Implementación de getStockItemById
    res.status(501).send('Not Implemented');
  };

  public getLowStockAlerts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { categoria_id, solo_criticos } = req.query;
      
      console.log('🚨 Obteniendo alertas de stock bajo con parámetros:', {
        categoria_id, solo_criticos
      });

      const result = await this.db.executeStoredProcedure<any>(
        'sp_StockGeneral_GetLowStock',
        {
          categoria_id: categoria_id ? parseInt(categoria_id as string) : null,
          solo_criticos: solo_criticos === 'true'
        }
      );

      const alerts = result.recordset || [];
      console.log(`✅ Se encontraron ${alerts.length} alertas de stock bajo`);

      // Clasificar alertas por criticidad
      const criticalAlerts = alerts.filter((item: any) => item.cantidad_actual === 0);
      const lowStockAlerts = alerts.filter((item: any) => 
        item.cantidad_actual > 0 && item.cantidad_actual <= item.min_stock
      );

      res.json({
        success: true,
        data: {
          alerts,
          summary: {
            total: alerts.length,
            critical: criticalAlerts.length,
            lowStock: lowStockAlerts.length
          },
          categories: {
            critical: criticalAlerts,
            lowStock: lowStockAlerts
          }
        },
        count: alerts.length
      });

    } catch (error: any) {
      console.error('❌ Error en getLowStockAlerts:', error);
      logger.error('Error al obtener alertas de stock bajo:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error interno del servidor',
        data: {
          alerts: [],
          summary: { total: 0, critical: 0, lowStock: 0 },
          categories: { critical: [], lowStock: [] }
        }
      });
    }
  };

  public getStockMovements = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { 
        producto_id, 
        tipo_movimiento, 
        empleado_id, 
        sector_id, 
        sucursal_id, 
        fecha_inicio, 
        fecha_fin,
        search,
        page = 1, 
        limit = 20 
      } = req.query;

      logger.info('[STOCK_MOVEMENTS] Obteniendo movimientos de stock', {
        filters: {
          producto_id,
          tipo_movimiento,
          empleado_id,
          sector_id,
          sucursal_id,
          fecha_inicio,
          fecha_fin,
          search,
          page,
          limit
        }
      });

      const result = await this.db.executeStoredProcedure<any>(
        'sp_StockGeneral_GetMovements',
        {
          producto_id: producto_id ? parseInt(producto_id as string) : null,
          tipo_movimiento: tipo_movimiento || null,
          empleado_id: empleado_id ? parseInt(empleado_id as string) : null,
          sector_id: sector_id ? parseInt(sector_id as string) : null,
          sucursal_id: sucursal_id ? parseInt(sucursal_id as string) : null,
          fecha_desde: fecha_inicio ? new Date(fecha_inicio as string) : null,
          fecha_hasta: fecha_fin ? new Date(fecha_fin as string) : null,
          search: search || null,
          PageNumber: parseInt(page as string),
          PageSize: parseInt(limit as string)
        }
      );

      const movements = result.recordset || [];
      console.log(`✅ Se encontraron ${movements.length} movimientos de stock`);

      res.json({
        success: true,
        data: movements,
        count: movements.length,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: movements.length
        }
      });

    } catch (error: any) {
      console.error('❌ Error en getStockMovements:', error);
      logger.error('Error al obtener movimientos de stock:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error interno del servidor',
        data: []
      });
    }
  };
}
