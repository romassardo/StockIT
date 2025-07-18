import { Response } from 'express';
import mysql from 'mysql2/promise';
import { AuthRequest } from '../types/auth.types';
import { DatabaseConnection } from '../utils/database';

import { logger } from '../utils/logger';

/**
 * Interfaz para los datos de asignación devueltos por los SPs
 */
interface AssignmentData {
  id: number;
  inventario_individual_id?: number;
  producto_id?: number;
  cantidad?: number;
  empleado_id?: number;
  sector_id?: number;
  sucursal_id?: number;
  tipo_asignacion: string;
  estado: string;
  fecha_asignacion: string;
  fecha_devolucion?: string;
  observaciones?: string;
  password_encriptacion?: string;
  cuenta_gmail?: string;
  numero_telefono?: string;
  codigo_2fa_whatsapp?: string;
  usuario_asigna_id: number;
  usuario_recibe_id?: number;
  TotalRows?: number; // Para paginación
}

/**
 * Interfaz para los datos de salida de los SPs de asignación
 */
interface AssignmentResult {
  assignment_id?: number;
  message: string;
}

/**
 * Controlador para gestión de asignaciones de equipos
 * CRÍTICO: Maneja la diferenciación entre productos con/sin número de serie
 */
export class AssignmentController {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
    logger.info('AssignmentController inicializado');
  }

  /**
   * Crea una nueva asignación
   * Diferencia entre productos con número de serie (inventario individual) 
   * y productos sin número de serie (stock general)
   */
  public createAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        inventario_individual_id,
        producto_id,
        cantidad,
        empleado_id,
        sector_id,
        sucursal_id,
        password_encriptacion,
        cuenta_gmail,
        numero_telefono,
        codigo_2fa_whatsapp,
        observaciones
      } = req.body;

      const usuario_id = req.user?.id;

      if (!usuario_id) {
        logger.error('Intento de crear asignación sin usuario autenticado');
        res.status(401).json({ 
          success: false, 
          message: 'Usuario no autenticado' 
        });
        return;
      }

      // Validación de destino (debe tener exactamente uno)
      const destinos = [empleado_id, sector_id, sucursal_id].filter(d => d !== undefined && d !== null);
      if (destinos.length !== 1) {
        logger.warn('Intento de crear asignación sin un destino único');
        res.status(400).json({
          success: false,
          message: 'Debe especificar exactamente un destino (empleado, sector o sucursal)'
        });
        return;
      }

      // Validación de origen (debe ser inventario_individual_id O producto_id+cantidad)
      const tieneInventarioIndividual = !!inventario_individual_id;
      const tieneProductoStock = !!producto_id && cantidad !== undefined && cantidad !== null;
      
      if ((tieneInventarioIndividual && tieneProductoStock) || (!tieneInventarioIndividual && !tieneProductoStock)) {
        logger.warn('Intento de crear asignación con datos de origen inválidos');
        res.status(400).json({
          success: false,
          message: 'Debe especificar inventario_individual_id (para productos con N/S) O producto_id+cantidad (para productos sin N/S)'
        });
        return;
      }

      // Validación de cantidad positiva para productos sin N/S
      if (tieneProductoStock && (isNaN(+cantidad) || +cantidad <= 0)) {
        logger.warn(`Intento de crear asignación con cantidad inválida: ${cantidad}`);
        res.status(400).json({
          success: false, 
          message: 'La cantidad debe ser un número positivo'
        });
        return;
      }

      // Parámetros para el stored procedure
      const tipo_asignacion = empleado_id ? 'Empleado' : sector_id ? 'Sector' : 'Sucursal';
      const id_destino = empleado_id || sector_id || sucursal_id;

      // Ejecutar el stored procedure
      const result = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_Assignment_Create',
        [
          inventario_individual_id || null,
          tipo_asignacion,
          id_destino,
          password_encriptacion || null,
          cuenta_gmail || null,
          numero_telefono || null,
          codigo_2fa_whatsapp || null,
          observaciones || null,
          usuario_id
        ]
      );
      
      const [data] = result;
      if (data && data.length > 0 && data[0].id_asignacion) {
        const newAssignmentId = data[0].id_asignacion;
        logger.info(`Asignación creada con ID: ${newAssignmentId}`);
        
        res.status(201).json({
          success: true,
          message: 'Asignación creada exitosamente',
          data: { assignment_id: newAssignmentId }
        });
      } else {
        logger.error('El SP sp_Assignment_Create no devolvió el ID de la nueva asignación', { result });
        res.status(500).json({ 
          success: false, 
          message: 'Error al crear la asignación: no se pudo obtener el ID del nuevo registro.'
        });
      }
    } catch (error: any) {
      logger.error(`Error al crear asignación: ${error.message}`, { error });
      
      // Manejo específico de errores conocidos del SP
      if (error.message?.includes('usar inventario_individual_id')) {
        // Producto con N/S intentando usar producto_id+cantidad
        res.status(400).json({ 
          success: false, 
          message: 'Este producto usa número de serie, debe especificar inventario_individual_id en lugar de producto_id'
        });
      } else if (error.message?.includes('usar producto_id')) {
        // Producto sin N/S intentando usar inventario_individual_id
        res.status(400).json({ 
          success: false,
          message: 'Este producto no usa número de serie, debe especificar producto_id y cantidad'
        });
      } else if (error.message?.includes('no está disponible')) {
        // Ítem no disponible (ya asignado o en reparación)
        res.status(409).json({ 
          success: false,
          message: 'El ítem de inventario no está disponible para asignación'
        });
      } else if (error.message?.includes('contraseña') || error.message?.includes('password')) {
        // Falta contraseña para notebooks
        res.status(400).json({ 
          success: false,
          message: 'La contraseña de encriptación es obligatoria para notebooks'
        });
      } else if (error.message?.includes('gmail') || error.message?.includes('correo')) {
        // Falta Gmail para celulares
        res.status(400).json({ 
          success: false,
          message: 'La cuenta Gmail es obligatoria para celulares'
        });
      } else if (error.message?.includes('stock insuficiente')) {
        // No hay suficiente stock
        res.status(400).json({ 
          success: false,
          message: 'No hay suficiente stock disponible para la cantidad solicitada'
        });
      } else {
        // Error genérico
        res.status(500).json({ 
          success: false,
          message: error.message || 'Error interno al procesar la asignación'
        });
      }
    }
  };

  /**
   * Registra la devolución de un ítem asignado
   */
  public returnAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { assignment_id } = req.params;
      const { observaciones } = req.body;
      const usuario_id = req.user?.id;

      if (!usuario_id) {
        logger.error(`Intento de devolver asignación ${assignment_id} sin usuario autenticado`);
        res.status(401).json({ 
          success: false, 
          message: 'Usuario no autenticado' 
        });
        return;
      }

      if (!assignment_id || isNaN(+assignment_id)) {
        logger.warn(`ID de asignación inválido: ${assignment_id}`);
        res.status(400).json({ 
          success: false,
          message: 'ID de asignación inválido'
        });
        return;
      }

      const result = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_Assignment_Return',
        [
          +assignment_id,
          observaciones || null,
          usuario_id
        ]
      );

      const [data] = result;
      if (data && data.length > 0) {
        const { message } = data[0];
        
        logger.info(`Asignación ${assignment_id} devuelta exitosamente por usuario ${usuario_id}`);
        
        res.status(200).json({
          success: true,
          message: message || 'Asignación devuelta exitosamente'
        });
      } else {
        logger.error('El SP no devolvió el resultado esperado', { result });
        res.status(500).json({ 
          success: false, 
          message: 'Error al procesar la devolución: respuesta incompleta del servidor'
        });
      }
    } catch (error: any) {
      logger.error(`Error al devolver asignación: ${error.message}`, { error });
      
      if (error.message?.includes('no encontrada') || error.message?.includes('ya devuelta')) {
        res.status(404).json({ 
          success: false,
          message: 'Asignación no encontrada o ya fue devuelta/cancelada'
        });
      } else {
        res.status(500).json({ 
          success: false,
          message: 'Error interno al procesar la devolución'
        });
      }
    }
  };

  /**
   * Cancela una asignación activa
   */
  public cancelAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { assignment_id } = req.params;
      const { motivo } = req.body;
      const usuario_id = req.user?.id;

      if (!usuario_id) {
        logger.error(`Intento de cancelar asignación ${assignment_id} sin usuario autenticado`);
        res.status(401).json({ 
          success: false, 
          message: 'Usuario no autenticado' 
        });
        return;
      }

      if (!assignment_id || isNaN(+assignment_id)) {
        logger.warn(`ID de asignación inválido: ${assignment_id}`);
        res.status(400).json({ 
          success: false,
          message: 'ID de asignación inválido'
        });
        return;
      }

      if (!motivo || motivo.trim().length < 5) {
        logger.warn('Intento de cancelar asignación sin motivo válido');
        res.status(400).json({ 
          success: false,
          message: 'Debe proporcionar un motivo válido para la cancelación (mínimo 5 caracteres)'
        });
        return;
      }

      const result = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_Assignment_Cancel',
        [
          +assignment_id,
          motivo.trim(),
          usuario_id
        ]
      );

      const [data] = result;
      if (data && data.length > 0) {
        const { message } = data[0];
        
        logger.info(`Asignación ${assignment_id} cancelada por usuario ${usuario_id}. Motivo: ${motivo}`);
        
        res.status(200).json({
          success: true,
          message: message || 'Asignación cancelada exitosamente'
        });
      } else {
        logger.error('El SP no devolvió el resultado esperado', { result });
        res.status(500).json({ 
          success: false, 
          message: 'Error al cancelar la asignación: respuesta incompleta del servidor'
        });
      }
    } catch (error: any) {
      logger.error(`Error al cancelar asignación: ${error.message}`, { error });
      
      if (error.message?.includes('no encontrada')) {
        res.status(404).json({ 
          success: false,
          message: 'Asignación no encontrada'
        });
      } else if (error.message?.includes('no está activa')) {
        res.status(409).json({ 
          success: false,
          message: 'No se puede cancelar una asignación que no está activa'
        });
      } else {
        res.status(500).json({ 
          success: false,
          message: 'Error interno al cancelar la asignación'
        });
      }
    }
  };

  /**
   * Obtiene el historial de asignaciones para un ítem de inventario individual
   */
  public getAssignmentHistoryByInventoryItem = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { inventario_id } = req.params;
      
      if (!inventario_id || isNaN(+inventario_id)) {
        logger.warn(`ID de inventario inválido: ${inventario_id}`);
        res.status(400).json({ 
          success: false,
          message: 'ID de inventario inválido'
        });
        return;
      }

      const result = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_Asignaciones_GetByInventarioId',
        [
          +inventario_id
        ]
      );

      logger.info(`Consultado historial de asignaciones para inventario ID ${inventario_id}`);
      
      const [data] = result;
      res.status(200).json({
        success: true,
        data: data || []
      });
    } catch (error: any) {
      logger.error(`Error al obtener historial de asignaciones: ${error.message}`, { error });
      res.status(500).json({ 
        success: false,
        message: 'Error interno al obtener historial de asignaciones'
      });
    }
  };

  /**
   * Obtiene asignaciones activas con filtros opcionales
   */
  public getActiveAssignments = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // Parámetros de filtrado opcional
      const { 
        empleado_id, 
        sector_id, 
        sucursal_id,
        page = '1',
        limit = '10'
      } = req.query;

      // Validación y conversión de parámetros de paginación
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      
      if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1 || limitNum > 100) {
        res.status(400).json({ 
          success: false,
          message: 'Parámetros de paginación inválidos' 
        });
        return;
      }

      // Validación de filtros mutuamente excluyentes
      const filtros = [empleado_id, sector_id, sucursal_id].filter(f => f !== undefined && f !== null);
      if (filtros.length > 1) {
        logger.warn('Intento de filtrar por múltiples destinos simultáneamente');
        res.status(400).json({ 
          success: false,
          message: 'Debe filtrar por un solo tipo de destino (empleado, sector o sucursal)'
        });
        return;
      }

      // Construir filtros SQL dinámicos
      const filtersSqlParts: string[] = ['a.activa = 1'];
      const sqlParams: any[] = [];

      if (empleado_id) {
        filtersSqlParts.push('a.empleado_id = ?');
        sqlParams.push(+empleado_id);
      } else if (sector_id) {
        filtersSqlParts.push('a.sector_id = ?');
        sqlParams.push(+sector_id);
      } else if (sucursal_id) {
        filtersSqlParts.push('a.sucursal_id = ?');
        sqlParams.push(+sucursal_id);
      }

      const filtersSql = filtersSqlParts.join(' AND ');

      // Consulta principal con paginación
      const dataQuery = `
        SELECT
          a.id,
          a.inventario_individual_id,
          a.empleado_id,
          a.sector_id,
          a.sucursal_id,
          ii.numero_serie,
          p.marca,
          p.modelo,
          c.nombre AS categoria_nombre,
          CASE
            WHEN a.empleado_id IS NOT NULL THEN CONCAT(e.nombre, ' ', e.apellido)
            WHEN a.sector_id  IS NOT NULL THEN s.nombre
            WHEN a.sucursal_id IS NOT NULL THEN su.nombre
          END AS destino,
          a.fecha_asignacion,
          e.nombre AS empleado_nombre,
          e.apellido AS empleado_apellido,
          s.nombre AS sector_nombre,
          su.nombre AS sucursal_nombre
        FROM   Asignaciones a
        LEFT   JOIN InventarioIndividual ii ON ii.id = a.inventario_individual_id
        LEFT   JOIN Productos           p ON p.id  = ii.producto_id
        LEFT   JOIN Categorias          c ON c.id  = p.categoria_id
        LEFT   JOIN Empleados           e ON e.id  = a.empleado_id
        LEFT   JOIN Sectores            s ON s.id  = a.sector_id
        LEFT   JOIN Sucursales         su ON su.id = a.sucursal_id
        WHERE  ${filtersSql}
        ORDER BY a.fecha_asignacion DESC
        LIMIT ? OFFSET ?`;

      // Consulta para total de registros
      const countQuery = `
        SELECT COUNT(1) AS total
        FROM   Asignaciones a
        WHERE  ${filtersSql}`;

      const [countResult, dataResult] = await Promise.all([
        this.db.executeQuery(countQuery, sqlParams),
        this.db.executeQuery(dataQuery, [...sqlParams, limitNum, (pageNum - 1) * limitNum])
      ]);

      const [countData] = countResult;
      const [resultData] = dataResult;
      
      const totalRecords = countData?.[0]?.total ?? 0;
      const totalPages = Math.ceil(totalRecords / limitNum);

      // Mapear a estructura alineada con el frontend
      const assignments = resultData.map((row: any) => ({
        id: row.id,
        fecha_asignacion: row.fecha_asignacion,
        inventario_individual_id: row.inventario_individual_id,
        activa: true,
        inventario: {
          numero_serie: row.numero_serie,
          producto: {
            marca: row.marca,
            modelo: row.modelo,
            categoria: {
              nombre: row.categoria_nombre
            }
          }
        },
        empleado: row.empleado_id ? { id: row.empleado_id, nombre: row.empleado_nombre, apellido: row.empleado_apellido } : undefined,
        sector: row.sector_id ? { id: row.sector_id, nombre: row.sector_nombre } : undefined,
        sucursal: row.sucursal_id ? { id: row.sucursal_id, nombre: row.sucursal_nombre } : undefined
      }));

      logger.info(`Consultadas asignaciones activas (query directa) con filtros: ${JSON.stringify({ empleado_id, sector_id, sucursal_id })}`);

      res.status(200).json({
        success: true,
        data: assignments,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalRecords,
          totalPages
        }
      });
    } catch (error: any) {
      logger.error(`Error al obtener asignaciones activas: ${error.message}`, { error });
      res.status(500).json({ 
        success: false,
        message: 'Error interno al obtener asignaciones'
      });
    }
  };

  /**
   * Obtiene los detalles de una asignación específica por ID
   */
  public getAssignmentById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { assignment_id } = req.params;
      
      if (!assignment_id || isNaN(+assignment_id)) {
        logger.warn(`ID de asignación inválido: ${assignment_id}`);
        res.status(400).json({ 
          success: false,
          message: 'ID de asignación inválido'
        });
        return;
      }

      const result = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_Assignment_GetById',
        [
          +assignment_id
        ]
      );

      const [data] = result;
      if (data && data.length > 0) {
        logger.info(`Consultada asignación ID ${assignment_id}`);
        
        res.status(200).json({
          success: true,
          data: data[0]
        });
      } else {
        logger.warn(`No se encontró la asignación con ID ${assignment_id}`);
        
        res.status(404).json({
          success: false,
          message: 'Asignación no encontrada'
        });
      }
    } catch (error: any) {
      logger.error(`Error al obtener asignación por ID: ${error.message}`, { error });
      res.status(500).json({ 
        success: false,
        message: 'Error interno al obtener asignación'
      });
    }
  };

  /**
   * Obtener asignaciones por empleado específico
   * Útil para consultas rápidas del equipo de soporte en la Bóveda de Datos
   */
  public getAssignmentsByEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      
      if (isNaN(employeeId)) {
        logger.warn('ID de empleado inválido en getAssignmentsByEmployee');
        res.status(400).json({
          success: false,
          message: 'ID de empleado inválido'
        });
        return;
      }

      // Usar query directa para obtener asignaciones activas del empleado
      const query = `
        SELECT
          a.id,
          a.inventario_individual_id,
          a.empleado_id,
          a.fecha_asignacion,
          a.password_encriptacion,
          a.cuenta_gmail,
          a.password_gmail,
          a.numero_telefono,
          a.codigo_2fa_whatsapp,
          a.imei_1,
          a.imei_2,
          a.observaciones,
          ii.numero_serie,
          p.marca,
          p.modelo,
          c.nombre AS categoria_nombre,
          e.nombre AS empleado_nombre,
          e.apellido AS empleado_apellido
        FROM   Asignaciones a
        LEFT   JOIN InventarioIndividual ii ON ii.id = a.inventario_individual_id
        LEFT   JOIN Productos           p ON p.id  = ii.producto_id
        LEFT   JOIN Categorias          c ON c.id  = p.categoria_id
        LEFT   JOIN Empleados           e ON e.id  = a.empleado_id
        WHERE  a.empleado_id = ? AND a.activa = 1
        ORDER BY a.fecha_asignacion DESC`;

      const result = await this.db.executeQuery(query, [employeeId]);
      
      const [data] = result;
      
      // Mapear a estructura que incluya datos sensibles
      const assignments = data.map((row: any) => ({
        id: row.id,
        fecha_asignacion: row.fecha_asignacion,
        inventario_individual_id: row.inventario_individual_id,
        activa: true,
        // Datos sensibles para la bóveda
        password_encriptacion: row.password_encriptacion,
        cuenta_gmail: row.cuenta_gmail,
        password_gmail: row.password_gmail,
        numero_telefono: row.numero_telefono,
        codigo_2fa_whatsapp: row.codigo_2fa_whatsapp,
        imei_1: row.imei_1,
        imei_2: row.imei_2,
        observaciones: row.observaciones,
        // Información del activo
        inventario: {
          numero_serie: row.numero_serie,
          producto: {
            marca: row.marca,
            modelo: row.modelo,
            categoria: {
              nombre: row.categoria_nombre
            }
          }
        },
        // Información del empleado
        empleado: {
          id: row.empleado_id,
          nombre: row.empleado_nombre,
          apellido: row.empleado_apellido
        }
      }));

      logger.info(`Consulta de asignaciones por empleado ${employeeId} completada: ${assignments.length} encontradas`);
      
      res.json({
        success: true,
        data: assignments,
        message: `Asignaciones del empleado encontradas: ${assignments.length}`
      });

    } catch (error: any) {
      logger.error(`Error al obtener asignaciones por empleado: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };

  /**
   * Obtiene detalles completos de una asignación específica por su ID, incluyendo datos sensibles.
   */
  public getAssignmentDetailsById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { assignment_id } = req.params;

      if (!assignment_id || isNaN(Number(assignment_id))) {
        res.status(400).json({ success: false, error: 'ID de asignación inválido' });
        return;
      }
      
      const result = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_Assignment_GetDetailsById',
        [
          Number(assignment_id)
        ]
      );
      
      const [data] = result;
      res.json(data);

    } catch (error: any) {
      logger.error('Error en getAssignmentDetailsById', { error });
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  };
}
