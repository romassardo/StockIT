/**
 * Tipos básicos para el sistema de inventario IT
 */

// Re-exportar tipos de autenticación desde auth.types
export { AuthRequest, UserJwtPayload } from './auth.types';

// Tipos de estados para elementos de inventario individual
export enum EstadoInventarioIndividual {
  DISPONIBLE = 'Disponible',
  ASIGNADO = 'Asignado',
  EN_REPARACION = 'En Reparación',
  DADO_DE_BAJA = 'Dado de Baja'
}

// Tipos de estados para stock general
export enum EstadoStockGeneral {
  ACTIVO = 'Activo',
  INACTIVO = 'Inactivo'
}

// Tipos de movimientos de stock
export enum TipoMovimientoStock {
  ENTRADA = 'Entrada',
  SALIDA = 'Salida'
}

// Tipos de asignaciones
export enum TipoAsignacion {
  EMPLEADO = 'Empleado',
  SECTOR = 'Sector',
  SUCURSAL = 'Sucursal'
}

// Interfaz para información de usuario
export interface Usuario {
  id: number
  nombre: string
  apellido: string
  email: string
  rol: string
  activo: boolean
}

// Interfaz para categoría de producto
export interface Categoria {
  id: number
  nombre: string
  categoria_padre_id: number | null
  requiere_serie: boolean
}

// Interfaz para productos (catálogo)
export interface Producto {
  id: number
  nombre: string
  descripcion: string
  marca: string
  modelo: string
  categoria_id: number
  stock_minimo: number
  requiere_serie: boolean
  activo: boolean
}

// Interfaz para elementos de inventario individual (con número de serie)
export interface InventarioIndividual {
  id: number
  producto_id: number
  numero_serie: string
  estado: EstadoInventarioIndividual
  fecha_compra: Date
  observaciones: string
  asignacion_actual_id: number | null
}

// Interfaz para elementos de stock general (sin número de serie)
export interface StockGeneral {
  id: number
  producto_id: number
  cantidad: number
  estado: EstadoStockGeneral
  fecha_actualizacion: Date
}

// Interfaz para asignaciones
export interface Asignacion {
  id: number
  inventario_id: number | null
  producto_id: number | null
  cantidad: number | null
  empleado_id: number | null
  sector_id: number | null
  sucursal_id: number | null
  fecha_asignacion: Date
  fecha_devolucion: Date | null
  observaciones: string
  contrasena_encriptacion: string | null
  info_gmail: string | null
}

// Interfaz para reparaciones
export interface Reparacion {
  id: number
  inventario_id: number
  fecha_envio: Date
  fecha_recepcion: Date | null
  proveedor: string
  motivo: string
  solucion: string | null
  costo: number | null
  estado: string
}

// Interfaz para movimientos de stock
export interface MovimientoStock {
  id: number
  producto_id: number
  tipo_movimiento: TipoMovimientoStock
  cantidad: number
  fecha_movimiento: Date
  usuario_id: number
  motivo: string
}

// Interfaz para empleados
export interface Empleado {
  id: number
  nombre: string
  apellido: string
  email: string
  sector_id: number
  sucursal_id: number
  activo: boolean
}

// Interfaz para sectores
export interface Sector {
  id: number
  nombre: string
  descripcion: string
  activo: boolean
}

// Interfaz para sucursales
export interface Sucursal {
  id: number;
  nombre: string;
  activo: boolean; // Corresponde a la columna 'activo' (BIT) en la BD
}

// Interfaz para reporte de auditoría de movimientos
export interface StockMovementReportItem {
  movimiento_id: number;
  producto: string;
  categoria: string;
  tipo_movimiento: string;
  cantidad: number;
  fecha_movimiento: Date;
  motivo: string;
  observaciones?: string;
  destino: string;
  tipo_destino: string;
  usuario_nombre: string;
  stock_anterior: number;
  stock_actual: number;
  TotalRecords: number;
}
