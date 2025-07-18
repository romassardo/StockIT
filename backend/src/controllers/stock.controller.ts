import { Request, Response } from 'express';
import { DatabaseConnection } from '../utils/database';
import { logger } from '../utils/logger';
import { AuthRequest } from '../types/auth.types';
import mysql from 'mysql2/promise';

interface CacheEntry {
  timestamp: number;
  response: any;
  status: number;
}

interface StockEntryRequest {
  producto_id: number;
  cantidad: number;
  motivo?: string;
  observaciones?: string;
  ubicacion?: string;
}

interface StockExitRequest {
  producto_id: number;
  cantidad: number;
  empleado_id?: number;
  sector_id?: number;
  sucursal_id?: number;
  motivo: string;
  observaciones?: string;
}

export class StockController {
  private db: DatabaseConnection;
  private cache: Map<string, CacheEntry> = new Map();

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  public addStockEntry = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const usuario_id = req.user?.id;
      if (!usuario_id) {
        res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        return;
      }

      const body: StockEntryRequest = req.body;

      // Validación básica
      if (!body.producto_id || !body.cantidad || body.cantidad <= 0) {
        res.status(400).json({
          success: false,
          message: 'Producto ID y cantidad (mayor a 0) son requeridos'
        });
        return;
      }

      logger.info(`[STOCK_ENTRY] Usuario ${usuario_id} agregando stock`, {
        producto_id: body.producto_id,
        cantidad: body.cantidad,
        motivo: body.motivo
      });

      const [results] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_StockGeneral_Entry',
        [
          body.producto_id,
          body.cantidad,
          usuario_id,
          body.motivo || 'Entrada manual',
          body.observaciones || null,
          body.ubicacion || null
        ]
      );

      // MySQL devuelve un array, verificamos si hay resultados
      if (!Array.isArray(results) || results.length === 0) {
        logger.error('[STOCK_ENTRY] Error: No se pudo procesar la entrada de stock');
        res.status(500).json({
          success: false,
          message: 'Error al procesar la entrada de stock'
        });
        return;
      }

      const result = results[0];
      logger.info(`[STOCK_ENTRY] Entrada de stock procesada exitosamente`, {
        producto_id: body.producto_id,
        cantidad: body.cantidad,
        nuevo_stock: result.nuevo_stock
      });

      res.status(201).json({
        success: true,
        message: 'Entrada de stock registrada exitosamente',
        data: {
          producto_id: body.producto_id,
          cantidad: body.cantidad,
          stock_anterior: result.stock_anterior,
          stock_actual: result.nuevo_stock,
          movimiento_id: result.movimiento_id
        }
      });

    } catch (error: any) {
      logger.error(`[STOCK_ENTRY] Error al agregar entrada de stock: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al agregar entrada de stock'
      });
    }
  };

  public processStockExit = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const usuario_id = req.user?.id;
      if (!usuario_id) {
        res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        return;
      }

      const body: StockExitRequest = req.body;

      // Validación básica
      if (!body.producto_id || !body.cantidad || body.cantidad <= 0) {
        res.status(400).json({
          success: false,
          message: 'Producto ID y cantidad (mayor a 0) son requeridos'
        });
        return;
      }

      if (!body.motivo) {
        res.status(400).json({
          success: false,
          message: 'El motivo de la salida es requerido'
        });
        return;
      }

      // Verificar que al menos uno de los destinos esté especificado
      if (!body.empleado_id && !body.sector_id && !body.sucursal_id) {
        res.status(400).json({
          success: false,
          message: 'Debe especificar al menos un destino (empleado, sector o sucursal)'
        });
        return;
      }

      logger.info(`[STOCK_EXIT] Usuario ${usuario_id} procesando salida de stock`, {
        producto_id: body.producto_id,
        cantidad: body.cantidad,
        motivo: body.motivo,
        empleado_id: body.empleado_id,
        sector_id: body.sector_id,
        sucursal_id: body.sucursal_id
      });

      const [results] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_StockGeneral_Exit',
        [
          body.producto_id,
          body.cantidad,
          usuario_id,
          body.empleado_id || null,
          body.sector_id || null,
          body.sucursal_id || null,
          body.motivo,
          body.observaciones || null
        ]
      );

      if (!Array.isArray(results) || results.length === 0) {
        logger.error('[STOCK_EXIT] Error: No se pudo procesar la salida de stock');
        res.status(500).json({
          success: false,
          message: 'Error al procesar la salida de stock'
        });
        return;
      }

      const result = results[0];
      logger.info(`[STOCK_EXIT] Salida de stock procesada exitosamente`, {
        producto_id: body.producto_id,
        cantidad: body.cantidad,
        nuevo_stock: result.nuevo_stock
      });

      res.status(200).json({
        success: true,
        message: 'Salida de stock registrada exitosamente',
        data: {
          producto_id: body.producto_id,
          cantidad: body.cantidad,
          stock_anterior: result.stock_anterior,
          stock_actual: result.nuevo_stock,
          movimiento_id: result.movimiento_id
        }
      });

    } catch (error: any) {
      logger.error(`[STOCK_EXIT] Error al procesar salida de stock: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al procesar salida de stock'
      });
    }
  };

  public getCurrentStock = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      console.log('📊 Obteniendo stock actual...');

      const [results] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_StockGeneral_GetAll',
        [
          null, // categoria_id
          false, // solo_bajo_stock
          null // producto_id
        ]
      );
      
      const stockItems = Array.isArray(results) ? results : [];
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

      const [results] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_StockGeneral_GetAll',
        [
          categoria_id ? Number(categoria_id) : null,
          solo_bajo_stock === 'true',
          producto_id ? Number(producto_id) : null
        ]
      );
      
      const stockItems = Array.isArray(results) ? results : [];
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

      const [results] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_StockGeneral_GetLowStock',
        [
          categoria_id ? parseInt(categoria_id as string) : null,
          solo_criticos === 'true'
        ]
      );

      const alerts = Array.isArray(results) ? results : [];
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

      const [results] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_StockGeneral_GetMovements',
        [
          producto_id ? parseInt(producto_id as string) : null,
          tipo_movimiento || null,
          empleado_id ? parseInt(empleado_id as string) : null,
          sector_id ? parseInt(sector_id as string) : null,
          sucursal_id ? parseInt(sucursal_id as string) : null,
          fecha_inicio ? new Date(fecha_inicio as string) : null,
          fecha_fin ? new Date(fecha_fin as string) : null,
          search || null,
          parseInt(page as string),
          parseInt(limit as string)
        ]
      );

      const movements = Array.isArray(results) ? results : [];
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

export default new StockController();
