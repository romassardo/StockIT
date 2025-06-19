import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Package, TrendingDown, AlertTriangle, Search, BarChart3, RefreshCw, History, Plus, Minus } from 'lucide-react';
import { stockService, ProductoStock } from '../services/stock.service';
import StockEntryModal from '../components/stock/StockEntryModal';
import StockExitModal from '../components/stock/StockExitModal';
import StockMovementsModal from '../components/stock/StockMovementsModal';
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
  const [showMovementsModal, setShowMovementsModal] = useState(false);
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
    const totalUnidades = productos.reduce((sum, p) => sum + p.cantidad_actual, 0);
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

  // Función para obtener el estado visual del stock - usando colores del design system
  const getStockStatus = (cantidad: number, minimo: number) => {
    if (cantidad === 0) return { 
      status: 'empty', 
      color: 'text-danger-600', 
      bg: theme === 'dark' ? 'bg-danger-900/20 border-danger-500/30' : 'bg-danger-50 border-danger-200', 
      label: 'Sin Stock' 
    };
    if (cantidad <= minimo) return { 
      status: 'low', 
      color: 'text-warning-600', 
      bg: theme === 'dark' ? 'bg-warning-900/20 border-warning-500/30' : 'bg-warning-50 border-warning-200', 
      label: 'Bajo Mínimo' 
    };
    return { 
      status: 'normal', 
      color: 'text-success-600', 
      bg: theme === 'dark' ? 'bg-success-900/20 border-success-500/30' : 'bg-success-50 border-success-200', 
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
    // Actualizar el estado localmente sin recargar todo
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

  // Categorías únicas para el filtro - usando Map para evitar duplicados
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
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'
      }`}>
        {/* Partículas de fondo animadas - Consistente con Login */}
        <div className="bg-particles">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 8 + 4}px`,
                height: `${Math.random() * 8 + 4}px`,
                animationDelay: `${Math.random() * 6}s`,
                opacity: Math.random() * 0.3 + 0.1,
              }}
            />
          ))}
        </div>
        
        <div className="text-center space-y-6">
          {/* Shimmer Loading con Glassmorphism */}
          <div className="space-y-4">
            <div className="skeleton-glass h-16 w-64 mx-auto rounded-2xl"></div>
            <div className="skeleton-glass h-4 w-48 mx-auto rounded-lg"></div>
            <div className="grid grid-cols-4 gap-4 mt-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton-glass h-20 w-40 rounded-xl" style={{ animationDelay: `${i * 0.1}s` }}></div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton-glass h-32 w-48 rounded-xl" style={{ animationDelay: `${i * 0.15}s` }}></div>
              ))}
            </div>
          </div>
          <p className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>
            Cargando datos del stock...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100'
    }`}>
      {/* 🌌 Fondo moderno con orbes animados - IGUAL QUE INVENTORY */}
      <div className={`fixed inset-0 pointer-events-none transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95' 
          : 'bg-gradient-to-br from-slate-50/95 via-slate-100/90 to-slate-200/95'
      }`}>
        <div className={`absolute top-20 left-10 w-32 h-32 rounded-full blur-xl animate-float transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-primary-500/20' 
            : 'bg-primary-500/10'
        }`}></div>
        <div className={`absolute top-40 right-20 w-24 h-24 rounded-full blur-lg animate-float transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-secondary-500/20' 
            : 'bg-secondary-500/10'
        }`} style={{animationDelay: '2s'}}></div>
        <div className={`absolute bottom-32 left-1/4 w-20 h-20 rounded-full blur-lg animate-float transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-success-500/20' 
            : 'bg-success-500/10'
        }`} style={{animationDelay: '4s'}}></div>
        <div className={`absolute bottom-20 right-1/3 w-28 h-28 rounded-full blur-xl animate-float transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-info-500/20' 
            : 'bg-info-500/10'
        }`} style={{animationDelay: '1s'}}></div>
      </div>

      <div className="relative z-20 p-6 max-w-7xl mx-auto">
        
        {/* Header Compacto Rediseñado con animación de entrada */}
        <div className={`glass-card p-4 mb-4 animate-glass-appear ${theme === 'dark' ? 'glass-dark' : ''}`}>
          
          {/* Línea 1: Título + Pestañas + Botones */}
          <div className="flex items-center justify-between mb-4">
            <div className="animate-glass-appear" style={{ animationDelay: '0.1s' }}>
              <h1 className={`text-4xl font-bold text-gradient-primary`}>
                Stock General
              </h1>
              <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                Control por cantidad • {filteredProductos.length} productos activos
              </p>
            </div>
            
            <div className="flex items-center gap-4 animate-glass-appear" style={{ animationDelay: '0.2s' }}>
              {/* Pestañas */}
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                <button
                  className="px-3 py-1.5 rounded-md text-sm font-medium bg-primary-500 text-white shadow-sm flex items-center gap-1.5"
                >
                  <Package className="w-3.5 h-3.5" />
                  Stock
                </button>
                <button
                  onClick={() => setShowMovementsModal(true)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-1.5 hover-gradient ${
                    theme === 'dark' ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-white'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  Movimientos
                </button>
                <button
                  onClick={() => setShowAlertsModal(true)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-1.5 hover-gradient ${
                    theme === 'dark' ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-white'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Alertas
                  {stats.alertasActivas > 0 && (
                    <span className="bg-warning-500 text-white text-xs px-1 py-0.5 rounded-full text-[10px] animate-pulse-glow">
                      {stats.alertasActivas}
                    </span>
                  )}
                </button>
              </div>

              {/* Botones con gradientes dinámicos */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenEntry()}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 hover-gradient-primary"
                >
                  <Plus className="w-4 h-4" />
                  Entrada
                </button>
                <button
                  onClick={loadStockData}
                  className={`border border-slate-300 hover:bg-slate-50 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 hover-gradient-neutral ${
                    theme === 'dark' 
                      ? 'border-slate-600 hover:bg-slate-800 text-slate-300' 
                      : 'text-slate-700'
                  }`}
                >
                  <RefreshCw className="w-4 h-4" />
                  Actualizar
                </button>
              </div>
            </div>
          </div>

          {/* Línea 2: Estadísticas con efectos 3D glassmorphism y animaciones stagger */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { icon: Package, label: 'Productos', value: stats.totalProductos, color: 'primary', delay: '0.1s' },
              { icon: BarChart3, label: 'Unidades', value: stats.totalUnidades.toLocaleString(), color: 'success', delay: '0.2s' },
              { icon: AlertTriangle, label: 'Alertas', value: stats.alertasActivas, color: 'warning', delay: '0.3s', pulse: stats.alertasActivas > 0 },
              { icon: TrendingDown, label: 'Sin Stock', value: stats.sinStock, color: 'danger', delay: '0.4s', pulse: stats.sinStock > 0 }
            ].map((stat, index) => (
              <div 
                key={index}
                className={`glass-card-static p-3 rounded-lg hover-lift animate-glass-appear ${
                  theme === 'dark' ? 'glass-dark' : ''
                } ${stat.pulse ? 'animate-pulse-glow' : ''}`}
                style={{ animationDelay: stat.delay }}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    theme === 'dark' 
                      ? `bg-${stat.color}-900/30` 
                      : `bg-${stat.color}-50`
                  }`}>
                    <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
                  </div>
                  <div>
                    <p className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      {stat.label}
                    </p>
                    <p className={`text-lg font-bold ${
                      stat.pulse && stat.value > 0 
                        ? `text-${stat.color}-600` 
                        : (theme === 'dark' ? 'text-white' : 'text-slate-900')
                    }`}>
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Línea 3: Filtros distribuidos de punta a punta */}
          {(
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-8 pr-3 py-1.5 border rounded-lg text-sm ${
                    theme === 'dark' 
                      ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-400' 
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
                  }`}
                />
              </div>
              
              <div className="flex gap-1 flex-1 max-w-2xl">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className={`px-3 py-1.5 border rounded-lg text-sm flex-1 ${
                    theme === 'dark' 
                      ? 'bg-slate-800 border-slate-600 text-white' 
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="">Todas las categorías</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id.toString()}>{cat.nombre}</option>
                  ))}
                </select>

                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value as 'all' | 'low' | 'normal' | 'empty')}
                  className={`px-3 py-1.5 border rounded-lg text-sm flex-1 ${
                    theme === 'dark' 
                      ? 'bg-slate-800 border-slate-600 text-white' 
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="all">Todos los estados</option>
                  <option value="normal">Stock Normal</option>
                  <option value="low">Bajo Mínimo</option>
                  <option value="empty">Sin Stock</option>
                </select>
              </div>

              <div className="flex gap-2">
                <select
                  value={itemsPerPage.toString()}
                  onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                  className={`px-2 py-1.5 border rounded-lg text-sm w-16 ${
                    theme === 'dark' 
                      ? 'bg-slate-800 border-slate-600 text-white' 
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>

                <button
                  onClick={clearFilters}
                  className={`px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    theme === 'dark' 
                      ? 'border-slate-600 text-slate-300 hover:bg-slate-700' 
                      : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Limpiar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Contenido por pestañas */}
        {(
          <>
            {/* Tabla de productos con design system */}
            <div className={`glass-card-static overflow-hidden ${theme === 'dark' ? 'glass-dark' : ''}`}>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className={theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50/50'}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-500'
                      }`}>
                        Modelo
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-500'
                      }`}>
                        Marca
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-500'
                      }`}>
                        Categoría
                      </th>
                      <th className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-500'
                      }`}>
                        Stock Actual
                      </th>
                      <th className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-500'
                      }`}>
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-700' : 'divide-slate-200'}`}>
                    {paginatedProductos.map((producto) => {
                      const stockStatus = getStockStatus(producto.cantidad_actual, producto.min_stock);
                      
                      return (
                        <tr key={producto.producto_id} className={`transition-colors duration-200 ${
                          theme === 'dark' ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'
                        }`}>
                          <td className={`px-6 py-4 whitespace-nowrap ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                            <div className="font-medium">
                              {producto.nombre_producto}
                            </div>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                            <div className="font-medium">
                              {producto.nombre_marca}
                            </div>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                            {producto.nombre_categoria}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`text-lg font-semibold ${stockStatus.color}`}>
                              {producto.cantidad_actual}
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              Mín: {producto.min_stock}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleOpenEntry(producto)}
                                className="bg-success-600 hover:bg-success-700 text-white px-3 py-1 rounded-lg text-sm transition-colors flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                Entrada
                              </button>
                              <button
                                onClick={() => handleOpenExit(producto)}
                                disabled={producto.cantidad_actual === 0}
                                className={`px-3 py-1 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                                  producto.cantidad_actual === 0
                                    ? theme === 'dark' ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                    : 'bg-danger-600 hover:bg-danger-700 text-white'
                                }`}
                              >
                                <Minus className="w-3 h-3" />
                                Salida
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className={`px-6 py-3 border-t ${
                  theme === 'dark' 
                    ? 'border-slate-700 bg-slate-800/20' 
                    : 'border-slate-200 bg-slate-50/50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      Mostrando {Math.min(filteredProductos.length, itemsPerPage)} de {filteredProductos.length} productos
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded-lg transition-colors text-sm ${
                          currentPage === 1
                            ? theme === 'dark' ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            : 'btn-glass-secondary'
                        }`}
                      >
                        Anterior
                      </button>
                      
                      <span className={`px-3 py-1 text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                        {currentPage} de {totalPages}
                      </span>
                      
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded-lg transition-colors text-sm ${
                          currentPage === totalPages
                            ? theme === 'dark' ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            : 'btn-glass-secondary'
                        }`}
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
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

      {/* Modal de Movimientos */}
      <StockMovementsModal
        isOpen={showMovementsModal}
        onClose={() => setShowMovementsModal(false)}
      />

      {/* Modal de Alertas */}
      <StockAlertsModal
        isOpen={showAlertsModal}
        onClose={() => setShowAlertsModal(false)}
      />
    </div>
  );
};

export default Stock;