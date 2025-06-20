import React, { useState, useEffect, useRef } from 'react';
import { FiDownload, FiFilter, FiRefreshCw } from 'react-icons/fi';
import { useNotification } from '../../contexts/NotificationContext';
import { getAssignmentsByDestination, GetAssignmentsByDestinationParams, AssignmentReportItem } from '../../services/report.service';
import Loading from '../common/Loading';

interface AssignmentsByDestinationReportProps {
  reportType: 'Empleado' | 'Sector' | 'Sucursal';
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const AssignmentsByDestinationReport: React.FC<AssignmentsByDestinationReportProps> = ({
  reportType,
  title,
  description,
  icon: IconComponent,
  color
}) => {
  const { addNotification } = useNotification();
  const [assignments, setAssignments] = useState<AssignmentReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState<Omit<GetAssignmentsByDestinationParams, 'tipoDestino'>>({
    estadoAsignacion: '',
    fechaDesde: '',
    fechaHasta: '',
    destinoId: undefined
  });
  const [showFilters, setShowFilters] = useState(true);
  const isInitialMount = useRef(true);

  const loadAssignments = async (page: number = 1) => {
    try {
      setLoading(true);
      
      const params: GetAssignmentsByDestinationParams = {
        page,
        pageSize: 20,
        tipoDestino: reportType,
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
  }, [currentPage, reportType]);

  // Handles debounced filter changes
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
  }, [filters]);

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
      destinoId: undefined
    });
  };

  const [exportLoading, setExportLoading] = useState(false);

  const handleExport = async () => {
    try {
      setExportLoading(true);
      
      // Construir parámetros de consulta
      const params = new URLSearchParams({
        TipoDestino: reportType,
        ...(filters.destinoId && { DestinoID: filters.destinoId.toString() }),
        ...(filters.estadoAsignacion && { EstadoAsignacion: filters.estadoAsignacion === 'activa' ? 'Activa' : 'Devuelta' }),
        ...(filters.fechaDesde && { FechaDesde: filters.fechaDesde }),
        ...(filters.fechaHasta && { FechaHasta: filters.fechaHasta })
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
        return 'bg-success-500/20 text-success-300 border-success-500/30';
      case 'devuelta':
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
      default:
        return 'bg-primary-500/20 text-primary-300 border-primary-500/30';
    }
  };

  if (loading && assignments.length === 0) {
    return <Loading />;
  }

  return (
    <div className="relative min-h-screen text-white p-4 sm:p-6 md:p-8 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-900">
      {/* Orbes de fondo fijos */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full blur-2xl bg-primary-500/20 animate-pulse" />
        <div className="absolute top-40 right-20 w-24 h-24 rounded-full blur-xl bg-secondary-500/20 animate-pulse" style={{animationDelay: '2s'}} />
        <div className="absolute bottom-32 left-1/4 w-20 h-20 rounded-full blur-lg bg-success-500/20 animate-pulse" style={{animationDelay: '4s'}} />
        <div className="absolute bottom-20 right-1/3 w-28 h-28 rounded-full blur-xl bg-info-500/20 animate-pulse" style={{animationDelay: '1s'}} />
      </div>
      
      {/* Contenido principal */}
      <div className="relative z-10">


        {/* Filtros */}
        <div className="p-6 rounded-2xl bg-slate-800/60 backdrop-blur-lg border border-slate-700 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-100 font-display">
                {title}
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                {description}
              </p>
            </div>
            
            {/* Panel de filtros y exportación */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowFilters(prev => !prev)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500/20 text-primary-300 rounded-lg hover:bg-primary-500/30 transition-colors"
              >
                <FiFilter className="w-4 h-4" />
                {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
              </button>
              
              <button
                onClick={handleExport}
                disabled={exportLoading}
                className="flex items-center gap-2 px-4 py-2 bg-success-500/20 text-success-300 rounded-lg hover:bg-success-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiDownload className={`w-4 h-4 ${exportLoading ? 'animate-pulse' : ''}`} />
                {exportLoading ? 'Exportando...' : 'Exportar Excel'}
              </button>
            </div>
          </div>

          {/* Panel de filtros expandible */}
          {showFilters && (
            <div className="mb-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600 animate-fade-in-down">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Estado</label>
                  <select
                    value={filters.estadoAsignacion}
                    onChange={(e) => handleFilterChange('estadoAsignacion', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 text-slate-100 border border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Todos</option>
                    <option value="activa">Activas</option>
                    <option value="devuelta">Devueltas</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Desde</label>
                  <input
                    type="date"
                    value={filters.fechaDesde}
                    onChange={(e) => handleFilterChange('fechaDesde', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 text-slate-100 border border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Hasta</label>
                  <input
                    type="date"
                    value={filters.fechaHasta}
                    onChange={(e) => handleFilterChange('fechaHasta', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 text-slate-100 border border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex justify-start">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-600/50 text-slate-300 rounded-lg hover:bg-slate-600/80 transition-colors"
                  >
                    <FiRefreshCw className="w-4 h-4" />
                    Limpiar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Resultados */}
        <div className="p-6 rounded-2xl bg-slate-800/60 backdrop-blur-lg border border-slate-700 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                color === 'primary' ? 'bg-primary-500/20' :
                color === 'success' ? 'bg-success-500/20' :
                color === 'warning' ? 'bg-warning-500/20' :
                color === 'danger' ? 'bg-danger-500/20' :
                color === 'info' ? 'bg-info-500/20' :
                'bg-secondary-500/20'
              }`}>
                <IconComponent className={`w-5 h-5 ${
                  color === 'primary' ? 'text-primary-400' :
                  color === 'success' ? 'text-success-400' :
                  color === 'warning' ? 'text-warning-400' :
                  color === 'danger' ? 'text-danger-400' :
                  color === 'info' ? 'text-info-400' :
                  'text-secondary-400'
                }`} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">
                  Resultados
                </h2>
                <p className="text-slate-400 text-sm">
                  {totalItems} asignaciones encontradas
                </p>
              </div>
            </div>
            
            <button
              onClick={() => loadAssignments(currentPage)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
          
          {/* Tabla moderna con diseño glassmorphism */}
          <div className="overflow-hidden rounded-lg border border-slate-600/50">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-700/50 border-b border-slate-600/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      {reportType}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Fecha Asignación
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Días
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Asignado por
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800/40 divide-y divide-slate-600/50">
                  {assignments.map((assignment, index) => (
                    <tr key={`assignment-${assignment.id || index}-${index}`} className="hover:bg-slate-700/40 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-slate-100">
                        {assignment.destino_nombre}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-200">
                        {assignment.producto_nombre}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getEstadoBadgeClass(assignment.estado)}`}>
                          {assignment.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        {formatDate(assignment.fecha_asignacion)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        <span className="inline-flex items-center gap-1">
                          {assignment.dias_asignado} días
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        {assignment.usuario_asigna}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          
          </div>
          
          {/* Paginación moderna */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-6 space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || loading}
                className="px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-600/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-slate-400">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || loading}
                className="px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-600/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
        
        {/* Estado vacío */}
        {assignments.length === 0 && !loading && (
          <div className="p-12 rounded-2xl bg-slate-800/60 backdrop-blur-lg border border-slate-700 text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
              color === 'primary' ? 'bg-primary-500/20' :
              color === 'success' ? 'bg-success-500/20' :
              color === 'warning' ? 'bg-warning-500/20' :
              color === 'danger' ? 'bg-danger-500/20' :
              color === 'info' ? 'bg-info-500/20' :
              'bg-secondary-500/20'
            }`}>
              <IconComponent className={`w-8 h-8 ${
                color === 'primary' ? 'text-primary-400' :
                color === 'success' ? 'text-success-400' :
                color === 'warning' ? 'text-warning-400' :
                color === 'danger' ? 'text-danger-400' :
                color === 'info' ? 'text-info-400' :
                'text-secondary-400'
              }`} />
            </div>
            <h3 className="text-lg font-medium text-slate-200 mb-2">
              Sin resultados
            </h3>
            <p className="text-slate-400">
              No se encontraron asignaciones para los filtros seleccionados.
              <br />
              Intenta ajustar los criterios de búsqueda.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentsByDestinationReport;