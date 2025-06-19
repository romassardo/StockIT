import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Filter, History, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Calendar, User, Building, MapPin } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { stockService, MovimientoStock, StockMovementsFilters } from '../../services/stock.service';

// 🎯 Constantes de configuración
const Z_INDEX = {
  MODAL_BACKDROP: 9998,
  MODAL_CONTENT: 9999
} as const;

interface StockMovementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: number;
  productName?: string;
}

const StockMovementsModal: React.FC<StockMovementsModalProps> = ({
  isOpen,
  onClose,
  productId,
  productName
}) => {
  const { theme } = useTheme();
  const [movements, setMovements] = useState<MovimientoStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<StockMovementsFilters>({
    producto_id: productId,
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({
    hasMore: false,
    total: 0
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadMovements();
    }
  }, [isOpen, filters]);

  const loadMovements = async () => {
    setLoading(true);
    try {
      const result = await stockService.getStockMovements(filters);
      setMovements(result.movements);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Error al cargar movimientos:', error);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof StockMovementsFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset page when filters change
    }));
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    // Simular filtro global - en el backend se implementaría la búsqueda
    setFilters(prev => ({
      ...prev,
      search: value || undefined,
      page: 1
    }));
  };

  const clearFilters = () => {
    setSearchTerm(''); // Limpiar búsqueda global
    setFilters({
      producto_id: productId,
      page: 1,
      limit: 20
    });
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMovementIcon = (tipo: string) => {
    return tipo === 'Entrada' ? TrendingUp : TrendingDown;
  };

  const getMovementColor = (tipo: string) => {
    return tipo === 'Entrada' 
      ? 'text-success-600 bg-success-500/10' 
      : 'text-danger-600 bg-danger-500/10';
  };

  if (!isOpen) return null;

  const modalContent = (
    <>
      {/* 🎭 Modal Backdrop con z-index máximo */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        style={{ zIndex: Z_INDEX.MODAL_BACKDROP }}
      />
      
      {/* 🔮 Modal Container con z-index máximo */}
      <div 
        className="fixed inset-0 flex items-center justify-center p-3"
        style={{ zIndex: Z_INDEX.MODAL_CONTENT }}
        onClick={onClose}
      >
        <div 
          className="glass-card animate-glass-appear relative w-full max-w-6xl max-h-[92vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ✨ Header compacto */}
          <div className="relative p-4 border-b border-white/10">
            {/* Gradiente de fondo del header */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-purple-500/5 to-transparent pointer-events-none" />
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-500 rounded-xl flex items-center justify-center shadow-primary animate-pulse-glow">
                  <History className="w-6 h-6 text-white filter drop-shadow-lg" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gradient-primary mb-1">
                    Historial de Movimientos
                  </h2>
                  <p className={`text-sm transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {productName ? `Movimientos de ${productName}` : 'Todos los movimientos de stock'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`
                    w-10 h-10 rounded-xl border border-white/10 backdrop-blur-sm transition-all duration-300 hover-lift flex items-center justify-center group
                    ${showFilters 
                      ? 'bg-primary-500/20 text-primary-600 border-primary-500/30' 
                      : theme === 'dark' 
                        ? 'bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 group-hover:text-white' 
                        : 'bg-slate-100/50 hover:bg-slate-200/50 text-slate-500 group-hover:text-slate-700'
                    }
                  `}
                >
                  <Filter className="w-5 h-5" />
                </button>
                
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 border border-white/10 hover:border-white/20 backdrop-blur-sm transition-all duration-300 hover-lift flex items-center justify-center group"
                >
                  <X className={`w-5 h-5 transition-colors duration-300 ${
                    theme === 'dark' 
                      ? 'text-slate-400 group-hover:text-white' 
                      : 'text-slate-500 group-hover:text-slate-700'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Filtros colapsables */}
          {showFilters && (
            <div className={`
              p-4 border-b border-white/10 backdrop-filter backdrop-blur-10 relative
              ${theme === 'dark' ? 'bg-slate-800/30' : 'bg-white/30'}
            `}>
              {/* Gradiente de fondo de filtros */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-transparent pointer-events-none" />
              
              <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Filtro por búsqueda global */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    🔍 Búsqueda Global
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="input-glass"
                    placeholder="Buscar por producto, marca, motivo, usuario..."
                  />
                </div>

                {/* Filtro por fecha inicio */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    📅 Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={filters.fecha_inicio || ''}
                    onChange={(e) => handleFilterChange('fecha_inicio', e.target.value)}
                    className="input-glass"
                  />
                </div>

                {/* Filtro por fecha fin */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    📅 Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={filters.fecha_fin || ''}
                    onChange={(e) => handleFilterChange('fecha_fin', e.target.value)}
                    className="input-glass"
                  />
                </div>

                {/* Filtro por tipo */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    📋 Tipo de Movimiento
                  </label>
                  <select
                    value={filters.tipo_movimiento || ''}
                    onChange={(e) => handleFilterChange('tipo_movimiento', e.target.value || undefined)}
                    className="input-glass"
                  >
                    <option value="">Todos los tipos</option>
                    <option value="Entrada">Solo Entradas</option>
                    <option value="Salida">Solo Salidas</option>
                  </select>
                </div>

                {/* Botón limpiar filtros */}
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="btn-glass-secondary w-full hover-lift"
                  >
                    🧹 Limpiar Filtros
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 📱 Contenido scrolleable optimizado */}
          <div className="overflow-y-auto max-h-[calc(92vh-180px)] scrollbar-hide">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 mx-auto border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
                  <p className={`text-lg font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    Cargando movimientos...
                  </p>
                </div>
              </div>
            ) : movements.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-500/10 flex items-center justify-center">
                  <History className="w-10 h-10 opacity-50" />
                </div>
                <h3 className="text-xl font-bold mb-2 opacity-75">No hay movimientos registrados</h3>
                <p className={`text-sm opacity-50 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  {productName ? `No se encontraron movimientos para ${productName}` : 'No se encontraron movimientos con los filtros seleccionados'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className={`sticky top-0 z-10 ${theme === 'dark' ? 'bg-slate-800/90' : 'bg-slate-50/90'} backdrop-blur-sm`}>
                    <tr>
                      <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-500'
                      }`}>
                        Tipo
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-500'
                      }`}>
                        Producto
                      </th>
                      <th className={`px-6 py-4 text-center text-xs font-bold uppercase tracking-wider ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-500'
                      }`}>
                        Cantidad
                      </th>
                      <th className={`px-6 py-4 text-center text-xs font-bold uppercase tracking-wider ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-500'
                      }`}>
                        Stock Anterior → Actual
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-500'
                      }`}>
                        Destino
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-500'
                      }`}>
                        Fecha / Usuario
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-700/50' : 'divide-slate-200/50'}`}>
                    {movements.map((movement) => {
                      const Icon = getMovementIcon(movement.tipo_movimiento);
                      const colorClass = getMovementColor(movement.tipo_movimiento);
                      
                      return (
                        <tr key={movement.movimiento_id} className={`transition-colors duration-200 hover:scale-[1.01] ${
                          theme === 'dark' ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50/80'
                        }`}>
                          {/* Tipo de movimiento */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold border backdrop-blur-sm ${colorClass} ${
                              movement.tipo_movimiento === 'Entrada' 
                                ? 'border-success-500/30 shadow-success' 
                                : 'border-danger-500/30 shadow-danger'
                            }`}>
                              <Icon className="w-4 h-4" />
                              {movement.tipo_movimiento}
                            </div>
                          </td>
                          
                                                     {/* Producto */}
                           <td className={`px-6 py-4 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                             <div className="font-semibold text-sm">
                               {movement.nombre_marca} {movement.nombre_producto}
                             </div>
                             <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                               📦 {movement.nombre_marca || 'Producto'}
                             </div>
                             {movement.motivo && (
                               <div className={`text-xs mt-1 font-medium ${theme === 'dark' ? 'text-primary-400' : 'text-primary-600'}`}>
                                 💡 {movement.motivo}
                               </div>
                             )}
                             {movement.observaciones && (
                               <div className={`text-xs mt-1 italic ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                                 📝 {movement.observaciones}
                               </div>
                             )}
                          </td>
                          
                          {/* Cantidad */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`text-2xl font-bold ${
                              movement.tipo_movimiento === 'Entrada' ? 'text-success-600' : 'text-danger-600'
                            }`}>
                              {movement.tipo_movimiento === 'Entrada' ? '+' : '-'}{movement.cantidad}
                            </span>
                          </td>
                          
                          {/* Stock anterior → actual */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className={`text-sm font-mono ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                              <span className="opacity-60">{movement.stock_anterior}</span>
                              <span className="mx-2 text-primary-500">→</span>
                              <span className="font-bold">{movement.stock_actual}</span>
                            </div>
                          </td>
                          
                          {/* Destino */}
                          <td className={`px-6 py-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                            {movement.empleado_nombre && (
                              <div className="flex items-center gap-2 text-sm mb-1">
                                <User className="w-4 h-4 text-emerald-500" />
                                <span className="font-medium">{movement.empleado_nombre}</span>
                              </div>
                            )}
                            {movement.sector_nombre && (
                              <div className="flex items-center gap-2 text-sm mb-1">
                                <Building className="w-4 h-4 text-blue-500" />
                                <span className="font-medium">{movement.sector_nombre}</span>
                              </div>
                            )}
                            {movement.sucursal_nombre && (
                              <div className="flex items-center gap-2 text-sm mb-1">
                                <MapPin className="w-4 h-4 text-purple-500" />
                                <span className="font-medium">{movement.sucursal_nombre}</span>
                              </div>
                            )}
                            {!movement.empleado_nombre && !movement.sector_nombre && !movement.sucursal_nombre && (
                              <span className="text-sm opacity-50 italic">Sin destino específico</span>
                            )}
                          </td>
                          
                          {/* Fecha y Usuario */}
                          <td className={`px-6 py-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                            <div className="flex items-center gap-2 text-sm mb-1">
                              <Calendar className="w-4 h-4 text-indigo-500" />
                              <span className="font-mono text-xs">{formatDate(movement.fecha_movimiento)}</span>
                            </div>
                            <div className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                              👤 Por: <span className="font-medium">{movement.usuario_nombre}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Paginación */}
          {movements.length > 0 && (
            <div className={`
              flex items-center justify-between p-4 border-t border-white/10 relative
              ${theme === 'dark' ? 'bg-slate-800/20' : 'bg-slate-50/50'}
            `}>
              {/* Gradiente de fondo del footer */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-500/5 via-transparent to-slate-500/5 pointer-events-none" />
              
              <div className={`relative text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                📊 Página {filters.page || 1} • {movements.length} movimientos
              </div>
              
              <div className="relative flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange((filters.page || 1) - 1)}
                  disabled={!filters.page || filters.page <= 1}
                  className="btn-glass-secondary px-3 py-2 hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="px-4 py-2 rounded-xl bg-primary-500/20 text-primary-600 font-bold border border-primary-500/30 backdrop-blur-sm">
                  {filters.page || 1}
                </div>
                
                <button
                  onClick={() => handlePageChange((filters.page || 1) + 1)}
                  disabled={!pagination.hasMore}
                  className="btn-glass-secondary px-3 py-2 hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );

  // Usar createPortal para renderizar el modal en el body del documento
  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
};

export default StockMovementsModal; 