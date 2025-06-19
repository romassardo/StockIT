import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AuthRequest } from '../types/auth.types';

/**
 * Middleware para registrar detalles de cada solicitud HTTP
 * @param req Objeto de solicitud Express
 * @param res Objeto de respuesta Express
 * @param next Función para continuar al siguiente middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Capturar tiempo de inicio
  const start = Date.now();
  
  // Registrar la solicitud
  logger.info(`SOLICITUD: ${req.method} ${req.url}`, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent') || 'Desconocido',
    body: sanitizeRequestBody(req.body),
    query: req.query,
    params: req.params
  });

  // Guardar tiempo original de envío
  const originalSend = res.send;
  
  // Sobrescribir función send para capturar respuesta
  res.send = function(body): Response {
    const duration = Date.now() - start;
    const size = body ? Buffer.from(body).length : 0;
    
    // Registrar la respuesta
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    logger[logLevel](`RESPUESTA: ${req.method} ${req.url} ${res.statusCode} - ${duration}ms - ${size} bytes`);
    
    // Restaurar y llamar a la función send original
    res.send = originalSend;
    return originalSend.call(this, body);
  };
  
  next();
};

/**
 * Función para sanear datos sensibles en el cuerpo de la solicitud
 * @param body Cuerpo de la solicitud
 * @returns Cuerpo saneado para el log
 */
function sanitizeRequestBody(body: any): any {
  if (!body) return {};
  
  // Crear una copia para no modificar el original
  const sanitized = { ...body };
  
  // Lista de campos sensibles a ocultar
  const sensitiveFields = ['password', 'contraseña', 'password_hash', 'token', 'secret', 'creditCard', 'tarjeta'];
  
  // Reemplazar valores de campos sensibles
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '******';
    }
  }
  
  return sanitized;
}

/**
 * Middleware para registrar errores
 * @param err Error ocurrido
 * @param req Objeto de solicitud Express con información de usuario
 * @param res Objeto de respuesta Express
 * @param next Función para continuar al siguiente middleware
 */
export const errorLogger = (err: any, req: AuthRequest, res: Response, next: NextFunction): void => {
  logger.error(`ERROR: ${req.method} ${req.url} - ${err.message}`, {
    method: req.method,
    url: req.url,
    error: {
      message: err.message,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
      code: err.code || 'UNKNOWN',
      status: err.status || 500
    },
    user: req.user ? { id: req.user.id, role: req.user.role } : undefined
  });
  
  next(err);
};
