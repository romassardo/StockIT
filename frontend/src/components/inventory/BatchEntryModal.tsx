import React, { useState, useEffect } from 'react';
import { FiX, FiUploadCloud } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import * as inventoryService from '../../services/inventory.service';
import ProductSearchSelect from '../common/ProductSearchSelect';
import { type Product } from '../../types';

interface BatchEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: { Creados: number; Duplicados: string | null }) => void;
}

const BatchEntryModal: React.FC<BatchEntryModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { theme } = useTheme();
  const { addNotification } = useNotification();

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [serialNumbers, setSerialNumbers] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchProducts = async () => {
        setIsLoadingProducts(true);
        try {
          const response = await inventoryService.getProductsWithSerialNumber();
          setProducts(response.data || []);
        } catch (err) {
          addNotification({ type: 'error', message: 'No se pudieron cargar los productos.' });
        } finally {
          setIsLoadingProducts(false);
        }
      };
      fetchProducts();
    }
  }, [isOpen, addNotification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedProductId) {
      setError('Por favor, seleccione un producto.');
      return;
    }

    const serials = serialNumbers.split(/[,\\n\\s]+/).filter(sn => sn.trim() !== '');
    if (serials.length === 0) {
      setError('Por favor, ingrese al menos un número de serie.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await inventoryService.createInventoryBatch({
        producto_id: parseInt(selectedProductId, 10),
        numeros_serie: serials,
      });

      if (response.success) {
        onSuccess(response.data);
      } else {
        addNotification({ type: 'error', message: response.message || 'Error en el alta masiva.' });
      }
    } catch (err: any) {
      addNotification({ type: 'error', message: err.response?.data?.error || 'Error de servidor.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
      <div className={`glass-card-deep w-full max-w-lg p-6 rounded-2xl`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gradient-primary">Alta Masiva de Activos</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-500/20">
            <FiX />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Producto</label>
              {isLoadingProducts ? (
                <p>Cargando productos...</p>
              ) : (
                <ProductSearchSelect 
                  products={products}
                  selectedProductId={selectedProductId}
                  onProductSelect={setSelectedProductId}
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Números de Serie</label>
              <textarea
                value={serialNumbers}
                onChange={(e) => setSerialNumbers(e.target.value)}
                placeholder="Pegue los números de serie aquí, separados por comas, espacios o saltos de línea."
                rows={8}
                className="input-glass w-full"
                disabled={isSubmitting}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary flex items-center gap-2" disabled={isSubmitting || isLoadingProducts}>
              <FiUploadCloud />
              {isSubmitting ? 'Procesando...' : 'Crear Activos'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BatchEntryModal; 

