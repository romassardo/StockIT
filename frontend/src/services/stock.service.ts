import api from './api';
import { StockResponse } from '../types';

export interface ProductoStock {
  producto_id: number;
  nombre_producto: string;
  descripcion_producto: string;
  categoria_id: number;
  nombre_categoria: string;
  nombre_marca: string;
  min_stock: number;
  cantidad_actual: number;
  ultima_modificacion: string;
  alerta_stock_bajo: boolean;
  ubicacion?: string;
}

export interface MovimientoStock {
  movimiento_id: number;
  producto_id: number;
  nombre_producto: string;
  nombre_marca: string;
  tipo_movimiento: 'Entrada' | 'Salida';
  cantidad: number;
  stock_anterior: number;
  stock_actual: number;
  fecha_movimiento: string;
  motivo: string;
  empleado_nombre?: string;
  sector_nombre?: string;
  sucursal_nombre?: string;
  usuario_nombre: string;
  observaciones?: string;
}

export interface AlertaStock {
  producto_id: number;
  nombre_producto: string;
  nombre_marca: string;
  nombre_categoria: string;
  cantidad_actual: number;
  min_stock: number;
  diferencia: number;
  porcentaje_disponible: number;
  criticidad: 'critico' | 'bajo' | 'normal';
}

export interface StockMovementsFilters {
  producto_id?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  tipo_movimiento?: 'Entrada' | 'Salida';
  empleado_id?: number;
  sector_id?: number;
  sucursal_id?: number;
  page?: number;
  limit?: number;
}

export interface AlertsResponse {
  alerts: AlertaStock[];
  summary: {
    total: number;
    critical: number;
    lowStock: number;
  };
  categories: {
    critical: AlertaStock[];
    lowStock: AlertaStock[];
  };
}

export interface MovimientoStockEntry {
  id: number;
  producto_id: number;
  tipo_movimiento: 'Entrada' | 'Salida';
  cantidad: number;
  fecha_movimiento: string;
  motivo: string;
  empleado_nombre?: string;
  sector_nombre?: string;
  sucursal_nombre?: string;
  observaciones?: string;
}

export interface StockEntryRequest {
  producto_id: number;
  cantidad: number;
  motivo: string;
  observaciones?: string;
}

export interface StockExitRequest {
  producto_id: number;
  cantidad: number;
  motivo: string;
  empleado_id?: number;
  sector_id?: number;
  sucursal_id?: number;
  observaciones?: string;
}

class StockService {
  async getCurrentStock(): Promise<ProductoStock[]> {
    try {
      const response = await api.get('/stock/general');
      return response.data.data || [];
    } catch (error) {
      console.error('[StockService] Error al cargar stock general:', error);
      throw error;
    }
  }

  async getStockMovements(filters?: StockMovementsFilters): Promise<{ movements: MovimientoStock[], pagination: any }> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }
      
      const endpoint = `/stock/movements${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(endpoint);
      
      return {
        movements: response.data.data || [],
        pagination: response.data.pagination || {}
      };
    } catch (error) {
      console.error('[StockService] Error al cargar movimientos de stock:', error);
      throw error;
    }
  }

  async createStockEntry(entryData: StockEntryRequest): Promise<StockResponse> {
    try {
      const response = await api.post('/stock/entry', entryData);
      return response.data;
    } catch (error) {
      console.error('[StockService] Error al registrar entrada de stock:', error);
      throw error;
    }
  }

  async createStockExit(exitData: StockExitRequest): Promise<StockResponse> {
    try {
      const response = await api.post('/stock/exit', exitData);
      return response.data;
    } catch (error) {
      console.error('[StockService] Error al registrar salida de stock:', error);
      throw error;
    }
  }

  async getAvailableProducts(): Promise<ProductoStock[]> {
    try {
      const response = await api.get('/stock/general');
      return response.data.data || [];
    } catch (error) {
      console.error('[StockService] Error al cargar productos para stock general:', error);
      throw error;
    }
  }

  async getLowStockAlerts(categoria_id?: number, solo_criticos?: boolean): Promise<AlertsResponse> {
    try {
      const params = new URLSearchParams();
      if (categoria_id) params.append('categoria_id', categoria_id.toString());
      if (solo_criticos) params.append('solo_criticos', 'true');
      
      const endpoint = `/stock/alerts${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(endpoint);
      return response.data.data;
    } catch (error) {
      console.error('[StockService] Error al cargar alertas de stock:', error);
      throw error;
    }
  }

  // Método legacy para compatibilidad
  async getStockAlerts(): Promise<ProductoStock[]> {
    try {
      const alertsResponse = await this.getLowStockAlerts();
      return alertsResponse.alerts.map(alert => ({
        producto_id: alert.producto_id,
        nombre_producto: alert.nombre_producto,
        descripcion_producto: '',
        categoria_id: 0,
        nombre_categoria: alert.nombre_categoria,
        nombre_marca: alert.nombre_marca,
        min_stock: alert.min_stock,
        cantidad_actual: alert.cantidad_actual,
        ultima_modificacion: '',
        alerta_stock_bajo: true
      }));
    } catch (error) {
      console.error('[StockService] Error al cargar alertas de stock (legacy):', error);
      throw error;
    }
  }
}

export const stockService = new StockService();
