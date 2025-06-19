import React, { useState } from 'react';
import { FiX, FiSave, FiAlertCircle } from 'react-icons/fi';
import { type ActiveRepair } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';
import * as repairService from '../../services/repair.service';

interface RepairReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRepairReturned: () => void;
  repair: ActiveRepair;
  zIndex?: number;
}

interface RepairReturnData {
  solucion_descripcion: string;
  estado: 'Reparado' | 'Sin Reparación';
}

const RepairReturnModal: React.FC<RepairReturnModalProps> = ({
  isOpen,
  onClose,
  onRepairReturned,
  repair,
  zIndex = 60,
}) => {
  const { addNotification } = useNotification();
  const [solucion, setSolucion] = useState('');
  const [estadoFinal, setEstadoFinal] = useState<'Reparado' | 'Sin Reparación'>('Reparado');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solucion.trim() || !estadoFinal) {
      setError('Todos los campos son obligatorios.');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      const data: RepairReturnData = {
        solucion_descripcion: solucion,
        estado: estadoFinal,
      };
      await repairService.returnRepair(repair.reparacion_id, data);
      addNotification({ type: 'success', message: 'Retorno de reparación procesado exitosamente.' });
      onRepairReturned();
      onClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Error al procesar el retorno.';
      setError(errorMessage);
      addNotification({ type: 'error', message: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="glass-card-deep w-full max-w-lg p-6 rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/20 dark:border-slate-700/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg text-white">
              <FiSave className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
              Procesar Retorno de Reparación
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200 disabled:opacity-50"
            type="button"
          >
            <FiX className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Información del activo */}
        <div className="pt-6 pb-4">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Activo en reparación:</p>
          <div className="bg-slate-100/50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200/30 dark:border-slate-700/30">
            <p className="font-bold text-lg text-slate-800 dark:text-slate-200">
              {repair.producto_marca} {repair.producto_modelo}
            </p>
            <p className="font-mono text-sm text-primary-600 dark:text-primary-400">
              {repair.numero_serie}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Proveedor: {repair.proveedor}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Descripción de la solución */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Descripción de la Solución *
            </label>
            <textarea
              value={solucion}
              onChange={(e) => setSolucion(e.target.value)}
              disabled={isSubmitting}
              className="input-glass w-full h-24 resize-none"
              placeholder="Detalle el trabajo realizado por el proveedor..."
              required
            />
          </div>

          {/* Estado final */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Estado Final del Activo *
            </label>
            <select
              value={estadoFinal}
              onChange={(e) => setEstadoFinal(e.target.value as 'Reparado' | 'Sin Reparación')}
              disabled={isSubmitting}
              className="input-glass w-full"
            >
              <option value="Reparado">Reparado (vuelve a Disponible)</option>
              <option value="Sin Reparación">Sin Reparación (se da de Baja)</option>
            </select>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50/80 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 rounded-lg">
              <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-4 pt-4 border-t border-slate-200/20 dark:border-slate-700/30">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !solucion.trim()}
              className="btn-primary"
            >
              {isSubmitting ? 'Procesando...' : 'Guardar Retorno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RepairReturnModal; 