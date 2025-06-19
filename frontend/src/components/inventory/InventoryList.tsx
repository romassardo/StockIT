import React from 'react';
import { FiEye, FiRefreshCw, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { InventoryItem, Pagination } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface InventoryListProps {
  items: InventoryItem[];
  viewMode: 'grid' | 'list';
  pagination: Pagination;
  onPageChange: (page: number) => void;
  onItemSelect: (item: InventoryItem) => void;
  onRefresh: () => void;
}

const InventoryList: React.FC<InventoryListProps> = ({
  items,
  viewMode,
  pagination,
  onPageChange,
  onItemSelect,
  onRefresh
}) => {
  const { theme } = useTheme();
  
  // Función para obtener el color del estado
  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'Disponible':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Asignado':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'En reparación':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Baja':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (items.length === 0) {
    return (
      <div className={`border rounded-2xl p-8 shadow-lg transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-slate-800/60 backdrop-blur-20 border-slate-700/30'
          : 'bg-white/60 backdrop-blur-20 border-white/30'
      }`}>
        <div className="text-center py-12">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
            theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'
          }`}>
            <FiRefreshCw className={`w-8 h-8 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-400'
            }`} />
          </div>
          <h3 className={`text-xl font-semibold mb-2 ${
            theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
          }`}>No se encontraron items</h3>
          <p className={`mb-6 ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>
            No hay items de inventario que coincidan con los filtros aplicados.
          </p>
          <button
            onClick={onRefresh}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl transition-colors duration-200 flex items-center gap-2 mx-auto"
          >
            <FiRefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lista de items */}
      <div className={`border rounded-2xl p-6 shadow-lg transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-slate-800/60 backdrop-blur-20 border-slate-700/30'
          : 'bg-white/60 backdrop-blur-20 border-white/30'
      }`}>
        {/* Header con contador y botón refresh */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className={`text-lg font-semibold ${
              theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
            }`}>
              Items de Inventario
            </h3>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}>
              {pagination.totalItems} items encontrados
            </p>
          </div>
          <button
            onClick={onRefresh}
            className={`p-2 rounded-xl transition-colors duration-200 ${
              theme === 'dark'
                ? 'bg-slate-700/70 hover:bg-slate-600/90'
                : 'bg-white/70 hover:bg-white/90'
            }`}
            title="Actualizar lista"
          >
            <FiRefreshCw className={`w-5 h-5 ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
            }`} />
          </button>
        </div>

        {/* Vista Grid */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className={`group border rounded-xl p-4 hover:shadow-lg transition-all duration-200 cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-700/70 backdrop-blur-10 border-slate-600/50 hover:bg-slate-700/80'
                    : 'bg-white/70 backdrop-blur-10 border-white/50 hover:bg-white/80'
                }`}
                onClick={() => onItemSelect(item)}
              >
                {/* Header del card */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold truncate text-sm ${
                      theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
                    }`}>
                      {item.numero_serie}
                    </h4>
                    <p className={`text-xs truncate ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      {(item.producto?.marca && item.producto?.modelo) ? 
                        `${item.producto.marca} ${item.producto.modelo}` : 
                        'Producto desconocido'}
                    </p>
                  </div>
                  <span className={`ml-2 px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(item.estado)}`}>
                    {item.estado}
                  </span>
                </div>

                {/* Información adicional */}
                <div className={`space-y-2 text-xs ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  {item.producto?.categoria && (
                    <div className="flex justify-between">
                      <span>Categoría:</span>
                      <span className="font-medium">{item.producto.categoria.nombre}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Fecha:</span>
                    <span>{formatDate(item.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ID:</span>
                    <span className="font-mono">#{item.id}</span>
                  </div>
                </div>

                {/* Botón de acción */}
                <div className={`mt-4 pt-3 border-t ${
                  theme === 'dark' ? 'border-slate-600/30' : 'border-white/30'
                }`}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onItemSelect(item);
                    }}
                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-3 rounded-lg text-xs font-medium transition-colors duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100"
                  >
                    <FiEye className="w-3 h-3" />
                    Ver Detalle
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Vista Lista */}
        {viewMode === 'list' && (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className={`group border rounded-xl p-4 hover:shadow-lg transition-all duration-200 cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-700/70 backdrop-blur-10 border-slate-600/50 hover:bg-slate-700/80'
                    : 'bg-white/70 backdrop-blur-10 border-white/50 hover:bg-white/80'
                }`}
                onClick={() => onItemSelect(item)}
              >
                <div className="flex items-center justify-between">
                  {/* Información principal */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    {/* Número de serie */}
                    <div>
                      <div className={`font-semibold ${
                        theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
                      }`}>{item.numero_serie}</div>
                      <div className={`text-sm ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}>#{item.id}</div>
                    </div>

                    {/* Producto */}
                    <div>
                      <div className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
                      }`}>
                        {(item.producto?.marca && item.producto?.modelo) ? 
                          `${item.producto.marca} ${item.producto.modelo}` : 
                          'Producto desconocido'}
                      </div>
                      <div className={`text-xs ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        {item.producto?.categoria?.nombre}
                      </div>
                    </div>

                    {/* Estado */}
                    <div>
                      <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${getStatusColor(item.estado)}`}>
                        {item.estado}
                      </span>
                    </div>

                    {/* Fecha */}
                    <div className={`text-sm ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      {formatDate(item.created_at)}
                    </div>
                  </div>

                  {/* Botón de acción */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onItemSelect(item);
                    }}
                    className="ml-4 p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors duration-200 opacity-0 group-hover:opacity-100"
                    title="Ver detalle"
                  >
                    <FiEye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div className={`border rounded-2xl p-4 shadow-lg transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-slate-800/60 backdrop-blur-20 border-slate-700/30'
            : 'bg-white/60 backdrop-blur-20 border-white/30'
        }`}>
          <div className="flex items-center justify-between">
            {/* Información de paginación */}
            <div className={`text-sm ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.totalItems)} de {pagination.totalItems} items
            </div>

            {/* Controles de paginación */}
            <div className="flex items-center space-x-2">
              {/* Botón anterior */}
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className={`p-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  theme === 'dark'
                    ? 'bg-slate-700/70 text-slate-300 hover:bg-slate-600/90'
                    : 'bg-white/70 text-slate-600 hover:bg-white/90'
                }`}
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>

              {/* Números de página */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                  let pageNumber;
                  if (pagination.totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNumber = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNumber = pagination.totalPages - 4 + i;
                  } else {
                    pageNumber = pagination.page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => onPageChange(pageNumber)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        pageNumber === pagination.page
                          ? 'bg-indigo-500 text-white'
                          : theme === 'dark'
                            ? 'bg-slate-700/70 text-slate-300 hover:bg-slate-600/90'
                            : 'bg-white/70 text-slate-600 hover:bg-white/90'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>

              {/* Botón siguiente */}
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className={`p-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  theme === 'dark'
                    ? 'bg-slate-700/70 text-slate-300 hover:bg-slate-600/90'
                    : 'bg-white/70 text-slate-600 hover:bg-white/90'
                }`}
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryList; 