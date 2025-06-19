// frontend/src/types/Repair.ts

export interface Repair {
  id: number; // Cambiado de reparacion_id a id para coincidir con el SP
  inventario_individual_id: number;
  numero_serie: string;
  producto_marca: string;
  producto_modelo: string;
  producto_categoria: string;
  fecha_envio: string; // ISO date string
  proveedor: string;
  problema_descripcion: string;
  estado: string;
  usuario_envia_nombre: string;
}

// Podrías tener otros tipos relacionados, por ejemplo, para el formulario de envío
export interface RepairFormData {
  inventario_individual_id: number;
  proveedor: string;
  descripcion_problema: string;
  usuario_envia_id: number;
}

// Para las opciones del selector de activos
export interface AssetForRepairOption {
  value: number; // inventario_individual_id
  label: string; // Ej: "Notebook Dell XPS 15 - SN: XXXXXX (Asignado a Usuario)"
  tipo_producto: string;
  marca: string;
  modelo: string;
  numero_serie: string;
  estado_actual: string; // 'Disponible' o 'Asignado'
  asignado_a?: string | null; // Nombre del usuario si está asignado
}
