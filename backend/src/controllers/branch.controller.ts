import { type Request, type Response } from 'express';
import sql from 'mssql';
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
      const params: Record<string, any> = { // Definir los parámetros para el SP
        nombre: { type: sql.VarChar(100), value: nombre },
        usuario_id: { type: sql.Int, value: usuarioId }
      };

      // Añadir 'activo' solo si está definido en el request body, para permitir que el SP use su default
      if (activo !== undefined) {
        params.activo = { type: sql.Bit, value: activo };
      }
      
      // Especificamos el tipo de resultado esperado del SP para el tipado
      const result = await this.db.executeStoredProcedure<{ id: number, mensaje: string }>('sp_Branch_Create', params);

      if (result.recordset && result.recordset.length > 0 && result.recordset[0].id) {
        const branchId = result.recordset[0].id;
        const message = result.recordset[0].mensaje || 'Sucursal creada exitosamente.';
        logger.info(`Sucursal creada con ID: ${branchId} por usuario ID: ${usuarioId}`);
        res.status(201).json({ success: true, message, branchId });
      } else {
        logger.error('Error al crear la sucursal: el SP no devolvió el ID o mensaje esperado en el recordset.', { nombre, usuarioId, spResult: result });
        res.status(500).json({ success: false, message: 'Error al crear la sucursal, respuesta inesperada del procedimiento almacenado.' });
      }
    } catch (error: any) {
      logger.error('Error al crear la sucursal:', { error, nombre, usuarioId });
      // Verificar si es un error lanzado por el SP (THROW)
      if (error.originalError && error.originalError.info && error.originalError.info.procName === 'sp_Branch_Create') {
        // Los errores 50020 y 50021 son definidos en el SP
        if (error.number === 50020 || error.number === 50021) { // Nombre obligatorio o Sucursal ya existe
          res.status(400).json({ success: false, message: error.message });
          return;
        }
      }
      res.status(500).json({ success: false, message: 'Error interno del servidor al crear la sucursal.' });
    }
  };

  // Obtener todas las sucursales
  public getAllBranches = async (req: Request, res: Response): Promise<void> => {
    const { activo_only } = req.query; // Consistente con otros controladores
    
    // Convertir el parámetro a boolean (por defecto true = solo activas)
    const activoOnly = activo_only === 'false' ? false : true;

    try {
      const params = {
        activo_only: { type: sql.Bit, value: activoOnly }
      };

      const result = await this.db.executeStoredProcedure<Sucursal>('sp_Branch_GetAll', params);
      
      res.status(200).json({ success: true, data: result.recordset });

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
      const params = {
        id: { type: sql.Int, value: branchId }
      };

      const result = await this.db.executeStoredProcedure<Sucursal>('sp_Branch_Get', params);

      if (result.recordset && result.recordset.length > 0) {
        res.status(200).json({ success: true, data: result.recordset[0] });
      } else {
        // Este caso no debería ocurrir si el SP lanza error 50022 como se espera
        logger.warn(`SP sp_Branch_Get para ID ${branchId} no devolvió error pero tampoco encontró la sucursal.`);
        res.status(404).json({ success: false, message: 'Sucursal no encontrada.' });
      }
    } catch (error: any) {
      logger.error(`Error al obtener la sucursal con ID ${branchId}:`, { error });
      // Verificar si es el error 'Sucursal no encontrada' lanzado por el SP
      if (error.originalError && error.originalError.info && error.originalError.info.procName === 'sp_Branch_Get' && error.number === 50022) {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      res.status(500).json({ success: false, message: 'Error interno del servidor al obtener la sucursal.' });
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
      const params = {
        id: branchId,
        nombre: nombre,
        usuario_id: usuarioId
      };

      const result = await this.db.executeStoredProcedure<{ id: number, mensaje: string }>('sp_Branch_Update', params);

      if (result.recordset && result.recordset.length > 0 && result.recordset[0].id) {
        res.status(200).json({
          success: true,
          message: result.recordset[0].mensaje,
          data: { id: result.recordset[0].id, nombre: nombre, activo: true } // Devolvemos el nombre actualizado y estado activo
        });
      } else {
        // Este caso no debería ocurrir si el SP siempre devuelve un resultado o lanza error
        logger.error(`SP sp_Branch_Update para ID ${branchId} no devolvió resultado esperado.`, { spResult: result });
        res.status(500).json({ success: false, message: 'Error al actualizar la sucursal, respuesta inesperada del servidor.' });
      }
    } catch (error: any) {
      logger.error(`Error al actualizar la sucursal ID ${branchId}:`, { error, nombre });
      if (error.originalError && error.originalError.info && error.originalError.info.procName === 'sp_Branch_Update') {
        switch (error.number) {
          case 50023: // Sucursal no encontrada
            res.status(404).json({ success: false, message: error.message });
            return;
          case 50024: // El nombre de la sucursal es obligatorio
          case 50025: // Ya existe otra sucursal con ese nombre
            res.status(error.number === 50024 ? 400 : 409).json({ success: false, message: error.message });
            return;
        }
      }
      res.status(500).json({ success: false, message: 'Error interno del servidor al actualizar la sucursal.' });
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
      const params = {
        id: branchId,
        activo: activo,
        usuario_id: usuarioId
      };

      const result = await this.db.executeStoredProcedure<{ id: number, mensaje: string }>('sp_Branch_ToggleActive', params);

      if (result.recordset && result.recordset.length > 0 && result.recordset[0].id) {
        res.status(200).json({
          success: true,
          message: result.recordset[0].mensaje,
          data: { id: result.recordset[0].id, activo: activo } // Devolvemos el nuevo estado
        });
      } else {
        // Este caso no debería ocurrir si el SP siempre devuelve un resultado o lanza error
        logger.error(`SP sp_Branch_ToggleActive para ID ${branchId} no devolvió resultado esperado.`, { spResult: result });
        res.status(500).json({ success: false, message: 'Error al cambiar estado de la sucursal, respuesta inesperada del servidor.' });
      }
    } catch (error: any) {
      logger.error(`Error al cambiar estado de la sucursal ID ${branchId}:`, { error, activo });
      if (error.originalError && error.originalError.info && error.originalError.info.procName === 'sp_Branch_ToggleActive') {
        switch (error.number) {
          case 50026: // Sucursal no encontrada
            res.status(404).json({ success: false, message: error.message });
            return;
          case 50027: // La sucursal ya tiene ese estado
            res.status(409).json({ success: false, message: error.message });
            return;
        }
      }
      res.status(500).json({ success: false, message: 'Error interno del servidor al cambiar el estado de la sucursal.' });
    }
  };
}
