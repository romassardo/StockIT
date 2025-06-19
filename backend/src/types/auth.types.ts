import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

/**
 * Definición de roles disponibles en el sistema
 */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'usuario' // Roles según proyecto-inventario-it.md
}

/**
 * Definición de los recursos del sistema
 */
export enum Resource {
  USUARIOS = 'usuarios',
  PRODUCTOS = 'productos',
  CATEGORIAS = 'categorias',
  INVENTARIO = 'inventario',
  ASIGNACIONES = 'asignaciones',
  REPARACIONES = 'reparaciones',
  REPORTES = 'reportes'
}

/**
 * Definición de operaciones posibles sobre recursos
 */
export enum Permission {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  ASSIGN = 'assign',
  REPAIR = 'repair',
  APPROVE = 'approve'
}

/**
 * Interfaz que extiende JwtPayload para definir la estructura del payload de nuestros tokens
 */
export interface UserJwtPayload extends JwtPayload {
  id: number;
  email: string;
  nombre_usuario: string; // Cambiado de 'nombre' para consistencia
  rol: string; // Rol del usuario para autorización
}

/**
 * Interfaz para las solicitudes autenticadas, extiende Request de Express
 * y añade la propiedad 'user' que contendrá el payload del JWT decodificado.
 */
export interface AuthRequest extends Request {
  user?: UserJwtPayload;
}

/**
 * Interfaz para la respuesta del token de autenticación
 */
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string | number; // Puede ser string como '15m' o número en segundos
  userId: number;
  nombre_usuario: string; // Cambiado de 'nombre' para consistencia
  rol: string;
}
