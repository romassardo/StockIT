import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { DatabaseConnection } from '../utils/database';
import { logger } from '../utils/logger';
import {
  JWT_SECRET, JWT_OPTIONS, JWT_REFRESH_SECRET, JWT_REFRESH_OPTIONS, JWT_EXPIRATION, JWT_REFRESH_EXPIRATION
} from '../config/jwt.config';
import { AuthRequest, UserJwtPayload } from '../types/auth.types';
import mysql from 'mysql2/promise';

interface DatabaseUser {
  id: number;
  nombre: string;
  email: string;
  password_hash: string;
  rol: string;
  activo: boolean;
}

export class AuthController {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
    logger.info('AuthController inicializado con lógica real.');
  }

  private async logSecurityEvent(userId: number | null, operacion: string, ipAddress: string | undefined, tableName: string, recordId: number | null, description: string, userAgent: string | undefined) {
    // Log de seguridad simplificado usando logger (no SP)
    logger.info(`Evento de seguridad: ${operacion}`, {
      userId: userId || 'N/A',
      tableName,
      recordId,
      description,
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown'
    });
  }

  public login = async (req: Request, res: Response): Promise<void> => {

    const { email, password } = req.body;
    const ipAddress = req.ip;

    if (!email || !password) {
      logger.warn(`Intento de login con datos incompletos (falta email o password) desde IP: ${ipAddress}`);
      res.status(400).json({ success: false, message: 'Email y contraseña son requeridos' });
      return;
    }

    try {
      const [results] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>('sp_User_GetByEmail', [email]);

      // Los SPs de MySQL devuelven [userRows, metadata], necesitamos acceder al primer elemento
      const userRows = results[0] as mysql.RowDataPacket[];
      
      if (!userRows || userRows.length === 0) {
        logger.warn(`Login fallido: Usuario con email ${email} no encontrado. IP: ${ipAddress}`);
        await this.logSecurityEvent(null, 'LOGIN_FAIL_NOT_FOUND', ipAddress, 'Usuarios', null, `Intento de login para usuario con email no existente: ${email}`, req.headers['user-agent']);
        res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        return;
      }

      const user: DatabaseUser = userRows[0] as DatabaseUser;

      if (!user.activo) {
        logger.warn(`Login fallido: Usuario con email ${email} inactivo. IP: ${ipAddress}`);
        await this.logSecurityEvent(user.id, 'LOGIN_FAIL_INACTIVE', ipAddress, 'Usuarios', user.id, `Intento de login para usuario con email inactivo: ${email}`, req.headers['user-agent']);
        res.status(401).json({ success: false, message: 'Usuario inactivo' });
        return;
      }

      const passwordIsValid = await bcrypt.compare(password, user.password_hash);
      if (!passwordIsValid) {
        logger.warn(`Login fallido: Contraseña incorrecta para email ${email}. IP: ${ipAddress}`);
        await this.logSecurityEvent(user.id, 'LOGIN_FAIL_PASSWORD', ipAddress, 'Usuarios', user.id, `Intento de login con contraseña incorrecta para email: ${email}`, req.headers['user-agent']);
        res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        return;
      }

      const payload: UserJwtPayload = {
        id: user.id,
        nombre_usuario: user.nombre, // Corregido: usa user.nombre como fuente
        email: user.email,
        rol: user.rol,
      };

      const accessToken = jwt.sign(payload, JWT_SECRET, JWT_OPTIONS);
      const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, JWT_REFRESH_OPTIONS);

      // Actualizar ultimo_acceso del usuario
      await this.db.executeQuery('UPDATE Usuarios SET ultimo_acceso = NOW() WHERE id = ?', [user.id]);

      await this.logSecurityEvent(user.id, 'LOGIN_SUCCESS', ipAddress, 'Usuarios', user.id, `Login exitoso para email: ${email}`, req.headers['user-agent']);
      logger.info(`Login exitoso para email ${email}. IP: ${ipAddress}`);

      res.status(200).json({
        success: true,
        accessToken,
        refreshToken,
        expiresIn: JWT_EXPIRATION,
        refreshExpiresIn: JWT_REFRESH_EXPIRATION,
        user: {
          id: user.id,
          nombre_usuario: user.nombre,
          email: user.email,
          rol: user.rol,
        },
      });
    } catch (error) {
      const err = error as Error;
      logger.error(`Error en login para email ${email}: ${err.message}. IP: ${ipAddress}`);
      await this.logSecurityEvent(null, 'LOGIN_ERROR_SERVER', ipAddress, 'Usuarios', null, `Error en servidor durante login para email ${email}: ${err.message}`, req.headers['user-agent']);
      res.status(500).json({ success: false, message: 'Error en el servidor durante el login' });
    }
  };

  public refreshToken = async (req: AuthRequest, res: Response): Promise<void> => {
    const { token: oldRefreshToken } = req.body;
    const ipAddress = req.ip;

    if (!oldRefreshToken) {
      res.status(400).json({ success: false, message: 'Refresh token es requerido' });
      return;
    }

    try {
      const decoded = jwt.verify(oldRefreshToken, JWT_REFRESH_SECRET, { algorithms: [JWT_REFRESH_OPTIONS.algorithm!] }) as unknown as { id: number };
      const userId = decoded.id;

      const [userResults] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>('sp_User_Get', [decoded.id]);

      // Los SPs de MySQL devuelven [userRows, metadata], necesitamos acceder al primer elemento
      const userRows = userResults[0] as mysql.RowDataPacket[];
      
      if (!userRows || userRows.length === 0) {
        logger.warn(`Refresh token: Usuario ID ${userId} no encontrado. IP: ${ipAddress}`);
        res.status(401).json({ success: false, message: 'Refresh token inválido o usuario no encontrado' });
        return;
      }

      const user: { id: number; nombre: string; email: string; rol: string; activo: boolean } = userRows[0] as any;
      if (!user.activo) {
        logger.warn(`Refresh token: Usuario ID ${userId} inactivo. IP: ${ipAddress}`);
        res.status(401).json({ success: false, message: 'Usuario inactivo' });
        return;
      }

      const payload: UserJwtPayload = {
        id: user.id,
        nombre_usuario: user.nombre, // Corregido: usa user.nombre como fuente
        email: user.email,
        rol: user.rol,
      };

      const newAccessToken = jwt.sign(payload, JWT_SECRET, JWT_OPTIONS);

      logger.info(`Access token refrescado para usuario ID ${userId}. IP: ${ipAddress}`);
      res.status(200).json({
        success: true,
        accessToken: newAccessToken,
        expiresIn: JWT_EXPIRATION,
      });
    } catch (error) {
      const err = error as Error;
      logger.warn(`Error al refrescar token: ${err.message}. IP: ${ipAddress}`);
      if (err.name === 'TokenExpiredError') {
        logger.warn(`Refresh token expirado. IP: ${ipAddress}`);
        res.status(401).json({ success: false, message: 'Refresh token expirado. Por favor, inicie sesión de nuevo.' });
        return;
      } else if (err.name === 'JsonWebTokenError' || err.name === 'NotBeforeError') {
        logger.warn(`Refresh token inválido. IP: ${ipAddress}, Error: ${err.message}`);
        res.status(403).json({ success: false, message: 'Refresh token inválido.' });
        return;
      } else {
        res.status(500).json({ success: false, message: 'Error en el servidor al refrescar token' });
        return;
      }
    }
  };

  public changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      // Esto no debería ocurrir si el middleware authenticateToken funciona
      res.status(401).json({ success: false, message: 'No autenticado' });
      return;
    }

    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    const ipAddress = req.ip;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Contraseña actual y nueva son requeridas' });
      return;
    }

    if (newPassword.length < 8) {
        res.status(400).json({ success: false, message: 'La nueva contraseña debe tener al menos 8 caracteres.' });
        return;
    }

    try {
      // Obtener el usuario actual
      const [userResults] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>('sp_User_Get', [userId]);

      // Los SPs de MySQL devuelven [userRows, metadata], necesitamos acceder al primer elemento
      const userRows = userResults[0] as mysql.RowDataPacket[];
      
      if (!userRows || userRows.length === 0) {
        logger.warn(`Cambio de contraseña: Usuario ID ${userId} no encontrado. IP: ${ipAddress}`);
        res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        return;
      }

      const user: DatabaseUser = userRows[0] as DatabaseUser;

      // Verificar contraseña actual
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isCurrentPasswordValid) {
        logger.warn(`Cambio de contraseña fallido: Contraseña actual incorrecta para usuario ID ${userId}. IP: ${ipAddress}`);
        await this.logSecurityEvent(userId, 'CHANGE_PASSWORD_FAIL_CURRENT', ipAddress, 'Usuarios', userId, `Intento de cambio de contraseña con contraseña actual incorrecta`, req.headers['user-agent']);
        res.status(401).json({ success: false, message: 'Contraseña actual incorrecta' });
        return;
      }

      // Hashear nueva contraseña
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Actualizar contraseña en la base de datos
      const [updateResults] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>('sp_User_ChangePassword', [userId, hashedNewPassword]);

      await this.logSecurityEvent(userId, 'CHANGE_PASSWORD_SUCCESS', ipAddress, 'Usuarios', userId, `Contraseña cambiada exitosamente`, req.headers['user-agent']);
      logger.info(`Contraseña cambiada exitosamente para usuario ID ${userId}. IP: ${ipAddress}`);

      res.status(200).json({
        success: true,
        message: 'Contraseña actualizada correctamente'
      });
    } catch (error) {
      const err = error as Error;
      logger.error(`Error al cambiar contraseña para usuario ID ${userId}: ${err.message}. IP: ${ipAddress}`);
      await this.logSecurityEvent(userId, 'CHANGE_PASSWORD_ERROR_SERVER', ipAddress, 'Usuarios', userId, `Error en servidor durante cambio de contraseña: ${err.message}`, req.headers['user-agent']);
      res.status(500).json({ success: false, message: 'Error en el servidor al cambiar contraseña' });
    }
  };

  public getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'No autenticado' });
      return;
    }

    try {
      const [userResults] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>('sp_User_Get', [req.user.id]);

      // Los SPs de MySQL devuelven [userRows, metadata], necesitamos acceder al primer elemento
      const userRows = userResults[0] as mysql.RowDataPacket[];
      
      if (!userRows || userRows.length === 0) {
        res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        return;
      }

      const user: DatabaseUser = userRows[0] as DatabaseUser;
      res.status(200).json({
        success: true,
        user: {
          id: user.id,
          nombre_usuario: user.nombre,
          email: user.email,
          rol: user.rol,
        }
      });
    } catch (error) {
      const err = error as Error;
      logger.error(`Error al obtener perfil: ${err.message}`);
      res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
  };

  public validateToken = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Token inválido' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Token válido',
      user: {
        id: req.user.id,
        nombre_usuario: req.user.nombre_usuario,
        email: req.user.email,
        rol: req.user.rol,
      }
    });
  };
}
