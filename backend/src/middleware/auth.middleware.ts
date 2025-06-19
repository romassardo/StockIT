import { type Response, type NextFunction, type Request } from 'express';
import jwt from 'jsonwebtoken';
import { logger, securityLog } from '../utils/logger';
import { type UserJwtPayload, type Permission, type Resource, UserRole } from '../types/auth.types';
import { JWT_SECRET, JWT_AUDIENCE, JWT_ISSUER, JWT_VERIFY_OPTIONS } from '../config/jwt.config';
import { hasPermission, getRolePermissions } from '../config/permissions.config';

/**
 * Middleware para verificar el token JWT
 * Valida que el token sea válido y añade la información del usuario a la solicitud
 */
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): Response | void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn(`[AUTH_MIDDLEWARE] Token no proporcionado o con formato incorrecto. IP: ${req.ip}`);

    return res.status(401).json({ success: false, message: 'No autenticado: Token no proporcionado o formato incorrecto' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    logger.warn(`[AUTH_MIDDLEWARE] Token vacío después de split. IP: ${req.ip}`);

    return res.status(401).json({ success: false, message: 'No autenticado: Token vacío' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, JWT_VERIFY_OPTIONS) as UserJwtPayload;
    logger.info(`[AUTH_MIDDLEWARE] Token verificado exitosamente. Payload decodificado: ${JSON.stringify(decoded)}`);
    req.user = decoded;
    logger.info(`[AUTH_MIDDLEWARE] Acceso autorizado para usuario ID: ${decoded.id}, Email: ${decoded.email}. IP: ${req.ip}, Ruta: ${req.originalUrl}`);

    next();
  } catch (error: any) {
    logger.error(`[AUTH_MIDDLEWARE] Error al verificar el token: ${error.name} - ${error.message}. Token problemático (inicio): ${token ? token.substring(0,15)+ '...' : 'N/A'}. IP: ${req.ip}`);

    
    let status = 401;
    let message = 'No autenticado: Token inválido';

    if (error.name === 'TokenExpiredError') {
        message = 'No autenticado: Token expirado';
        status = 401; 
    } else if (error.name === 'JsonWebTokenError') {
        message = `No autenticado: Error en el token (${error.message})`;
    } else if (error.name === 'NotBeforeError') {
        message = 'No autenticado: Token aún no activo';
    }
    
    logger.error(`[AUTH_MIDDLEWARE_FAIL_DETAIL] JWT_SECRET usado (inicio): ${JWT_SECRET ? JWT_SECRET.substring(0, 10) + '...' : 'NO DEFINIDO'}`);
    logger.error(`[AUTH_MIDDLEWARE_FAIL_DETAIL] Token problemático (inicio): ${token ? token.substring(0,15)+ '...' : 'N/A'}`);

    return res.status(status).json({ success: false, message });
  }
};

/**
 * Middleware para verificar si el usuario tiene el rol requerido
 * @param roles Array de roles permitidos
 */
export const authorizeRoles = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    // Verificar que el usuario existe en la solicitud (ya pasó por authenticateToken)
    if (req.user == null) {
      logger.warn(`Intento de acceso sin autenticación previa a ${req.originalUrl}`);
      res.status(401).json({
        error: 'No autorizado',
        message: 'Se requiere autenticación'
      });
      return;
    }


    if (roles.includes(req.user.rol)) {
      next();
    } else {
      logger.warn(`Acceso denegado: Usuario ID ${req.user.id} con rol ${req.user.rol} intentó acceder a ${req.originalUrl}. Roles permitidos: ${roles.join(', ')}`);
      res.status(403).json({
        error: 'Prohibido',
        message: 'No tienes los permisos necesarios para acceder a este recurso'
      });
    }
  };
};

/**
 * Middleware para verificar si el usuario tiene un permiso específico para un recurso
 * @param resource Recurso al que se quiere acceder
 * @param permission Permiso necesario para acceder al recurso
 */
export const authorizePermission = (resource: Resource, permission: Permission) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    // Verificar que el usuario existe en la solicitud (ya pasó por authenticateToken)
    if (req.user == null) {
      logger.warn(`Intento de acceso sin autenticación previa a recurso ${resource}`);
      res.status(401).json({
        error: 'No autorizado',
        message: 'Se requiere autenticación'
      });
      return;
    }


    const userHasPermission = hasPermission(req.user.rol, resource, permission);

    if (userHasPermission) {
      next();
    } else {
      logger.warn(`Permiso denegado: Usuario ID ${req.user.id} con rol ${req.user.rol} intentó ${permission} en ${resource}`);
      res.status(403).json({
        error: 'Prohibido',
        message: `No tienes permiso para ${permission} en ${resource}`
      });
    }
  };
};

/**
 * Middleware para verificar si el usuario tiene múltiples permisos (uno de cada)
 * @param permissions Array de objetos con recurso y permiso
 */
export const authorizeMultiplePermissions = (permissions: Array<{ resource: Resource, permission: Permission }>) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    // Verificar que el usuario existe en la solicitud (ya pasó por authenticateToken)
    if (req.user == null) {
      logger.warn(`Intento de acceso sin autenticación previa a múltiples recursos`);
      res.status(401).json({
        error: 'No autorizado',
        message: 'Se requiere autenticación'
      });
      return;
    }


    const missingPermissions = permissions.filter(
      ({ resource, permission }) => !hasPermission(req.user!.rol, resource, permission)
    );

    if (missingPermissions.length === 0) {
      next();
    } else {
      const missingDetails = missingPermissions
        .map(p => `${p.permission} en ${p.resource}`)
        .join(', ');

      logger.warn(`Permisos múltiples denegados: Usuario ID ${req.user.id} con rol ${req.user.rol}. Falta: ${missingDetails}`);
      res.status(403).json({
        error: 'Prohibido',
        message: `No tienes los permisos necesarios: ${missingDetails}`
      });
    }
  };
};

/**
 * Middleware para verificar si el usuario es propietario del recurso o tiene un rol específico
 * Útil para permitir que los usuarios modifiquen sus propios recursos
 * @param idExtractor Función que extrae el ID del propietario desde el request
 * @param adminRoles Roles que pueden acceder al recurso independientemente de la propiedad
 */
export const authorizeOwnerOrRole = (
  idExtractor: (req: AuthRequest) => number | null,
  adminRoles: UserRole[] = [UserRole.ADMIN]
) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    // Verificar que el usuario existe en la solicitud (ya pasó por authenticateToken)
    if (req.user == null) {
      logger.warn(`Intento de acceso sin autenticación previa a recurso protegido por propiedad`);
      res.status(401).json({
        error: 'No autorizado',
        message: 'Se requiere autenticación'
      });
      return;
    }


    if (adminRoles.includes(req.user.rol as UserRole)) {
      next();
      return;
    }


    const ownerId = idExtractor(req);


    if (ownerId === null || ownerId !== req.user.id) {
      logger.warn(`Acceso denegado a recurso protegido: Usuario ID ${req.user.id} intentó acceder a recurso de usuario ID ${ownerId}`);
      res.status(403).json({
        error: 'Prohibido',
        message: 'No tienes permiso para acceder a este recurso'
      });
      return;
    }


    next();
  };
};

/**
 * Alias para authorizeRoles para mantener la consistencia con la documentación del proyecto.
 */
export const requireRole = authorizeRoles;

// Tipos locales que pueden ser exportados si son necesarios en otros módulos
export interface AuthRequest extends Request {
  user?: UserJwtPayload;
}
