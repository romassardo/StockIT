import { Request, Response } from 'express';
import { DatabaseConnection } from '../utils/database';
import { logger } from '../utils/logger';
import { AuthRequest } from '../types/auth.types';
import { Sector } from '../types'; // Sector está definido en types/index.ts

// Interfaz para representar los datos tal como vienen del Stored Procedure, incluyendo TotalRows
interface SectorFromSP extends Sector {
  TotalRows: number;
}

export class SectorController {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  // Crear un nuevo sector
  public createSector = async (req: AuthRequest, res: Response): Promise<void> => {
    const { nombre, descripcion, responsable_email } = req.body;
    const userId = req.user?.id; // El ID del usuario que crea el sector

    if (!nombre) {
      res.status(400).json({ success: false, message: 'El nombre del sector es obligatorio.' });
      return;
    }

    try {
      const params = {
        Nombre: nombre,
        Descripcion: descripcion,
        ResponsableEmail: responsable_email,
        usuario_id: userId 
      };
      const result = await this.db.executeStoredProcedure<{ id: number }>('sp_Sector_Create', params);
      
      if (result.recordset && result.recordset.length > 0 && result.recordset[0].id) {
        const newSectorId = result.recordset[0].id;
        logger.info(`Sector creado con ID: ${newSectorId} por UsuarioID: ${userId}`);
        res.status(201).json({ 
          success: true, 
          message: 'Sector creado exitosamente.', 
          sectorId: newSectorId 
        });
      } else {
        throw new Error('El SP sp_Sector_Create no devolvió el ID del sector creado.');
      }
    } catch (error: any) {
      logger.error(`Error al crear sector: ${error.message}`, { error, params: req.body, userId });
      if (error.message.includes('ya existe')) { // Asumiendo que el SP lanza un error con 'ya existe'
        res.status(409).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: 'Error interno del servidor al crear el sector.' });
      }
    }
  };

  // Obtener todos los sectores
  public getAllSectors = async (req: Request, res: Response): Promise<void> => {
    const { activo_only } = req.query;
    
    try {
      // El procedimiento sp_Sector_GetAll solo acepta el parámetro activo_only
      const params = {
        activo_only: activo_only ? (String(activo_only).toLowerCase() === 'true' ? 1 : 0) : 1
      };

      const result = await this.db.executeStoredProcedure<Sector>('sp_Sector_GetAll', params);
      
      if (result.recordset) {
        logger.debug(`Sectores obtenidos. Total: ${result.recordset.length}`);
        res.status(200).json({
          success: true,
          message: 'Sectores obtenidos exitosamente.',
          data: result.recordset
        });
      } else {
        throw new Error('No se pudo obtener información de sectores');
      }
    } catch (error: any) {
      logger.error(`Error al obtener sectores: ${error.message}`, { error });
      res.status(500).json({ success: false, message: 'Error interno del servidor al obtener los sectores.' });
    }
  };

  // Obtener un sector por ID
  public getSectorById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
        res.status(400).json({ success: false, message: 'ID de sector inválido.' });
        return;
    }
    try {
      const result = await this.db.executeStoredProcedure<Sector>('sp_Sector_Get', { SectorID: Number(id) });
      if (result.recordset && result.recordset.length > 0) {
        logger.debug(`Sector obtenido con ID: ${id}`);
        res.status(200).json({ success: true, data: result.recordset[0] });
      } else {
        logger.warn(`Sector no encontrado con ID: ${id}`);
        res.status(404).json({ success: false, message: 'Sector no encontrado.' });
      }
    } catch (error: any) {
      logger.error(`Error al obtener sector por ID ${id}: ${error.message}`, { error });
      res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
  };

  // Actualizar un sector
  public updateSector = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { nombre, descripcion, responsable_email, activo } = req.body;
    const userId = req.user?.id;

    if (!id || isNaN(Number(id))) {
        res.status(400).json({ success: false, message: 'ID de sector inválido.' });
        return;
    }
    if (!nombre) {
      res.status(400).json({ success: false, message: 'El nombre del sector es obligatorio.' });
      return;
    }

    try {
      const params = {
        id: Number(id),
        nombre: nombre,
        usuario_id: userId
      };
      const result = await this.db.executeStoredProcedure('sp_Sector_Update', params);
      logger.info(`Sector ID: ${id} actualizado por UsuarioID: ${userId}`);
      
      // Devolver los datos del sector actualizado (solo campos disponibles en BD)
      const sectorData = {
        id: Number(id),
        nombre: nombre,
        activo: true // Los sectores están activos por defecto después de actualizar
      };
      
      res.status(200).json({ 
        success: true, 
        message: 'Sector actualizado exitosamente.',
        data: sectorData
      });
    } catch (error: any) {
      logger.error(`Error al actualizar sector ID ${id}: ${error.message}`, { error, params: req.body, userId });
       if (error.message.includes('no existe')) {
        res.status(404).json({ success: false, message: 'Sector no encontrado para actualizar.' });
      } else if (error.message.includes('ya existe')) {
        res.status(409).json({ success: false, message: error.message });
      }
      else {
        res.status(500).json({ success: false, message: 'Error interno del servidor al actualizar el sector.' });
      }
    }
  };

  // Cambiar estado activo/inactivo de un sector
  public toggleSectorActiveStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { activo } = req.body as { activo?: boolean };
    const usuarioId = req.user?.id;
    const sectorId = parseInt(id, 10);

    if (isNaN(sectorId)) {
      res.status(400).json({ success: false, message: 'El ID del sector debe ser un número.' });
      return;
    }

    if (activo === undefined || typeof activo !== 'boolean') {
      res.status(400).json({ success: false, message: 'El estado "activo" (true/false) es obligatorio.' });
      return;
    }

    if (!usuarioId) {
      logger.warn(`Intento de cambiar estado de sector ID ${sectorId} sin usuario autenticado.`);
      res.status(401).json({ success: false, message: 'Acceso no autorizado. Usuario no identificado.' });
      return;
    }

    try {
      const params = {
        id: sectorId,
        activo: activo,
        usuario_id: usuarioId
      };
      
      await this.db.executeStoredProcedure('sp_Sector_ToggleActive', params);
      
      const message = activo ? 'Sector activado exitosamente' : 'Sector desactivado exitosamente';
      logger.info(`Estado de sector ID ${sectorId} cambiado a ${activo} por usuario ID ${usuarioId}`);
      
      res.status(200).json({ 
        success: true, 
        message: message,
        data: { id: sectorId, activo: activo }
      });
    } catch (error: any) {
      logger.error(`Error al cambiar estado del sector ID ${sectorId}: ${error.message}`, { error, usuarioId });
      if (error.message.includes('no existe')) {
        res.status(404).json({ success: false, message: 'Sector no encontrado.' });
      } else {
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
      }
    }
  };
}
