import React, { useEffect } from 'react';
import { FiX, FiDownload, FiAlertTriangle, FiPackage } from 'react-icons/fi';
import { StockAlertItem, StockAlertSummary } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface StockAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: StockAlertItem[];
  summary?: StockAlertSummary;
}

const StockAlertsModal: React.FC<StockAlertsModalProps> = ({
  isOpen,
  onClose,
  data,
  summary,
}) => {
  const { theme } = useTheme();
  
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscKey);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  const handleExportCSV = () => {
    console.log('Exportando alertas de stock a CSV...', data);
    alert('Funcionalidad de exportación a CSV pendiente de implementación.');
  };

  const getTipoAlertaBadge = (tipoAlerta: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-semibold";
    if (tipoAlerta === 'Sin Stock') {
      return `${baseClasses} bg-red-500/20 text-red-400 border border-red-500/30`;
    } else {
      return `${baseClasses} bg-yellow-500/20 text-yellow-400 border border-yellow-500/30`;
    }
  };

  const getDiasAgotarseColor = (dias: number) => {
    if (dias === 0) return 'text-red-400';
    if (dias <= 7) return 'text-red-400';
    if (dias <= 30) return 'text-yellow-400';
    return 'text-green-400';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 transition-opacity duration-300 ease-out z-50"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose} 
        aria-hidden="true"
      ></div>

      {/* Modal Content */}
      <div
        className={`relative z-10 rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 \
                    max-w-7xl w-full max-h-[90vh] \
                    ${theme === 'dark' 
                      ? 'bg-slate-800/90 border border-slate-700/50 text-slate-100'
                      : 'bg-white/90 border border-slate-300/50 text-slate-900'
                    } backdrop-blur-lg`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b \
                        ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-300/50'}`}>
          <div className="flex items-center gap-3">
            <FiAlertTriangle className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl font-bold font-display">Alertas de Stock</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-all duration-200 \
                        ${theme === 'dark' 
                          ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-700/50' 
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                        }`}
            aria-label="Cerrar modal"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="p-6 border-b border-slate-700/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <FiAlertTriangle className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-medium text-red-400">Sin Stock</span>
                </div>
                <p className="text-2xl font-bold text-red-400 mt-1">{summary.TotalSinStock}</p>
              </div>
              
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <FiPackage className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm font-medium text-yellow-400">Stock Bajo</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400 mt-1">{summary.TotalStockBajo}</p>
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <FiAlertTriangle className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium text-blue-400">Total Alertas</span>
                </div>
                <p className="text-2xl font-bold text-blue-400 mt-1">{summary.TotalAlertas}</p>
              </div>
              
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <FiPackage className="w-5 h-5 text-purple-500" />
                  <span className="text-sm font-medium text-purple-400">Días Promedio</span>
                </div>
                <p className="text-2xl font-bold text-purple-400 mt-1">
                  {Math.round(summary.PromedioDiasParaAgotarse)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="mb-4">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition-all duration-300 ease-out-expo shadow-lg hover:shadow-primary"
            >
              <FiDownload />
              Exportar a CSV
            </button>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-900/80 backdrop-blur-sm">
                <tr>
                  <th className="p-3 text-sm font-semibold text-slate-300 border-b border-slate-700">Producto</th>
                  <th className="p-3 text-sm font-semibold text-slate-300 border-b border-slate-700">Categoría</th>
                  <th className="p-3 text-sm font-semibold text-slate-300 border-b border-slate-700">Stock</th>
                  <th className="p-3 text-sm font-semibold text-slate-300 border-b border-slate-700">Mínimo</th>
                  <th className="p-3 text-sm font-semibold text-slate-300 border-b border-slate-700">Días</th>
                  <th className="p-3 text-sm font-semibold text-slate-300 border-b border-slate-700">Promedio/Día</th>
                  <th className="p-3 text-sm font-semibold text-slate-300 border-b border-slate-700">Último Mov.</th>
                  <th className="p-3 text-sm font-semibold text-slate-300 border-b border-slate-700">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {data.length > 0 ? (
                  data.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-slate-700/50 transition-colors">
                      <td className="p-3 text-sm text-slate-200 border-b border-slate-800 font-medium">
                        {row.ProductoNombre}
                      </td>
                      <td className="p-3 text-sm text-slate-300 border-b border-slate-800">
                        {row.Categoria}
                      </td>
                      <td className="p-3 text-sm border-b border-slate-800">
                        <span className={`font-bold ${row.CantidadActual === 0 ? 'text-red-400' : 'text-slate-200'}`}>
                          {row.CantidadActual}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-slate-300 border-b border-slate-800">
                        {row.StockMinimo}
                      </td>
                      <td className="p-3 text-sm border-b border-slate-800">
                        <span className={`font-bold ${getDiasAgotarseColor(row.DiasParaAgotarse)}`}>
                          {row.DiasParaAgotarse === 999 ? '∞' : row.DiasParaAgotarse}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-slate-300 border-b border-slate-800">
                        {row.PromedioSalidaDiaria.toFixed(1)}
                      </td>
                      <td className="p-3 text-sm text-slate-300 border-b border-slate-800">
                        {formatDate(row.UltimoMovimiento)}
                      </td>
                      <td className="p-3 text-sm border-b border-slate-800">
                        <span className={getTipoAlertaBadge(row.TipoAlerta)}>
                          {row.TipoAlerta}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center p-8 text-slate-400">
                      No se encontraron alertas de stock.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockAlertsModal; 