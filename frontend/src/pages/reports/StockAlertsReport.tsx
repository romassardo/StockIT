import React, { useState, useEffect } from 'react';
import { AlertTriangle, Package, ChevronLeft, ChevronRight, Search, RefreshCw } from 'lucide-react';
import { getStockAlerts } from '../../services/report.service';
import { PaginatedStockAlerts } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';
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

const StockAlertsReport: React.FC = () => {
  const { theme } = useTheme();
  const { addNotification } = useNotification();
  
  const [data, setData] = useState<PaginatedStockAlerts | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAlerts = async (pageNum: number) => {
    setLoading(true);
    try {
      const result = await getStockAlerts({ page: pageNum, pageSize, searchTerm });
      
      // Sanitización
      const sanitizedResult = {
        ...result,
        items: result.items.map(item => ({
          ...item,
          ProductoID: Number(item.ProductoID),
          CategoriaID: Number(item.CategoriaID),
          CantidadActual: Number(item.CantidadActual),
          StockMinimo: Number(item.StockMinimo),
          UmbralPersonalizado: Number(item.UmbralPersonalizado),
          DiasParaAgotarse: Number(item.DiasParaAgotarse),
          PromedioSalidaDiaria: Number(item.PromedioSalidaDiaria),
          TotalRows: Number(item.TotalRows),
        }))
      };
      
      setData(sanitizedResult);
    } catch (error) {
      addNotification({
        message: 'Error al cargar las alertas de stock.',
        type: 'error',
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts(page);
  }, [page]);

  // Búsqueda con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchAlerts(1);
      } else {
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handlePageChange = (newPage: number) => {
    if (data && newPage >= 1 && newPage <= data.totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
               <AlertTriangle size={24} />
             </div>
             <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-600">
               Reporte de Alertas de Stock
             </h1>
          </div>
          <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Monitoreo de niveles críticos y reposición de inventario
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-3">
           {/* Buscador Global */}
           <div className="relative group w-full md:w-64">
             <input
               type="text"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               placeholder="Buscar..."
               className={`w-full pl-10 pr-4 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-red-500/50 transition-all ${
                 theme === 'dark' 
                   ? 'bg-slate-800/50 border-slate-700 text-slate-200 focus:bg-slate-800' 
                   : 'bg-white border-slate-200 text-slate-700 focus:bg-white'
               }`}
             />
             <Search className={`absolute left-3 top-2.5 w-4 h-4 transition-colors ${
               theme === 'dark' ? 'text-slate-500 group-focus-within:text-red-400' : 'text-slate-400 group-focus-within:text-red-500'
             }`} />
           </div>

           <button 
             onClick={() => fetchAlerts(page)}
             className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-medium text-sm transition-colors ${
               theme === 'dark' 
                 ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-700 text-slate-300' 
                 : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
             }`}
           >
             <RefreshCw size={16} /> Actualizar
           </button>
        </div>
      </header>

      {/* Content */}
      <GlassCard className="!p-0 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loading text="Analizando niveles de stock..." />
          </div>
        ) : !data?.items.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <Package className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className={`text-lg font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Todo en orden
            </h3>
            <p className="text-slate-500 text-sm">
              No hay productos con alertas de stock en este momento.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className={`border-b ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Producto</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Categoría</th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase text-slate-500 tracking-wider">Stock Actual</th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase text-slate-500 tracking-wider">Mínimo</th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase text-slate-500 tracking-wider">Días Est.</th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase text-slate-500 tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-700/50' : 'divide-slate-200/50'}`}>
                  {data.items.map((item, index) => {
                    const isCritical = item.CantidadActual === 0;
                    
                    return (
                      <tr key={index} className={`transition-colors ${theme === 'dark' ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}`}>
                        <td className="px-6 py-4">
                          <div className={`font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                            {item.ProductoNombre}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {item.Categoria}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-lg font-bold font-mono ${isCritical ? 'text-red-500' : 'text-amber-500'}`}>
                            {item.CantidadActual}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-slate-500">
                          {item.StockMinimo}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {item.DiasParaAgotarse < 999 ? (
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                              item.DiasParaAgotarse < 7 
                                ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {item.DiasParaAgotarse} días
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {isCritical ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-600 border border-red-500/20">
                              SIN STOCK
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                              BAJO STOCK
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
               <p className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                 Mostrando {data.items.length} de {data.totalItems} alertas
               </p>
               
               <div className="flex items-center gap-2">
                 <button
                   onClick={() => handlePageChange(page - 1)}
                   disabled={page <= 1}
                   className={`p-2 rounded-lg transition-all border ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-800 text-slate-400 disabled:opacity-30' : 'border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-30'}`}
                 >
                   <ChevronLeft size={18} />
                 </button>
                 <span className={`px-4 py-2 text-sm font-medium rounded-lg border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
                   {page} / {data.totalPages || 1}
                 </span>
                 <button
                   onClick={() => handlePageChange(page + 1)}
                   disabled={page >= data.totalPages}
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

export default StockAlertsReport;
