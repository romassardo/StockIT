import api from './api';
import { 
  InventoryReportItem, 
  StockAlertItem, 
  PaginatedStockAlerts, 
  StockDisponibleReportItem, 
  PaginatedStockDisponibleReport,
  PaginatedRepairHistoryReport,
  PaginatedStockMovementsReport,
  StockMovementFilters
} from '../types';

export interface PaginatedInventoryReport {
  items: InventoryReportItem[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export interface AssignmentReportItem {
  id: number;
  tipo_asignacion: string;
  estado: string;
  fecha_asignacion: string;
  fecha_devolucion: string | null;
  destino_nombre: string;
  producto_nombre: string;
  tipo_inventario: string;
  usuario_asigna: string;
  usuario_recibe: string | null;
  dias_asignado: number;
  TotalRows: number;
}

export interface PaginatedAssignmentsReport {
  items: AssignmentReportItem[];
  stats: any[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

interface GetInventoryReportParams {
  page?: number;
  pageSize?: number;
  tipoInventario?: 'Individual' | 'General' | '';
  estado?: string;
  categoriaId?: number;
  fechaDesde?: string;
  fechaHasta?: string;
}

interface GetStockAlertsParams {
  page?: number;
  pageSize?: number;
  tipoAlerta?: 'Sin Stock' | 'Stock Bajo' | '';
  categoriaId?: number;
  diasParaAgotarse?: number;
  searchTerm?: string;
}

interface GetStockDisponibleReportParams {
  page?: number;
  pageSize?: number;
  FilterType?: 'Serializado' | 'General' | '';
  FilterCategoria?: string;
  SortBy?: 'Categoria' | 'Marca' | 'Modelo';
  SortOrder?: 'ASC' | 'DESC';
  searchTerm?: string;
}

export interface GetAssignmentsByDestinationParams {
  page?: number;
  pageSize?: number;
  tipoDestino: 'Empleado' | 'Sector' | 'Sucursal';
  destinoId?: number;
  estadoAsignacion?: 'activa' | 'devuelta' | '';
  fechaDesde?: string;
  fechaHasta?: string;
  searchTerm?: string;
  tipoDispositivo?: string;
}

// 🔧 SOLUCIÓN BIGINT: Función utilitaria para convertir bigint a number de forma segura
const convertBigIntToNumber = (value: any): number => {
  if (typeof value === 'bigint') {
    // Verificar que el bigint esté dentro del rango seguro de JavaScript
    if (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER) {
      console.warn(`BigInt ${value} está fuera del rango seguro de Number, podría perder precisión`);
    }
    return Number(value);
  }
  return typeof value === 'number' ? value : 0;
};

// 🔧 SOLUCIÓN BIGINT: Función para sanitizar StockAlertItem
const sanitizeStockAlertItem = (item: any): StockAlertItem => {
  return {
    ...item,
    ProductoID: convertBigIntToNumber(item.ProductoID || item.productoid || item.ProductoId),
    ProductoNombre: item.ProductoNombre || item.productonombre || item.producto_nombre || '',
    Categoria: item.Categoria || item.categoria || '',
    CategoriaID: convertBigIntToNumber(item.CategoriaID || item.categoriaid || item.CategoriaId),
    CantidadActual: convertBigIntToNumber(item.CantidadActual || item.cantidadactual || item.cantidad_actual),
    StockMinimo: convertBigIntToNumber(item.StockMinimo || item.stockminimo || item.stock_minimo),
    UmbralPersonalizado: convertBigIntToNumber(item.UmbralPersonalizado || item.umbralpersonalizado || item.umbral_personalizado),
    DiasParaAgotarse: convertBigIntToNumber(item.DiasParaAgotarse || item.diasparaagotarse || item.dias_para_agotarse),
    PromedioSalidaDiaria: convertBigIntToNumber(item.PromedioSalidaDiaria || item.promediosalidadiaria || item.promedio_salida_diaria),
    TotalRows: convertBigIntToNumber(item.TotalRows || item.totalrows || item.TotalRecords),
    TipoAlerta: item.TipoAlerta || item.tipoalerta || item.tipo_alerta || '',
    UltimoMovimiento: item.UltimoMovimiento || item.ultimomovimiento || item.ultimo_movimiento
  };
};


export const getInventoryReport = async (params: GetInventoryReportParams = {}): Promise<PaginatedInventoryReport> => {
  try {
    const response = await api.get('/reports/inventory-summary', { params });
    const items = response.data.recordset;
    const totalItems = items.length > 0 ? items[0].TotalRows : 0;
    const pageSize = params.pageSize || 20;
    
    return {
      items,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
      currentPage: params.page || 1,
    };
  } catch (error) {
    console.error('Error fetching inventory report:', error);
    throw error;
  }
};

export const getStockAlerts = async (params: GetStockAlertsParams = {}): Promise<PaginatedStockAlerts> => {
  try {
    const response = await api.get('/reports/stock-alerts', { params });
    
    // 🔧 CORRECCIÓN: El backend devuelve directamente { success, summary, items, pagination }
    // NO está dentro de response.data.data como otros endpoints
    
    // Verificar si la respuesta tiene la estructura esperada
    if (!response.data || !response.data.items) {
      console.error('Estructura de respuesta inesperada:', response.data);
      throw new Error('Estructura de respuesta inválida del servidor');
    }
    
    // 🔧 SOLUCIÓN BIGINT: Sanitizar los items para convertir bigint a number
    const sanitizedItems = response.data.items.map(sanitizeStockAlertItem);
    
    const summary = response.data.summary || {};
    const pagination = response.data.pagination || {};
    
    return {
      items: sanitizedItems, // ✅ Items sanitizados sin bigint
      summary,
      totalItems: pagination.totalItems || 0,
      totalPages: pagination.totalPages || 0,
      currentPage: pagination.page || 1,
    };
  } catch (error) {
    console.error('Error fetching stock alerts report:', error);
    throw error;
  }
};

export const getStockAlertsCount = async (): Promise<number> => {
  try {
    const response = await api.get('/reports/stats/stock-alerts-count');
    return response.data.data.count;
  } catch (error) {
    console.error('Error fetching stock alerts count:', error);
    // Devolver 0 en caso de error para no romper la UI
    return 0;
  }
};

// Función de sanitización para items de stock disponible
const sanitizeStockDisponibleItem = (item: any): StockDisponibleReportItem => {
  return {
    ...item,
    ProductoId: Number(item.ProductoId),
    cantidad_disponible: Number(item.cantidad_disponible),
    TotalRecords: Number(item.TotalRecords),
  };
};

export const getStockDisponibleReport = async (params: GetStockDisponibleReportParams = {}): Promise<PaginatedStockDisponibleReport> => {
  try {
    const response = await api.get('/reports/inventory/full', { params });
    const sanitizedItems = response.data.items.map(sanitizeStockDisponibleItem);
    return {
      ...response.data,
      items: sanitizedItems,
    };
  } catch (error) {
    console.error('Error fetching stock disponible report:', error);
    throw error;
  }
};

// Mantener compatibilidad con el nombre anterior
export const getFullInventoryReport = getStockDisponibleReport;

export const getAssignmentsByDestination = async (params: GetAssignmentsByDestinationParams): Promise<PaginatedAssignmentsReport> => {
  try {
    const response = await api.get('/reports/assignments-by-destination', { params });
    
    // Verificar estructura de respuesta - el backend devuelve directamente { success, items, totalItems, totalPages, currentPage }
    if (!response.data || !response.data.items) {
      console.error('Estructura de respuesta inesperada:', response.data);
      throw new Error('Estructura de respuesta inválida del servidor');
    }
    
    // Sanitizar items para convertir bigint a number y manejar case sensitivity
    const sanitizedItems = response.data.items.map((item: any) => ({
      ...item,
      id: convertBigIntToNumber(item.id),
      tipo_asignacion: item.tipo_asignacion || '',
      estado: item.estado || '',
      fecha_asignacion: item.fecha_asignacion || '',
      fecha_devolucion: item.fecha_devolucion || null,
      destino_nombre: item.destino_nombre || '',
      producto_nombre: item.producto_nombre || '',
      tipo_inventario: item.tipo_inventario || '',
      usuario_asigna: item.usuario_asigna || '',
      usuario_recibe: item.usuario_recibe || null,
      dias_asignado: convertBigIntToNumber(item.dias_asignado),
      TotalRows: convertBigIntToNumber(item.TotalRows),
    }));
    
    return {
      items: sanitizedItems,
      stats: [],
      totalItems: response.data.totalItems || 0,
      totalPages: response.data.totalPages || 0,
      currentPage: response.data.currentPage || 1,
    };
  } catch (error) {
    console.error('Error fetching assignments by destination report:', error);
    throw error;
  }
};

export interface GetRepairHistoryParams {
  page: number;
  pageSize: number;
  fechaDesde?: string;
  fechaHasta?: string;
  estado?: string;
  proveedor?: string;
}

export const getRepairHistoryReport = async (params: GetRepairHistoryParams): Promise<PaginatedRepairHistoryReport> => {
  try {
    const response = await api.get('/reports/repair-history', { params });
    
    // Verificar estructura de respuesta
    if (!response.data || !response.data.data) {
      console.error('Estructura de respuesta inesperada:', response.data);
      throw new Error('Estructura de respuesta inválida del servidor');
    }
    
    // El backend devuelve { success: true, data: [], pagination: {} }
    const items = response.data.data;
    const pagination = response.data.pagination || {};
    
    return {
      items: items || [],
      totalRecords: pagination.totalRows || 0, // El backend devuelve totalRows
      totalPages: pagination.totalPages || 0,
      currentPage: pagination.page || 1,
    };
  } catch (error) {
    console.error('Error fetching repair history report:', error);
    throw error;
  }
};

export interface GetStockMovementsParams {
  page: number;
  pageSize: number;
  fechaDesde?: string;
  fechaHasta?: string;
  tipoMovimiento?: string;
  producto?: string;
  usuario?: string;
}

export const getStockMovementsReport = async (params: GetStockMovementsParams): Promise<PaginatedStockMovementsReport> => {
  try {
    const response = await api.get('/reports/stock-movements', { params });
    
    // Verificar estructura de respuesta
    if (!response.data || !response.data.data) {
      console.error('Estructura de respuesta inesperada:', response.data);
      throw new Error('Estructura de respuesta inválida del servidor');
    }
    
    const { items, pagination } = response.data.data;
    
    return {
      items: items || [],
      totalRecords: pagination.totalRecords || 0,
      totalPages: pagination.totalPages || 0,
      currentPage: pagination.currentPage || 1,
    };
  } catch (error) {
    console.error('Error fetching stock movements report:', error);
    throw error;
  }
};

// Función para exportar Auditoría de Movimientos a Excel
export const exportStockMovementsToExcel = async (filters: StockMovementFilters): Promise<void> => {
  try {
    const params = new URLSearchParams();
    if (filters.fechaDesde) params.append('fechaDesde', filters.fechaDesde);
    if (filters.fechaHasta) params.append('fechaHasta', filters.fechaHasta);
    if (filters.tipoMovimiento) params.append('tipoMovimiento', filters.tipoMovimiento);
    if (filters.producto) params.append('producto', filters.producto);
    if (filters.usuario) params.append('usuario', filters.usuario);

    const response = await fetch(`${api.defaults.baseURL}/reports/stock-movements/export?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al exportar el reporte');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auditoria-movimientos-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting stock movements to Excel:', error);
    throw error;
  }
}; 