import { Request, Response } from 'express';
import { DatabaseConnection } from '../utils/database';
import { logger } from '../utils/logger';
import * as sql from 'mssql';
import { AuthRequest } from '../types/auth.types';

export class RepairController {
  private db = DatabaseConnection.getInstance();

  /**
   * Obtiene la lista de reparaciones activas (paginada).
   */
  public getActiveRepairs = async (req: Request, res: Response): Promise<void> => {
    const { 
      page = 1, 
      limit = 10,
      search = ''
    } = req.query;

    const params = {
      PageNumber: { type: sql.Int, value: Number(page) },
      PageSize: { type: sql.Int, value: Number(limit) },
      SearchTerm: { type: sql.NVarChar(100), value: search || null }
    };

    try {
      const result = await this.db.executeStoredProcedure('sp_Repair_GetActive', params) as { recordset: any[] };
      
      const totalRows = result.recordset.length > 0 ? result.recordset[0].TotalRows : 0;
      const totalPages = Math.ceil(totalRows / Number(limit));

      res.json({
        success: true,
        data: result.recordset,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          totalItems: totalRows,
          totalPages: totalPages,
        }
      });
    } catch (error: any) {
      logger.error('Error obteniendo reparaciones activas:', { errorMessage: error.message, stack: error.stack });
      res.status(500).json({ success: false, error: 'Error interno del servidor al obtener reparaciones activas.' });
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

    const params = {
      inventario_individual_id: { type: sql.Int, value: inventario_individual_id },
      proveedor: { type: sql.NVarChar(100), value: proveedor },
      descripcion_problema: { type: sql.Text, value: problema_descripcion },
      usuario_envia_id: { type: sql.Int, value: usuario_id },
      NuevaReparacionID: { type: sql.Int, value: null, isOutput: true }
    };

    try {
      const result = await this.db.executeStoredProcedure('sp_Repair_Create', params) as any;
      
      if (result.output && result.output.NuevaReparacionID) {
        res.status(201).json({ 
          success: true, 
          message: 'Reparación registrada y activo actualizado.',
          repairId: result.output.NuevaReparacionID
        });
      } else {
        // Fallback en caso de que el ID de salida no se retorne correctamente
        res.status(201).json({ success: true, message: 'Reparación registrada y activo actualizado.' });
      }
    } catch (error: any) {
      logger.error('Error creando reparación:', { errorMessage: error.message, stack: error.stack, body: req.body });
      res.status(500).json({ success: false, error: 'Error interno del servidor al crear la reparación.' });
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

    const params = {
      reparacion_id: { type: sql.Int, value: Number(id) },
      solucion_descripcion: { type: sql.Text, value: solucion_descripcion },
      estado_final_reparacion: { type: sql.NVarChar(20), value: estado_final },
      usuario_recibe_id: { type: sql.Int, value: usuario_recibe_id }
    };

    try {
      await this.db.executeStoredProcedure('sp_Repair_Return', params);
      res.json({ success: true, message: 'Retorno de reparación procesado exitosamente.' });
    } catch (error: any) {
      logger.error('Error procesando retorno de reparación:', { errorMessage: error.message, stack: error.stack, params: req.params, body: req.body });
      res.status(500).json({ success: false, error: 'Error interno del servidor al procesar el retorno.' });
    }
  }
} 