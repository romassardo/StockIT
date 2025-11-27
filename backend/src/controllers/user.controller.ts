import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
import { DatabaseConnection } from '../utils/database';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

export class UserController {
  private db = DatabaseConnection.getInstance();

  public getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { 
        page = '1',
        pageSize = '25',
        search = '',
        rol = '',
        activo = ''
      } = req.query;

      const result = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_User_GetAll',
        [
          parseInt(page as string),
          parseInt(pageSize as string),
          search as string,
          rol as string,
          activo ? activo === 'true' : null
        ]
      );

      // MySQL devuelve [[rows], OkPacket] para SPs, así que tomamos el primer array
      const rawResult = result[0];
      const users = Array.isArray(rawResult[0]) ? rawResult[0] : rawResult;
      const totalItems = users.length > 0 ? users[0]?.TotalRecords || users.length : 0;
      const totalPages = Math.ceil(totalItems / parseInt(pageSize as string));

      res.json({
        success: true,
        data: {
          data: users,
          totalItems,
          totalPages,
          currentPage: parseInt(page as string)
        }
      });

    } catch (error) {
      logger.error('Error obteniendo usuarios:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  public getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = parseInt(id);

      if (isNaN(userId)) {
        res.status(400).json({ error: 'ID de usuario inválido' });
        return;
      }

      const result = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_User_Get',
        [userId]
      );

      const [data] = result;
      if (!data || data.length === 0) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      res.json({
        success: true,
        data: data[0]
      });

    } catch (error) {
      logger.error('Error obteniendo usuario:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  public getStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const result = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_User_GetStats',
        []
      );

      // MySQL devuelve [[rows], OkPacket] para SPs
      const rawData = result[0];
      const data = Array.isArray(rawData[0]) ? rawData[0] : rawData;
      const stats = data[0] || {
        total: 0,
        admins: 0,
        usuarios: 0,
        activos: 0,
        inactivos: 0
      };

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Error obteniendo estadísticas de usuarios:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  public validateEmail = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { email, excludeId } = req.query;

      if (!email) {
        res.status(400).json({ error: 'Email es requerido' });
        return;
      }

      const result = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_User_ValidateEmail',
        [
          email as string,
          excludeId ? parseInt(excludeId as string) : null
        ]
      );

      // MySQL devuelve [[rows], OkPacket] para SPs
      const rawData = result[0];
      const data = Array.isArray(rawData[0]) ? rawData[0] : rawData;
      const available = data[0]?.available || false;

      res.json({
        success: true,
        data: { available }
      });

    } catch (error) {
      logger.error('Error validando email:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  public createUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { nombre, email, password, rol, activo = true } = req.body;

      // Validaciones
      if (!nombre || !email || !password || !rol) {
        res.status(400).json({ error: 'Todos los campos son requeridos' });
        return;
      }

      if (!['admin', 'usuario'].includes(rol)) {
        res.status(400).json({ error: 'Rol inválido' });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        return;
      }

      // Hash contraseña
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const result = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_User_Create',
        [
          nombre,
          email,
          passwordHash,
          rol,
          activo,
          req.user!.id
        ]
      );

      logger.info(`Usuario ${nombre} creado por ${req.user!.username}`);

      const [data] = result;
      res.status(201).json({
        success: true,
        data: data[0]
      });

    } catch (error) {
      logger.error('Error creando usuario:', error);
      
      if ((error as Error).message?.includes('email ya existe')) {
        res.status(409).json({ error: 'El email ya está registrado' });
      } else {
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  };

  public updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { nombre, email, rol, activo, password } = req.body;
      const userId = parseInt(id);

      if (isNaN(userId)) {
        res.status(400).json({ error: 'ID de usuario inválido' });
        return;
      }

      // Validaciones
      if (nombre && !nombre.trim()) {
        res.status(400).json({ error: 'El nombre no puede estar vacío' });
        return;
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        res.status(400).json({ error: 'El formato del email no es válido' });
        return;
      }

      if (rol && !['admin', 'usuario'].includes(rol)) {
        res.status(400).json({ error: 'Rol inválido' });
        return;
      }

      if (password && password.length < 6) {
        res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        return;
      }

      // Hash contraseña si se proporciona
      let passwordHash = null;
      if (password) {
        const saltRounds = 12;
        passwordHash = await bcrypt.hash(password, saltRounds);
      }

      const result = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_User_Update',
        [
          userId,
          nombre || null,
          email || null,
          passwordHash,
          rol || null,
          activo !== undefined ? activo : null,
          req.user!.id
        ]
      );

      logger.info(`Usuario ${userId} actualizado por ${req.user!.username}`);

      const [data] = result;
      res.json({
        success: true,
        data: data[0]
      });

    } catch (error) {
      logger.error('Error actualizando usuario:', error);
      
      if ((error as Error).message?.includes('no encontrado')) {
        res.status(404).json({ error: 'Usuario no encontrado' });
      } else if ((error as Error).message?.includes('email ya existe')) {
        res.status(409).json({ error: 'El email ya está registrado' });
      } else {
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  };

  public toggleUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = parseInt(id);

      if (isNaN(userId)) {
        res.status(400).json({ error: 'ID de usuario inválido' });
        return;
      }

      // No permitir desactivar el propio usuario
      if (userId === req.user!.id) {
        res.status(400).json({ error: 'No puedes desactivar tu propio usuario' });
        return;
      }

      const result = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_User_ToggleActive',
        [
          userId,
          req.user!.id
        ]
      );

      logger.info(`Estado de usuario ${userId} cambiado por ${req.user!.username}`);

      const [data] = result;
      res.json({ 
        success: true, 
        message: 'Estado actualizado exitosamente',
        data: data[0]
      });

    } catch (error) {
      logger.error('Error cambiando estado usuario:', error);
      
      if ((error as Error).message?.includes('no encontrado')) {
        res.status(404).json({ error: 'Usuario no encontrado' });
      } else {
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  };

  public changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;
      const userId = parseInt(id);

      if (isNaN(userId)) {
        res.status(400).json({ error: 'ID de usuario inválido' });
        return;
      }

      if (!currentPassword || !newPassword) {
        res.status(400).json({ error: 'Contraseña actual y nueva son requeridas' });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
        return;
      }

      // Obtener usuario actual
      const userResult = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_User_Get',
        [userId]
      );

      const [userData] = userResult;
      if (!userData || userData.length === 0) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      const user = userData[0];

      // Verificar contraseña actual
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isCurrentPasswordValid) {
        res.status(400).json({ error: 'La contraseña actual es incorrecta' });
        return;
      }

      // Hash nueva contraseña
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      await this.db.executeStoredProcedure(
        'sp_User_ChangePassword',
        [
          userId,
          newPasswordHash,
          req.user!.id
        ]
      );

      logger.info(`Contraseña cambiada para usuario ${userId} por ${req.user!.username}`);

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });

    } catch (error) {
      logger.error('Error cambiando contraseña:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
}