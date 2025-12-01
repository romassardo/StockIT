import { type Request, type Response } from 'express';
import mysql from 'mysql2/promise';
import { DatabaseConnection } from '../utils/database';
import { logger } from '../utils/logger';
import { type AuthRequest } from '../types/auth.types';
import { type Sucursal } from '../types'; // Asegúrate que Sucursal está definida en types/index.ts

export class BranchController {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  // Crear una nueva sucursal
  public createBranch = async (req: AuthRequest, res: Response): Promise<void> => {
    const { nombre, activo } = req.body as { nombre: string, activo?: boolean };
    const usuarioId = req.user?.id;

    if (!nombre) {
      res.status(400).json({ success: false, message: 'El nombre de la sucursal es obligatorio.' });
      return;
    }

    if (!usuarioId) {
      logger.warn('Intento de creación de sucursal sin usuario autenticado.');
      res.status(401).json({ success: false, message: 'Acceso no autorizado. Usuario no identificado.' });
      return;
    }

    try {
      // Usar consulta directa ya que el SP no existe en MySQL
      const activoValue = activo !== undefined ? (activo ? 1 : 0) : 1;
      const insertQuery = `INSERT INTO Sucursales (nombre, activo) VALUES (?, ?)`;

      logger.info(`Creando sucursal: ${nombre}`);
      const [result] = await this.db.executeQuery<any>(insertQuery, [nombre, activoValue]);

      if (result.insertId) {
        logger.info(`Sucursal creada con ID: ${result.insertId} por usuario ID: ${usuarioId}`);
        res.status(201).json({ 
          success: true, 
          message: 'Sucursal creada exitosamente.', 
          data: { id: result.insertId, nombre, activo: activoValue === 1 }
        });
      } else {
        res.status(500).json({ success: false, message: 'Error al crear la sucursal.' });
      }
    } catch (error: any) {
      logger.error('Error al crear la sucursal:', { error, nombre, usuarioId });
      
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ success: false, message: 'Ya existe una sucursal con ese nombre.' });
      } else {
        res.status(500).json({ success: false, message: 'Error interno del servidor al crear la sucursal.' });
      }
    }
  };

  // Obtener todas las sucursales
  public getAllBranches = async (req: Request, res: Response): Promise<void> => {
    const { activo_only } = req.query; // Consistente con otros controladores
    
    // Convertir el parámetro a boolean (por defecto true = solo activas)
    const activoOnly = activo_only === 'false' ? false : true;

    try {
      const params = [activoOnly];

      const result = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>('sp_Branch_GetAll', params);
      
      // MySQL devuelve [[rows], OkPacket] para SPs
      const rawData = result[0];
      const data = Array.isArray(rawData[0]) ? rawData[0] : rawData;
      res.status(200).json({ success: true, data: data || [] });

    } catch (error: any) {
      logger.error('Error al obtener todas las sucursales:', { error, query: req.query });
      res.status(500).json({ success: false, message: 'Error interno del servidor al obtener las sucursales.' });
    }
  };

  // Obtener una sucursal por ID
  public getBranchById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const branchId = parseInt(id, 10);

    if (isNaN(branchId)) {
      res.status(400).json({ success: false, message: 'El ID de la sucursal debe ser un número.' });
      return;
    }

    try {
      const params = [branchId];

      const result = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>('sp_Branch_Get', params);

      const [data] = result;
      if (data && data.length > 0) {
        res.status(200).json({ success: true, data: data[0] });
      } else {
        logger.warn(`SP sp_Branch_Get para ID ${branchId} no encontró la sucursal.`);
        res.status(404).json({ success: false, message: 'Sucursal no encontrada.' });
      }
    } catch (error: any) {
      logger.error(`Error al obtener la sucursal con ID ${branchId}:`, { error });
      
      if (error.message?.includes('no encontrada')) {
        res.status(404).json({ success: false, message: 'Sucursal no encontrada.' });
      } else {
        res.status(500).json({ success: false, message: 'Error interno del servidor al obtener la sucursal.' });
      }
    }
  };

  // Actualizar una sucursal (solo el nombre según sp_Branch_Update)
  public updateBranch = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { nombre } = req.body as { nombre?: string }; // 'activo' no se maneja aquí
    const usuarioId = req.user?.id;
    const branchId = parseInt(id, 10);

    if (isNaN(branchId)) {
      res.status(400).json({ success: false, message: 'El ID de la sucursal debe ser un número.' });
      return;
    }

    if (!nombre || nombre.trim() === '') {
      res.status(400).json({ success: false, message: 'El nombre de la sucursal es obligatorio.' });
      return;
    }

    if (!usuarioId) {
      logger.warn(`Intento de actualización de sucursal ID ${branchId} sin usuario autenticado.`);
      res.status(401).json({ success: false, message: 'Acceso no autorizado. Usuario no identificado.' });
      return;
    }

    try {
      // Usar consulta directa ya que el SP no existe en MySQL
      const updateQuery = `UPDATE Sucursales SET nombre = ? WHERE id = ?`;
      
      const [result] = await this.db.executeQuery<any>(updateQuery, [nombre, branchId]);

      if (result.affectedRows > 0) {
        logger.info(`Sucursal ID: ${branchId} actualizada por UsuarioID: ${usuarioId}`);
        res.status(200).json({
          success: true,
          message: 'Sucursal actualizada exitosamente.',
          data: { id: branchId, nombre: nombre, activo: true }
        });
      } else {
        res.status(404).json({ success: false, message: 'Sucursal no encontrada.' });
      }
    } catch (error: any) {
      logger.error(`Error al actualizar la sucursal ID ${branchId}:`, { error, nombre });
      
      if (error.message?.includes('Duplicate')) {
        res.status(409).json({ success: false, message: 'Ya existe otra sucursal con ese nombre.' });
      } else {
        res.status(500).json({ success: false, message: 'Error interno del servidor al actualizar la sucursal.' });
      }
    }
  };

  // Cambiar estado activo/inactivo de una sucursal
  public toggleBranchActive = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { activo } = req.body as { activo?: boolean };
    const usuarioId = req.user?.id;
    const branchId = parseInt(id, 10);

    if (isNaN(branchId)) {
      res.status(400).json({ success: false, message: 'El ID de la sucursal debe ser un número.' });
      return;
    }

    if (activo === undefined || typeof activo !== 'boolean') {
      res.status(400).json({ success: false, message: 'El estado "activo" (true/false) es obligatorio.' });
      return;
    }

    if (!usuarioId) {
      logger.warn(`Intento de cambiar estado de sucursal ID ${branchId} sin usuario autenticado.`);
      res.status(401).json({ success: false, message: 'Acceso no autorizado. Usuario no identificado.' });
      return;
    }

    try {
      // Usar consulta directa ya que el SP no existe en MySQL
      const updateQuery = `UPDATE Sucursales SET activo = ? WHERE id = ?`;
      const [result] = await this.db.executeQuery<any>(updateQuery, [activo ? 1 : 0, branchId]);

      if (result.affectedRows > 0) {
        logger.info(`Estado de sucursal ID ${branchId} cambiado a ${activo} por usuario ID ${usuarioId}`);
        res.status(200).json({
          success: true,
          message: activo ? 'Sucursal activada exitosamente.' : 'Sucursal desactivada exitosamente.',
          data: { id: branchId, activo: activo }
        });
      } else {
        res.status(404).json({ success: false, message: 'Sucursal no encontrada.' });
      }
    } catch (error: any) {
      logger.error(`Error al cambiar estado de la sucursal ID ${branchId}:`, { error, activo });
      res.status(500).json({ success: false, message: 'Error interno del servidor al cambiar el estado de la sucursal.' });
    }
  };
}
