import { Request, Response } from 'express';
import mysql from 'mysql2/promise';
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
      // Usar consulta directa ya que el SP no existe en MySQL
      const insertQuery = `
        INSERT INTO Empleados (nombre, apellido, email, activo)
        VALUES (?, ?, ?, ?)
      `;
      const activoValue = activo !== undefined ? (activo ? 1 : 0) : 1;
      
      logger.info(`Creando empleado: ${nombre} ${apellido}`);
      const [result] = await this.db.executeQuery<any>(insertQuery, [nombre, apellido, email || null, activoValue]);
      
      if (result.insertId) {
        logger.info(`Empleado creado con ID: ${result.insertId} por usuario ID: ${usuario_id}`);
        res.status(201).json({ 
          success: true, 
          message: 'Empleado creado exitosamente.', 
          data: { id: result.insertId, nombre, apellido, email, activo: activoValue === 1 }
        });
      } else {
        res.status(500).json({ success: false, message: 'Error al crear el empleado.' });
      }
    } catch (error) {
      const err = error as Error & { code?: string };
      logger.error(`Error al crear empleado: ${err.message}`, { error: err });
      
      if (err.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ success: false, message: 'El empleado ya existe.' });
      } else {
        res.status(500).json({ success: false, message: 'Error interno del servidor al crear el empleado.' });
      }
    }
  };

  // GET /employees
  public getAllEmployees = async (req: Request, res: Response): Promise<void> => {
    const { activo_only, page, pageSize } = req.query;

    // Por defecto, mostramos TODOS los empleados (activos e inactivos).
    // El SP usa @activo_only = 1 para solo activos, y @activo_only = 0 para todos.
    const activoOnlyBit = activo_only === 'true' ? 1 : 0;
    const pageNumber = parseInt(page as string) || 1;
    const pageSizeNumber = parseInt(pageSize as string) || 100; // 100 por defecto para obtener todos
    
    try {
      const params = [
        activoOnlyBit,
        pageNumber,
        pageSizeNumber
      ];
      
      logger.info(`Obteniendo empleados con filtro activo_only: ${activoOnlyBit}, página: ${pageNumber}, tamaño: ${pageSizeNumber}`);
      
      const result = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>('sp_Employee_GetAll', params);
      
      // MySQL devuelve [[rows], OkPacket] para SPs
      const rawData = result[0];
      const data = Array.isArray(rawData[0]) ? rawData[0] : rawData;
      const employees = data || [];
      const totalItems = employees.length > 0 ? employees[0].TotalItems || employees.length : 0;
      const totalPages = Math.ceil(totalItems / pageSizeNumber);

      // Devolvemos los resultados con la estructura que espera el frontend
      res.status(200).json({
        success: true,
        message: 'Empleados obtenidos exitosamente.',
        data: {
          employees: employees,
          totalItems,
          totalPages,
          currentPage: pageNumber
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
      const result = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>('sp_Employee_Get', [employeeId]);
      
      const [data] = result;
      if (data && data.length > 0) {
        res.status(200).json({ success: true, message: 'Empleado encontrado.', data: data[0] });
      } else {
        logger.warn(`SP sp_Employee_Get para ID ${employeeId} no arrojó error pero no devolvió datos.`);
        res.status(404).json({ success: false, message: 'Empleado no encontrado.' });
      }
    } catch (error) {
      const err = error as Error & { number?: number };
      logger.error(`Error al obtener empleado por ID ${employeeId}: ${err.message}`, { error: err });
      
      if (err.message?.includes('no encontrado')) {
        res.status(404).json({ success: false, message: 'Empleado no encontrado.' });
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
      // Usar consulta directa ya que el SP no existe en MySQL
      const updateQuery = `
        UPDATE Empleados 
        SET nombre = ?, apellido = ?
        WHERE id = ?
      `;
      
      logger.info(`Actualizando empleado ID ${employeeId} con nombre: ${nombre}, apellido: ${apellido}`);
      const [result] = await this.db.executeQuery<any>(updateQuery, [nombre, apellido, employeeId]);
      
      if (result.affectedRows > 0) {
        logger.info(`Empleado ID: ${employeeId} actualizado por usuario ID: ${usuario_id}`);
        
        // Devolver los datos del empleado actualizado
        const employeeData = {
          id: employeeId,
          nombre: nombre,
          apellido: apellido,
          activo: true
        };
        
        res.status(200).json({ 
          success: true, 
          message: 'Empleado actualizado exitosamente.', 
          data: employeeData 
        });
      } else {
        logger.warn(`Empleado ID ${employeeId} no encontrado para actualizar.`);
        res.status(404).json({ success: false, message: 'Empleado no encontrado.' }); 
      }
    } catch (error) {
      const err = error as Error & { number?: number };
      logger.error(`Error al actualizar empleado ID ${employeeId}: ${err.message}`, { error: err });
      res.status(500).json({ success: false, message: 'Error interno del servidor al actualizar el empleado.' });
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
      // Usar consulta directa ya que el SP no existe en MySQL
      const updateQuery = `UPDATE Empleados SET activo = ? WHERE id = ?`;
      
      logger.info(`Cambiando estado de empleado ID ${employeeId} a ${activo} por usuario ID: ${usuario_id}`);
      const [result] = await this.db.executeQuery<any>(updateQuery, [activo ? 1 : 0, employeeId]);
      
      if (result.affectedRows > 0) {
        logger.info(`Estado de empleado ID: ${employeeId} cambiado a ${activo} por usuario ID: ${usuario_id}`);
        res.status(200).json({ 
          success: true, 
          message: 'Estado del empleado actualizado exitosamente.', 
          data: { id: employeeId, activo } 
        });
      } else {
        res.status(404).json({ success: false, message: 'Empleado no encontrado.' });
      }
    } catch (error) {
      const err = error as Error & { number?: number };
      logger.error(`Error al cambiar estado de empleado ID ${employeeId}: ${err.message}`, { error: err });
      res.status(500).json({ success: false, message: 'Error interno del servidor al cambiar el estado del empleado.' });
    }
  };
}
