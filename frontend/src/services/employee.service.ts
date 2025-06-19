import api from './api';
import { Employee } from '../types';

export interface PaginatedEmployeesResponse {
  success: boolean;
  message: string;
  data: {
    employees: Employee[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface EmployeeResponse {
  success: boolean;
  message: string;
  data: Employee[];
}

export interface SingleEmployeeResponse {
  success: boolean;
  message: string;
  data: Employee;
}

class EmployeeService {
  private baseUrl = '/employees';

  /**
   * Obtener todos los empleados activos
   */
  async getActiveEmployees(): Promise<EmployeeResponse> {
    const response = await api.get<EmployeeResponse>(`${this.baseUrl}?activo_only=true`);
    return response.data;
  }

  /**
   * Obtener todos los empleados (para EntitiesManagement)
   */
  async getAll(): Promise<Employee[]> {
    const response = await api.get<PaginatedEmployeesResponse>(this.baseUrl);
    // Extraer el array de empleados del objeto paginado
    return response.data.data.employees;
  }

  /**
   * Obtener todos los empleados con paginación
   */
  async getAllWithPagination(page: number = 1, pageSize: number = 10): Promise<PaginatedEmployeesResponse['data']> {
    const response = await api.get<PaginatedEmployeesResponse>(this.baseUrl, {
      params: {
        page,
        pageSize,
      },
    });
    return response.data.data;
  }

  /**
   * Alias para compatibilidad con EntitiesManagement
   */
  async getAllEmployees(): Promise<EmployeeResponse> {
    const response = await api.get<EmployeeResponse>(this.baseUrl);
    return response.data;
  }

  /**
   * Obtener empleado por ID
   */
  async getEmployeeById(id: number): Promise<EmployeeResponse> {
    const response = await api.get<EmployeeResponse>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Crear nuevo empleado
   */
  async create(data: Partial<Employee>): Promise<SingleEmployeeResponse> {
    const response = await api.post<SingleEmployeeResponse>(this.baseUrl, data);
    return response.data;
  }

  /**
   * Actualizar empleado
   */
  async update(id: number, data: Partial<Employee>): Promise<SingleEmployeeResponse> {
    const response = await api.put<SingleEmployeeResponse>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  /**
   * Desactivar empleado (soft delete)
   */
  async delete(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.patch<{ success: boolean; message:string }>(`${this.baseUrl}/${id}/toggle-active`, { activo: false });
    return response.data;
  }

  /**
   * Reactivar empleado
   */
  async reactivate(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.patch<{ success: boolean; message: string }>(`${this.baseUrl}/${id}/toggle-active`, { activo: true });
    return response.data;
  }
}

export const employeeService = new EmployeeService(); 