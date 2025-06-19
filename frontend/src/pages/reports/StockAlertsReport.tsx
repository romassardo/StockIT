import React, { useState, useEffect, useMemo } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import { getStockAlerts } from '../../services/report.service';
import { StockAlertItem, PaginatedStockAlerts } from '../../types';
import { useTable, Column, CellProps } from 'react-table';
import { useNotification } from '../../contexts/NotificationContext';
import Loading from '../../components/common/Loading';

const StockAlertsReport: React.FC = () => {
  const [data, setData] = useState<PaginatedStockAlerts | null>(null);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotification();

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        const result = await getStockAlerts({ page: 1, pageSize: 20 });
        
        // 🔧 SANITIZACIÓN ADICIONAL: Asegurar que todos los campos numéricos sean numbers
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

    fetchAlerts();
  }, [addNotification]);
  
  const columns = useMemo<Column<StockAlertItem>[]>(() => [
    {
      accessor: 'ProductoNombre',
      Header: 'Producto',
    },
    {
      accessor: 'Categoria',
      Header: 'Categoría',
    },
    {
      accessor: 'CantidadActual',
      Header: 'Stock Actual',
      Cell: ({ value }: CellProps<StockAlertItem, number>) => <span>{Number(value)}</span>,
    },
    {
      accessor: 'StockMinimo',
      Header: 'Stock Mínimo',
      Cell: ({ value }: CellProps<StockAlertItem, number>) => <span>{Number(value)}</span>,
    },
    {
      accessor: 'TipoAlerta',
      Header: 'Tipo de Alerta',
    },
  ], []);

  const tableInstance = useTable({ columns, data: data?.items || [] });

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = tableInstance;

  return (
    <div className="relative min-h-screen text-white p-4 sm:p-6 md:p-8 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-900">
      {/* Orbes de fondo fijos (sin AnimatedOrbsBackground) */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full blur-2xl bg-primary-500/20 animate-pulse" />
        <div className="absolute top-40 right-20 w-24 h-24 rounded-full blur-xl bg-secondary-500/20 animate-pulse" style={{animationDelay: '2s'}} />
        <div className="absolute bottom-32 left-1/4 w-20 h-20 rounded-full blur-lg bg-success-500/20 animate-pulse" style={{animationDelay: '4s'}} />
        <div className="absolute bottom-20 right-1/3 w-28 h-28 rounded-full blur-xl bg-info-500/20 animate-pulse" style={{animationDelay: '1s'}} />
      </div>
      
      <div className="relative z-10">
        <header className="mb-8">
          <div className="flex items-center space-x-4">
            <FiAlertTriangle className="w-8 h-8 text-red-400" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-100 font-display">
              Reporte de Alertas de Stock
            </h1>
          </div>
          <p className="mt-2 text-slate-400 max-w-2xl">
            Análisis detallado de todos los productos que han alcanzado o caído por debajo de su nivel de stock mínimo.
          </p>
        </header>

        <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-6 overflow-x-auto">
          {loading ? (
            <Loading />
          ) : (
            <table {...getTableProps()} className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                {headerGroups.map(headerGroup => {
                  const { key: headerGroupKey, ...headerGroupProps } = headerGroup.getHeaderGroupProps();
                  return (
                    <tr key={headerGroupKey} {...headerGroupProps}>
                      {headerGroup.headers.map(column => {
                        const { key: headerKey, ...headerProps } = column.getHeaderProps();
                        return (
                          <th key={headerKey} {...headerProps} className="px-6 py-3">
                            {column.render('Header')}
                          </th>
                        );
                      })}
                    </tr>
                  );
                })}
              </thead>
              <tbody {...getTableBodyProps()}>
                {rows.map(row => {
                  prepareRow(row);
                  const { key: rowKey, ...rowProps } = row.getRowProps();
                  return (
                    <tr key={rowKey} {...rowProps} className="border-b border-slate-700 hover:bg-slate-800">
                      {row.cells.map(cell => {
                        const { key: cellKey, ...cellProps } = cell.getCellProps();
                        return (
                          <td key={cellKey} {...cellProps} className="px-6 py-4">
                            {cell.render('Cell')}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockAlertsReport;
