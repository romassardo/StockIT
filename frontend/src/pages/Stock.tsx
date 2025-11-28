import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Package, TrendingDown, AlertTriangle, Search, BarChart3, RefreshCw, Plus, Minus } from 'lucide-react';
import { stockService, ProductoStock } from '../services/stock.service';
import StockEntryModal from '../components/stock/StockEntryModal';
import StockExitModal from '../components/stock/StockExitModal';
import StockAlertsModal from '../components/stock/StockAlertsModal';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';

const Stock: React.FC = () => {
  const { theme } = useTheme();
  const { addNotification } = useNotification();

  // Estados principales
  const [productos, setProductos] = useState<ProductoStock[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de UI
  const [showStockEntry, setShowStockEntry] = useState(false);
  const [showStockExit, setShowStockExit] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductoStock | null>(null);

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'normal' | 'empty'>('all');

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Cargar datos
  const loadStockData = useCallback(async () => {
    try {
      setLoading(true);

      const stockData = await stockService.getCurrentStock();
      setProductos(stockData);
    } catch (err: any) {
      addNotification({
        type: 'error',
        title: 'Error de Conexión',
        message: 'No se pudieron cargar los datos del stock'
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    loadStockData();
  }, [loadStockData]);

  // Estadísticas computadas con memoización
  const stats = useMemo(() => {
    const totalProductos = productos.length;
    const totalUnidades = productos.reduce((sum, p) => sum + (Number(p.cantidad_actual) || 0), 0);
    const alertasActivas = productos.filter(p => p.cantidad_actual <= p.min_stock).length;
    const sinStock = productos.filter(p => p.cantidad_actual === 0).length;

    return {
      totalProductos,
      totalUnidades,
      alertasActivas,
      sinStock
    };
  }, [productos]);

  // Productos filtrados
  const filteredProductos = useMemo(() => {
    let filtered = productos;

    // Filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.nombre_marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.nombre_producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.nombre_categoria?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por categoría
    if (categoryFilter) {
      filtered = filtered.filter(p => p.categoria_id.toString() === categoryFilter);
    }

    // Filtro por estado de stock
    if (stockFilter !== 'all') {
      filtered = filtered.filter(p => {
        if (stockFilter === 'empty') return p.cantidad_actual === 0;
        if (stockFilter === 'low') return p.cantidad_actual > 0 && p.cantidad_actual <= p.min_stock;
        if (stockFilter === 'normal') return p.cantidad_actual > p.min_stock;
        return true;
      });
    }

    return filtered;
  }, [productos, searchTerm, categoryFilter, stockFilter]);

  // Paginación
  const paginatedProductos = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProductos.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProductos, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProductos.length / itemsPerPage);

  // Función para obtener el estado visual del stock
  const getStockStatus = (cantidad: number, minimo: number) => {
    if (cantidad === 0) return { 
      status: 'empty', 
      color: 'text-red-500', 
      bg: 'bg-red-500/10 border-red-500/20', 
      label: 'Sin Stock' 
    };
    if (cantidad <= minimo) return { 
      status: 'low', 
      color: 'text-amber-500', 
      bg: 'bg-amber-500/10 border-amber-500/20', 
      label: 'Bajo Mínimo' 
    };
    return { 
      status: 'normal', 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-500/10 border-emerald-500/20', 
      label: 'Stock Normal' 
    };
  };

  // Manejo de modales
  const handleOpenEntry = (product?: ProductoStock) => {
    setSelectedProduct(product || null);
    setShowStockEntry(true);
  };

  const handleOpenExit = (product: ProductoStock) => {
    setSelectedProduct(product);
    setShowStockExit(true);
  };

  const handleModalClose = () => {
    setShowStockEntry(false);
    setShowStockExit(false);
    setSelectedProduct(null);
  };

  const handleEntrySuccess = (updatedProduct: { producto_id: number; stock_actual: number }) => {
    setProductos(prevProductos =>
      prevProductos.map(p =>
        p.producto_id === updatedProduct.producto_id
          ? { ...p, cantidad_actual: updatedProduct.stock_actual }
          : p
      )
    );
    
    handleModalClose();
    
    addNotification({
      type: 'success',
      title: 'Operación Exitosa',
      message: 'El stock se ha actualizado correctamente.'
    });
  };

  const handleModalSuccess = () => {
    handleModalClose();
    loadStockData();
    addNotification({
      type: 'success',
      title: 'Operación Exitosa',
      message: 'El movimiento de stock se registró correctamente'
    });
  };

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setStockFilter('all');
    setCurrentPage(1);
  };

  // Categorías únicas para el filtro
  const categorias = useMemo(() => {
    const categoriaMap = new Map();
    
    productos.forEach(producto => {
      if (producto.nombre_categoria && !categoriaMap.has(producto.categoria_id)) {
        categoriaMap.set(producto.categoria_id, {
          id: producto.categoria_id,
          nombre: producto.nombre_categoria
        });
      }
    });
    
    return Array.from(categoriaMap.values());
  }, [productos]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className={`text-lg font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
            Cargando inventario...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-300 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
      
      {/* Header Principal */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
               <Package size={24} />
             </div>
             <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
               Stock General
             </h1>
          </div>
          <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Control de cantidades y movimientos de productos
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAlertsModal(true)}
            className={`px-4 py-2 rounded-xl border font-medium text-sm transition-all flex items-center gap-2 relative ${
              theme === 'dark' 
                ? 'border-slate-700 hover:bg-slate-800 text-slate-300' 
                : 'border-slate-200 hover:bg-slate-50 text-slate-600'
            }`}
          >
            <AlertTriangle size={18} className={stats.alertasActivas > 0 ? 'text-amber-500' : ''} /> 
            Alertas
            {stats.alertasActivas > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-xs flex items-center justify-center rounded-full shadow-sm">
                {stats.alertasActivas}
              </span>
            )}
          </button>
          <button 
            onClick={() => handleOpenEntry()}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30 flex items-center gap-2"
          >
            <Plus size={18} /> Entrada Manual
          </button>
        </div>
      </header>

      {/* Estadísticas Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { 
            label: 'Productos Totales', 
            value: stats.totalProductos, 
            icon: Package, 
            color: 'bg-indigo-500',
            bg: theme === 'dark' ? 'bg-indigo-500/10' : 'bg-indigo-50'
          },
          { 
            label: 'Unidades en Stock', 
            value: stats.totalUnidades.toLocaleString(), 
            icon: BarChart3, 
            color: 'bg-emerald-500',
            bg: theme === 'dark' ? 'bg-emerald-500/10' : 'bg-emerald-50'
          },
          { 
            label: 'Alertas de Stock', 
            value: stats.alertasActivas, 
            icon: AlertTriangle, 
            color: 'bg-amber-500',
            bg: theme === 'dark' ? 'bg-amber-500/10' : 'bg-amber-50'
          },
          { 
            label: 'Sin Stock', 
            value: stats.sinStock, 
            icon: TrendingDown, 
            color: 'bg-red-500',
            bg: theme === 'dark' ? 'bg-red-500/10' : 'bg-red-50'
          }
        ].map((stat, index) => (
          <div 
            key={index} 
            className={`
              relative overflow-hidden rounded-2xl p-5 transition-all hover:scale-[1.02]
              ${theme === 'dark' 
                ? 'bg-slate-900/60 border border-slate-700/50 backdrop-blur-xl' 
                : 'bg-white/80 border border-slate-200/60 shadow-xl shadow-slate-200/20 backdrop-blur-xl'
              }
            `}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-sm font-medium mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  {stat.label}
                </p>
                <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                  {stat.value}
                </h3>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon size={20} className={stat.color.replace('bg-', 'text-')} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Barra de Filtros */}
      <div className={`
        p-4 rounded-2xl mb-6 flex flex-col lg:flex-row gap-4 justify-between items-center
        ${theme === 'dark' 
          ? 'bg-slate-900/60 border border-slate-700/50 backdrop-blur-xl' 
          : 'bg-white/80 border border-slate-200/60 shadow-xl shadow-slate-200/20 backdrop-blur-xl'
        }
      `}>
        <div className="w-full lg:w-96 relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre, marca o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`
              w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all border
              ${theme === 'dark' 
                ? 'bg-slate-800/50 border-slate-700 focus:border-indigo-500 text-white placeholder-slate-500' 
                : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-800 placeholder-slate-400'
              }
            `}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={`
              px-4 py-2.5 rounded-xl text-sm outline-none border cursor-pointer
              ${theme === 'dark' 
                ? 'bg-slate-800/50 border-slate-700 text-slate-200 focus:border-indigo-500' 
                : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-indigo-500'
              }
            `}
          >
            <option value="">Todas las categorías</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.id.toString()}>{cat.nombre}</option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className={`
              px-4 py-2.5 rounded-xl text-sm outline-none border cursor-pointer
              ${theme === 'dark' 
                ? 'bg-slate-800/50 border-slate-700 text-slate-200 focus:border-indigo-500' 
                : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-indigo-500'
              }
            `}
          >
            <option value="all">Todos los estados</option>
            <option value="normal">Stock Normal</option>
            <option value="low">Bajo Mínimo</option>
            <option value="empty">Sin Stock</option>
          </select>

          <div className="flex gap-2">
            <button 
              onClick={loadStockData}
              className={`p-2.5 rounded-xl border transition-colors ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-500'}`}
              title="Actualizar"
            >
              <RefreshCw size={18} />
            </button>
            {(searchTerm || categoryFilter || stockFilter !== 'all') && (
              <button
                onClick={clearFilters}
                className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium hover:opacity-80 transition-opacity"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabla de Stock */}
      <div className={`
        rounded-2xl overflow-hidden border
        ${theme === 'dark' 
          ? 'bg-slate-900/60 border-slate-700/50 backdrop-blur-xl' 
          : 'bg-white/80 border-slate-200/60 shadow-xl shadow-slate-200/20 backdrop-blur-xl'
        }
      `}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`text-xs uppercase tracking-wider font-semibold border-b ${theme === 'dark' ? 'text-slate-400 border-slate-700 bg-slate-800/30' : 'text-slate-500 border-slate-200 bg-slate-50/50'}`}>
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4 text-center">Estado Stock</th>
                <th className="px-6 py-4 text-center">Cantidad</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
              {paginatedProductos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Package size={48} className="mb-4 opacity-20" />
                      <p className="text-lg font-medium">No se encontraron productos</p>
                      <p className="text-sm">Intenta ajustar los filtros o buscar otro término</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProductos.map((producto, index) => {
                  const stockStatus = getStockStatus(producto.cantidad_actual, producto.min_stock);
                  return (
                    <tr 
                      key={`${producto.producto_id}-${index}`}
                      className={`group transition-colors ${theme === 'dark' ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className={`font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                            {producto.nombre_producto}
                          </span>
                          <span className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                            {producto.nombre_marca}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm opacity-80">
                        {producto.nombre_categoria}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${stockStatus.bg} ${stockStatus.color}`}>
                          {stockStatus.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            {producto.cantidad_actual}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Min: {producto.min_stock}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEntry(producto)}
                            className="p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 transition-colors"
                            title="Agregar Stock"
                          >
                            <Plus size={18} />
                          </button>
                          <button
                            onClick={() => handleOpenExit(producto)}
                            disabled={producto.cantidad_actual === 0}
                            className={`p-2 rounded-lg transition-colors ${
                              producto.cantidad_actual === 0 
                                ? 'opacity-30 cursor-not-allowed text-slate-400' 
                                : 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400'
                            }`}
                            title="Registrar Salida"
                          >
                            <Minus size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className={`px-6 py-4 border-t flex items-center justify-between ${theme === 'dark' ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50/50'}`}>
            <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Página {currentPage} de {totalPages} ({filteredProductos.length} items)
            </span>
            <div className="flex gap-2">
              <select
                value={itemsPerPage.toString()}
                onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                className={`px-2 py-1 rounded-lg text-sm border outline-none ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-lg text-sm border transition-all ${
                  currentPage === 1 
                    ? 'opacity-50 cursor-not-allowed border-transparent' 
                    : theme === 'dark' ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-white'
                }`}
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-lg text-sm border transition-all ${
                  currentPage === totalPages 
                    ? 'opacity-50 cursor-not-allowed border-transparent' 
                    : theme === 'dark' ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-white'
                }`}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      {showStockEntry && (
        <StockEntryModal
          isOpen={showStockEntry}
          onClose={handleModalClose}
          onSuccess={handleEntrySuccess}
          selectedProductId={selectedProduct?.producto_id}
        />
      )}

      {showStockExit && selectedProduct && (
        <StockExitModal
          isOpen={showStockExit}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          selectedProductId={selectedProduct.producto_id}
        />
      )}

      <StockAlertsModal
        isOpen={showAlertsModal}
        onClose={() => setShowAlertsModal(false)}
      />
    </div>
  );
};

export default Stock;