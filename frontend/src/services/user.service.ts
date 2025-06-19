import api from './api';
import type { SystemUser, PaginatedResponse, ApiResponse } from '../types';

export interface UserCreateData {
  nombre: string;
  email: string;
  password: string;
  rol: 'admin' | 'usuario';
  activo?: boolean;
}

export interface UserUpdateData {
  nombre?: string;
  email?: string;
  rol?: 'admin' | 'usuario';
  activo?: boolean;
  password?: string;
}

export interface UserFilters {
  search?: string;
  rol?: string;
  activo?: boolean;
}

export interface UserListParams {
  page?: number;
  pageSize?: number;
  filters?: UserFilters;
}

export interface UserStats {
  total: number;
  admins: number;
  usuarios: number;
  activos: number;
  inactivos: number;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

class UserService {
  private baseUrl = '/users';

  /**
   * Obtener todos los usuarios con paginación y filtros
   */
  async getAll(params: UserListParams = {}): Promise<PaginatedResponse<SystemUser>> {
    const { page = 1, pageSize = 25, filters = {} } = params;
    
    const queryParams = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(filters.search && { search: filters.search }),
      ...(filters.rol && { rol: filters.rol }),
      ...(filters.activo !== undefined && { activo: filters.activo.toString() })
    });

    const response = await api.get<PaginatedResponse<SystemUser>>(
      `${this.baseUrl}?${queryParams}`
    );
    
    return response.data;
  }

  /**
   * Obtener usuario por ID
   */
  async getById(id: number): Promise<SystemUser> {
    const response = await api.get<ApiResponse<SystemUser>>(`${this.baseUrl}/${id}`);
    return response.data.data;
  }

  /**
   * Crear nuevo usuario
   */
  async create(userData: UserCreateData): Promise<SystemUser> {
    const response = await api.post<ApiResponse<SystemUser>>(this.baseUrl, userData);
    return response.data.data;
  }

  /**
   * Actualizar usuario existente
   */
  async update(id: number, userData: UserUpdateData): Promise<SystemUser> {
    const response = await api.put<ApiResponse<SystemUser>>(`${this.baseUrl}/${id}`, userData);
    return response.data.data;
  }

  /**
   * Cambiar estado activo/inactivo del usuario
   */
  async toggleActive(id: number): Promise<SystemUser> {
    const response = await api.patch<ApiResponse<SystemUser>>(`${this.baseUrl}/${id}/toggle-active`);
    return response.data.data;
  }

  /**
   * Cambiar contraseña de usuario
   */
  async changePassword(id: number, passwordData: PasswordChangeData): Promise<void> {
    await api.post(`${this.baseUrl}/${id}/change-password`, passwordData);
  }

  /**
   * Obtener estadísticas de usuarios
   */
  async getStats(): Promise<UserStats> {
    const response = await api.get<ApiResponse<UserStats>>(`${this.baseUrl}/stats`);
    return response.data.data;
  }

  /**
   * Validar disponibilidad de email
   */
  async validateEmail(email: string, excludeId?: number): Promise<boolean> {
    const queryParams = new URLSearchParams({
      email,
      ...(excludeId && { excludeId: excludeId.toString() })
    });

    const response = await api.get<ApiResponse<{ available: boolean }>>(
      `${this.baseUrl}/validate-email?${queryParams}`
    );
    
    return response.data.data.available;
  }

  /**
   * Buscar usuarios por término
   */
  async search(searchTerm: string, limit: number = 10): Promise<SystemUser[]> {
    const response = await this.getAll({
      pageSize: limit,
      filters: { search: searchTerm }
    });
    
    return response.data;
  }

  /**
   * Obtener solo administradores
   */
  async getAdmins(): Promise<SystemUser[]> {
    const response = await this.getAll({
      pageSize: 100,
      filters: { rol: 'admin', activo: true }
    });
    
    return response.data;
  }

  /**
   * Obtener solo usuarios estándar
   */
  async getStandardUsers(): Promise<SystemUser[]> {
    const response = await this.getAll({
      pageSize: 100,
      filters: { rol: 'usuario', activo: true }
    });
    
    return response.data;
  }
}

const userService = new UserService();
export default userService;