import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiFilter, 
  FiDownload, 
  FiTrendingUp, 
  FiTrendingDown,
  FiPackage,
  FiCalendar,
  FiUser,
  FiFileText,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import { getStockMovementsReport, exportStockMovementsToExcel } from '../../services/report.service';
import { StockMovementItem, StockMovementFilters } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';

const StockMovementsReport: React.FC = () => {
  // Estados
  const [reportData, setReportData] = useState<StockMovementItem[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados de filtros
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');
  const [tipoMovimiento, setTipoMovimiento] = useState<string>('');
  const [producto, setProducto] = useState<string>('');
  const [usuario, setUsuario] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const { addNotification } = useNotification();

  // Función para obtener icono según tipo de movimiento
  const getTipoMovimientoIcon = (tipo: string) => {
    switch (tipo) {
      case 'Entrada':
        return <FiTrendingUp className="text-green-500" />;
      case 'Salida':
        return <FiTrendingDown className="text-red-500" />;
      default:
        return <FiPackage className="text-gray-500" />;
    }
  };

  // Función para obtener color según tipo de movimiento
  const getTipoMovimientoColor = (tipo: string) => {
    switch (tipo) {
      case 'Entrada':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'Salida':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Función para exportar a Excel
  const handleExportToExcel = async () => {
    setIsExporting(true);
    try {
      const filters: StockMovementFilters = {
        fechaDesde: fechaDesde || undefined,
        fechaHasta: fechaHasta || undefined,
        tipoMovimiento: tipoMovimiento || undefined,
        producto: producto || undefined,
        usuario: usuario || undefined
      };

      await exportStockMovementsToExcel(filters);
      addNotification({ message: 'Reporte exportado exitosamente', type: 'success' });

    } catch (error) {
      console.error('Error al exportar:', error);
      addNotification({ message: 'Error al exportar el reporte', type: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  // Función para cargar datos
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        pageSize: pageSize,
        fechaDesde: fechaDesde || undefined,
        fechaHasta: fechaHasta || undefined,
        tipoMovimiento: tipoMovimiento || undefined,
        producto: producto || undefined,
        usuario: usuario || undefined
      };

      const response = await getStockMovementsReport(params);
      setReportData(response.items);
      setTotalRecords(response.totalRecords);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Error al cargar el reporte. Por favor, intente nuevamente.');
      addNotification({ message: 'Error al cargar el reporte', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, fechaDesde, fechaHasta, tipoMovimiento, producto, usuario, addNotification]);

  // Cargar datos iniciales y cuando cambien los filtros (con debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadData();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [loadData]);

  // Función para cambiar página
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen relative">
      {/* 🌌 ORBES DE FONDO ANIMADOS - ESTÁNDAR DEL PROYECTO */}
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-900">
        {/* Orbe 1: Top-left - Primary */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary-500/20 rounded-full blur-xl animate-float"></div>
        
        {/* Orbe 2: Top-right - Secondary */}
        <div className="absolute top-40 right-20 w-24 h-24 bg-secondary-500/20 rounded-full blur-lg animate-float" style={{animationDelay: '2s'}}></div>
        
        {/* Orbe 3: Bottom-left - Success */}
        <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-success-500/20 rounded-full blur-lg animate-float" style={{animationDelay: '4s'}}></div>
        
        {/* Orbe 4: Bottom-right - Info */}
        <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-info-500/20 rounded-full blur-xl animate-float" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Contenido principal */}
      <div className="relative z-10">
        <header className="mb-8">
          <div className="flex items-center space-x-4">
            <FiFileText className="w-8 h-8 text-primary-400" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-100 font-display">
              Auditoría de Movimientos
            </h1>
          </div>
          <p className="text-slate-400 max-w-2xl">
            Historial completo de entradas y salidas de stock general con trazabilidad detallada
          </p>
        </header>

        {/* Tarjeta de contenido principal */}
        <div className="glass-card-deep p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-100 font-display">
                Reporte de Movimientos de Stock
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                {reportData.length > 0 ? `${totalRecords} registros encontrados` : 'Sin registros'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg transition-all duration-200 border border-slate-600/30"
              >
                <FiFilter className="text-sm" />
                Filtros
              </button>

              <button
                onClick={handleExportToExcel}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiDownload className="text-sm" />
                {isExporting ? 'Exportando...' : 'Exportar Excel'}
              </button>
            </div>
          </div>

          {/* Panel de Filtros */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-slate-600/30">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Fecha Desde */}
                <div>
                  <label htmlFor="fechaDesde" className="block text-sm font-medium text-slate-300 mb-2">
                    <FiCalendar className="inline mr-1" />
                    Fecha Desde
                  </label>
                  <input
                    id="fechaDesde"
                    name="fechaDesde"
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Fecha Hasta */}
                <div>
                  <label htmlFor="fechaHasta" className="block text-sm font-medium text-slate-300 mb-2">
                    <FiCalendar className="inline mr-1" />
                    Fecha Hasta
                  </label>
                  <input
                    id="fechaHasta"
                    name="fechaHasta"
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Tipo de Movimiento */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <FiTrendingUp className="inline mr-1" />
                    Tipo de Movimiento
                  </label>
                  <select
                    value={tipoMovimiento}
                    onChange={(e) => setTipoMovimiento(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Todos</option>
                    <option value="Entrada">Entrada</option>
                    <option value="Salida">Salida</option>
                  </select>
                </div>

                {/* Producto */}
                <div>
                  <label htmlFor="producto" className="block text-sm font-medium text-slate-300 mb-2">
                    <FiPackage className="inline mr-1" />
                    Producto
                  </label>
                  <input
                    id="producto"
                    name="producto"
                    type="text"
                    value={producto}
                    onChange={(e) => setProducto(e.target.value)}
                    placeholder="Buscar producto..."
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Usuario */}
                <div>
                  <label htmlFor="usuario" className="block text-sm font-medium text-slate-300 mb-2">
                    <FiUser className="inline mr-1" />
                    Usuario
                  </label>
                  <input
                    id="usuario"
                    name="usuario"
                    type="text"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    placeholder="Buscar usuario..."
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tabla de Datos */}
          <div className="glass-card-deep p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                <span className="ml-3 text-slate-300">Cargando reporte...</span>
              </div>
            ) : (
              <>
                {/* Header de la tabla */}
                <div className="mb-4 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-white">
                    Movimientos de Stock ({totalRecords} registros)
                  </h3>
                </div>

                {reportData.length === 0 ? (
                  <div className="text-center py-12">
                    <FiFileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <h3 className="text-lg font-medium text-slate-300 mb-2">No hay movimientos</h3>
                    <p className="text-slate-400">No se encontraron movimientos con los filtros aplicados.</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-600/30">
                            <th className="text-left py-3 px-4 font-medium text-slate-300">ID</th>
                            <th className="text-left py-3 px-4 font-medium text-slate-300">Producto</th>
                            <th className="text-left py-3 px-4 font-medium text-slate-300">Categoría</th>
                            <th className="text-left py-3 px-4 font-medium text-slate-300">Tipo</th>
                            <th className="text-left py-3 px-4 font-medium text-slate-300">Cantidad</th>
                            <th className="text-left py-3 px-4 font-medium text-slate-300">Stock Anterior</th>
                            <th className="text-left py-3 px-4 font-medium text-slate-300">Stock Actual</th>
                            <th className="text-left py-3 px-4 font-medium text-slate-300">Fecha</th>
                            <th className="text-left py-3 px-4 font-medium text-slate-300">Motivo</th>
                            <th className="text-left py-3 px-4 font-medium text-slate-300">Destino</th>
                            <th className="text-left py-3 px-4 font-medium text-slate-300">Usuario</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.map((movement) => (
                            <tr key={movement.movimiento_id} className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors">
                              <td className="py-3 px-4 text-slate-300 font-mono text-sm">
                                #{movement.movimiento_id}
                              </td>
                              <td className="py-3 px-4 text-white font-medium">
                                {movement.producto}
                              </td>
                              <td className="py-3 px-4 text-slate-300">
                                {movement.categoria}
                              </td>
                              <td className="py-3 px-4">
                                <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-medium border ${getTipoMovimientoColor(movement.tipo_movimiento)}`}>
                                  {getTipoMovimientoIcon(movement.tipo_movimiento)}
                                  {movement.tipo_movimiento}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-white font-mono">
                                {movement.cantidad}
                              </td>
                              <td className="py-3 px-4 text-slate-300 font-mono">
                                {movement.stock_anterior}
                              </td>
                              <td className="py-3 px-4 text-white font-mono font-medium">
                                {movement.stock_actual}
                              </td>
                              <td className="py-3 px-4 text-slate-300 text-sm">
                                {formatDate(movement.fecha_movimiento)}
                              </td>
                              <td className="py-3 px-4 text-slate-300">
                                {movement.motivo}
                              </td>
                              <td className="py-3 px-4 text-slate-300">
                                <div className="text-sm">
                                  <div className="text-white">{movement.destino}</div>
                                  <div className="text-xs text-slate-400">{movement.tipo_destino}</div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-slate-300">
                                {movement.usuario_nombre}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Paginación */}
                    {totalPages > 1 && (
                      <div className="mt-6 flex items-center justify-between">
                        <div className="text-sm text-slate-400">
                          Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalRecords)} de {totalRecords} registros
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="flex items-center gap-1 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600/30"
                          >
                            <FiChevronLeft className="text-sm" />
                            Anterior
                          </button>
                          
                          <span className="px-4 py-2 text-slate-300">
                            Página {currentPage} de {totalPages}
                          </span>
                          
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="flex items-center gap-1 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600/30"
                          >
                            Siguiente
                            <FiChevronRight className="text-sm" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockMovementsReport;