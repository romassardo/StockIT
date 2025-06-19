import * as winston from 'winston';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
// Importamos explícitamente el módulo para evitar problemas de tipos
const DailyRotateFile = require('winston-daily-rotate-file');

// Aseguramos que existe el directorio de logs
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Obtenemos las funciones de formato
const formatUtils = winston.format || {};
const combine = formatUtils.combine || ((formats: any) => formats);
const timestamp = formatUtils.timestamp || ((opts: any) => opts);
const printf = formatUtils.printf || ((template: any) => template);
const colorize = formatUtils.colorize || (() => {});

// Formato personalizado para los logs
const logFormat = printf((info: any) => {
  const { level, message, timestamp, ...meta } = info;
  const metaString = (Object.keys(meta).length > 0) ? JSON.stringify(meta) : '';
  return `[${timestamp}] ${level}: ${message} ${metaString}`;
});

// Configuramos formatos

// Configuramos transporte para rotación diaria de logs
const fileRotateTransport = new DailyRotateFile({
  filename: path.join(logDir, 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',   // Mantener logs por 14 días
  maxSize: '20m',    // Tamaño máximo por archivo: 20MB
  zippedArchive: true // Comprimir archivos antiguos
});

// Configuramos transporte para errores con rotación diaria
const errorRotateTransport = new DailyRotateFile({
  filename: path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxFiles: '30d',    // Mantener logs de errores por 30 días
  maxSize: '20m',
  zippedArchive: true
});

// Creamos el logger
export const logger = (winston.createLogger || (() => winston))({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // Transporte para rotación diaria de todos los logs
    fileRotateTransport,
    // Transporte para rotación diaria de errores
    errorRotateTransport
  ],
  // Control de excepciones no manejadas
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      zippedArchive: true
    })
  ]
});

// Si no estamos en producción, también mostramos logs en la consola
if (process.env.NODE_ENV !== 'production') {
  logger.add(new (winston.transports.Console as any)({
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      logFormat
    )
  }));
}

/**
 * Función para log de auditoría (cambios en inventario, asignaciones, etc.)
 * Esta función registra acciones críticas que requieren seguimiento detallado para fines
 * de auditoría y cumplimiento normativo
 * 
 * @param userId ID del usuario que realiza la acción
 * @param action Acción realizada (crear, modificar, eliminar, asignar, etc.)
 * @param entityType Tipo de entidad afectada (Inventario, Producto, Asignación, etc.)
 * @param entityId ID de la entidad afectada, puede ser null para acciones generales
 * @param details Detalles adicionales de la acción (cambios específicos, etc.)
 * @param metadata Información adicional opcional (IP, navegador, etc.)
 */
export const auditLog = (
  userId: number,
  action: string,
  entityType: string,
  entityId: number | null,
  details: any,
  metadata?: Record<string, any>
): void => {
  // Crear un identificador único para la acción de auditoría
  const auditId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  
  // Registrar con nivel específico para auditoría (fácil filtrado)
  logger.log({
    level: 'info',
    message: `AUDITORÍA: ${action} en ${entityType}${entityId ? ` #${entityId}` : ''}`,
    userId,
    auditId,
    entityType,
    entityId,
    action,
    details,
    metadata,
    timestamp: new Date().toISOString(),
    category: 'AUDIT'
  });

  // Si tenemos integración con base de datos, también guardamos allí
  // Esto se implementará en una tarea posterior cuando tengamos la tabla LogAuditoria lista
};

/**
 * Función para registrar acciones relacionadas con seguridad
 * Útil para intentos de login, cambios de permisos, etc.
 * 
 * @param userId ID del usuario relacionado con el evento de seguridad
 * @param action Tipo de acción de seguridad
 * @param success Indica si la acción fue exitosa
 * @param details Detalles adicionales
 * @param metadata Información adicional (IP, navegador, etc.)
 */
export const securityLog = (
  userId: number | null,
  action: string,
  success: boolean,
  details: any,
  metadata?: Record<string, any>
): void => {
  const level = success ? 'info' : 'warn';
  
  logger.log({
    level,
    message: `SEGURIDAD: ${action} - ${success ? 'Exitoso' : 'Fallido'}`,
    userId,
    action,
    success,
    details,
    metadata,
    timestamp: new Date().toISOString(),
    category: 'SECURITY'
  });
};
