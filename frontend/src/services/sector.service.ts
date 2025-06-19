import api from './api';
import { Sector } from '../types';

export interface SectorResponse {
  success: boolean;
  message: string;
  data: Sector[];
}

export interface SingleSectorResponse {
  success: boolean;
  message: string;
  data: Sector;
}

class SectorService {
  private baseUrl = '/sectors';

  /**
   * Obtener todos los sectores activos
   */
  async getActiveSectors(): Promise<SectorResponse> {
    const response = await api.get<SectorResponse>(`${this.baseUrl}?activo_only=true`);
    return response.data;
  }

  /**
   * Obtener todos los sectores
   */
  async getAllSectors(): Promise<SectorResponse> {
    const response = await api.get<SectorResponse>(this.baseUrl);
    return response.data;
  }

  /**
   * Alias para compatibilidad con EntitiesManagement
   */
  async getAll(): Promise<Sector[]> {
    const response = await api.get<SectorResponse>(this.baseUrl);
    return response.data.data;
  }

  /**
   * Obtener sector por ID
   */
  async getSectorById(id: number): Promise<SectorResponse> {
    const response = await api.get<SectorResponse>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Crear nuevo sector
   */
  async create(data: Partial<Sector>): Promise<SingleSectorResponse> {
    const response = await api.post<SingleSectorResponse>(this.baseUrl, data);
    return response.data;
  }

  /**
   * Actualizar sector
   */
  async update(id: number, data: Partial<Sector>): Promise<SingleSectorResponse> {
    const response = await api.put<SingleSectorResponse>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  /**
   * Desactivar sector (soft delete)
   */
  async delete(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.patch<{ success: boolean; message: string }>(`${this.baseUrl}/${id}/toggle-active`, { activo: false });
    return response.data;
  }

  /**
   * Reactivar sector
   */
  async reactivate(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.patch<{ success: boolean; message: string }>(`${this.baseUrl}/${id}/toggle-active`, { activo: true });
    return response.data;
  }
}

export const sectorService = new SectorService(); 