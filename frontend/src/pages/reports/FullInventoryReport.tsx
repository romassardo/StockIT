import React, { useMemo, useState, useEffect } from 'react';
import { useTable, usePagination, Column } from 'react-table';
import { getStockDisponibleReport } from '../../services/report.service';
import { StockDisponibleReportItem, PaginatedStockDisponibleReport } from '../../types';
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight, FiFilter, FiDownload, FiGrid, FiList, FiPackage } from 'react-icons/fi';

const StockDisponibleReport: React.FC = () => {
  const [data, setData] = useState<StockDisponibleReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  
  // Estados de filtros
  const [filterType, setFilterType] = useState<string>('');
  const [filterCategoria, setFilterCategoria] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('Categoria');
  const [sortOrder, setSortOrder] = useState<string>('ASC');
  const [showFilters, setShowFilters] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const handleExport = async () => {
    try {
      setExportLoading(true);
      
      // Construir parámetros de consulta
      const params = new URLSearchParams({
        FilterType: filterType,
        FilterCategoria: filterCategoria,
        SortBy: sortBy,
        SortOrder: sortOrder
      });

      // Hacer la llamada a la API
      const response = await fetch(`/api/reports/stock-disponible/export?${params}`, {
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
      let filename = 'stock_disponible.xlsx';
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
      
      console.log('Archivo exportado exitosamente');
      
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar el reporte. Inténtelo nuevamente.');
    } finally {
      setExportLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result: PaginatedStockDisponibleReport = await getStockDisponibleReport({ 
          page: currentPage, 
          pageSize: pageSize,
          FilterType: filterType as any,
          FilterCategoria: filterCategoria || undefined,
          SortBy: sortBy as any,
          SortOrder: sortOrder as any
        });
        setData(result.items);
        setPageCount(result.totalPages);
      } catch (error) {
        console.error('Error fetching full inventory report:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, pageSize, filterType, filterCategoria, sortBy, sortOrder]);

  const columns: Column<StockDisponibleReportItem>[] = useMemo(
    () => [
      {
        Header: 'Tipo',
        accessor: 'TipoInventario',
        Cell: ({ value }: { value: string }) => (
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full ${
              value === 'Serializado'
                ? 'bg-blue-500/20 text-blue-300'
                : 'bg-green-500/20 text-green-300'
            }`}
          >
            {value}
          </span>
        ),
      },
      {
        Header: 'Categoría',
        accessor: 'Categoria',
      },
      {
        Header: 'Marca',
        accessor: 'marca',
      },
      {
        Header: 'Modelo',
        accessor: 'modelo',
      },
      {
        Header: 'Descripción',
        accessor: 'descripcion',
        Cell: ({ value }: { value: string | null }) => value || <span className="text-slate-500">-</span>,
      },
      {
        Header: 'Cantidad Disponible',
        accessor: 'cantidad_disponible',
        Cell: ({ value }: { value: number }) => (
          <span className="font-semibold text-success-400">
            {value} {value === 1 ? 'unidad' : 'unidades'}
          </span>
        ),
      },
    ],
    []
  );

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
  }

  return (
    <div className="relative min-h-screen text-white p-4 sm:p-6 md:p-8 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-900">
      {/* 🌌 ORBES DE FONDO OBLIGATORIAS - ESTÁNDAR DEL PROYECTO */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full blur-2xl bg-primary-500/20 animate-pulse" />
        <div className="absolute top-40 right-20 w-24 h-24 rounded-full blur-xl bg-secondary-500/20 animate-pulse" style={{animationDelay: '2s'}} />
        <div className="absolute bottom-32 left-1/4 w-20 h-20 rounded-full blur-lg bg-success-500/20 animate-pulse" style={{animationDelay: '4s'}} />
        <div className="absolute bottom-20 right-1/3 w-28 h-28 rounded-full blur-xl bg-info-500/20 animate-pulse" style={{animationDelay: '1s'}} />
      </div>
      
      {/* Contenido principal */}
      <div className="relative z-10">
        <header className="mb-8">
          <div className="flex items-center space-x-4">
            <FiPackage className="w-8 h-8 text-primary-400" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-100 font-display">
              Stock Disponible
            </h1>
          </div>
          <p className="mt-2 text-slate-400 max-w-2xl">
            Reporte de productos disponibles para asignar (excluye activos ya asignados o en reparación)
          </p>
        </header>
        
        <div className="p-6 rounded-2xl bg-slate-800/60 backdrop-blur-lg border border-slate-700 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-100 font-display">
                Stock Disponible
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Solo productos disponibles para asignar (no incluye asignados)
              </p>
            </div>
            
            {/* Panel de filtros y exportación */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500/20 text-primary-300 rounded-lg hover:bg-primary-500/30 transition-colors"
              >
                <FiFilter className="w-4 h-4" />
                Filtros
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
            <div className="mb-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tipo</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 text-slate-100 border border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Todos</option>
                    <option value="Serializado">Serializados</option>
                    <option value="General">Stock General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Ordenar por</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 text-slate-100 border border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="Categoria">Categoría</option>
                    <option value="Marca">Marca</option>
                    <option value="Modelo">Modelo</option>
                    <option value="Cantidad">Cantidad Disponible</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Orden</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 text-slate-100 border border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="ASC">Ascendente</option>
                    <option value="DESC">Descendente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Items por página</label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 text-slate-100 border border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-4">
          <div className="overflow-x-auto">
            <table {...getTableProps()} className="w-full text-sm">
              <thead>
                {headerGroups.map(headerGroup => {
                  const { key: headerGroupKey, ...headerGroupProps } = headerGroup.getHeaderGroupProps();
                  return (
                    <tr key={headerGroupKey} {...headerGroupProps}>
                      {headerGroup.headers.map(column => {
                        const { key: columnKey, ...columnProps } = column.getHeaderProps();
                        return (
                          <th
                            key={columnKey}
                            {...columnProps}
                            className="p-3 text-left font-semibold text-slate-400 border-b border-slate-700"
                          >
                            {column.render('Header')}
                          </th>
                        );
                      })}
                    </tr>
                  );
                })}
              </thead>
              <tbody {...getTableBodyProps()}>
                {page.map(row => {
                  prepareRow(row);
                  const { key: rowKey, ...rowProps } = row.getRowProps();
                  return (
                    <tr key={rowKey} {...rowProps} className="hover:bg-slate-700/50 transition-colors duration-200">
                      {row.cells.map(cell => {
                        const { key: cellKey, ...cellProps } = cell.getCellProps();
                        return (
                          <td
                            key={cellKey}
                            {...cellProps}
                            className="p-3 border-b border-slate-700/50"
                          >
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

          {/* Paginación */}
          <div className="flex items-center justify-between mt-4 text-sm text-slate-400">
            <div>
              <span>
                Página{' '}
                <strong>
                  {pageIndex + 1} de {pageOptions.length}
                </strong>{' '}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-2 rounded-md hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">
                <FiChevronsLeft />
              </button>
              <button onClick={() => setCurrentPage(p => p - 1)} disabled={!canPreviousPage} className="p-2 rounded-md hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">
                <FiChevronLeft />
              </button>
              <span className="px-2">
                <input
                  type="number"
                  value={currentPage}
                  onChange={e => {
                    const page = e.target.value ? Number(e.target.value) : 1;
                    if (page > 0 && page <= pageOptions.length) {
                      setCurrentPage(page);
                    }
                  }}
                  className="w-12 text-center bg-slate-700 rounded-md p-1"
                  min="1"
                  max={pageOptions.length}
                />
              </span>
              <button onClick={() => setCurrentPage(p => p + 1)} disabled={!canNextPage} className="p-2 rounded-md hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">
                <FiChevronRight />
              </button>
              <button onClick={() => setCurrentPage(pageCount)} disabled={currentPage === pageCount} className="p-2 rounded-md hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">
                <FiChevronsRight />
              </button>
            </div>
            <div>
              <select
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
                className="bg-slate-700 rounded-md p-1"
              >
                {[15, 25, 50, 100].map(size => (
                  <option key={size} value={size}>
                    Mostrar {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockDisponibleReport;
