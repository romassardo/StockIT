import React, { useState, useEffect } from 'react';
import { FiTag, FiType, FiHardDrive, FiLoader, FiCheckCircle } from 'react-icons/fi';
import * as inventoryService from '../../services/inventory.service';
import { Product } from '../../types';
import Modal from '../common/Modal';
import { useNotification } from '../../contexts/NotificationContext';

interface InventoryEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const InventoryEntryModal: React.FC<InventoryEntryModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { addNotification } = useNotification();
  
  const [formData, setFormData] = useState({
    productoId: '',
    numeroSerie: '',
    observaciones: '',
  });
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await inventoryService.getProductsWithSerialNumber();
      if (response.success && Array.isArray(response.data)) {
        setProducts(response.data);
      } else {
        setProducts([]);
        addNotification({ type: 'warning', message: 'No se encontraron productos con número de serie configurado.' });
      }
    } catch (err) {
      console.error(err);
      addNotification({ type: 'error', message: 'Error al cargar el catálogo de productos.' });
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.productoId) {
      addNotification({ type: 'warning', message: 'Por favor seleccione un producto.' });
      return;
    }
    if (!formData.numeroSerie || formData.numeroSerie.trim().length < 3) {
      addNotification({ type: 'warning', message: 'El número de serie es obligatorio (mín. 3 caracteres).' });
      return;
    }

    setSubmitting(true);
    try {
      await inventoryService.createInventoryItem({
        producto_id: parseInt(formData.productoId),
        numero_serie: formData.numeroSerie.trim().toUpperCase(),
        observaciones: formData.observaciones,
      });
      
      addNotification({ type: 'success', message: 'Activo registrado exitosamente.' });
      onSuccess();
      handleClose();

    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Error al registrar el activo.';
      addNotification({ type: 'error', message: msg });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleClose = () => {
    if (submitting) return;
    setFormData({ productoId: '', numeroSerie: '', observaciones: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Registrar Nuevo Activo"
      zIndex={50}
    >
      <div className="p-6 space-y-6">
        
        {/* Selección de Producto */}
        <div>
          <label htmlFor="product" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Producto <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <FiType />
            </div>
            <select
              id="product"
              value={formData.productoId}
              onChange={(e) => setFormData(prev => ({ ...prev, productoId: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
              required
              disabled={loadingProducts || submitting}
            >
              <option value="">{loadingProducts ? 'Cargando catálogo...' : 'Seleccione un producto...'}</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nombre_marca} {p.nombre_producto}
                </option>
              ))}
            </select>
            {/* Flecha custom para select si fuera necesario, por ahora default del navegador */}
          </div>
          {products.length === 0 && !loadingProducts && (
            <p className="text-xs text-amber-500 mt-1">
              * No hay productos configurados para usar N/S. Contacte al administrador.
            </p>
          )}
        </div>

        {/* Número de Serie */}
        <div>
          <label htmlFor="serial" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Número de Serie <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <FiTag />
            </div>
            <input
              id="serial"
              type="text"
              value={formData.numeroSerie}
              onChange={(e) => setFormData(prev => ({ ...prev, numeroSerie: e.target.value.toUpperCase() }))}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
              placeholder="Ej: SN-HP-554433"
              required
              disabled={submitting}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Se convertirá a mayúsculas automáticamente.
          </p>
        </div>
        
        {/* Observaciones */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Observaciones (Opcional)
          </label>
          <div className="relative">
            <div className="absolute top-3 left-3 pointer-events-none text-slate-400">
              <FiHardDrive />
            </div>
            <textarea
              id="notes"
              value={formData.observaciones}
              onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 min-h-[100px]"
              placeholder="Detalles adicionales sobre el estado o procedencia..."
              disabled={submitting}
            />
          </div>
        </div>

      </div>

      {/* Footer con Botones */}
      <div className="flex justify-end items-center gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-3xl">
        <button 
          type="button" 
          onClick={handleClose} 
          disabled={submitting}
          className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button 
          type="button"
          onClick={handleSubmit} 
          disabled={submitting || loadingProducts || !formData.productoId || !formData.numeroSerie} 
          className="px-6 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/30 transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {submitting ? (
            <>
              <FiLoader className="animate-spin" /> Registrando...
            </>
          ) : (
            <>
              <FiCheckCircle /> Registrar Activo
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}; 
