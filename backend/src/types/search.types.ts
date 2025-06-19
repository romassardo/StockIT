/**
 * Tipos para la funcionalidad de búsqueda global
 */

// Enum para los tipos de búsqueda
export enum SearchType {
  SERIAL_NUMBER = 'SerialNumber',
  ENCRYPTION_PASSWORD = 'EncryptionPassword',
  GENERAL = 'General'
}

// Enum para los tipos de resultados
export enum ResultType {
  INVENTORY = 'Inventario',
  ASSIGNMENT = 'Asignación',
  EMPLOYEE = 'Empleado',
  PRODUCT = 'Producto',
  SECTOR = 'Sector',
  BRANCH = 'Sucursal'
}

// Interfaz para resultados de búsqueda global
export interface SearchResult {
  resultType: ResultType;
  itemId: number;
  title: string;
  description: string;
  status: string;
  dateInfo: Date;
  entityType: string;
  serialNumber: string | null;
  encryptionPassword: string | null;
  relatedInfo: string | null;
}

// Interfaz para la respuesta paginada de búsqueda
export interface PaginatedSearchResponse {
  results: SearchResult[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// Interfaz para los parámetros de búsqueda
export interface SearchParams {
  searchTerm: string;
  searchType?: SearchType;
  page?: number;
  limit?: number;
}