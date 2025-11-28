import React, { useState, useEffect } from 'react';
import { Package, Filter, Download, ChevronLeft, ChevronRight, Search, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { getStockDisponibleReport } from '../../services/report.service';
import { StockDisponibleReportItem, PaginatedStockDisponibleReport } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import Loading from '../../components/common/Loading';

const GlassCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const { theme } = useTheme();
  return (
    <div className={`
      relative overflow-hidden rounded-2xl transition-all duration-300
      ${theme === 'dark' 
        ? 'bg-slate-900/60 border border-slate-700/50 shadow-lg shadow-slate-900/20 backdrop-blur-xl' 
        : 'bg-white/80 border border-slate-200/60 shadow-xl shadow-slate-200/40 backdrop-blur-xl'
      }
      ${className}
    `}>
      {children}
    </div>
  );
};

const FullInventoryReport: React.FC = () => {
  const { theme } = useTheme();
  
  const [data, setData] = useState<StockDisponibleReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  
  // Filtros
  const [filterType, setFilterType] = useState<string>('');
  const [filterCategoria, setFilterCategoria] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('Categoria');
  const [sortOrder, setSortOrder] = useState<string>('ASC');
  const [showFilters, setShowFilters] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getStockDisponibleReport({ 
        page: currentPage, 
        pageSize: pageSize,
        FilterType: filterType as any,
        FilterCategoria: filterCategoria || undefined,
        SortBy: sortBy as any,
        SortOrder: sortOrder as any
      });
      setData(result.items);
      setTotalPages(result.totalPages);
      setTotalItems(result.totalItems || 0);
    } catch (error) {
      console.error('Error fetching full inventory report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, pageSize, filterType, filterCategoria, sortBy, sortOrder]);

  const handleExport = async () => {
    try {
      setExportLoading(true);
      const params = new URLSearchParams({
        FilterType: filterType,
        FilterCategoria: filterCategoria,
        SortBy: sortBy,
        SortOrder: sortOrder
      });

      const response = await fetch(`/api/reports/stock-disponible/export?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Error al exportar');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'stock_disponible.xlsx';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="([^"]+)"/);
        if (match) filename = match[1];
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting:', error);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
               <Package size={24} />
             </div>
             <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
               Stock Disponible
             </h1>
          </div>
          <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Inventario completo de productos disponibles para asignación
          </p>
        </div>

        <div className="flex items-center gap-3">
           <button 
             onClick={() => setShowFilters(!showFilters)}
             className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-medium text-sm transition-colors ${
               theme === 'dark' 
                 ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-700 text-slate-300' 
                 : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
             }`}
           >
             <SlidersHorizontal size={16} /> Filtros
           </button>
           
           <button 
             onClick={handleExport}
             disabled={exportLoading}
             className={`px-4 py-2 rounded-xl flex items-center gap-2 font-medium text-sm transition-colors ${
               theme === 'dark'
                 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                 : 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'
             }`}
           >
             <Download size={16} className={exportLoading ? 'animate-pulse' : ''} />
             {exportLoading ? 'Exportando...' : 'Excel'}
           </button>
        </div>
      </header>

      {/* Filtros */}
      {showFilters && (
        <GlassCard className="mb-6 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5 opacity-70">Tipo</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                  theme === 'dark' 
                    ? 'bg-slate-800/50 border-slate-700 text-slate-200' 
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <option value="">Todos</option>
                <option value="Serializado">Serializados</option>
                <option value="General">Stock General</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 opacity-70">Categoría</label>
              <input
                type="text"
                value={filterCategoria}
                onChange={(e) => setFilterCategoria(e.target.value)}
                placeholder="Buscar categoría..."
                className={`w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                  theme === 'dark' 
                    ? 'bg-slate-800/50 border-slate-700 text-slate-200' 
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 opacity-70">Ordenar por</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                  theme === 'dark' 
                    ? 'bg-slate-800/50 border-slate-700 text-slate-200' 
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <option value="Categoria">Categoría</option>
                <option value="Marca">Marca</option>
                <option value="Modelo">Modelo</option>
                <option value="Cantidad">Cantidad</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 opacity-70">Orden</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSortOrder('ASC')}
                  className={`flex-1 py-2 rounded-lg text-sm border transition-all ${
                    sortOrder === 'ASC'
                      ? 'bg-indigo-500 text-white border-indigo-500'
                      : theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'
                  }`}
                >
                  ASC
                </button>
                <button
                  onClick={() => setSortOrder('DESC')}
                  className={`flex-1 py-2 rounded-lg text-sm border transition-all ${
                    sortOrder === 'DESC'
                      ? 'bg-indigo-500 text-white border-indigo-500'
                      : theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'
                  }`}
                >
                  DESC
                </button>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Content */}
      <GlassCard className="!p-0 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loading text="Cargando inventario..." />
          </div>
        ) : !data.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <Package className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className={`text-lg font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              No hay datos
            </h3>
            <p className="text-slate-500 text-sm">
              No se encontraron productos con los filtros actuales.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className={`border-b ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Tipo</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Categoría</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Marca</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Modelo</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Descripción</th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase text-slate-500 tracking-wider">Disponible</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-700/50' : 'divide-slate-200/50'}`}>
                  {data.map((item, index) => (
                    <tr key={index} className={`transition-colors ${theme === 'dark' ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}`}>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          item.TipoInventario === 'Serializado'
                            ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                            : 'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                        }`}>
                          {item.TipoInventario}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {item.Categoria}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {item.marca}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {item.modelo}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 max-w-[200px] truncate">
                        {item.descripcion || '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-lg font-bold font-mono ${
                          item.cantidad_disponible > 0 
                            ? 'text-emerald-500' 
                            : 'text-slate-400'
                        }`}>
                          {item.cantidad_disponible}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="flex items-center gap-4">
                 <p className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                   Total: {totalItems} items
                 </p>
                 <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className={`text-sm rounded px-2 py-1 outline-none border ${
                      theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <option value={15}>15 por pág.</option>
                    <option value={25}>25 por pág.</option>
                    <option value={50}>50 por pág.</option>
                  </select>
               </div>
               
               <div className="flex items-center gap-2">
                 <button
                   onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                   disabled={currentPage <= 1}
                   className={`p-2 rounded-lg transition-all border ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-800 text-slate-400 disabled:opacity-30' : 'border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-30'}`}
                 >
                   <ChevronLeft size={18} />
                 </button>
                 <span className={`px-4 py-2 text-sm font-medium rounded-lg border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
                   {currentPage} / {totalPages || 1}
                 </span>
                 <button
                   onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                   disabled={currentPage >= totalPages}
                   className={`p-2 rounded-lg transition-all border ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-800 text-slate-400 disabled:opacity-30' : 'border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-30'}`}
                 >
                   <ChevronRight size={18} />
                 </button>
               </div>
            </div>
          </>
        )}
      </GlassCard>
    </div>
  );
};

export default FullInventoryReport;
