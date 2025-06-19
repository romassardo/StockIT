import { Request, Response } from 'express';
import { AuthRequest } from '../types/auth.types';
import { DatabaseConnection } from '../utils/database';
import { logger } from '../utils/logger';
import * as sql from 'mssql';

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

      const result = await this.db.executeStoredProcedure<any>(
        'sp_InventarioIndividual_Create',
        {
          producto_id: parsedProductId,
          numero_serie: cleanSerial,
          usuario_alta_id: req.user!.id
        }
      );
      
      // sp_InventarioIndividual_Create devuelve el item creado en el recordset si tiene éxito.
      // Los errores de lógica de negocio (ej: N/S duplicado) se lanzan como RAISERROR y se capturan en el catch.
      if (!result.recordset || result.recordset.length === 0) {
        // Esto podría ocurrir si el SP no devuelve el registro por alguna razón no cubierta por RAISERROR
        logger.error('SP sp_InventarioIndividual_Create no devolvió el registro esperado.', { producto_id, numero_serie });
        res.status(500).json({ error: 'Error al crear el item de inventario, no se obtuvo confirmación.' });
        return;
      }

      logger.info(`Inventario creado: ${cleanSerial} (ID: ${result.recordset[0]?.id}) por ${req.user!.username}`);

      res.status(201).json({
        success: true,
        message: 'Item de inventario creado exitosamente.',
        data: result.recordset[0]
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

      const result = await this.db.executeStoredProcedure<any>(
        'sp_InventarioIndividual_GetBySerialNumber',
        { numero_serie: String(serial).trim().toUpperCase() }
      );

      if (!result.recordset || result.recordset.length === 0) {
        res.status(404).json({ error: 'Item de inventario no encontrado con ese número de serie.' });
        return;
      }

      // Transformar los datos usando la función auxiliar
      const transformedData = this.transformInventoryItem(result.recordset[0]);

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

      const result = await this.db.executeStoredProcedure<any>(
        'sp_InventarioIndividual_GetAll',
        {
          estado: estado ? String(estado) : null,
          categoria_id: categoria_id ? parseInt(categoria_id as string) : null,
          search: search ? String(search).trim() : null, // Parámetro de búsqueda global
          PageNumber: pageNum,
          PageSize: limitNum
        }
      );

      const data = result.recordset || [];
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
        {
          InventoryId: inventoryId,
          NewEstado: estado as string,
          Observaciones: observaciones ? String(observaciones).trim() : null,
          UsuarioId: req.user!.id
        }
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
        res.status(500).json({ error: 'Error interno del servidor al actualizar el estado del inventario.' });
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
      
      const [logsResult, assignmentsResult, repairsResult] = await Promise.all([
        this.db.executeStoredProcedure('sp_LogsActividad_GetByInventarioId', { inventario_individual_id: inventoryId }),
        this.db.executeStoredProcedure('sp_Asignaciones_GetByInventarioId', { inventario_individual_id: inventoryId }),
        this.db.executeStoredProcedure('sp_Repair_GetByInventarioId', { inventario_individual_id: inventoryId })
      ]);

      const itemResult = await this.db.executeStoredProcedure('sp_InventarioIndividual_Get', { id: inventoryId });

      if (!itemResult.recordset || itemResult.recordset.length === 0) {
        res.status(404).json({ error: 'Item de inventario no encontrado.' });
        return;
      }
      
      const item = this.transformInventoryItem(itemResult.recordset[0]);
      
      const activeAssignment = assignmentsResult.recordset.find((a: any) => a.activa);
      const activeRepair = repairsResult.recordset.find((r: any) => r.estado === 'En Reparación');

      if (activeAssignment) {
        item.asignacion_actual = { ...activeAssignment };
      }
      if (activeRepair) {
        item.reparacion_actual = { ...activeRepair };
      }

      res.json({
        success: true,
        data: {
          item: item,
          activityLogs: logsResult.recordset || [],
          assignments: assignmentsResult.recordset || [],
          repairs: repairsResult.recordset || [],
        }
      });

    } catch (error: any) {
      logger.error('Error obteniendo historial de inventario:', { errorMessage: error.message, stack: error.stack, params: req.params });
      res.status(500).json({ error: 'Error interno del servidor al obtener el historial del item.' });
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

      const result = await this.db.executeStoredProcedure<any>(
        'sp_InventarioIndividual_Get',
        { inventario_id: inventoryId }
      );

      if (!result.recordset || result.recordset.length === 0) {
        res.status(404).json({ error: 'Item de inventario no encontrado.' });
        return;
      }

      // Transformar los datos usando la función auxiliar
      const transformedData = this.transformInventoryItem(result.recordset[0]);

      res.json({
        success: true,
        data: transformedData
      });

    } catch (error: any) {
      logger.error('Error obteniendo inventario por ID:', { 
        errorMessage: error.message, 
        stack: error.stack, 
        inventory_id_param: req.params?.id 
      });
      res.status(500).json({ error: 'Error interno del servidor al obtener el item de inventario.' });
    }
  };

  public updateInventoryItem = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const inventoryId = parseInt(id);

      if (isNaN(inventoryId)) {
        res.status(400).json({ error: 'ID de inventario inválido.' });
        return;
      }

      const { numero_serie, fecha_compra, fecha_garantia, observaciones } = req.body;

      // Validaciones básicas de los campos opcionales
      // El SP sp_InventarioIndividual_Update se encargará de la lógica más compleja
      // y de cuáles campos realmente puede actualizar.
      const paramsToUpdate: any = {
        inventario_id: inventoryId, // Corregido para coincidir con el SP
        usuario_id: req.user!.id    // Corregido para coincidir con el SP
      };

      if (numero_serie !== undefined) {
        const cleanSerial = String(numero_serie).trim().toUpperCase();
        if (cleanSerial.length > 0) {
            paramsToUpdate.numero_serie = cleanSerial;
        } else {
            // Si se envía un numero_serie vacío, podría interpretarse como borrarlo, pero el SP no lo soporta.
            // El SP usa ISNULL(@numero_serie, numero_serie), así que enviar NULL o no enviar el campo no lo cambia.
            // Para cambiarlo a vacío (si la BD lo permitiera) se necesitaría lógica adicional.
            // Por ahora, si es vacío, no lo enviamos, manteniendo el valor actual.
        }
      }
      // Para las fechas y observaciones, si se proporcionan explícitamente (incluso como null), se envían.
      // Si son undefined, no se incluyen en paramsToUpdate y el SP no los modificará (si usan ISNULL) o los tomará como NULL.
      // El SP modificado ahora toma NULL directamente para estos campos.
      if (fecha_compra !== undefined) paramsToUpdate.fecha_compra = fecha_compra; 
      if (fecha_garantia !== undefined) paramsToUpdate.fecha_garantia = fecha_garantia; 
      if (observaciones !== undefined) paramsToUpdate.observaciones = String(observaciones).trim() || null;
      
      // Verificar que al menos un campo se esté intentando actualizar (además de los IDs)
      if (Object.keys(paramsToUpdate).length <= 2) {
        res.status(400).json({ error: 'No se proporcionaron datos para actualizar.' });
        return;
      }

      const result = await this.db.executeStoredProcedure<any>(
        'sp_InventarioIndividual_Update',
        paramsToUpdate
      );
      
      // El SP sp_InventarioIndividual_Update ahora devuelve el item actualizado en su recordset.
      if (result.recordset && result.recordset.length > 0) {
        logger.info(`Inventario ${inventoryId} actualizado por ${req.user!.username}. Datos: ${JSON.stringify(req.body)}`);
        res.json({ 
            success: true, 
            message: 'Item de inventario actualizado exitosamente.',
            data: result.recordset[0]
        });
      } else {
        // Si el SP no devuelve un recordset, algo inesperado ocurrió, o el ID no existía y el SP no lanzó error (lo cual no debería pasar con el THROW).
        logger.warn(`Actualización de inventario ${inventoryId} no devolvió datos, aunque no hubo error explícito.`, { result });
        // Se asume que si no hay error y no hay recordset, el item no se encontró o no se modificó.
        // El SP ahora lanza un error si el item no existe, así que este caso es menos probable.
        res.status(404).json({ error: 'Item de inventario no encontrado o no se pudo actualizar. Verifique el ID.' });
      }

    } catch (error: any) {
      logger.error('Error actualizando inventario:', { 
        errorMessage: error.message, 
        stack: error.stack, 
        params: req.params, 
        body: req.body 
      });
      if (error.message?.toLowerCase().includes('no se puede modificar un item en estado')) {
        res.status(400).json({ error: error.message });
      } else if (error.message?.toLowerCase().includes('item de inventario no encontrado')) {
        res.status(404).json({ error: 'Item de inventario no encontrado.' });
      } else {
        res.status(500).json({ error: 'Error interno del servidor al actualizar el item de inventario.' });
      }
    }
  };

  async getHistory(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const result = await this.db.executeStoredProcedure('sp_LogsActividad_GetByInventarioId', {
        inventario_id: { type: sql.Int, value: parseInt(id, 10) }
      });
        
      res.json({
        success: true,
        data: {
          activityLogs: result.recordset
        }
      });
    } catch (error: any) {
      logger.error(`Error al obtener historial para inventario ID ${id}:`, error.message);
      res.status(500).json({ success: false, error: 'Error al obtener el historial del activo.' });
    }
  }

  public createInventoryBatch = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { producto_id, numeros_serie } = req.body;

      if (!producto_id || !numeros_serie) {
        res.status(400).json({ error: 'Se requiere el ID del producto y una lista de números de serie.' });
        return;
      }
      
      if (!Array.isArray(numeros_serie) || numeros_serie.length === 0) {
        res.status(400).json({ error: 'numeros_serie debe ser un arreglo no vacío de strings.' });
        return;
      }

      const numeros_serie_csv = numeros_serie.join(',');

      const result = await this.db.executeStoredProcedure<any>(
        'sp_InventarioIndividual_BatchCreate',
        {
          producto_id: parseInt(producto_id),
          numeros_serie_csv: numeros_serie_csv,
          usuario_alta_id: req.user!.id
        }
      );

      const summary = result.recordset[0];
      logger.info(`Alta masiva ejecutada por ${req.user!.username}. Creados: ${summary.Creados}. Duplicados: ${summary.Duplicados || 'Ninguno'}`);

      res.status(201).json({
        success: true,
        message: 'Alta masiva procesada exitosamente.',
        data: summary
      });

    } catch (error: any) {
      logger.error('Error en alta masiva de inventario:', { 
        errorMessage: error.message, 
        stack: error.stack, 
        body: req.body,
      });
       if (error.message?.includes('El producto especificado no existe')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Error interno del servidor durante el alta masiva.' });
      }
    }
  };

  // --- Métodos de Reparaciones ---

  public getActiveRepairs = async (req: AuthRequest, res: Response): Promise<void> => {
    const { page = 1, pageSize = 10 } = req.query;
    try {
      const result = await DatabaseConnection.getInstance().executeStoredProcedure('sp_Repair_GetActive', {
        PageNumber: { type: sql.Int, value: Number(page) },
        PageSize: { type: sql.Int, value: Number(pageSize) }
      });

      const data = result.recordset;
      
      let totalItems = 0;
      if (isRepairRecordArray(data)) {
        totalItems = data[0].TotalRows;
      }
      
      res.json({
          success: true,
          data: data,
          pagination: {
              page: Number(page),
              limit: Number(pageSize),
              totalItems: totalItems,
              totalPages: Math.ceil(totalItems / Number(pageSize))
          }
      });

    } catch (error) {
      logger.error('Error al obtener reparaciones activas', { error });
      res.status(500).json({ success: false, error: 'Error interno del servidor al obtener reparaciones activas.' });
    }
  };

  public createRepair = async (req: AuthRequest, res: Response): Promise<void> => {
    const { inventario_individual_id, proveedor, problema_descripcion } = req.body;
    const usuario_id = req.user?.id;

    if (!usuario_id) {
      res.status(401).json({ message: 'No autorizado' });
      return;
    }
    
    if (!inventario_individual_id || !proveedor || !problema_descripcion) {
        res.status(400).json({ message: "Faltan campos requeridos: inventario_individual_id, proveedor, problema_descripcion" });
        return;
    }

    try {
      await DatabaseConnection.getInstance().executeStoredProcedure('sp_Repair_Create', {
        inventario_individual_id: { type: sql.Int, value: inventario_individual_id },
        proveedor: { type: sql.NVarChar(100), value: proveedor },
        problema_descripcion: { type: sql.Text, value: problema_descripcion },
        usuario_envia_id: { type: sql.Int, value: usuario_id }
      });

      res.status(201).json({ message: 'Registro de reparación creado exitosamente.' });
    } catch (error) {
      logger.error('Error al crear registro de reparación', { error });
      res.status(500).json({ message: 'Error interno del servidor al crear la reparación.' });
    }
  };

  public returnRepair = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { solucion_descripcion, estado_final } = req.body;
    const usuario_id = req.user?.id;

    if (!usuario_id) {
      res.status(401).json({ message: 'No autorizado' });
      return;
    }

    if (!solucion_descripcion || !estado_final) {
        res.status(400).json({ message: "Faltan campos requeridos: solucion_descripcion, estado_final" });
        return;
    }

    try {
      await DatabaseConnection.getInstance().executeStoredProcedure('sp_Repair_Return', {
        reparacion_id: { type: sql.Int, value: Number(id) },
        solucion_descripcion: { type: sql.Text, value: solucion_descripcion },
        estado_final: { type: sql.VarChar(20), value: estado_final },
        usuario_recibe_id: { type: sql.Int, value: usuario_id }
      });

      res.status(200).json({ message: 'Reparación actualizada exitosamente.' });
    } catch (error) {
      logger.error('Error al retornar de reparación', { error });
      res.status(500).json({ message: 'Error interno del servidor al retornar de reparación.' });
    }
  };
}
