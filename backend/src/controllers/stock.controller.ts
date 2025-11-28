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

      // El SP tiene parámetros OUT, usamos variables de sesión de MySQL
      const pool = this.db.getPool();
      
      // Llamar al SP con parámetros OUT usando variables de sesión
      await pool.query(
        `CALL sp_StockGeneral_Entry(?, ?, ?, ?, ?, @movimiento_id, @stock_id, @stock_actual, @mensaje)`,
        [
          body.producto_id,
          body.cantidad,
          body.motivo || 'Entrada manual',
          body.observaciones || null,
          usuario_id
        ]
      );
      
      // Obtener los valores de los parámetros OUT
      const [outParams] = await pool.query<mysql.RowDataPacket[]>(
        'SELECT @movimiento_id as movimiento_id, @stock_id as stock_id, @stock_actual as stock_actual, @mensaje as mensaje'
      );
      
      const result = outParams[0];
      
      if (!result) {
        logger.error('[STOCK_ENTRY] Error: No se obtuvieron resultados del SP');
        res.status(500).json({
          success: false,
          message: 'Error al procesar la entrada de stock'
        });
        return;
      }

      logger.info(`[STOCK_ENTRY] Entrada de stock procesada exitosamente`, {
        producto_id: body.producto_id,
        cantidad: body.cantidad,
        nuevo_stock: result.stock_actual
      });

      res.status(201).json({
        success: true,
        message: result.mensaje || 'Entrada de stock registrada exitosamente',
        data: {
          producto_id: body.producto_id,
          cantidad: body.cantidad,
          stock_actual: result.stock_actual,
          movimiento_id: result.movimiento_id
        },
        stockActual: result.stock_actual
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

      // Orden correcto del SP: producto_id, cantidad, motivo, empleado_id, sector_id, sucursal_id, observaciones, usuario_id
      const [results] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_StockGeneral_Exit',
        [
          body.producto_id,
          body.cantidad,
          body.motivo,
          body.empleado_id || null,
          body.sector_id || null,
          body.sucursal_id || null,
          body.observaciones || null,
          usuario_id
        ]
      );

      // El SP retorna un SELECT, extraemos el primer resultado
      const resultData = Array.isArray(results) && Array.isArray(results[0]) 
        ? results[0][0]  // MySQL devuelve [[data], OkPacket]
        : (Array.isArray(results) ? results[0] : null);

      if (!resultData) {
        logger.error('[STOCK_EXIT] Error: No se pudo procesar la salida de stock');
        res.status(500).json({
          success: false,
          message: 'Error al procesar la salida de stock'
        });
        return;
      }

      logger.info(`[STOCK_EXIT] Salida de stock procesada exitosamente`, {
        producto_id: body.producto_id,
        cantidad: body.cantidad,
        nuevo_stock: resultData.stock_actual
      });

      res.status(200).json({
        success: true,
        message: resultData.mensaje || 'Salida de stock registrada exitosamente',
        stockActual: resultData.stock_actual,
        alertaBajoStock: resultData.alerta_bajo_stock,
        data: {
          producto_id: body.producto_id,
          cantidad: body.cantidad,
          stock_actual: resultData.stock_actual,
          movimiento_id: resultData.movimiento_id
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
      
      // MySQL SPs devuelven [dataRows, OkPacket], necesitamos extraer dataRows
      const stockItems = Array.isArray(results) && Array.isArray(results[0]) 
        ? results[0]
        : (Array.isArray(results) ? results : []);
      console.log(`✅ Se encontraron ${stockItems.length} items de stock actual`);
      console.log('📦 Primeros 2 items:', stockItems.slice(0, 2));

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
      
      // MySQL SPs devuelven [dataRows, OkPacket], necesitamos extraer dataRows
      const stockItems = Array.isArray(results) && Array.isArray(results[0]) 
        ? results[0]  // El primer elemento es el array de datos
        : (Array.isArray(results) ? results : []);
      console.log(`✅ Se encontraron ${stockItems.length} items de stock`);
      console.log('📦 Primeros 2 items:', stockItems.slice(0, 2));

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

      // CORRECCIÓN: El SP sp_StockGeneral_GetLowStock solo acepta 1 parámetro (categoria_id)
      // El filtrado de 'solo_criticos' se hará en memoria si es necesario
      const [results] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_StockGeneral_GetLowStock',
        [
          categoria_id ? parseInt(categoria_id as string) : null
        ]
      );

      // MySQL SPs devuelven [dataRows, OkPacket], necesitamos extraer dataRows
      let alerts = Array.isArray(results) && Array.isArray(results[0]) 
        ? results[0]
        : (Array.isArray(results) ? results : []);
      console.log(`✅ Se encontraron ${alerts.length} alertas de stock bajo (bruto)`);

      // Si se solicitó solo críticos, filtrar aquí
      if (solo_criticos === 'true') {
        alerts = alerts.filter((item: any) => item.cantidad_actual === 0);
      }

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

      // MySQL SPs devuelven [dataRows, OkPacket], necesitamos extraer dataRows
      const movements = Array.isArray(results) && Array.isArray(results[0]) 
        ? results[0]
        : (Array.isArray(results) ? results : []);
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
