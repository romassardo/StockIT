import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth.types'; // Asegúrate que la ruta a auth.types es correcta
import { logger } from '../utils/logger';

/**
 * Middleware para autorizar el acceso basado en roles de usuario.
 * @param allowedRoles Array de strings que representan los roles permitidos para acceder a la ruta.
 * @returns Una función de middleware de Express.
 */
export const authorizeRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Primero, verificar si el usuario está autenticado y tiene un rol
    if (!req.user || !req.user.rol) {
      logger.warn(`Intento de acceso no autorizado (sin rol definido) a ruta protegida por rol. Path: ${req.path}`);
      return res.status(403).json({ 
        success: false, 
        message: 'Acceso denegado. Rol de usuario no definido o usuario no autenticado.' 
      });
    }

    // Verificar si el rol del usuario está en la lista de roles permitidos
    const userRole = req.user.rol;
    if (allowedRoles.includes(userRole)) {
      // El usuario tiene un rol permitido, continuar con la siguiente función en la cadena de middleware
      logger.debug(`Usuario con rol '${userRole}' autorizado para acceder a ${req.path}`);
      next();
    } else {
      // El usuario no tiene un rol permitido
      logger.warn(`Intento de acceso denegado para usuario con rol '${userRole}' a ruta ${req.path}. Roles permitidos: ${allowedRoles.join(', ')}`);
      return res.status(403).json({ 
        success: false, 
        message: 'Acceso denegado. No tienes los permisos necesarios para realizar esta acción.' 
      });
    }
  };
};
