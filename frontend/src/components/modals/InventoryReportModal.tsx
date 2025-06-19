import React, { useEffect } from 'react';
import { FiX, FiDownload } from 'react-icons/fi';
import { InventoryReportItem } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface InventoryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: InventoryReportItem[];
}

const InventoryReportModal: React.FC<InventoryReportModalProps> = ({
  isOpen,
  onClose,
  title,
  data,
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
    console.log('Exportando a CSV...', data);
    alert('Funcionalidad de exportación a CSV pendiente de implementación.');
  };

  const columns = [
    { header: 'ID', accessor: 'ID' as keyof InventoryReportItem },
    { header: 'Tipo', accessor: 'TipoInventario' as keyof InventoryReportItem },
    { header: 'Marca', accessor: 'ProductoMarca' as keyof InventoryReportItem },
    { header: 'Modelo', accessor: 'ProductoModelo' as keyof InventoryReportItem },
    { header: 'Categoría', accessor: 'ProductoCategoria' as keyof InventoryReportItem },
    { header: 'N/S', accessor: 'NumeroSerie' as keyof InventoryReportItem },
    { header: 'Estado', accessor: 'Estado' as keyof InventoryReportItem },
    { header: 'Cantidad', accessor: 'Cantidad' as keyof InventoryReportItem },
  ];

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
                    max-w-6xl w-full max-h-[90vh] \
                    ${theme === 'dark' 
                      ? 'bg-slate-800/90 border border-slate-700/50 text-slate-100'
                      : 'bg-white/90 border border-slate-300/50 text-slate-900'
                    } backdrop-blur-lg`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b \
                        ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-300/50'}`}>
          <h2 className="text-2xl font-bold font-display">{title}</h2>
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

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
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
                  {columns.map((col) => (
                    <th key={String(col.accessor)} className="p-3 text-sm font-semibold text-slate-300 border-b border-slate-700">
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.length > 0 ? (
                  data.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-slate-700/50 transition-colors">
                      {columns.map((col) => (
                        <td key={String(col.accessor)} className="p-3 text-sm text-slate-200 border-b border-slate-800">
                          {String(row[col.accessor] ?? 'N/A')}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="text-center p-8 text-slate-400">
                      No se encontraron datos para este reporte.
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

export default InventoryReportModal; 