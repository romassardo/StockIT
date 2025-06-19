// frontend/src/components/modals/SendToRepairModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../common/Modal'; // Asumiendo que Modal existe
import Button from '../common/Button';
import Input from '../common/Input'; // Asumiendo que Input existe
import Textarea from '../common/Textarea'; // Asumiendo que Textarea existe
import SelectSearch from '../common/SelectSearch'; // Componente para buscar activos
import { FiSend, FiXCircle } from 'react-icons/fi';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext'; // Para el ID del usuario que envía
import { useNotification } from '../../contexts/NotificationContext';

interface AssetOption {
  value: number; // inventario_individual_id
  label: string; // Ej: "Notebook Dell XPS 15 - SN: XXXXXX"
}

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
  preselectedAsset?: PreselectedAsset; // Activo preseleccionado opcional
  zIndex?: number;
}

const SendToRepairModal: React.FC<SendToRepairModalProps> = ({ 
  isOpen, 
  onClose, 
  onRepairSubmitted,
  preselectedAsset,
  zIndex = 60 // Por defecto, un poco más alto que el modal base
}) => {
  const { user } = useAuth(); // Obtener usuario del contexto
  const { addNotification } = useNotification(); // Hook para notificaciones
  const [assetId, setAssetId] = useState<number | null>(null);
  const [proveedor, setProveedor] = useState<string>('');
  const [descripcionProblema, setDescripcionProblema] = useState<string>('');
  const [assetOptions, setAssetOptions] = useState<AssetOption[]>([]);
  const [loadingAssets, setLoadingAssets] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar activos (Notebooks y Celulares en estado Disponible o Asignado)
  const fetchAssetsForRepair = useCallback(async () => {
    setLoadingAssets(true);
    try {
      const response = await api.get('/inventory/for-repair');
      const data = response.data.data.map((asset: any) => ({
        value: asset.id,
        label: `${asset.categoria} ${asset.marca} ${asset.modelo} - N/S: ${asset.numero_serie} (${asset.estado})`
      }));
      setAssetOptions(data);
    } catch (err) {
      console.error('Error fetching assets for repair:', err);
      addNotification({ type: 'error', message: 'Error al cargar activos para reparación.' });
    } finally {
      setLoadingAssets(false);
    }
  }, [addNotification]);

  useEffect(() => {
    if (isOpen) {
      if (!preselectedAsset) {
        fetchAssetsForRepair();
      }
      
      // Si hay un activo preseleccionado, configurarlo
      if (preselectedAsset) {
        setAssetId(preselectedAsset.inventario_individual_id);
      } else {
        setAssetId(null);
      }
      setProveedor('');
      setDescripcionProblema('');
      setError(null);
    }
  }, [isOpen, fetchAssetsForRepair, preselectedAsset]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Prevenir doble envío
    if (isSubmitting) {
      return;
    }
    
    if (!user || !user.id) {
      addNotification({ type: 'error', message: 'Error de autenticación. Por favor, inicie sesión de nuevo.' });
      setIsSubmitting(false);
      return;
    }
    
    setIsSubmitting(true);
    
    if (!assetId || !proveedor || !descripcionProblema) {
      addNotification({ type: 'error', message: 'Por favor, complete todos los campos.' });
      setIsSubmitting(false);
      return;
    }

    try {
      const repairData = {
        inventario_individual_id: assetId,
        proveedor,
        problema_descripcion: descripcionProblema,
        usuario_envia_id: user?.id, // ID del usuario logueado, asegurar que user exista
      };

      await api.post('/repairs', repairData);

      addNotification({ type: 'success', message: 'Activo enviado a reparación exitosamente.' });
      onRepairSubmitted(); // Llama a la función para refrescar la lista principal
      onClose(); // Cierra el modal

    } catch (err: any) {
      console.error('Error al enviar a reparación:', err);
      const errorMessage = err.response?.data?.message || 'Error al enviar a reparación. Intente de nuevo.';
      addNotification({ type: 'error', message: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Envío a Reparación" zIndex={zIndex}>
      <form onSubmit={handleSubmit} className="space-y-6 p-2">
        <div>
          <label htmlFor="asset" className="block text-sm font-medium text-text-secondary mb-1">Activo a Reparar (N/S)</label>
          {preselectedAsset ? (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {preselectedAsset.producto_info} - N/S: {preselectedAsset.numero_serie}
              </p>
              {preselectedAsset.empleado_info && (
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  Asignado a: {preselectedAsset.empleado_info}
                </p>
              )}
            </div>
          ) : (
            <SelectSearch
              options={assetOptions}
              value={assetOptions.find(opt => opt.value === assetId) || null}
              onChange={(option) => setAssetId(option ? Number(option.value) : null)}
              placeholder="Buscar por N/S, tipo, marca..."
              isLoading={loadingAssets}
              isClearable
            />
          )}
        </div>

        <Input
          label="Proveedor"
          id="proveedor"
          value={proveedor}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProveedor(e.target.value)}
          placeholder="Nombre del proveedor o servicio técnico"
          required
          maxLength={100}
        />

        <Textarea
          label="Descripción del Problema"
          id="descripcionProblema"
          value={descripcionProblema}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescripcionProblema(e.target.value)}
          placeholder="Detalle la falla o el motivo del envío a reparación"
          required
          rows={4}
        />

        {error && <p className="text-sm text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}

        <div className="flex justify-end space-x-4 pt-4">
          <Button type="button" onClick={onClose} variant="secondary" className="glassmorphism-button-secondary">
            <FiXCircle className="mr-2" />
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting} className="glassmorphism-button">
            <FiSend className="mr-2" />
            {isSubmitting ? 'Enviando...' : 'Enviar a Reparación'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default SendToRepairModal;
