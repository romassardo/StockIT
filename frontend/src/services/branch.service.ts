import api from './api';
import { Branch } from '../types';

export interface BranchResponse {
  success: boolean;
  message: string;
  data: Branch[];
}

export interface SingleBranchResponse {
  success: boolean;
  message: string;
  data: Branch;
}

class BranchService {
  private baseUrl = '/branches';

  /**
   * Obtener todas las sucursales activas
   */
  async getActiveBranches(): Promise<BranchResponse> {
    const response = await api.get<BranchResponse>(`${this.baseUrl}?activo_only=true`);
    return response.data;
  }

  /**
   * Obtener todas las sucursales
   */
  async getAllBranches(): Promise<BranchResponse> {
    const response = await api.get<BranchResponse>(this.baseUrl);
    return response.data;
  }

  /**
   * Alias para compatibilidad con EntitiesManagement
   */
  async getAll(): Promise<Branch[]> {
    const response = await api.get<BranchResponse>(this.baseUrl);
    return response.data.data;
  }

  /**
   * Obtener sucursal por ID
   */
  async getBranchById(id: number): Promise<BranchResponse> {
    const response = await api.get<BranchResponse>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Crear nueva sucursal
   */
  async create(data: Partial<Branch>): Promise<SingleBranchResponse> {
    const response = await api.post<SingleBranchResponse>(this.baseUrl, data);
    return response.data;
  }

  /**
   * Actualizar sucursal
   */
  async update(id: number, data: Partial<Branch>): Promise<SingleBranchResponse> {
    const response = await api.put<SingleBranchResponse>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  /**
   * Desactivar sucursal (soft delete)
   */
  async delete(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.patch<{ success: boolean; message: string }>(`${this.baseUrl}/${id}/toggle-active`, { activo: false });
    return response.data;
  }

  /**
   * Reactivar sucursal
   */
  async reactivate(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.patch<{ success: boolean; message: string }>(`${this.baseUrl}/${id}/toggle-active`, { activo: true });
    return response.data;
  }
}

export const branchService = new BranchService(); 