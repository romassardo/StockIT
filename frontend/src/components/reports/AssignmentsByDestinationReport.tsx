import React, { useState, useEffect, useRef } from 'react';
import { Filter, Download, RefreshCw, ChevronLeft, ChevronRight, Calendar, Search } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { getAssignmentsByDestination, GetAssignmentsByDestinationParams, AssignmentReportItem } from '../../services/report.service';
import { branchService } from '../../services/branch.service';
import { sectorService } from '../../services/sector.service';
import { employeeService } from '../../services/employee.service';
import Loading from '../common/Loading';
import { useTheme } from '../../contexts/ThemeContext';

interface AssignmentsByDestinationReportProps {
  reportType: 'Empleado' | 'Sector' | 'Sucursal';
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

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

const AssignmentsByDestinationReport: React.FC<AssignmentsByDestinationReportProps> = ({
  reportType,
  title,
  description,
  icon: IconComponent,
  color
}) => {
  const { theme } = useTheme();
  const { addNotification } = useNotification();
  const [assignments, setAssignments] = useState<AssignmentReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [destinations, setDestinations] = useState<any[]>([]);
  
  const [filters, setFilters] = useState<Omit<GetAssignmentsByDestinationParams, 'tipoDestino'>>({
    estadoAsignacion: '',
    fechaDesde: '',
    fechaHasta: '',
    destinoId: undefined,
    tipoDispositivo: ''
  });
  
  const [showFilters, setShowFilters] = useState(true);
  const isInitialMount = useRef(true);

  // Cargar destinos (empleados, sectores o sucursales)
  useEffect(() => {
    const loadDestinations = async () => {
      try {
        let data: any[] = [];
        if (reportType === 'Sucursal') {
          const response = await branchService.getActiveBranches();
          data = response.data;
        } else if (reportType === 'Sector') {
          const response = await sectorService.getActiveSectors();
          data = response.data;
        } else if (reportType === 'Empleado') {
          const response = await employeeService.getActiveEmployees();
          data = response.data.employees;
        }
        setDestinations(data);
        // Resetear selección al cambiar tipo
        handleFilterChange('destinoId', undefined);
      } catch (error) {
        console.error('Error loading destinations:', error);
        addNotification({
          message: 'Error al cargar lista de filtros',
          type: 'error'
        });
      }
    };
    loadDestinations();
  }, [reportType]);

  const loadAssignments = async (page: number = 1) => {
    try {
      setLoading(true);
      
      const params: GetAssignmentsByDestinationParams = {
        page,
        pageSize,
        tipoDestino: reportType,
        searchTerm,
        ...filters
      };

      const result = await getAssignmentsByDestination(params);
      
      setAssignments(result.items);
      setTotalItems(result.totalItems);
      setTotalPages(result.totalPages);
      setCurrentPage(page);
      
    } catch (error) {
      console.error('Error al cargar asignaciones:', error);
      addNotification({
        message: 'Error al cargar el reporte de asignaciones',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handles pagination and report type changes
  useEffect(() => {
    loadAssignments(currentPage);
  }, [currentPage, pageSize, reportType]);

  // Handles debounced filter changes and search
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const handler = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        loadAssignments(1);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [filters, searchTerm]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      estadoAsignacion: '',
      fechaDesde: '',
      fechaHasta: '',
      destinoId: undefined,
      tipoDispositivo: ''
    });
    setSearchTerm('');
  };

  const [exportLoading, setExportLoading] = useState(false);

  const handleExport = async () => {
    try {
      setExportLoading(true);
      
      // Construir parámetros de consulta
      const params = new URLSearchParams({
        TipoDestino: reportType,
        ...(searchTerm && { SearchTerm: searchTerm }),
        ...(filters.destinoId && { DestinoID: filters.destinoId.toString() }),
        ...(filters.estadoAsignacion && { EstadoAsignacion: filters.estadoAsignacion === 'activa' ? 'Activa' : 'Devuelta' }),
        ...(filters.fechaDesde && { FechaDesde: filters.fechaDesde }),
        ...(filters.fechaHasta && { FechaHasta: filters.fechaHasta }),
        ...(filters.tipoDispositivo && { TipoDispositivo: filters.tipoDispositivo })
      });

      // Hacer la llamada a la API
      const response = await fetch(`/api/reports/assignments-by-destination/export?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al exportar el reporte');
      }

      // Crear blob y descargar archivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Obtener nombre del archivo del header Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `asignaciones_${reportType.toLowerCase()}.xlsx`;
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
        message: `Reporte exportado exitosamente: ${filename}`,
        type: 'success'
      });
      
    } catch (error) {
      console.error('Error al exportar:', error);
      addNotification({
        message: 'Error al exportar el reporte. Inténtelo nuevamente.',
        type: 'error'
      });
    } finally {
      setExportLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getEstadoBadgeClass = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'activa':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'devuelta':
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
      default:
        return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
    }
  };

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <div className={`p-2 rounded-xl ${
                color === 'primary' ? 'bg-indigo-500/10 text-indigo-500' :
                color === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                color === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                'bg-slate-500/10 text-slate-500'
             }`}>
               <IconComponent size={24} />
             </div>
             <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
               {title}
             </h1>
          </div>
          <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            {description}
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
               className={`w-full pl-10 pr-4 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                 theme === 'dark' 
                   ? 'bg-slate-800/50 border-slate-700 text-slate-200 focus:bg-slate-800' 
                   : 'bg-white border-slate-200 text-slate-700 focus:bg-white'
               }`}
             />
             <Search className={`absolute left-3 top-2.5 w-4 h-4 transition-colors ${
               theme === 'dark' ? 'text-slate-500 group-focus-within:text-indigo-400' : 'text-slate-400 group-focus-within:text-indigo-500'
             }`} />
           </div>

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
             onClick={() => loadAssignments(currentPage)}
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
            {/* Selector Dinámico de Destino (Empleado/Sector/Sucursal) */}
            <div>
              <label className="block text-xs font-medium mb-1.5 opacity-70">{reportType}</label>
              <select
                value={filters.destinoId || ''}
                onChange={(e) => handleFilterChange('destinoId', e.target.value ? Number(e.target.value) : undefined)}
                className={`w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                  theme === 'dark' 
                    ? 'bg-slate-800/50 border-slate-700 text-slate-200' 
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <option value="">Todos</option>
                {destinations.map((dest) => (
                  <option key={dest.id} value={dest.id}>
                    {reportType === 'Empleado' ? `${dest.nombre} ${dest.apellido}` : dest.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 opacity-70">Dispositivo</label>
              <select
                value={filters.tipoDispositivo}
                onChange={(e) => handleFilterChange('tipoDispositivo', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                  theme === 'dark' 
                    ? 'bg-slate-800/50 border-slate-700 text-slate-200' 
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <option value="">Todos</option>
                <option value="Notebook">Notebook</option>
                <option value="Celular">Celular</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 opacity-70">Estado</label>
              <select
                value={filters.estadoAsignacion}
                onChange={(e) => handleFilterChange('estadoAsignacion', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                  theme === 'dark' 
                    ? 'bg-slate-800/50 border-slate-700 text-slate-200' 
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <option value="">Todos</option>
                <option value="activa">Activas</option>
                <option value="devuelta">Devueltas</option>
              </select>
            </div>
            
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
            
            <div className="flex justify-end mt-2">
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

      {/* Content */}
      <GlassCard className="!p-0 overflow-hidden">
        {loading && assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loading text="Cargando asignaciones..." />
          </div>
        ) : assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <IconComponent className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className={`text-lg font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              No hay resultados
            </h3>
            <p className="text-slate-500 text-sm">
              No se encontraron asignaciones con los filtros seleccionados.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className={`border-b ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">
                      {reportType}
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">
                      Fecha Asignación
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">
                      Días
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">
                      Asignado por
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-700/50' : 'divide-slate-200/50'}`}>
                  {assignments.map((assignment, index) => (
                    <tr key={`assignment-${assignment.id || index}-${index}`} className={`transition-colors ${theme === 'dark' ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}`}>
                      <td className="px-6 py-4 text-sm font-medium">
                        {assignment.destino_nombre}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                        {assignment.producto_nombre}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getEstadoBadgeClass(assignment.estado)}`}>
                          {assignment.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(assignment.fecha_asignacion)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                        <span className="font-mono">{assignment.dias_asignado}</span> días
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                        {assignment.usuario_asigna}
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
                   Total: {totalItems} registros
                 </p>
                 <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className={`text-sm rounded px-2 py-1 outline-none border ${
                      theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <option value={20}>20 por pág.</option>
                    <option value={50}>50 por pág.</option>
                    <option value={100}>100 por pág.</option>
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

export default AssignmentsByDestinationReport;