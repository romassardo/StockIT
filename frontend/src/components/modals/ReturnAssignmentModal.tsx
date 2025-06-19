import React, { useState } from 'react';
import { FiInfo, FiLoader } from 'react-icons/fi';
import { useNotification } from '../../contexts/NotificationContext';
import { assignmentService } from '../../services/assignment.service';
import Modal from '../common/Modal';

interface ReturnAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssignmentReturned: () => void;
  assignment: {
    id: number;
    numero_serie: string;
    producto_info: string;
    empleado_info: string;
  };
  zIndex?: number;
}

const ReturnAssignmentModal: React.FC<ReturnAssignmentModalProps> = ({ 
  isOpen, 
  onClose, 
  onAssignmentReturned,
  assignment,
  zIndex = 60
}) => {
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [observaciones, setObservaciones] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await assignmentService.returnAssignment(assignment.id, observaciones);
      if (response.success) {
        addNotification({ type: 'success', message: 'Activo devuelto exitosamente.' });
        onAssignmentReturned();
        onClose();
      } else {
        addNotification({ type: 'error', message: response.message || 'Error al procesar la devolución.' });
      }
    } catch (error: any) {
      addNotification({ 
        type: 'error', 
        message: error.response?.data?.message || 'Ocurrió un error inesperado.' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar Devolución" zIndex={zIndex}>
      <div className="p-5 space-y-4">
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-slate-700/50 border border-blue-200 dark:border-slate-600">
          <div className="flex items-start space-x-3">
            <FiInfo className="text-blue-500 dark:text-blue-400 mt-1" size={20} />
            <div>
              <p className="font-semibold text-sm text-blue-800 dark:text-blue-300">Estás a punto de registrar la devolución de:</p>
              <ul className="text-xs list-disc list-inside mt-1 text-blue-700 dark:text-blue-400">
                <li><strong>Producto:</strong> {assignment.producto_info}</li>
                <li><strong>S/N:</strong> {assignment.numero_serie}</li>
                <li><strong>Asignado a:</strong> {assignment.empleado_info}</li>
              </ul>
              <p className="text-xs mt-2 text-blue-600 dark:text-blue-500">
                El estado del activo se cambiará a "Disponible".
              </p>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="observaciones" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Observaciones (Opcional)
          </label>
          <textarea
            id="observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Ej: El equipo se devuelve por fin de proyecto."
            className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors dark:bg-slate-900 dark:text-slate-200 dark:border-slate-600"
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 rounded-b-2xl">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors flex items-center gap-2 disabled:bg-indigo-400"
        >
          {loading && <FiLoader className="animate-spin" />}
          Confirmar Devolución
        </button>
      </div>
    </Modal>
  );
};

export default ReturnAssignmentModal; 