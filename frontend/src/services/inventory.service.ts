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
const sanitizeNumericFields = <T extends object>(obj: T): T => {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized: any = Array.isArray(obj) ? [] : {};
  Object.keys(obj).forEach(keyStr => {
    const key = keyStr as keyof T;
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

import { InventoryItem, PaginatedResponse, CreateInventoryItem, Product } from '../types';
import api from './api';

export const getAllInventory = async (page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<InventoryItem>> => {
  try {
    const response = await api.get<PaginatedResponse<InventoryItem>>('/inventory', {
      params: { page, pageSize }
    });
    return sanitizeNumericFields(response.data);
  } catch (error) {
    console.error('Error obteniendo inventario:', error);
    throw error;
  }
};

export const getInventoryById = async (id: number): Promise<InventoryItem> => {
  try {
    const response = await api.get<InventoryItem>(`/inventory/${id}`);
    return sanitizeNumericFields(response.data);
  } catch (error) {
    console.error('Error obteniendo item de inventario:', error);
    throw error;
  }
};

export const createInventoryItem = async (item: CreateInventoryItem): Promise<InventoryItem> => {
  try {
    const response = await api.post<InventoryItem>('/inventory', item);
    return sanitizeNumericFields(response.data);
  } catch (error) {
    console.error('Error creando item de inventario:', error);
    throw error;
  }
};

export const createBatchInventoryItems = async (items: CreateInventoryItem[]): Promise<InventoryItem[]> => {
  try {
    const response = await api.post<InventoryItem[]>('/inventory/batch', { items });
    return sanitizeNumericFields(response.data);
  } catch (error) {
    console.error('Error creando items de inventario en lote:', error);
    throw error;
  }
};

export const updateInventoryItem = async (id: number, item: Partial<InventoryItem>): Promise<InventoryItem> => {
  try {
    const response = await api.put<InventoryItem>(`/inventory/${id}`, item);
    return sanitizeNumericFields(response.data);
  } catch (error) {
    console.error('Error actualizando item de inventario:', error);
    throw error;
  }
};

export const getInventoryHistory = async (id: number): Promise<any[]> => {
  try {
    const response = await api.get<any[]>(`/inventory/${id}/history`);
    return sanitizeNumericFields(response.data);
  } catch (error) {
    console.error('Error obteniendo historial de inventario:', error);
    throw error;
  }
};

export const getActiveRepairs = async (page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<any>> => {
  try {
    const response = await api.get<PaginatedResponse<any>>('/inventory/repairs/active', {
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
}): Promise<any> => {
  try {
    const response = await api.post<any>('/inventory/repairs', repairData);
    return sanitizeNumericFields(response.data);
  } catch (error) {
    console.error('Error creando reparación:', error);
    throw error;
  }
};

export const getProductsWithSerialNumber = async (): Promise<{ success: boolean; data: Product[] }> => {
  try {
    const response = await api.get<{ success: boolean; data: Product[] }>('/products/serial-number-items');
    return sanitizeNumericFields(response.data);
  } catch (error) {
    console.error('Error obteniendo productos con número de serie:', error);
    throw error;
  }
};

export const getInventoryBySerial = async (serialNumber: string): Promise<InventoryItem> => {
  try {
    const response = await api.get<InventoryItem>(`/inventory/serial/${serialNumber}`);
    return sanitizeNumericFields(response.data);
  } catch (error) {
    console.error('Error obteniendo inventario por serial:', error);
    throw error;
  }
};

export const getInventoryItems = async (filters?: any): Promise<PaginatedResponse<InventoryItem>> => {
  try {
    const response = await api.get<PaginatedResponse<InventoryItem>>('/inventory', {
      params: filters
    });
    return sanitizeNumericFields(response.data);
  } catch (error) {
    console.error('Error obteniendo items de inventario:', error);
    throw error;
  }
};

export const createInventoryBatch = async (batchData: any): Promise<{ success: boolean; data: { Creados: number; Duplicados: string | null }; message?: string }> => {
  try {
    const response = await api.post<any>('/inventory/batch', batchData);
    return sanitizeNumericFields(response.data);
  } catch (error) {
    console.error('Error creando lote de inventario:', error);
    throw error;
  }
};
