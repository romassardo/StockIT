import { Request, Response } from 'express';
import mysql from 'mysql2/promise';
import { DatabaseConnection } from '../utils/database';
import { logger } from '../utils/logger';
import { AuthRequest } from '../types/auth.types';

export class RepairController {
  private db = DatabaseConnection.getInstance();

  /**
   * Obtiene la lista de reparaciones activas (paginada).
   */
  public getActiveRepairs = async (req: Request, res: Response): Promise<void> => {
    const { 
      page = 1, 
      pageSize = 10,
      search = '',
      proveedor = ''
    } = req.query;

    const params = [
      Number(page),
      Number(pageSize),
      proveedor || search || null
    ];

    try {
      const result = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>('sp_Repair_GetActive', params);
      
      const [data] = result;
      const repairs = data || [];
      const totalRows = repairs.length > 0 ? repairs[0].TotalRows || repairs.length : 0;
      const totalPages = Math.ceil(totalRows / Number(pageSize));

      res.json({
        success: true,
        data: repairs,
        pagination: {
          page: Number(page),
          limit: Number(pageSize),
          totalItems: totalRows,
          totalPages: totalPages,
        }
      });
    } catch (error: any) {
      logger.error('Error obteniendo reparaciones activas:', { 
        errorMessage: error.message, 
        stack: error.stack,
        params: req.query
      });
      res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor al obtener reparaciones activas.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Crea un nuevo registro de reparación.
   * BODY: { inventario_individual_id, proveedor, problema_descripcion }
   */
  public createRepair = async (req: AuthRequest, res: Response): Promise<void> => {
    const { inventario_individual_id, proveedor, problema_descripcion } = req.body;
    const usuario_id = req.user!.id;

    if (!inventario_individual_id || !proveedor || !problema_descripcion || !usuario_id) {
      res.status(400).json({ success: false, error: 'Faltan parámetros requeridos.' });
      return;
    }

    const params = [
      inventario_individual_id,
      proveedor,
      problema_descripcion,
      usuario_id
    ];

    try {
      const result = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>('sp_Repair_Create', params);
      
      const [data] = result;
      if (data && data.length > 0 && data[0].id) {
        res.status(201).json({ 
          success: true, 
          message: 'Reparación registrada y activo actualizado.',
          repairId: data[0].id
        });
      } else {
        // Fallback en caso de que el ID no se retorne correctamente
        res.status(201).json({ success: true, message: 'Reparación registrada y activo actualizado.' });
      }
    } catch (error: any) {
      logger.error('Error creando reparación:', { errorMessage: error.message, stack: error.stack, body: req.body });
      
      if (error.message?.includes('no está disponible')) {
        res.status(409).json({ success: false, error: 'El activo no está disponible para enviar a reparación.' });
      } else if (error.message?.includes('no encontrado')) {
        res.status(404).json({ success: false, error: 'Activo de inventario no encontrado.' });
      } else {
        res.status(500).json({ success: false, error: 'Error interno del servidor al crear la reparación.' });
      }
    }
  }

  /**
   * Procesa el retorno de una reparación.
   * BODY: { solucion_descripcion, estado_final }
   */
  public returnRepair = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { solucion_descripcion, estado_final } = req.body;
    const usuario_recibe_id = req.user!.id;

    if (!id || !solucion_descripcion || !estado_final || !usuario_recibe_id) {
      res.status(400).json({ success: false, error: 'Faltan parámetros requeridos.' });
      return;
    }

    const params = [
      Number(id),
      solucion_descripcion,
      estado_final,
      usuario_recibe_id
    ];

    try {
      await this.db.executeStoredProcedure<mysql.RowDataPacket[]>('sp_Repair_Return', params);
      res.json({ success: true, message: 'Retorno de reparación procesado exitosamente.' });
    } catch (error: any) {
      logger.error('Error procesando retorno de reparación:', { errorMessage: error.message, stack: error.stack, params: req.params, body: req.body });
      
      if (error.message?.includes('no encontrada')) {
        res.status(404).json({ success: false, error: 'Reparación no encontrada.' });
      } else if (error.message?.includes('ya procesada')) {
        res.status(409).json({ success: false, error: 'La reparación ya fue procesada anteriormente.' });
      } else {
        res.status(500).json({ success: false, error: 'Error interno del servidor al procesar el retorno.' });
      }
    }
  }
} 