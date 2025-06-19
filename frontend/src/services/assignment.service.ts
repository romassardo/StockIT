import api from './api';
import { Assignment } from '../types';

// Interfaces para asignaciones
export interface AssignmentRequest {
  inventario_individual_id: number;
  empleado_id?: number;
  sector_id?: number;
  sucursal_id?: number;
  observaciones?: string;
  
  // Campos específicos para notebooks
  password_encriptacion?: string;
  
  // Campos específicos para celulares
  numero_telefono?: string;
  cuenta_gmail?: string;
  password_gmail?: string;
  codigo_2fa_whatsapp?: string;
  imei_1?: string;
  imei_2?: string;
}

// Interface para la respuesta de detalles de asignación
export interface DetailedAssignmentData {
  asignacion_id: number;
  fecha_asignacion: string;
  fecha_devolucion?: string | null;
  asignacion_observaciones?: string | null;
  password_encriptacion?: string | null;
  cuenta_gmail?: string | null;
  password_gmail?: string | null;
  numero_telefono?: string | null;
  codigo_2fa_whatsapp?: string | null;
  imei_1?: string | null;
  imei_2?: string | null;
  asignacion_activa: boolean;
  inventario_id: number;
  numero_serie: string;
  inventario_estado: string;
  producto_id: number;
  producto_marca: string;
  producto_modelo: string;
  producto_descripcion?: string | null;
  categoria_id: number;
  categoria_nombre: string; // Importante para la lógica condicional en el frontend
  empleado_id?: number | null;
  empleado_nombre?: string | null;
  empleado_apellido?: string | null;
  sector_id?: number | null;
  sector_nombre?: string | null;
  sucursal_id?: number | null;
  sucursal_nombre?: string | null;
  usuario_asigna_nombre: string;
  usuario_recibe_nombre?: string | null;
}

export interface DetailedAssignmentApiResponse {
  success: boolean;
  message?: string;
  data: DetailedAssignmentData;
}

export interface AssignmentResponse {
  success: boolean;
  message: string;
  data: Assignment | Assignment[];
}

class AssignmentService {
  private baseUrl = '/assignments';

  /**
   * Crear nueva asignación
   */
  async createAssignment(data: AssignmentRequest): Promise<AssignmentResponse> {
    const response = await api.post<AssignmentResponse>(this.baseUrl, data);
    return response.data;
  }

  /**
   * Obtener asignaciones activas
   */
  async getActiveAssignments(): Promise<AssignmentResponse> {
    const response = await api.get<AssignmentResponse>(`${this.baseUrl}/active`);
    return response.data;
  }

  /**
   * Devolver asignación
   */
  async returnAssignment(assignmentId: number, observaciones?: string): Promise<AssignmentResponse> {
    const response = await api.put<AssignmentResponse>(`${this.baseUrl}/${assignmentId}/return`, {
      observaciones
    });
    return response.data;
  }

  /**
   * Obtener asignaciones por empleado
   */
  async getAssignmentsByEmployee(employeeId: number): Promise<AssignmentResponse> {
    const response = await api.get<AssignmentResponse>(`${this.baseUrl}/by-employee/${employeeId}`);
    return response.data;
  }

  /**
   * Obtener historial de asignaciones de un item
   */
  async getItemHistory(inventoryId: number): Promise<AssignmentResponse> {
    const response = await api.get<AssignmentResponse>(`${this.baseUrl}/inventory/${inventoryId}`);
    return response.data;
  }

  /**
   * Obtener detalles completos de una asignación específica
   */
  async getAssignmentDetails(assignmentId: number): Promise<DetailedAssignmentApiResponse> {
    const response = await api.get<DetailedAssignmentApiResponse>(`${this.baseUrl}/${assignmentId}/details`);
    return response.data;
  }
}

export const assignmentService = new AssignmentService();

/**
 * Obtiene los detalles completos y sensibles de una asignación por su ID.
 * @param assignmentId El ID de la asignación.
 * @returns Una promesa que se resuelve con los detalles de la asignación.
 */
export const getAssignmentDetails = async (assignmentId: number): Promise<Assignment> => {
  try {
    const response = await api.get(`/assignments/${assignmentId}/details`);
    // El SP devuelve un recordset, incluso para un solo resultado.
    // Asumimos que los detalles están en el primer elemento si existe.
    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
    throw new Error('No se encontraron detalles para la asignación.');
  } catch (error) {
    console.error(`Error al obtener los detalles de la asignación ${assignmentId}:`, error);
    throw error;
  }
};