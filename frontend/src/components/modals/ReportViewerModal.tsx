import React from 'react';
import Modal from '../common/Modal';
import { FiX, FiDownload } from 'react-icons/fi';

interface ReportViewerModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: T[];
  columns: { header: string; accessor: keyof T }[];
}

function ReportViewerModal<T extends {}>({
  isOpen,
  onClose,
  title,
  data,
  columns,
}: ReportViewerModalProps<T>) {
  
  const handleExportCSV = () => {
    // Lógica de exportación a CSV se implementará aquí
    console.log('Exportando a CSV...', data);
    alert('Funcionalidad de exportación a CSV pendiente de implementación.');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 bg-slate-800/50 text-slate-100 rounded-lg max-w-4xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold font-display text-white">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700/50 transition-colors">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition-all duration-300 ease-out-expo shadow-lg hover:shadow-primary"
          >
            <FiDownload />
            Exportar a CSV
          </button>
        </div>

        <div className="overflow-auto max-h-[60vh]">
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
    </Modal>
  );
}

export default ReportViewerModal; 