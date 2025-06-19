import { Request, Response } from 'express';
import * as sql from 'mssql';
import { DatabaseConnection } from '../utils/database';
import { logger } from '../utils/logger';
import { AuthRequest } from '../types/auth.types'; // Asumiendo que AuthRequest define req.user

// Interfaz para el tipo de dato que devuelven los SP de Empleado (ajustar según SPs)
interface EmployeeData {
  id: number;
  nombre: string;
  apellido: string;
  nombre_completo?: string; // Para GetAll y GetById
  activo: boolean;
  // Añadir otros campos que devuelvan los SPs si es necesario
  // email?: string;
  // telefono?: string;
  // sector_id?: number;
  // sucursal_id?: number;
  // fecha_ingreso?: string;
}

// Interfaz para el resultado común de SPs de Create, Update, Toggle (ID y mensaje)
interface ProcedureResult {
  id: number;
  mensaje: string;
}

export class EmployeeController {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
    logger.info('EmployeeController inicializado.');
  }

  // POST /employees
  public createEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
    const { nombre, apellido, email, telefono, sector_id, sucursal_id, fecha_ingreso, activo } = req.body;
    const usuario_id = req.user?.id; 

    if (!nombre || !apellido) {
      logger.warn('Intento de crear empleado sin nombre o apellido.');
      res.status(400).json({ success: false, message: 'Nombre y apellido son requeridos.' });
      return;
    }
    if (usuario_id === undefined) {
      logger.error('Intento de crear empleado sin usuario_id (token no verificado o ausente)');
      res.status(401).json({ success: false, message: 'Usuario no autenticado correctamente.' });
      return;
    }

    try {
      const params = {
        nombre,
        apellido,
        email, // Puede ser null
        telefono, // Puede ser null
        sector_id, // Puede ser null
        sucursal_id, // Puede ser null
        fecha_ingreso, // Puede ser null
        activo: activo !== undefined ? activo : true, // Valor por defecto si no se envía
        usuario_id
      };
      logger.info(`Creando empleado con params: ${JSON.stringify(params)}`);
      const result = await this.db.executeStoredProcedure<ProcedureResult>('sp_Employee_Create', params);
      
      if (result.recordset && result.recordset.length > 0 && result.recordset[0].id) {
        logger.info(`Empleado creado con ID: ${result.recordset[0].id} por usuario ID: ${usuario_id}`);
        res.status(201).json({ success: true, message: result.recordset[0].mensaje || 'Empleado creado exitosamente.', data: result.recordset[0] });
      } else {
        logger.error('sp_Employee_Create no devolvió el resultado esperado (ID).', { result });
        res.status(500).json({ success: false, message: 'Error al crear el empleado: SP no devolvió ID.' });
      }
    } catch (error) {
      const err = error as Error & { number?: number };
      logger.error(`Error al crear empleado: ${err.message}`, { error: err });
      // Revisar si el error viene de una validación del SP (ej. RAISERROR con severidad < 10)
      // o un error de SQL Server (ej. clave duplicada, FK constraint)
      if (err.message.includes('El empleado ya existe') || err.message.includes('Error de validación del SP')) { // Ajustar según mensajes reales del SP
        res.status(409).json({ success: false, message: err.message }); // 409 Conflict o 400 Bad Request
      } else {
        res.status(500).json({ success: false, message: 'Error interno del servidor al crear el empleado.' });
      }
    }
  };

  // GET /employees
  public getAllEmployees = async (req: Request, res: Response): Promise<void> => {
    // Los parámetros de paginación de la query se ignoran aquí porque el SP no los soporta,
    // pero se mantienen para que la firma de la llamada desde el frontend no falle.
    const { activo_only } = req.query;

    // Por defecto, mostramos TODOS los empleados (activos e inactivos).
    // El SP usa @activo_only = 1 para solo activos, y @activo_only = 0 para todos.
    const activoOnlyBit = activo_only === 'true' ? 1 : 0;
    
    try {
      const params = {
        activo_only: { type: sql.Bit, value: activoOnlyBit }
      };
      
      logger.info(`Obteniendo empleados con filtro activo_only: ${activoOnlyBit}`);
      
      const result = await this.db.executeStoredProcedure<EmployeeData>(
        'sp_Employee_GetAll', 
        params
      );
      
      const employees = result.recordset || [];
      const totalItems = employees.length;

      // Como el SP no pagina, devolvemos todos los resultados en una sola página
      // para mantener la compatibilidad con la estructura que espera el frontend.
      res.status(200).json({
        success: true,
        message: 'Empleados obtenidos exitosamente.',
        data: {
          employees: employees,
          totalItems,
          totalPages: 1,
          currentPage: 1
        }
      });
    } catch (error) {
      const err = error as Error;
      logger.error(`Error al obtener todos los empleados: ${err.message}`, { error: err });
      res.status(500).json({ success: false, message: 'Error interno del servidor al obtener empleados.' });
    }
  };

  // GET /employees/:id
  public getEmployeeById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const employeeId = parseInt(id, 10);

    if (isNaN(employeeId)) {
      logger.warn(`Intento de obtener empleado con ID inválido: ${id}`);
      res.status(400).json({ success: false, message: 'ID de empleado inválido.' });
      return;
    }

    try {
      logger.info(`Obteniendo empleado por ID: ${employeeId}`);
      const result = await this.db.executeStoredProcedure<EmployeeData>('sp_Employee_Get', { id: employeeId });
      
      // El SP sp_Employee_Get arroja un error si no se encuentra el empleado.
      // Por lo tanto, si llegamos aquí, es porque se encontró.
      // La comprobación de result.recordset.length > 0 es una capa extra de seguridad.
      if (result.recordset && result.recordset.length > 0) {
        res.status(200).json({ success: true, message: 'Empleado encontrado.', data: result.recordset[0] });
      } else {
        // Este caso es muy improbable si el SP funciona como se espera, pero es un buen fallback.
        logger.warn(`SP sp_Employee_Get para ID ${employeeId} no arrojó error pero no devolvió datos.`);
        res.status(404).json({ success: false, message: 'Empleado no encontrado.' });
      }
    } catch (error) {
      const err = error as Error & { number?: number };
      logger.error(`Error al obtener empleado por ID ${employeeId}: ${err.message}`, { error: err });
      
      // El SP lanza un error específico (50002) que podemos atrapar por su mensaje.
      if (err.message.includes('Empleado no encontrado')) {
        res.status(404).json({ success: false, message: err.message });
      } else {
        res.status(500).json({ success: false, message: 'Error interno del servidor al obtener el empleado.' });
      }
    }
  };

  // PUT /employees/:id
  public updateEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const employeeId = parseInt(id, 10);
    const { nombre, apellido, email, telefono, sector_id, sucursal_id, fecha_ingreso } = req.body;
    const usuario_id = req.user?.id;

    if (isNaN(employeeId)) {
      logger.warn(`Intento de actualizar empleado con ID inválido: ${id}`);
      res.status(400).json({ success: false, message: 'ID de empleado inválido.' });
      return;
    }
    if (!nombre || !apellido) { // Validar campos obligatorios para la actualización
      logger.warn(`Intento de actualizar empleado ID ${employeeId} sin nombre o apellido.`);
      res.status(400).json({ success: false, message: 'Nombre y apellido son requeridos para la actualización.' });
      return;
    }
    if (usuario_id === undefined) {
      logger.error(`Intento de actualizar empleado ID ${employeeId} sin usuario_id`);
      res.status(401).json({ success: false, message: 'Usuario no autenticado correctamente.' });
      return;
    }

    try {
      const params = {
        id: employeeId,
        nombre,
        apellido,
        email,
        telefono,
        sector_id,
        sucursal_id,
        fecha_ingreso,
        usuario_id
      };
      logger.info(`Actualizando empleado ID ${employeeId} con params: ${JSON.stringify(params)}`);
      const result = await this.db.executeStoredProcedure<ProcedureResult>('sp_Employee_Update', params);
      
      if (result.recordset && result.recordset.length > 0 && result.recordset[0].id) {
        logger.info(`Empleado ID: ${result.recordset[0].id} actualizado por usuario ID: ${usuario_id}`);
        
        // Devolver los datos completos del empleado actualizado
        const employeeData = {
          id: result.recordset[0].id,
          nombre: nombre,
          apellido: apellido,
          email: email,
          telefono: telefono,
          sector_id: sector_id,
          sucursal_id: sucursal_id,
          fecha_ingreso: fecha_ingreso,
          activo: true // Asumimos que está activo después de actualizar
        };
        
        res.status(200).json({ 
          success: true, 
          message: result.recordset[0].mensaje || 'Empleado actualizado exitosamente.', 
          data: employeeData 
        });
      } else {
        logger.error(`sp_Employee_Update no devolvió el resultado esperado para ID: ${employeeId}.`, { result });
        // Esto podría ser un caso donde el SP no encontró el empleado para actualizar y no arrojó error.
        // O el SP no devolvió el ID/mensaje esperado.
        res.status(404).json({ success: false, message: 'Empleado no encontrado o error al actualizar.' }); 
      }
    } catch (error) {
      const err = error as Error & { number?: number };
      logger.error(`Error al actualizar empleado ID ${employeeId}: ${err.message}`, { error: err });
      if (err.message.includes('Empleado no encontrado')) {
        res.status(404).json({ success: false, message: err.message });
      } else if (err.message.includes('Error de validación del SP')) { // Ajustar según mensajes reales del SP
        res.status(400).json({ success: false, message: err.message });
      } else {
        res.status(500).json({ success: false, message: 'Error interno del servidor al actualizar el empleado.' });
      }
    }
  };

  // PATCH /employees/:id/toggle-active
  public toggleEmployeeActiveStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const employeeId = parseInt(id, 10);
    const { activo } = req.body; // Se espera un booleano
    const usuario_id = req.user?.id;

    if (isNaN(employeeId)) {
      logger.warn(`Intento de cambiar estado de empleado con ID inválido: ${id}`);
      res.status(400).json({ success: false, message: 'ID de empleado inválido.' });
      return;
    }
    if (typeof activo !== 'boolean') {
      logger.warn(`Intento de cambiar estado de empleado ID ${employeeId} sin estado 'activo' booleano.`);
      res.status(400).json({ success: false, message: 'El estado \'activo\' (booleano) es requerido.' });
      return;
    }
    if (usuario_id === undefined) {
      logger.error(`Intento de cambiar estado de empleado ID ${employeeId} sin usuario_id`);
      res.status(401).json({ success: false, message: 'Usuario no autenticado correctamente.' });
      return;
    }

    try {
      const params = {
        id: employeeId,
        activo,
        usuario_id
      };
      logger.info(`Cambiando estado de empleado ID ${employeeId} a ${activo} por usuario ID: ${usuario_id}`);
      const result = await this.db.executeStoredProcedure<ProcedureResult>('sp_Employee_ToggleActive', params);
      
      if (result.recordset && result.recordset.length > 0 && result.recordset[0].id) {
        logger.info(`Estado de empleado ID: ${result.recordset[0].id} cambiado a ${activo} por usuario ID: ${usuario_id}`);
        res.status(200).json({ 
          success: true, 
          message: result.recordset[0].mensaje || 'Estado del empleado actualizado exitosamente.', 
          data: { id: result.recordset[0].id, activo } 
        });
      } else {
        logger.error(`sp_Employee_ToggleActive no devolvió el resultado esperado para ID: ${employeeId}.`, { result });
        // Podría ser que el empleado no se encontró o el SP no devolvió ID/mensaje.
        res.status(404).json({ success: false, message: 'Empleado no encontrado o error al cambiar estado.' });
      }
    } catch (error) {
      const err = error as Error & { number?: number };
      logger.error(`Error al cambiar estado de empleado ID ${employeeId}: ${err.message}`, { error: err });
      if (err.message.includes('Empleado no encontrado')) {
        res.status(404).json({ success: false, message: err.message });
      } else if (err.message.includes('El empleado ya tiene ese estado')) { // Asumiendo que el SP usa RAISERROR con este mensaje
        res.status(409).json({ success: false, message: err.message }); // 409 Conflict
      } else {
        res.status(500).json({ success: false, message: 'Error interno del servidor al cambiar el estado del empleado.' });
      }
    }
  };
}
