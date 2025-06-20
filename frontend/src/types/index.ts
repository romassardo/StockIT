// Definiciones de tipos comunes para la aplicación

// Usuario del sistema para administración
export interface SystemUser {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'usuario';
  activo: boolean;
  fecha_creacion: string;
  ultimo_acceso?: string;
  created_at?: string;
  updated_at?: string;
}

// Usuario de empleados (para asignaciones)
export interface User {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  sector_id?: number;
  sucursal_id?: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

// Respuesta de autenticación
export interface AuthResponse {
  user: User;
  token: string;
  message?: string; // Opcional, si el backend lo envía en este nivel
  success?: boolean; // Opcional, si el backend lo envía en este nivel
}

// Credenciales de inicio de sesión
export interface LoginCredentials {
  email: string;
  password: string;
}

// Estado de autenticación
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Inventario Individual (con número de serie)
export interface InventoryItem {
  id: number;
  producto_id: number;
  numero_serie: string;
  estado: 'Disponible' | 'Asignado' | 'En reparación' | 'Dado de Baja';
  observaciones?: string;
  fecha_compra?: string;
  fecha_ingreso: string;
  fecha_baja?: string;
  motivo_baja?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  producto?: Product;
  asignaciones?: Assignment[];
  asignacion_actual?: Assignment;
  reparacion_actual?: ActiveRepair;
}

// Para la creación de un nuevo item de inventario individual
export interface CreateInventoryItem {
  producto_id: number;
  numero_serie: string;
  estado?: 'Disponible' | 'Asignado' | 'En reparación' | 'Dado de Baja';
  observaciones?: string;
  fecha_compra?: string;
}

// Producto (categoría de item)
export interface Product {
  id: number;
  producto_id: number; // A menudo los SPs devuelven esto
  marca: string;
  modelo: string;
  nombre_producto: string;
  nombre_marca?: string;
  nombre_categoria: string;
  descripcion?: string;
  categoria_id: number;
  usa_numero_serie: boolean;
  stock_minimo?: number;
  cantidad_actual?: number; // Para el selector de stock
  activo: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  categoria?: Category;
  stockId?: number;
  stockActual?: number;
  alertaBajoStock?: boolean;
}

// Categoría de producto
export interface Category {
  id: number;
  nombre: string;
  descripcion?: string;
  created_at: string;
  updated_at: string;
}

// Asignación
export interface Assignment {
  id: number;
  inventario_individual_id: number;
  empleado_id: number;
  empleado_nombre: string;
  sector_id: number;
  sector_nombre: string;
  sucursal_id: number;
  sucursal_nombre: string;
  fecha_asignacion: string;
  fecha_devolucion?: string;
  usuario_asigna_id: number;
  usuario_asigna_nombre: string;
  usuario_recibe_id?: number;
  usuario_recibe_nombre?: string;
  observaciones?: string;
  password_encriptacion?: string;
  numero_telefono?: string;
  cuenta_gmail?: string;
  password_gmail?: string;
  codigo_2fa_whatsapp?: string;
  imei_1?: string;
  imei_2?: string;
  activa: boolean;
  numero_serie?: string;
  marca?: string;
  modelo?: string;
  // Datos anidados opcionales
  inventario?: InventoryItem;
  empleado?: Employee;
  sector?: Sector;
  sucursal?: Branch;
}

// Empleado
export interface Employee {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  sector_id: number;
  sucursal_id: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  sector?: Sector;
  sucursal?: Branch;
}

// Sector
export interface Sector {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

// Sucursal
export interface Branch {
  id: number;
  nombre: string;
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

// Movimiento de stock
export interface StockMovement {
  id: number;
  producto_id: number;
  tipo_movimiento: 'Entrada' | 'Salida';
  cantidad: number;
  motivo: string;
  empleado_id?: number;
  sector_id?: number;
  sucursal_id?: number;
  fecha_movimiento: string;
  created_at: string;
  updated_at: string;
  producto?: Product;
  empleado?: Employee;
  sector?: Sector;
  sucursal?: Branch;
}

// Stock General (nuevos tipos para T5.5)
export interface StockGeneral {
  id: number;
  producto_id: number;
  cantidad_actual: number;
  stock_minimo: number;
  ultima_actualizacion: string;
  ubicacion?: string;
  producto?: Product;
  bajo_minimo?: boolean;
}

// Formulario de entrada de stock
export interface StockEntryForm {
  producto_id: number;
  cantidad: number;
  motivo: string;
  observaciones?: string;
}

// Formulario de salida de stock
export interface StockExitForm {
  producto_id: number;
  cantidad: number;
  motivo: string;
  empleado_id?: number;
  sector_id?: number;
  sucursal_id?: number;
  observaciones?: string;
}

// Alerta de stock bajo
export interface StockAlert {
  id: number;
  producto_id: number;
  cantidad_actual: number;
  stock_minimo: number;
  diferencia: number;
  producto?: Product;
}

// Filtros para stock
export interface StockFilters {
  categoria_id?: number;
  bajo_minimo?: boolean;
  producto_id?: number;
  busqueda?: string;
}

// Respuesta de API para operaciones de stock
export interface StockResponse {
  success: boolean;
  message: string;
  movimientoId?: number;
  stockId?: number;
  stockActual?: number;
  alertaBajoStock?: boolean;
}

// Paginación genérica
export interface PaginatedResponse<T> {
  data: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

// Paginación
export interface Pagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: Pagination;
  error?: string;
}

export interface ChangelogEntry {
  id: number;
  // ... (definición existente)
}

export interface ActiveRepair {
  id: number;
  reparacion_id: number;
  inventario_individual_id: number;
  numero_serie: string;
  marca: string;
  modelo: string;
  producto_marca?: string;
  producto_modelo?: string;
  producto_categoria?: string;
  empleado_asignado?: string;
  fecha_envio: string;
  fecha_retorno?: string;
  proveedor: string;
  problema_descripcion: string;
  solucion_descripcion?: string;
  estado_reparacion?: 'En Reparación' | 'Reparado' | 'Sin Reparación';
  usuario_envia_id: number;
  usuario_envia_nombre: string;
  usuario_recibe_nombre?: string;
  dias_en_reparacion?: number;
  TotalRows?: number;
}

// ===============================================
// Tipos para Historial y Timeline
// ===============================================

export interface ActivityLog {
  id: number;
  fecha_hora: string;
  usuario_nombre: string;
  accion: string;
  descripcion: string;
}

export interface TimelineEvent {
  id: string;
  fecha: string;
  accion: string;
  usuario: string;
  observaciones?: string;
}

// ===============================================
// Tipos para Búsqueda Global (Fase 6)
// ===============================================

export enum ResultType {
  INVENTORY = 'Inventario',
  ASSIGNMENT = 'Asignacion',
  EMPLOYEE = 'Empleado',
  REPAIR = 'Reparacion',
  STOCK = 'Stock',
  PRODUCT = 'Producto',
}

export enum EntityType {
  NOTEBOOK = 'Notebook',
  CELULAR = 'Celular',
  PERIFERICO = 'Periférico',
  COMPONENTE = 'Componente',
  CONSUMIBLE = 'Consumible',
  DESKTOP = 'Desktop',
  GENERICO = 'Genérico'
}

export interface SearchResult {
  resultType: ResultType;
  itemId: number;
  title: string;
  description: string;
  status?: string;
  dateInfo?: string;
  entityType?: EntityType;
  serialNumber?: string;
  encryptionPassword?: string;
  relatedInfo?: string;
}

export interface PaginatedSearchResponse<T> {
  success: boolean;
  results: T[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  error?: string;
}

export interface Changelog {
  id: number;
  version: string;
  fecha_cambio: string;
  descripcion: string;
  tipo_cambio: string;
  usuario_id: number;
  usuario_nombre?: string;
}

export interface InventoryReportItem {
  ID: number;
  TipoInventario: 'Individual' | 'General';
  ProductoID: number;
  ProductoMarca: string;
  ProductoModelo: string;
  ProductoCategoria: string;
  NumeroSerie: string | null;
  Estado: 'Disponible' | 'Asignado' | 'En Reparación' | 'Dado de Baja' | null;
  Cantidad: number | null;
  FechaIngreso: string | null;
  FechaModificacion: string | null;
  TotalRows: number;
}

// Reportes - Alertas de Stock
export interface StockAlertItem {
  ProductoID: number;
  ProductoNombre: string;
  Categoria: string;
  CategoriaID: number;
  CantidadActual: number;
  StockMinimo: number;
  UmbralPersonalizado: number;
  DiasParaAgotarse: number;
  PromedioSalidaDiaria: number;
  UltimoMovimiento: string;
  TipoAlerta: 'Sin Stock' | 'Stock Bajo';
  TotalRows: number;
}

export interface StockAlertSummary {
  ReportType: string;
  TotalSinStock: number;
  TotalStockBajo: number;
  TotalAlertas: number;
  MinimosDiasParaAgotarse: number;
  PromedioDiasParaAgotarse: number;
}

export interface PaginatedStockAlerts {
  items: StockAlertItem[];
  summary: StockAlertSummary;
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export interface FullInventoryReportItem {
  ProductoId: number;
  Categoria: string;
  marca: string;
  modelo: string;
  descripcion: string | null;
  numero_serie: string | null;
  estado: string;
  cantidad_actual: number;
  ubicacion: string | null;
  TipoInventario: 'Serializado' | 'General';
}

// Nuevo tipo para Stock Disponible agrupado
export interface StockDisponibleReportItem {
  ProductoId: number;
  Categoria: string;
  marca: string;
  modelo: string;
  descripcion: string | null;
  cantidad_disponible: number;
  TipoInventario: 'Serializado' | 'General';
  TotalRecords: number;
}

export interface PaginatedFullInventoryReport {
  items: FullInventoryReportItem[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
}

export interface PaginatedStockDisponibleReport {
  items: StockDisponibleReportItem[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
}

// ===============================
// TIPOS PARA HISTORIA DE REPARACIONES
// ===============================

export interface RepairHistoryItem {
  reparacion_id: number;
  numero_serie: string;
  marca: string;
  modelo: string;
  categoria: string;
  fecha_envio: string;
  fecha_retorno: string | null;
  proveedor: string;
  problema_descripcion: string;
  solucion_descripcion: string | null;
  estado: string;
  usuario_envia: string;
  usuario_recibe: string | null;
  dias_reparacion: number;
  TotalRows: number;
}

export interface PaginatedRepairHistoryReport {
  items: RepairHistoryItem[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
}

export interface RepairHistoryFilters {
  fechaDesde?: string;
  fechaHasta?: string;
  estado?: string;
  proveedor?: string;
}

// ===============================
// TIPOS PARA AUDITORÍA DE MOVIMIENTOS
// ===============================

export interface StockMovementItem {
  movimiento_id: number;
  producto: string;
  categoria: string;
  tipo_movimiento: string;
  cantidad: number;
  fecha_movimiento: string;
  motivo: string;
  observaciones: string | null;
  destino: string;
  tipo_destino: string;
  usuario_nombre: string;
  stock_anterior: number;
  stock_actual: number;
  TotalRecords: number;
}

export interface PaginatedStockMovementsReport {
  items: StockMovementItem[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
}

export interface StockMovementFilters {
  fechaDesde?: string;
  fechaHasta?: string;
  tipoMovimiento?: string;
  producto?: string;
  usuario?: string;
}
