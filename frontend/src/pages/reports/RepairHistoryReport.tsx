import React, { useState, useEffect, useMemo } from 'react';
import { useTable, usePagination, Column } from 'react-table';
import { getRepairHistoryReport } from '../../services/report.service';
import { RepairHistoryItem, PaginatedRepairHistoryReport } from '../../types';
import { 
  FiChevronLeft, 
  FiChevronRight, 
  FiChevronsLeft, 
  FiChevronsRight, 
  FiFilter, 
  FiDownload,
  FiTool,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle
} from 'react-icons/fi';

const RepairHistoryReport: React.FC = () => {
  const [data, setData] = useState<RepairHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  
  // Estados de filtros
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');
  const [estado, setEstado] = useState<string>('');
  const [proveedor, setProveedor] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Función para obtener icono según estado
  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'Reparado':
        return <FiCheckCircle className="text-success-400" />;
      case 'En Reparación':
        return <FiClock className="text-warning-400" />;
      case 'Sin Reparación':
        return <FiXCircle className="text-danger-400" />;
      default:
        return <FiAlertCircle className="text-slate-400" />;
    }
  };

  // Función para formatear fechas
  const formatDate = (dateString: string | null) => {
    if (!dateString) return <span className="text-slate-500">-</span>;
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Función para exportar Excel
  const handleExport = async () => {
    try {
      setExportLoading(true);
      
      // Construir parámetros
      const params = new URLSearchParams();
      if (fechaDesde) params.append('fechaDesde', fechaDesde);
      if (fechaHasta) params.append('fechaHasta', fechaHasta);
      if (estado) params.append('estado', estado);
      if (proveedor) params.append('proveedor', proveedor);

      // Llamada a la API
      const response = await fetch(`/api/reports/repair-history/export?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al exportar el reporte');
      }

      // Crear blob y descargar
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
      
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar el reporte. Inténtelo nuevamente.');
    } finally {
      setExportLoading(false);
    }
  };

  // Efecto para cargar datos con filtros automáticos
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result: PaginatedRepairHistoryReport = await getRepairHistoryReport({
          page: currentPage,
          pageSize: pageSize,
          fechaDesde: fechaDesde || undefined,
          fechaHasta: fechaHasta || undefined,
          estado: estado || undefined,
          proveedor: proveedor || undefined,
        });
        setData(result.items);
        setPageCount(result.totalPages);
      } catch (error) {
        console.error('Error fetching repair history report:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, pageSize, fechaDesde, fechaHasta, estado, proveedor]);

  // Columnas de la tabla
  const columns: Column<RepairHistoryItem>[] = useMemo(
    () => [
      {
        Header: 'N° Serie',
        accessor: 'numero_serie',
        Cell: ({ value }: { value: string }) => (
          <span className="font-mono text-sm bg-slate-700/50 px-2 py-1 rounded">
            {value}
          </span>
        ),
      },
      {
        Header: 'Activo',
        accessor: 'marca',
        Cell: ({ row }: { row: any }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-200">
              {row.original.marca} {row.original.modelo}
            </span>
            <span className="text-xs text-slate-400">{row.original.categoria}</span>
          </div>
        ),
      },
      {
        Header: 'Proveedor',
        accessor: 'proveedor',
        Cell: ({ value }: { value: string }) => (
          <span className="text-primary-300">{value}</span>
        ),
      },
      {
        Header: 'Fecha Envío',
        accessor: 'fecha_envio',
        Cell: ({ value }: { value: string }) => formatDate(value),
      },
      {
        Header: 'Fecha Retorno',
        accessor: 'fecha_retorno',
        Cell: ({ value }: { value: string | null }) => formatDate(value),
      },
      {
        Header: 'Estado',
        accessor: 'estado',
        Cell: ({ value }: { value: string }) => (
          <div className="flex items-center gap-2">
            {getEstadoIcon(value)}
            <span
              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                value === 'Reparado'
                  ? 'bg-success-500/20 text-success-300'
                  : value === 'En Reparación'
                  ? 'bg-warning-500/20 text-warning-300'
                  : 'bg-danger-500/20 text-danger-300'
              }`}
            >
              {value}
            </span>
          </div>
        ),
      },
      {
        Header: 'Días',
        accessor: 'dias_reparacion',
        Cell: ({ value }: { value: number }) => (
          <span className="font-semibold text-info-400">
            {value} {value === 1 ? 'día' : 'días'}
          </span>
        ),
      },
      {
        Header: 'Problema',
        accessor: 'problema_descripcion',
        Cell: ({ value }: { value: string }) => (
          <div className="max-w-xs truncate" title={value}>
            {value}
          </div>
        ),
      },
    ],
    []
  );

  // Hook de react-table
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    gotoPage,
    nextPage,
    previousPage,
    state: { pageIndex },
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

  useEffect(() => {
    gotoPage(currentPage - 1);
  }, [currentPage, gotoPage]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }  return (
    <div className="relative min-h-screen text-slate-200 p-4 sm:p-6 md:p-8 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-900">
      {/* 🌌 Orbes de fondo animados - IMPLEMENTACIÓN OBLIGATORIA */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full blur-xl bg-primary-500/20 animate-float" />
        <div className="absolute top-40 right-20 w-24 h-24 rounded-full blur-lg bg-secondary-500/20 animate-float" style={{animationDelay: '2s'}} />
        <div className="absolute bottom-32 left-1/4 w-20 h-20 rounded-full blur-lg bg-success-500/20 animate-float" style={{animationDelay: '4s'}} />
        <div className="absolute bottom-20 right-1/3 w-28 h-28 rounded-full blur-xl bg-info-500/20 animate-float" style={{animationDelay: '1s'}} />
      </div>
      
      {/* Contenido principal */}
      <div className="relative z-10">
        <header className="mb-8">
          <div className="flex items-center space-x-4">
            <FiTool className="w-8 h-8 text-primary-400" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-100 font-display">
              Historia de Reparaciones
            </h1>
          </div>
          <p className="text-slate-400 max-w-2xl">
            Historial completo de todas las reparaciones realizadas en notebooks y celulares.
          </p>
        </header>
        
        <div className="p-6 rounded-2xl bg-slate-800/60 backdrop-blur-lg border border-slate-700 shadow-xl">
          {/* Header con título y controles */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-100 font-display">
                Reporte de Historia de Reparaciones
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                {data.length > 0 ? `${data[0].TotalRows} registros encontrados` : 'Sin registros'}
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg transition-all duration-200 border border-slate-600/50"
              >
                <FiFilter className="text-sm" />
                Filtros
              </button>
              
              <button
                onClick={handleExport}
                disabled={exportLoading}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiDownload className="text-sm" />
                {exportLoading ? 'Exportando...' : 'Exportar Excel'}
              </button>
            </div>
          </div>

          {/* Panel de filtros */}
          {showFilters && (
            <div className="mb-6 p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Fecha Desde
                  </label>
                  <input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Fecha Hasta
                  </label>
                  <input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Estado
                  </label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Todos los estados</option>
                    <option value="En Reparación">En Reparación</option>
                    <option value="Reparado">Reparado</option>
                    <option value="Sin Reparación">Sin Reparación</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Proveedor
                  </label>
                  <input
                    type="text"
                    value={proveedor}
                    onChange={(e) => setProveedor(e.target.value)}
                    placeholder="Nombre del proveedor"
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tabla de reportes */}
          <div className="overflow-x-auto">
            <table {...getTableProps()} className="w-full">
              <thead>
                {headerGroups.map(headerGroup => (
                  <tr {...headerGroup.getHeaderGroupProps()} className="border-b border-slate-600">
                    {headerGroup.headers.map(column => (
                      <th
                        {...column.getHeaderProps()}
                        className="text-left py-4 px-4 text-sm font-semibold text-slate-300 uppercase tracking-wider"
                      >
                        {column.render('Header')}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody {...getTableBodyProps()}>
                {page.map((row, i) => {
                  prepareRow(row);
                  return (
                    <tr
                      {...row.getRowProps()}
                      className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors"
                    >
                      {row.cells.map(cell => (
                        <td
                          {...cell.getCellProps()}
                          className="py-4 px-4 text-sm text-slate-200"
                        >
                          {cell.render('Cell')}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Estado vacío */}
          {data.length === 0 && !loading && (
            <div className="text-center py-12">
              <FiTool className="mx-auto text-6xl text-slate-600 mb-4" />
              <h3 className="text-xl font-semibold text-slate-400 mb-2">
                No hay reparaciones registradas
              </h3>
              <p className="text-slate-500">
                {showFilters ? 'Intenta ajustar los filtros de búsqueda' : 'Aún no se han registrado reparaciones en el sistema'}
              </p>
            </div>
          )}

          {/* Paginación */}
          {data.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-slate-700/50">
              <div className="flex items-center gap-2 mb-4 sm:mb-0">
                <span className="text-sm text-slate-400">Mostrar</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1 bg-slate-800 border border-slate-600 rounded text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {[15, 25, 50, 100].map(size => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-slate-400">registros por página</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={!canPreviousPage}
                  className="p-2 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FiChevronsLeft />
                </button>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={!canPreviousPage}
                  className="p-2 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FiChevronLeft />
                </button>
                
                <span className="px-4 py-2 text-sm text-slate-300">
                  Página {currentPage} de {pageCount}
                </span>
                
                <button
                  onClick={() => setCurrentPage(Math.min(pageCount, currentPage + 1))}
                  disabled={!canNextPage}
                  className="p-2 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FiChevronRight />
                </button>
                <button
                  onClick={() => setCurrentPage(pageCount)}
                  disabled={!canNextPage}
                  className="p-2 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FiChevronsRight />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RepairHistoryReport;