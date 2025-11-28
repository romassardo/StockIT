import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTable, usePagination, Column } from 'react-table';
import { getRepairHistoryReport } from '../../services/report.service';
import { RepairHistoryItem, PaginatedRepairHistoryReport } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { 
  Filter, 
  Download, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Search, 
  Wrench, 
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import Loading from '../../components/common/Loading';

// GlassCard Component (Local definition to match other reports)
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

const RepairHistoryReport: React.FC = () => {
  const { theme } = useTheme();
  const { addNotification } = useNotification();

  // Data State
  const [data, setData] = useState<RepairHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  // Pagination State
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    fechaDesde: '',
    fechaHasta: '',
    estado: '',
    proveedor: ''
  });
  const [showFilters, setShowFilters] = useState(true);

  const isInitialMount = useRef(true);

  // Helper: Get status badge style
  const getEstadoBadgeClass = (estado: string) => {
    switch (estado) {
      case 'Reparado':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'En Reparación':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Sin Reparación':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'Reparado':
        return <CheckCircle size={16} className="mr-1.5" />;
      case 'En Reparación':
        return <Clock size={16} className="mr-1.5" />;
      case 'Sin Reparación':
        return <XCircle size={16} className="mr-1.5" />;
      default:
        return <AlertCircle size={16} className="mr-1.5" />;
    }
  };

  // Helper: Format Date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return <span className="text-slate-400">-</span>;
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Export Function
  const handleExport = async () => {
    try {
      setExportLoading(true);
      
      const params = new URLSearchParams();
      if (filters.fechaDesde) params.append('FechaDesde', filters.fechaDesde);
      if (filters.fechaHasta) params.append('FechaHasta', filters.fechaHasta);
      if (filters.estado) params.append('EstadoReparacion', filters.estado);
      if (filters.proveedor) params.append('Proveedor', filters.proveedor);
      if (searchTerm) params.append('searchTerm', searchTerm); 
      
      // Add reportType parameter for the export controller
      params.append('reportType', 'repairHistory');
      
      const response = await fetch(`/api/reports/repair-history/export?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al exportar el reporte');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'historia_reparaciones.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      addNotification({
        message: 'Reporte exportado exitosamente',
        type: 'success'
      });
      
    } catch (error) {
      console.error('Error al exportar:', error);
      addNotification({
        message: 'Error al exportar el reporte',
        type: 'error'
      });
    } finally {
      setExportLoading(false);
    }
  };

  // Data Fetching
  const fetchData = async () => {
    setLoading(true);
    try {
      const result: PaginatedRepairHistoryReport = await getRepairHistoryReport({
        page: currentPage,
        pageSize: pageSize,
        fechaDesde: filters.fechaDesde || undefined,
        fechaHasta: filters.fechaHasta || undefined,
        estado: filters.estado || undefined,
        proveedor: filters.proveedor || undefined,
      });
      setData(result.items);
      setPageCount(result.totalPages);
      setTotalRecords(result.totalRecords);
    } catch (error) {
      console.error('Error fetching repair history report:', error);
      addNotification({
        message: 'Error al cargar el historial de reparaciones',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Effect for Fetching
  useEffect(() => {
    fetchData();
  }, [currentPage, pageSize]);

  // Effect for Debounced Filtering
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const handler = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchData();
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      fechaDesde: '',
      fechaHasta: '',
      estado: '',
      proveedor: ''
    });
    setSearchTerm('');
  };

  // Table Configuration
  const columns: Column<RepairHistoryItem>[] = useMemo(
    () => [
      {
        Header: 'Equipo',
        accessor: 'numero_serie', 
        Cell: ({ row }: { row: any }) => (
          <div className="flex flex-col">
            <span className={`font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
              {row.original.marca} {row.original.modelo}
            </span>
            <span className="text-xs text-slate-500 font-mono mt-0.5">
              SN: {row.original.numero_serie}
            </span>
            <span className="text-xs text-slate-500 mt-0.5">
              {row.original.categoria}
            </span>
          </div>
        ),
      },
      {
        Header: 'Proveedor',
        accessor: 'proveedor',
        Cell: ({ value }: { value: string }) => (
          <span className={`font-medium ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>
            {value}
          </span>
        ),
      },
      {
        Header: 'Fechas',
        accessor: 'fecha_envio',
        Cell: ({ row }: { row: any }) => (
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs w-12">Envío:</span>
              <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                {formatDate(row.original.fecha_envio)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs w-12">Retorno:</span>
              <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                {formatDate(row.original.fecha_retorno)}
              </span>
            </div>
          </div>
        ),
      },
      {
        Header: 'Estado',
        accessor: 'estado',
        Cell: ({ value }: { value: string }) => (
          <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getEstadoBadgeClass(value)}`}>
            {getEstadoIcon(value)}
            {value}
          </div>
        ),
      },
      {
        Header: 'Tiempo',
        accessor: 'dias_reparacion',
        Cell: ({ value }: { value: number }) => (
          <span className={`font-mono font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
            {value} {value === 1 ? 'día' : 'días'}
          </span>
        ),
      },
      {
        Header: 'Detalles',
        accessor: 'problema_descripcion',
        Cell: ({ row }: { row: any }) => (
          <div className="flex flex-col gap-1 max-w-xs">
             <div className="text-xs">
               <span className="text-slate-500 font-semibold">Problema: </span>
               <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} title={row.original.problema_descripcion}>
                 {row.original.problema_descripcion?.substring(0, 50)}{row.original.problema_descripcion?.length > 50 ? '...' : ''}
               </span>
             </div>
             {row.original.solucion_descripcion && (
               <div className="text-xs">
                 <span className="text-slate-500 font-semibold">Solución: </span>
                 <span className="text-emerald-500/80" title={row.original.solucion_descripcion}>
                   {row.original.solucion_descripcion?.substring(0, 50)}{row.original.solucion_descripcion?.length > 50 ? '...' : ''}
                 </span>
               </div>
             )}
          </div>
        ),
      },
    ],
    [theme]
  );

  // React Table Hooks
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    canPreviousPage,
    canNextPage,
    gotoPage,
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 0, pageSize: 15 },
      manualPagination: true,
      pageCount,
    },
    usePagination
  );

  // Sync react-table page with our state
  useEffect(() => {
    gotoPage(currentPage - 1);
  }, [currentPage, gotoPage]);

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
               <Wrench size={24} />
             </div>
             <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
               Historia de Reparaciones
             </h1>
          </div>
          <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Historial completo de intervenciones técnicas y reparaciones
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-3">
           <button 
             onClick={() => setShowFilters(!showFilters)}
             className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-medium text-sm transition-colors ${
               theme === 'dark' 
                 ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-700 text-slate-300' 
                 : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
             }`}
           >
             <Filter size={16} /> {showFilters ? 'Ocultar Filtros' : 'Filtros'}
           </button>
           
           <button 
             onClick={fetchData}
             disabled={loading}
             className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-medium text-sm transition-colors ${
               theme === 'dark' 
                 ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-700 text-slate-300' 
                 : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
             }`}
           >
             <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            
            <div>
              <label className="block text-xs font-medium mb-1.5 opacity-70">Desde</label>
              <div className="relative">
                <input
                  type="date"
                  value={filters.fechaDesde}
                  onChange={(e) => handleFilterChange('fechaDesde', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                    theme === 'dark' 
                      ? 'bg-slate-800/50 border-slate-700 text-slate-200' 
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                />
                <Calendar className="absolute right-3 top-2.5 w-4 h-4 opacity-50 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 opacity-70">Hasta</label>
              <div className="relative">
                <input
                  type="date"
                  value={filters.fechaHasta}
                  onChange={(e) => handleFilterChange('fechaHasta', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                    theme === 'dark' 
                      ? 'bg-slate-800/50 border-slate-700 text-slate-200' 
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                />
                <Calendar className="absolute right-3 top-2.5 w-4 h-4 opacity-50 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 opacity-70">Estado</label>
              <select
                value={filters.estado}
                onChange={(e) => handleFilterChange('estado', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                  theme === 'dark' 
                    ? 'bg-slate-800/50 border-slate-700 text-slate-200' 
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <option value="">Todos los estados</option>
                <option value="En Reparación">En Reparación</option>
                <option value="Reparado">Reparado</option>
                <option value="Sin Reparación">Sin Reparación</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 opacity-70">Proveedor</label>
              <input
                type="text"
                value={filters.proveedor}
                onChange={(e) => handleFilterChange('proveedor', e.target.value)}
                placeholder="Buscar proveedor..."
                className={`w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                  theme === 'dark' 
                    ? 'bg-slate-800/50 border-slate-700 text-slate-200 placeholder-slate-500' 
                    : 'bg-white border-slate-200 text-slate-700 placeholder-slate-400'
                }`}
              />
            </div>

            <div className="flex justify-end mt-2 sm:col-span-2 lg:col-span-4">
              <button
                onClick={clearFilters}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  theme === 'dark' 
                    ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <RefreshCw size={14} /> Limpiar Filtros
              </button>
            </div>

          </div>
        </GlassCard>
      )}

      <GlassCard className="!p-0 overflow-hidden">
        {loading && data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loading text="Cargando historial..." />
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <Wrench className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className={`text-lg font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              No hay registros
            </h3>
            <p className="text-slate-500 text-sm">
              No se encontraron reparaciones con los filtros seleccionados.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table {...getTableProps()} className="w-full text-left">
                <thead className={`border-b ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  {headerGroups.map(headerGroup => {
                    const { key: headerGroupKey, ...headerGroupProps } = headerGroup.getHeaderGroupProps();
                    return (
                      <tr key={headerGroupKey} {...headerGroupProps}>
                        {headerGroup.headers.map(column => {
                          const { key: headerKey, ...headerProps } = column.getHeaderProps();
                          return (
                            <th
                              key={headerKey}
                              {...headerProps}
                              className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider"
                            >
                              {column.render('Header')}
                            </th>
                          );
                        })}
                      </tr>
                    );
                  })}
                </thead>
                <tbody {...getTableBodyProps()} className={`divide-y ${theme === 'dark' ? 'divide-slate-700/50' : 'divide-slate-200/50'}`}>
                  {page.map(row => {
                    prepareRow(row);
                    const { key: rowKey, ...rowProps } = row.getRowProps();
                    return (
                      <tr key={rowKey} {...rowProps} className={`transition-colors ${theme === 'dark' ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}`}>
                        {row.cells.map(cell => {
                          const { key: cellKey, ...cellProps } = cell.getCellProps();
                          return (
                            <td key={cellKey} {...cellProps} className="px-6 py-4 text-sm">
                              {cell.render('Cell')}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="flex items-center gap-4">
                 <p className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                   Total: {totalRecords} registros
                 </p>
                 <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className={`text-sm rounded px-2 py-1 outline-none border ${
                      theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <option value={15}>15 por pág.</option>
                    <option value={25}>25 por pág.</option>
                    <option value={50}>50 por pág.</option>
                    <option value={100}>100 por pág.</option>
                  </select>
               </div>
               
               <div className="flex items-center gap-2">
                 <button
                   onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                   disabled={!canPreviousPage}
                   className={`p-2 rounded-lg transition-all border ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-800 text-slate-400 disabled:opacity-30' : 'border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-30'}`}
                 >
                   <ChevronLeft size={18} />
                 </button>
                 <span className={`px-4 py-2 text-sm font-medium rounded-lg border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
                   {currentPage} / {pageCount || 1}
                 </span>
                 <button
                   onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}
                   disabled={!canNextPage}
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

export default RepairHistoryReport;