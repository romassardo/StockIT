import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
import { DatabaseConnection } from '../utils/database';
import { logger } from '../utils/logger';

/**
 * Controlador para gestionar operaciones de Changelog
 * Permite administración completa para administradores y vista pública
 */
export class ChangelogController {
  private db = DatabaseConnection.getInstance();

  /**
   * Obtiene todos los registros de changelog con filtros opcionales
   * Endpoint: GET /api/changelog
   * Acceso: Admin
   */
  public getAllChangelogs = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { version, tipo_cambio, page = '1', pageSize = '10' } = req.query;
      
      const pageNumber = parseInt(page as string, 10);
      const itemsPerPage = parseInt(pageSize as string, 10);
      
      const result = await this.db.executeStoredProcedure<any>('sp_Changelog_GetAll', {
        version: version || null,
        tipo_cambio: tipo_cambio || null,
        PageNumber: pageNumber,
        PageSize: itemsPerPage
      });
      
      // Formato de respuesta paginada
      if (result.recordset.length > 0) {
        const totalRows = result.recordset[0].TotalRows;
        const totalPages = Math.ceil(totalRows / itemsPerPage);
        
        res.status(200).json({
          data: result.recordset,
          pagination: {
            totalItems: totalRows,
            totalPages,
            currentPage: pageNumber,
            pageSize: itemsPerPage
          }
        });
      } else {
        res.status(200).json({
          data: [],
          pagination: {
            totalItems: 0,
            totalPages: 0,
            currentPage: pageNumber,
            pageSize: itemsPerPage
          }
        });
      }
      
    } catch (error) {
      logger.error('Error obteniendo registros del changelog:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  /**
   * Obtiene un registro específico del changelog por su ID
   * Endpoint: GET /api/changelog/:id
   * Acceso: Admin
   */
  public getChangelogById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const result = await this.db.executeStoredProcedure<any>('sp_Changelog_Get', {
        id: parseInt(id, 10)
      });
      
      if (result.recordset.length === 0) {
        res.status(404).json({ message: 'Registro de changelog no encontrado' });
        return;
      }
      
      res.status(200).json(result.recordset[0]);
      
    } catch (error) {
      logger.error('Error obteniendo registro de changelog:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  /**
   * Crea un nuevo registro en el changelog
   * Endpoint: POST /api/changelog
   * Acceso: Admin
   */
  public createChangelog = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { version, descripcion, tipo_cambio } = req.body;
      const usuario_id = (req.user as any).id; // Usuario autenticado
      
      // Validaciones básicas
      if (!version || !descripcion || !tipo_cambio) {
        res.status(400).json({ message: 'Faltan campos obligatorios: version, descripcion, tipo_cambio' });
        return;
      }
      
      // Validar tipo de cambio
      const tiposCambioValidos = ['Feature', 'Bugfix', 'Enhancement', 'Breaking'];
      if (!tiposCambioValidos.includes(tipo_cambio)) {
        res.status(400).json({ 
          message: 'Tipo de cambio inválido',
          validValues: tiposCambioValidos
        });
        return;
      }
      
      const result = await this.db.executeStoredProcedure<any>('sp_Changelog_Create', {
        version,
        descripcion,
        tipo_cambio,
        usuario_id
      });
      
      const newId = result.recordset[0].id;
      
      logger.info(`Registro de changelog ${version} creado por ${req.user!.nombre_usuario}`);
      
      res.status(201).json({
        success: true,
        data: {
          id: newId,
          version,
          tipo_cambio
        }
      });
      
    } catch (error) {
      logger.error('Error creando registro de changelog:', error);
      
      // Manejo específico de errores del SP
      if ((error as Error).message?.includes('Tipo de cambio inválido')) {
        res.status(400).json({ 
          error: 'Tipo de cambio inválido',
          validValues: ['Nueva Funcionalidad', 'Mejora', 'Corrección', 'Otro']
        });
        return;
      }
      
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  /**
   * Actualiza un registro existente del changelog
   * Endpoint: PUT /api/changelog/:id
   * Acceso: Admin
   */
  public updateChangelog = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { version, descripcion, tipo_cambio } = req.body;
      const usuario_id = (req.user as any).id; // Usuario autenticado
      
      // Validaciones básicas
      if (!version || !descripcion || !tipo_cambio) {
        res.status(400).json({ message: 'Faltan campos obligatorios: version, descripcion, tipo_cambio' });
        return;
      }
      
      // Validar tipo de cambio
      const tiposCambioValidos = ['Feature', 'Bugfix', 'Enhancement', 'Breaking'];
      if (!tiposCambioValidos.includes(tipo_cambio)) {
        res.status(400).json({ 
          message: 'Tipo de cambio inválido',
          validValues: tiposCambioValidos
        });
        return;
      }
      
      const result = await this.db.executeStoredProcedure<any>('sp_Changelog_Update', {
        id: parseInt(id, 10),
        version,
        descripcion,
        tipo_cambio,
        usuario_id
      });
      
      if (result.recordset.length === 0 || result.recordset[0].success !== 1) {
        res.status(404).json({ message: 'Registro de changelog no encontrado' });
        return;
      }
      
      logger.info(`Registro de changelog ${version} actualizado por ${req.user!.nombre_usuario}`);
      
      res.status(200).json({
        success: true,
        data: {
          id: parseInt(id, 10),
          version,
          tipo_cambio
        }
      });
      
    } catch (error) {
      logger.error('Error actualizando registro de changelog:', error);
      
      // Manejo específico de errores del SP
      if ((error as Error).message?.includes('no existe')) {
        res.status(404).json({ error: 'Registro de changelog no encontrado' });
        return;
      } else if ((error as Error).message?.includes('Tipo de cambio inválido')) {
        res.status(400).json({ 
          error: 'Tipo de cambio inválido',
          validValues: ['Nueva Funcionalidad', 'Mejora', 'Corrección', 'Otro']
        });
        return;
      }
      
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  /**
   * Elimina un registro del changelog
   * Endpoint: DELETE /api/changelog/:id
   * Acceso: Admin
   */
  public deleteChangelog = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const usuario_id = (req.user as any).id; // Usuario autenticado
      
      const result = await this.db.executeStoredProcedure<any>('sp_Changelog_Delete', {
        id: parseInt(id, 10),
        usuario_id
      });
      
      if (result.recordset.length === 0 || result.recordset[0].success !== 1) {
        res.status(404).json({ message: 'Registro de changelog no encontrado' });
        return;
      }
      
      logger.info(`Registro de changelog ID=${id} eliminado por ${req.user!.nombre_usuario}`);
      
      res.status(200).json({
        success: true,
        data: {
          id: parseInt(id, 10)
        }
      });
      
    } catch (error) {
      logger.error('Error eliminando registro de changelog:', error);
      
      // Manejo específico de errores del SP
      if ((error as Error).message?.includes('no existe')) {
        res.status(404).json({ error: 'Registro de changelog no encontrado' });
        return;
      }
      
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  /**
   * Obtiene la vista pública del changelog con filtros opcionales
   * Endpoint: GET /api/changelog/public
   * Acceso: Público (sin autenticación)
   */
  public getPublicChangelog = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { version, tipo_cambio, page = '1', pageSize = '10' } = req.query;
      
      const pageNumber = parseInt(page as string, 10);
      const itemsPerPage = parseInt(pageSize as string, 10);
      
      const result = await this.db.executeStoredProcedure<any>('sp_Changelog_GetPublic', {
        version: version || null,
        tipo_cambio: tipo_cambio || null,
        PageNumber: pageNumber,
        PageSize: itemsPerPage
      });
      
      // Formato de respuesta paginada
      if (result.recordset.length > 0) {
        const totalRows = result.recordset[0].TotalRows;
        const totalPages = Math.ceil(totalRows / itemsPerPage);
        
        res.status(200).json({
          data: result.recordset,
          pagination: {
            totalItems: totalRows,
            totalPages,
            currentPage: pageNumber,
            pageSize: itemsPerPage
          }
        });
      } else {
        res.status(200).json({
          data: [],
          pagination: {
            totalItems: 0,
            totalPages: 0,
            currentPage: pageNumber,
            pageSize: itemsPerPage
          }
        });
      }
      
    } catch (error) {
      logger.error('Error obteniendo registros públicos del changelog:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
}