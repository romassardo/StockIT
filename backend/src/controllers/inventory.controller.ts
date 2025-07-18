import { Request, Response } from 'express';
import { AuthRequest } from '../types/auth.types';
import { DatabaseConnection } from '../utils/database';
import { logger } from '../utils/logger';
import mysql from 'mysql2/promise';

// Interfaz para el resultado esperado del SP de reparaciones activas
interface RepairRecord {
  id: number;
  // ... otras propiedades de la reparación
  TotalRows: number;
}

// Guarda de tipo para verificar si el objeto es un array de RepairRecord
function isRepairRecordArray(data: unknown): data is RepairRecord[] {
  return (
    Array.isArray(data) &&
    data.length > 0 &&
    typeof data[0] === 'object' &&
    data[0] !== null &&
    'TotalRows' in data[0]
  );
}

export class InventoryController {
  private db = DatabaseConnection.getInstance();

  // Función auxiliar para transformar datos del SP a la estructura esperada por el frontend
  private transformInventoryItem = (item: any): any => {
    const { TotalRows, producto_marca, producto_modelo, producto_descripcion, categoria_nombre, categoria_id, ...rest } = item;
    
    return {
      ...rest,
      // Crear el objeto producto anidado que espera el frontend
      producto: {
        id: item.producto_id,
        marca: producto_marca,
        modelo: producto_modelo,
        descripcion: producto_descripcion,
        categoria_id: categoria_id,
        categoria: categoria_nombre ? {
          id: categoria_id,
          nombre: categoria_nombre
        } : null
      }
    };
  };

  public createInventoryItem = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { producto_id, numero_serie } = req.body; // ubicacion y observaciones no son parte del SP de creación directa.

      // Validaciones básicas
      if (!producto_id || !numero_serie) {
        res.status(400).json({ error: 'Producto ID y número de serie son requeridos.' });
        return;
      }

      const parsedProductId = parseInt(producto_id);
      if (isNaN(parsedProductId)) {
        res.status(400).json({ error: 'Producto ID debe ser un número.' });
        return;
      }

      // Validar formato de número de serie (no espacios, longitud mínima)
      if (String(numero_serie).trim().length < 3) {
        res.status(400).json({ error: 'El número de serie debe tener al menos 3 caracteres.' });
        return;
      }

      const cleanSerial = String(numero_serie).trim().toUpperCase();

      const [results] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_InventarioIndividual_Create',
        [
          parsedProductId,
          cleanSerial,
          req.user!.id
        ]
      );
      
      // sp_InventarioIndividual_Create devuelve el item creado en el results si tiene éxito.
      // Los errores de lógica de negocio (ej: N/S duplicado) se lanzan como RAISERROR y se capturan en el catch.
      if (!results || results.length === 0) {
        // Esto podría ocurrir si el SP no devuelve el registro por alguna razón no cubierta por RAISERROR
        logger.error('SP sp_InventarioIndividual_Create no devolvió el registro esperado.', { producto_id, numero_serie });
        res.status(500).json({ error: 'Error al crear el item de inventario, no se obtuvo confirmación.' });
        return;
      }

      logger.info(`Inventario creado: ${cleanSerial} (ID: ${results[0]?.id}) por ${req.user!.username}`);

      res.status(201).json({
        success: true,
        message: 'Item de inventario creado exitosamente.',
        data: results[0]
      });

    } catch (error: any) {
      logger.error('Error creando inventario:', { 
        errorMessage: error.message, 
        stack: error.stack, 
        body: req.body,
        producto_id_param: req.body?.producto_id,
        numero_serie_param: req.body?.numero_serie
      });
      
      // Manejo de errores específicos del SP basados en el mensaje de error (proveniente de RAISERROR)
      if (error.message?.toLowerCase().includes('no está configurado para usar números de serie') || error.message?.toLowerCase().includes('no maneja números de serie')) {
        res.status(400).json({ error: 'El producto especificado no está configurado para usar números de serie individuales.' });
      } else if (error.message?.toLowerCase().includes('ya existe un item con el número de serie') || error.message?.toLowerCase().includes('uq_inventarioindividual_numero_serie')) {
        res.status(409).json({ error: `El número de serie '${String(req.body?.numero_serie).trim().toUpperCase()}' ya existe en el sistema.` });
      } else if (error.message?.toLowerCase().includes('no existe o no está activo') || error.message?.toLowerCase().includes('fk_inventarioindividual_producto')) {
        res.status(404).json({ error: 'El producto especificado no existe o no está activo.' });
      } else {
        res.status(500).json({ error: 'Error interno del servidor al crear el item de inventario.' });
      }
    }
  };

  public getInventoryBySerial = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { serial } = req.params;

      if (!serial || String(serial).trim().length < 3) {
        res.status(400).json({ error: 'Número de serie inválido o demasiado corto.' });
        return;
      }

      const [results] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_InventarioIndividual_GetBySerialNumber',
        [String(serial).trim().toUpperCase()]
      );

      if (!results || results.length === 0) {
        res.status(404).json({ error: 'Item de inventario no encontrado con ese número de serie.' });
        return;
      }

      // Transformar los datos usando la función auxiliar
      const transformedData = this.transformInventoryItem(results[0]);

      res.json({
        success: true,
        data: transformedData
      });

    } catch (error: any) {
      logger.error('Error obteniendo inventario por serie:', { errorMessage: error.message, stack: error.stack, serial_param: req.params?.serial });
      res.status(500).json({ error: 'Error interno del servidor al obtener inventario por serie.' });
    }
  };

  public getAvailableInventory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { 
        estado,
        categoria_id,
        search, // Nuevo parámetro para búsqueda global
        page = '1', 
        limit = '50' 
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1 || limitNum > 100) {
        res.status(400).json({ error: 'Parámetros de paginación inválidos. Page y limit deben ser números positivos, limit no mayor a 100.' });
        return;
      }

      const [results] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_InventarioIndividual_GetAll',
        [
          estado ? String(estado) : null,
          categoria_id ? parseInt(categoria_id as string) : null,
          search ? String(search).trim() : null, // Parámetro de búsqueda global
          pageNum,
          limitNum
        ]
      );

      const data = results || [];
      // El SP ahora devuelve TotalRows en cada fila, tomamos el primero si existe.
      const totalItems = data.length > 0 ? data[0].TotalRows : 0; 
      const totalPages = Math.ceil(totalItems / limitNum);

      // Transformar los datos del SP para que coincidan con la estructura esperada por el frontend
      const responseData = data.map(this.transformInventoryItem);

      if (responseData.length === 0 && pageNum > 1 && totalItems > 0) {
         res.status(404).json({ 
            success: false, 
            error: 'Página no encontrada. No hay resultados para los parámetros de paginación proporcionados.',
            pagination: {
                page: pageNum,
                limit: limitNum,
                totalItems: totalItems,
                totalPages: totalPages
            }
        });
        return;
      }

      res.json({
        success: true,
        data: responseData,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalItems: totalItems,
          totalPages: totalPages
        }
      });

    } catch (error: any) {
      logger.error('Error obteniendo inventario disponible:', { errorMessage: error.message, stack: error.stack, query_params: req.query });
      res.status(500).json({ error: 'Error interno del servidor al obtener inventario disponible.' });
    }
  };

  public updateInventoryState = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { estado, observaciones } = req.body;

      const inventoryId = parseInt(id);
      if (isNaN(inventoryId)) {
        res.status(400).json({ error: 'ID de inventario inválido.' });
        return;
      }

      const validStates = ['Disponible', 'Asignado', 'En Reparación', 'Dado de Baja'];
      if (!estado || !validStates.includes(estado as string)) {
        res.status(400).json({ 
          error: 'Estado inválido. Debe ser uno de: ' + validStates.join(', ') + '.', 
          validStates: validStates 
        });
        return;
      }

      // Para 'Dado de Baja', 'observaciones' (motivo_baja) es requerido por el SP.
      if (estado === 'Dado de Baja' && (!observaciones || String(observaciones).trim() === '')) {
        res.status(400).json({ error: 'Observaciones (motivo de baja) son requeridas cuando el estado es "Dado de Baja".' });
        return;
      }

      await this.db.executeStoredProcedure(
        'sp_InventarioIndividual_UpdateState',
        [
          inventoryId,
          estado as string,
          observaciones ? String(observaciones).trim() : null,
          req.user!.id
        ]
      );

      logger.info(`Inventario ${inventoryId} actualizado a estado '${estado}' por ${req.user!.username}`);

      res.json({ success: true, message: 'Estado del item de inventario actualizado exitosamente.' });

    } catch (error: any) {
      logger.error('Error actualizando estado inventario:', { errorMessage: error.message, stack: error.stack, params: req.params, body: req.body });
      
      if (error.message?.toLowerCase().includes('item de inventario no encontrado')) {
        res.status(404).json({ error: 'Item de inventario no encontrado.' });
      } else if (error.message?.toLowerCase().includes('transición de estado no permitida') || error.message?.toLowerCase().includes('no se puede cambiar')) {
        res.status(400).json({ error: error.message }); // El SP debe proveer un mensaje claro.
      } else {
        res.status(500).json({ error: 'Error interno del servidor al actualizar estado de inventario.' });
      }
    }
  };

  public getInventoryHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const inventoryId = parseInt(id);
      if (isNaN(inventoryId)) {
        res.status(400).json({ error: 'ID de inventario inválido.' });
        return;
      }

      const [results] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_LogsActividad_GetByInventarioId',
        [inventoryId]
      );

      const data = results || [];

      res.json({
        success: true,
        data: data,
        totalItems: data.length
      });

    } catch (error: any) {
      logger.error('Error obteniendo historial inventario:', { errorMessage: error.message, stack: error.stack, inventory_id: req.params?.id });
      res.status(500).json({ error: 'Error interno del servidor al obtener historial de inventario.' });
    }
  };

  public getInventoryItemById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const inventoryId = parseInt(id);
      if (isNaN(inventoryId)) {
        res.status(400).json({ error: 'ID de inventario inválido.' });
        return;
      }

      const [results] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_InventarioIndividual_Get',
        [inventoryId]
      );

      if (!results || results.length === 0) {
        res.status(404).json({ error: 'Item de inventario no encontrado.' });
        return;
      }

      // Transformar los datos usando la función auxiliar
      const transformedData = this.transformInventoryItem(results[0]);

      res.json({
        success: true,
        data: transformedData
      });

    } catch (error: any) {
      logger.error('Error obteniendo item inventario por ID:', { errorMessage: error.message, stack: error.stack, inventory_id: req.params?.id });
      res.status(500).json({ error: 'Error interno del servidor al obtener item de inventario.' });
    }
  };

  public updateInventoryItem = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { 
        producto_id,
        numero_serie,
        estado,
        fecha_baja,
        motivo_baja,
        usuario_baja_id
      } = req.body;

      const inventoryId = parseInt(id);
      if (isNaN(inventoryId)) {
        res.status(400).json({ error: 'ID de inventario inválido.' });
        return;
      }

      // Validaciones básicas
      if (producto_id && isNaN(parseInt(producto_id))) {
        res.status(400).json({ error: 'Producto ID debe ser un número.' });
        return;
      }

      if (numero_serie && String(numero_serie).trim().length < 3) {
        res.status(400).json({ error: 'El número de serie debe tener al menos 3 caracteres.' });
        return;
      }

      const validStates = ['Disponible', 'Asignado', 'En Reparación', 'Dado de Baja'];
      if (estado && !validStates.includes(estado as string)) {
        res.status(400).json({ 
          error: 'Estado inválido. Debe ser uno de: ' + validStates.join(', ') + '.', 
          validStates: validStates 
        });
        return;
      }

      // Para 'Dado de Baja', 'motivo_baja' es requerido
      if (estado === 'Dado de Baja' && (!motivo_baja || String(motivo_baja).trim() === '')) {
        res.status(400).json({ error: 'Motivo de baja es requerido cuando el estado es "Dado de Baja".' });
        return;
      }

      const cleanSerial = numero_serie ? String(numero_serie).trim().toUpperCase() : null;

      await this.db.executeStoredProcedure(
        'sp_InventarioIndividual_Update',
        [
          inventoryId,
          producto_id ? parseInt(producto_id) : null,
          cleanSerial,
          estado || null,
          fecha_baja || null,
          motivo_baja ? String(motivo_baja).trim() : null,
          usuario_baja_id ? parseInt(usuario_baja_id) : null
        ]
      );

      logger.info(`Inventario ${inventoryId} actualizado por ${req.user!.username}`);

      res.json({ success: true, message: 'Item de inventario actualizado exitosamente.' });

    } catch (error: any) {
      logger.error('Error actualizando item inventario:', { errorMessage: error.message, stack: error.stack, params: req.params, body: req.body });
      
      if (error.message?.toLowerCase().includes('item de inventario no encontrado')) {
        res.status(404).json({ error: 'Item de inventario no encontrado.' });
      } else if (error.message?.toLowerCase().includes('ya existe un item con el número de serie') || error.message?.toLowerCase().includes('uq_inventarioindividual_numero_serie')) {
        res.status(409).json({ error: `El número de serie '${String(req.body?.numero_serie).trim().toUpperCase()}' ya existe en el sistema.` });
      } else if (error.message?.toLowerCase().includes('producto no existe') || error.message?.toLowerCase().includes('fk_inventarioindividual_producto')) {
        res.status(404).json({ error: 'El producto especificado no existe.' });
      } else {
        res.status(500).json({ error: 'Error interno del servidor al actualizar item de inventario.' });
      }
    }
  };

  async getHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const [results] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_LogsActividad_GetByInventarioId',
        [parseInt(id)]
      );

      res.json({
        success: true,
        data: results || []
      });
    } catch (error: any) {
      logger.error('Error obteniendo historial:', { error: error.message, id: req.params.id });
      res.status(500).json({ error: 'Error al obtener historial' });
    }
  }

  public createInventoryBatch = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { items } = req.body;

      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'Se requiere un array de items no vacío.' });
        return;
      }

      if (items.length > 100) {
        res.status(400).json({ error: 'No se pueden crear más de 100 items a la vez.' });
        return;
      }

      // Preparar parámetros para el SP de batch create
      const serialNumbers = items.map(item => String(item.numero_serie).trim().toUpperCase()).join(',');
      const productId = items[0].producto_id;

      // Validar que todos los items tengan el mismo producto_id
      if (!items.every(item => item.producto_id === productId)) {
        res.status(400).json({ error: 'Todos los items deben tener el mismo producto_id.' });
        return;
      }

      const [results] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_InventarioIndividual_BatchCreate',
        [
          productId,
          serialNumbers,
          req.user!.id
        ]
      );

      logger.info(`Batch inventario creado: ${items.length} items por ${req.user!.username}`);

      res.status(201).json({
        success: true,
        message: `${items.length} items de inventario creados exitosamente.`,
        data: results || []
      });

    } catch (error: any) {
      logger.error('Error creando batch inventario:', { errorMessage: error.message, stack: error.stack, body: req.body });
      res.status(500).json({ error: 'Error interno del servidor al crear batch de inventario.' });
    }
  };

  public getActiveRepairs = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { 
        page = '1',
        limit = '25',
        search
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1 || limitNum > 100) {
        res.status(400).json({ error: 'Parámetros de paginación inválidos.' });
        return;
      }

      const [results] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_Repair_GetActive',
        [
          search ? String(search).trim() : null,
          pageNum,
          limitNum
        ]
      );

      const data = results || [];
      const totalItems = data.length > 0 ? data[0].TotalRows : 0;
      const totalPages = Math.ceil(totalItems / limitNum);

      res.json({
        success: true,
        data: data,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalItems: totalItems,
          totalPages: totalPages
        }
      });

    } catch (error: any) {
      logger.error('Error obteniendo reparaciones activas:', { errorMessage: error.message, stack: error.stack });
      res.status(500).json({ error: 'Error interno del servidor al obtener reparaciones activas.' });
    }
  };

  public createRepair = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { 
        inventario_individual_id,
        proveedor,
        problema_descripcion
      } = req.body;

      const [results] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_Repair_Create',
        [
          inventario_individual_id,
          proveedor,
          problema_descripcion,
          req.user!.id
        ]
      );

      logger.info(`Reparación creada para inventario ${inventario_individual_id} por ${req.user!.username}`);

      res.status(201).json({
        success: true,
        message: 'Reparación creada exitosamente.',
        data: results && results.length > 0 ? results[0] : null
      });

    } catch (error: any) {
      logger.error('Error creando reparación:', { errorMessage: error.message, stack: error.stack, body: req.body });
      res.status(500).json({ error: 'Error interno del servidor al crear reparación.' });
    }
  };

  public returnRepair = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { 
        estado,
        solucion_descripcion
      } = req.body;

      const repairId = parseInt(id);
      if (isNaN(repairId)) {
        res.status(400).json({ error: 'ID de reparación inválido.' });
        return;
      }

      const validStates = ['Reparado', 'Sin Reparación'];
      if (!estado || !validStates.includes(estado)) {
        res.status(400).json({ 
          error: 'Estado inválido. Debe ser "Reparado" o "Sin Reparación".',
          validStates: validStates 
        });
        return;
      }

      await this.db.executeStoredProcedure(
        'sp_Repair_Return',
        [
          repairId,
          estado,
          solucion_descripcion || null,
          req.user!.id
        ]
      );

      logger.info(`Reparación ${repairId} finalizada con estado '${estado}' por ${req.user!.username}`);

      res.json({
        success: true,
        message: 'Reparación finalizada exitosamente.'
      });

    } catch (error: any) {
      logger.error('Error finalizando reparación:', { errorMessage: error.message, stack: error.stack, params: req.params, body: req.body });
      res.status(500).json({ error: 'Error interno del servidor al finalizar reparación.' });
    }
  };
}
