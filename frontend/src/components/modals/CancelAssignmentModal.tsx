import React, { useState } from 'react';
import { FiAlertTriangle, FiLoader } from 'react-icons/fi';
import { useNotification } from '../../contexts/NotificationContext';
import { assignmentService } from '../../services/assignment.service';
import Modal from '../common/Modal';

interface CancelAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssignmentCancelled: () => void;
  assignment: {
    id: number;
    numero_serie: string;
    producto_info: string;
    empleado_info: string;
  };
  zIndex?: number;
}

const CancelAssignmentModal: React.FC<CancelAssignmentModalProps> = ({ 
  isOpen, 
  onClose, 
  onAssignmentCancelled,
  assignment,
  zIndex = 60
}) => {
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [motivo, setMotivo] = useState('');

  const handleSubmit = async () => {
    if (motivo.trim().length < 5) {
      addNotification({ type: 'warning', message: 'El motivo debe tener al menos 5 caracteres.' });
      return;
    }

    setLoading(true);
    try {
      const response = await assignmentService.cancelAssignment(assignment.id, motivo);
      if (response.success) {
        addNotification({ type: 'success', message: 'Asignación cancelada exitosamente.' });
        onAssignmentCancelled();
        onClose();
      } else {
        addNotification({ type: 'error', message: response.message || 'Error al cancelar la asignación.' });
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
    <Modal isOpen={isOpen} onClose={onClose} title="Cancelar Asignación" zIndex={zIndex}>
      <div className="p-5 space-y-4">
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-start space-x-3">
            <FiAlertTriangle className="text-red-500 dark:text-red-400 mt-1" size={20} />
            <div>
              <p className="font-semibold text-sm text-red-800 dark:text-red-300">¡Atención! Esta acción es destructiva</p>
              <p className="text-xs mt-1 text-red-700 dark:text-red-400">
                Estás a punto de cancelar una asignación. Esto debe usarse <strong>solo si la asignación se creó por error</strong>.
                Si el empleado devolvió el equipo, usa la opción "Devolver".
              </p>
              <ul className="text-xs list-disc list-inside mt-2 text-red-700 dark:text-red-400 opacity-80">
                <li><strong>Producto:</strong> {assignment.producto_info}</li>
                <li><strong>S/N:</strong> {assignment.numero_serie}</li>
                <li><strong>Asignado a:</strong> {assignment.empleado_info}</li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="motivo" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Motivo de la cancelación <span className="text-red-500">*</span>
          </label>
          <textarea
            id="motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej: Error al seleccionar el empleado. Asignación duplicada."
            className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors dark:bg-slate-900 dark:text-slate-200 dark:border-slate-600"
            rows={3}
          />
          <p className="text-xs text-slate-400 mt-1 text-right">
            {motivo.length}/5 caracteres mínimos
          </p>
        </div>
      </div>

      <div className="flex justify-end items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 rounded-b-2xl">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          Cerrar
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || motivo.trim().length < 5}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors flex items-center gap-2 disabled:bg-red-400 disabled:cursor-not-allowed"
        >
          {loading && <FiLoader className="animate-spin" />}
          Cancelar Asignación
        </button>
      </div>
    </Modal>
  );
};

export default CancelAssignmentModal;