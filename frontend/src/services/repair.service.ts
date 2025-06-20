// 🔧 SOLUCIÓN BIGINT: Función utilitaria para convertir bigint a number de forma segura
const convertBigIntToNumber = (value: any): number => {
  if (typeof value === 'bigint') {
    if (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER) {
      console.warn('BigInt fuera del rango seguro de Number, podría perder precisión');
    }
    return Number(value);
  }
  return typeof value === 'number' ? value : 0;
};

// 🔧 SOLUCIÓN BIGINT: Función para sanitizar objetos con campos numéricos
const sanitizeNumericFields = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  const sanitized: { [key: string]: any } = Array.isArray(obj) ? [] : {};
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (typeof value === 'bigint') {
      sanitized[key] = convertBigIntToNumber(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeNumericFields(value);
    } else {
      sanitized[key] = value;
    }
  });
  return sanitized;
};

import { ActiveRepair, ApiResponse } from '../types';
import api from './api';

export const getActiveRepairs = async (page: number = 1, pageSize: number = 10): Promise<ApiResponse<ActiveRepair[]>> => {
  try {
    const response = await api.get<ApiResponse<ActiveRepair[]>>(`/repairs/active`, {
      params: { page, pageSize }
    });
    return sanitizeNumericFields(response.data);
  } catch (error) {
    console.error('Error obteniendo reparaciones activas:', error);
    throw error;
  }
};

export const createRepair = async (repairData: {
  inventario_individual_id: number;
  proveedor: string;
  problema_descripcion: string;
}): Promise<ActiveRepair> => {
  try {
    const response = await api.post<ApiResponse<ActiveRepair>>('/repairs', repairData);
    return sanitizeNumericFields(response.data.data);
  } catch (error) {
    console.error('Error creando reparación:', error);
    throw error;
  }
};

export const returnRepair = async (repairId: number, repairData: {
  solucion_descripcion?: string;
  estado: 'Reparado' | 'Sin Reparación';
}): Promise<ApiResponse<ActiveRepair>> => {
  try {
    const response = await api.put<ApiResponse<ActiveRepair>>(`/repairs/${repairId}/return`, repairData);
    return sanitizeNumericFields(response.data);
  } catch (error) {
    console.error('Error retornando reparación:', error);
    throw error;
  }
};
