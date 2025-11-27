import api from './api';
import { AuthResponse, User } from '../types';

class AuthService {
  public async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const backendApiResponse = await api.post<{ 
        success?: boolean; 
        accessToken: string;
        user: User; 
        message?: string; 
      }>('/auth/login', { email, password });

      const responseData = backendApiResponse.data;

      if (responseData && responseData.accessToken) {
        localStorage.setItem('token', responseData.accessToken);
        // Mapear nombre_usuario a nombre para compatibilidad con el frontend
        const user = responseData.user ? {
          ...responseData.user,
          nombre: (responseData.user as any).nombre_usuario || responseData.user.nombre
        } : responseData.user;
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        }
        return { 
          user, 
          token: responseData.accessToken,
          message: responseData.message,
          success: responseData.success 
        };
      } else {
        throw new Error('Respuesta de login inválida del servidor.');
      }
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Error desconocido durante el inicio de sesión.');
      }
    }
  }

  public logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  public isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  public getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  public async changePassword(currentPassword: string, newPassword: string): Promise<{success: boolean; message: string}> {
    const response = await api.post('/auth/change-password', { 
      currentPassword, 
      newPassword 
    });
    return response.data;
  }

  public async getProfile(): Promise<User> {
    const response = await api.get('/auth/profile');
    return response.data;
  }

  public getToken(): string | null {
    return localStorage.getItem('token');
  }

  public async validateToken(): Promise<User | null> {
    try {
      const token = this.getToken();
      if (!token) return null;
      const response = await api.get<User>('/auth/validate-token');
      if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
      }
      this.logout();
      return null;
    } catch (error) {
      return null;
    }
  }
}

export const authService = new AuthService();
