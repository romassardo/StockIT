import React, { useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiSearch } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';

// Tipos
export interface Column<T = any> {
  id: string;
  header: string;
  accessor: (row: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  total: number;
}

export interface DataTableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  initialSort?: SortConfig;
  pagination?: PaginationState;
  onPageChange?: (page: number) => void;
  onSearch?: (term: string) => void;
  actionColumn?: (row: T) => React.ReactNode;
  keyExtractor: (row: T) => string | number;
  emptyMessage?: string;
}

const DataTable = <T extends object>({
  columns,
  data,
  isLoading = false,
  onRowClick,
  initialSort,
  pagination,
  onPageChange,
  onSearch,
  actionColumn,
  keyExtractor,
  emptyMessage = "No hay datos disponibles"
}: DataTableProps<T>) => {
  const { theme } = useTheme();
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(initialSort || null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Manejar cambio de término de búsqueda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (onSearch) {
      onSearch(term);
    }
  };

  // Manejar cambio de orden
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === key) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }
    
    setSortConfig({ key, direction });
  };

  // Manejar cambio de página
  const handlePageChange = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
    }
  };

  return (
    <div className="w-full">
      {/* Barra de búsqueda y filtros */}
      {onSearch && (
        <div className="mb-4 flex justify-between items-center">
          <div className="relative w-64">
            <label htmlFor="table-search" className="sr-only">
              Buscar en la tabla de datos
            </label>
            <input
              type="text"
              id="table-search"
              name="tableSearch"
              className={`w-full p-2 pl-10 border rounded-md transition-all duration-300 focus:outline-none ${
                theme === 'dark'
                  ? 'border-dark-border bg-dark-bg-surface text-dark-text-primary placeholder-dark-text-muted focus:border-primary'
                  : 'border-[#CED4DA] bg-white text-[#212529] placeholder-[#6C757D] focus:border-[#3F51B5] focus:shadow-[0_0_0_3px_rgba(63,81,181,0.15)]'
              }`}
              placeholder="Buscar..."
              value={searchTerm}
              onChange={handleSearchChange}
              autoComplete="off"
              aria-label="Buscar en la tabla"
              aria-describedby="table-search-help"
            />
            <span id="table-search-help" className="sr-only">
              Busque datos específicos en la tabla actual
            </span>
            <FiSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
              theme === 'dark' ? 'text-dark-text-muted' : 'text-[#6C757D]'
            }`} />
          </div>
          {/* Aquí se pueden agregar más filtros si es necesario */}
        </div>
      )}

      {/* Tabla */}
      <div className={`w-full overflow-x-auto border rounded-md transition-all duration-300 ${
        theme === 'dark' 
          ? 'border-dark-border shadow-dark-sm' 
          : 'border-[#DEE2E6] shadow-sm'
      }`}>
        <table className="min-w-full divide-y divide-[#DEE2E6] dark:divide-dark-border">
          <thead className={`transition-colors duration-300 ${
            theme === 'dark' ? 'bg-dark-bg-secondary' : 'bg-[#F8F9FA]'
          }`}>
            <tr>
              {columns.map((column) => (
                <th
                  key={`header-${column.id}`}
                  className={`px-6 py-3 text-left text-sm font-semibold transition-colors duration-300 ${
                    theme === 'dark' ? 'text-dark-text-secondary' : 'text-[#495057]'
                  } ${column.width ? column.width : ''}`}
                  onClick={() => column.sortable && handleSort(column.id)}
                  style={{ cursor: column.sortable ? 'pointer' : 'default' }}
                >
                  <div className="flex items-center">
                    {column.header}
                    {column.sortable && sortConfig && sortConfig.key === column.id && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actionColumn && (
                <th key="header-actions" className={`px-6 py-3 text-left text-sm font-semibold transition-colors duration-300 ${
                  theme === 'dark' ? 'text-dark-text-secondary' : 'text-[#495057]'
                }`}>
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className={`divide-y transition-all duration-300 ${
            theme === 'dark' 
              ? 'bg-dark-bg-surface divide-dark-border' 
              : 'bg-white divide-[#DEE2E6]'
          }`}>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + (actionColumn ? 1 : 0)} className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#3F51B5]"></div>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actionColumn ? 1 : 0)} className={`px-6 py-4 text-center transition-colors duration-300 ${
                  theme === 'dark' ? 'text-dark-text-secondary' : 'text-[#495057]'
                }`}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  className={`transition-colors duration-300 ${
                    theme === 'dark' 
                      ? 'hover:bg-dark-bg-primary' 
                      : 'hover:bg-[#F1F3F5]'
                  }`}
                  onClick={() => onRowClick && onRowClick(row)}
                  style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {columns.map((column) => (
                    <td key={`${keyExtractor(row)}-${column.id}`} className={`px-6 py-4 text-sm transition-colors duration-300 ${
                      theme === 'dark' ? 'text-dark-text-primary' : 'text-[#212529]'
                    }`}>
                      {column.accessor(row)}
                    </td>
                  ))}
                  {actionColumn && (
                    <td className="px-6 py-4 text-sm">
                      {actionColumn(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {pagination && (
        <div className={`py-3 flex items-center justify-between border-t mt-3 transition-colors duration-300 ${
          theme === 'dark' ? 'border-dark-border' : 'border-[#DEE2E6]'
        }`}>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className={`text-sm transition-colors duration-300 ${
                theme === 'dark' ? 'text-dark-text-secondary' : 'text-[#495057]'
              }`}>
                Mostrando <span className="font-medium">{Math.min(pagination.pageSize || 0, pagination.total || 0)}</span> de{' '}
                <span className="font-medium">{pagination.total || 0}</span> resultados
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium transition-all duration-300 ${
                    pagination.currentPage === 1
                      ? theme === 'dark'
                        ? 'text-dark-text-muted cursor-not-allowed bg-dark-bg-surface border-dark-border'
                        : 'text-[#6C757D] cursor-not-allowed bg-white border-[#DEE2E6]'
                      : theme === 'dark'
                        ? 'text-dark-text-primary bg-dark-bg-surface border-dark-border hover:bg-dark-bg-primary'
                        : 'text-[#495057] bg-white border-[#DEE2E6] hover:bg-[#E8EAF6]'
                  }`}
                >
                  <FiChevronLeft className="h-5 w-5" />
                </button>
                
                {/* Números de página */}
                {Array.from({ length: Math.ceil((pagination.total || 0) / (pagination.pageSize || 1)) }, (_, i) => i + 1)
                  .slice(Math.max(0, pagination.currentPage - 3), pagination.currentPage + 2)
                  .map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-all duration-300 ${
                        page === pagination.currentPage
                          ? theme === 'dark'
                            ? 'bg-primary text-white border-primary'
                            : 'bg-[#3F51B5] text-white border-[#3F51B5]'
                          : theme === 'dark'
                            ? 'text-dark-text-primary bg-dark-bg-surface border-dark-border hover:bg-dark-bg-primary'
                            : 'text-[#495057] bg-white border-[#DEE2E6] hover:bg-[#E8EAF6]'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === Math.ceil(pagination.total / pagination.pageSize)}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium transition-all duration-300 ${
                    pagination.currentPage === Math.ceil(pagination.total / pagination.pageSize)
                      ? theme === 'dark'
                        ? 'text-dark-text-muted cursor-not-allowed bg-dark-bg-surface border-dark-border'
                        : 'text-[#6C757D] cursor-not-allowed bg-white border-[#DEE2E6]'
                      : theme === 'dark'
                        ? 'text-dark-text-primary bg-dark-bg-surface border-dark-border hover:bg-dark-bg-primary'
                        : 'text-[#495057] bg-white border-[#DEE2E6] hover:bg-[#E8EAF6]'
                  }`}
                >
                  <FiChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
