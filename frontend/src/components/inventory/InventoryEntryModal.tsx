import React, { useState, useEffect } from 'react';
import { FiX, FiPlusCircle, FiTag, FiType, FiHardDrive } from 'react-icons/fi';
import * as inventoryService from '../../services/inventory.service';
import { Product } from '../../types';

interface InventoryEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const InventoryEntryModal: React.FC<InventoryEntryModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    productoId: '',
    numeroSerie: '',
    observaciones: '',
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchProducts = async () => {
        setLoading(true);
        try {
          const response = await inventoryService.getProductsWithSerialNumber();
          setProducts(response.data || []);
        } catch (err) {
          setError('No se pudieron cargar los productos del catálogo.');
        } finally {
          setLoading(false);
        }
      };
      fetchProducts();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setError(null);
    setSubmitting(true);

    try {
      if (!formData.productoId || !formData.numeroSerie) {
        throw new Error('Debe seleccionar un producto e ingresar un número de serie.');
      }
      
      await inventoryService.createInventoryItem({
        producto_id: parseInt(formData.productoId),
        numero_serie: formData.numeroSerie,
        observaciones: formData.observaciones,
      });
      
      onSuccess();
      handleClose();

    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Ocurrió un error al registrar el dispositivo.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleClose = () => {
    if (submitting) return;
    setFormData({ productoId: '', numeroSerie: '', observaciones: '' });
    setError(null);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="glass-card-deep w-full max-w-lg p-6 rounded-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gradient-primary">Nuevo Ingreso de Activo</h2>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-slate-500/20">
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-300 dark:border-red-500/30 mb-4">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="product" className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                <FiType /> Producto*
              </label>
              <select
                id="product"
                value={formData.productoId}
                onChange={(e) => setFormData(prev => ({ ...prev, productoId: e.target.value }))}
                className="input-glass w-full"
                required
                disabled={loading}
              >
                <option value="">{loading ? 'Cargando...' : 'Seleccione un producto'}</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre_marca} {p.nombre_producto}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="serial" className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                <FiTag /> Número de Serie*
              </label>
              <input
                id="serial"
                type="text"
                value={formData.numeroSerie}
                onChange={(e) => setFormData(prev => ({ ...prev, numeroSerie: e.target.value.toUpperCase() }))}
                className="input-glass w-full"
                placeholder="Ej: SN-DELL-123XYZ"
                required
              />
            </div>
            
            <div>
              <label htmlFor="notes" className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                <FiHardDrive /> Observaciones (Opcional)
              </label>
              <textarea
                id="notes"
                value={formData.observaciones}
                onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                className="input-glass w-full"
                rows={3}
                placeholder="Detalles adicionales sobre el ingreso..."
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={handleClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={submitting || loading} className="btn-primary">
              {submitting ? 'Registrando...' : 'Registrar Activo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 

