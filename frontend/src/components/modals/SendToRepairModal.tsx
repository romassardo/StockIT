import React, { useState } from 'react';
import { FiTool, FiTruck, FiFileText, FiLoader, FiAlertCircle, FiPackage } from 'react-icons/fi';
import Modal from '../common/Modal';
import { useNotification } from '../../contexts/NotificationContext';
import * as inventoryService from '../../services/inventory.service';

interface PreselectedAsset {
  inventario_individual_id: number;
  numero_serie: string;
  producto_info: string;
  empleado_info?: string;
}

interface SendToRepairModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRepairSubmitted: () => void;
  preselectedAsset?: PreselectedAsset;
  zIndex?: number;
}

const SendToRepairModal: React.FC<SendToRepairModalProps> = ({ 
  isOpen, 
  onClose, 
  onRepairSubmitted,
  preselectedAsset,
  zIndex = 60
}) => {
  const { addNotification } = useNotification();
  
  const [proveedor, setProveedor] = useState('');
  const [problemaDescripcion, setProblemaDescripcion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!preselectedAsset) {
      addNotification({ type: 'error', message: 'No hay un activo seleccionado para reparar.' });
      return;
    }

    if (!proveedor.trim() || !problemaDescripcion.trim()) {
      addNotification({ type: 'warning', message: 'Complete todos los campos obligatorios.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await inventoryService.createRepair({
        inventario_individual_id: preselectedAsset.inventario_individual_id,
        proveedor: proveedor.trim(),
        problema_descripcion: problemaDescripcion.trim(),
      });

      addNotification({ type: 'success', message: 'Orden de reparación creada exitosamente.' });
      onRepairSubmitted();
      onClose();
    } catch (err: any) {
      console.error('Error al crear reparación:', err);
      const msg = err.response?.data?.error || 'Error al procesar el envío a reparación.';
      addNotification({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enviar a Reparación" zIndex={zIndex}>
      <div className="p-6 space-y-6">
        
        {/* Tarjeta del Activo */}
        {preselectedAsset ? (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 flex items-start gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-800/30 rounded-lg text-amber-600 dark:text-amber-400">
              <FiTool size={24} />
            </div>
            <div>
              <h4 className="font-bold text-amber-900 dark:text-amber-100">
                {preselectedAsset.producto_info}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold uppercase text-amber-700 dark:text-amber-300 bg-amber-200/50 dark:bg-amber-700/30 px-2 py-0.5 rounded">
                  SN: {preselectedAsset.numero_serie}
                </span>
              </div>
              {preselectedAsset.empleado_info && (
                <p className="text-sm text-amber-800 dark:text-amber-200/70 mt-2 flex items-center gap-1">
                  <span className="opacity-75">Asignado a:</span> {preselectedAsset.empleado_info}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2">
            <FiAlertCircle /> Error: No se seleccionó un activo.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Proveedor */}
          <div>
            <label htmlFor="proveedor" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              <div className="flex items-center gap-2">
                <FiTruck className="text-indigo-500" /> Proveedor / Servicio Técnico *
              </div>
            </label>
            <input
              id="proveedor"
              type="text"
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
              placeholder="Ej: Servicio Técnico Oficial HP"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Descripción del Problema */}
          <div>
            <label htmlFor="problema" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              <div className="flex items-center gap-2">
                <FiFileText className="text-indigo-500" /> Descripción de la Falla *
              </div>
            </label>
            <textarea
              id="problema"
              value={problemaDescripcion}
              onChange={(e) => setProblemaDescripcion(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 resize-none"
              placeholder="Describa el problema o falla que presenta el equipo..."
              required
              disabled={isSubmitting}
            />
          </div>

        </form>
      </div>

      {/* Footer */}
      <div className="flex justify-end items-center gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-3xl">
        <button 
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-xl text-sm font-medium border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting || !proveedor || !problemaDescripcion || !preselectedAsset}
          className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
        >
          {isSubmitting ? (
            <>
              <FiLoader className="animate-spin" /> Enviando...
            </>
          ) : (
            <>
              <FiTool /> Confirmar Envío
            </>
          )}
        </button>
      </div>
    </Modal>
  );
};

export default SendToRepairModal;