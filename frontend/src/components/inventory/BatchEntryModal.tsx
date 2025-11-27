import React, { useState, useEffect } from 'react';
import { FiUploadCloud, FiType, FiAlignJustify, FiLoader, FiCheckCircle } from 'react-icons/fi';
import * as inventoryService from '../../services/inventory.service';
import { Product } from '../../types';
import Modal from '../common/Modal';
import { useNotification } from '../../contexts/NotificationContext';

interface BatchEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
}

const BatchEntryModal: React.FC<BatchEntryModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { addNotification } = useNotification();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [serialNumbers, setSerialNumbers] = useState('');
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
        addNotification({ type: 'warning', message: 'No se encontraron productos con número de serie.' });
      }
    } catch (err) {
      addNotification({ type: 'error', message: 'Error al cargar productos.' });
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedProductId) {
      addNotification({ type: 'warning', message: 'Seleccione un producto.' });
      return;
    }

    // Separar por comas, espacios o nuevas líneas y limpiar vacíos
    const serials = serialNumbers
      .split(/[\n,]+/) // Separar por salto de línea o coma
      .map(s => s.trim().toUpperCase())
      .filter(s => s.length > 0);

    if (serials.length === 0) {
      addNotification({ type: 'warning', message: 'Ingrese al menos un número de serie.' });
      return;
    }

    // Validar mínimos
    if (serials.some(s => s.length < 3)) {
      addNotification({ type: 'warning', message: 'Todos los números de serie deben tener al menos 3 caracteres.' });
      return;
    }

    setSubmitting(true);
    try {
      // Preparar payload como array de objetos CreateInventoryItem
      const itemsToCreate = serials.map(sn => ({
        producto_id: parseInt(selectedProductId),
        numero_serie: sn
      }));

      // Usar el servicio correcto que envía { items: [...] }
      const createdItems = await inventoryService.createBatchInventoryItems(itemsToCreate);
      
      addNotification({ type: 'success', message: `${createdItems.length || serials.length} activos creados exitosamente.` });
      onSuccess(createdItems.length || serials.length);
      handleClose();

    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Error al procesar la carga masiva.';
      addNotification({ type: 'error', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setSerialNumbers('');
    setSelectedProductId('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Carga Masiva de Activos"
      zIndex={50}
    >
      <div className="p-6 space-y-6">
        
        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-300">
          <p className="font-semibold mb-1">Instrucciones:</p>
          <ul className="list-disc list-inside space-y-1 opacity-90">
            <li>Seleccione el producto común para todos los activos.</li>
            <li>Copie y pegue los números de serie (uno por línea o separados por comas).</li>
            <li>Se crearán automáticamente como "Disponibles".</li>
          </ul>
        </div>

        {/* Selección de Producto */}
        <div>
          <label htmlFor="batch-product" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Producto <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <FiType />
            </div>
            <select
              id="batch-product"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:opacity-50 appearance-none"
              disabled={loadingProducts || submitting}
            >
              <option value="">{loadingProducts ? 'Cargando...' : 'Seleccione un producto...'}</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nombre_marca} {p.nombre_producto}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Área de Texto para Series */}
        <div>
          <label htmlFor="batch-serials" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Números de Serie <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute top-3 left-3 pointer-events-none text-slate-400">
              <FiAlignJustify />
            </div>
            <textarea
              id="batch-serials"
              value={serialNumbers}
              onChange={(e) => setSerialNumbers(e.target.value)}
              rows={8}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-mono text-sm"
              placeholder={`SN001\nSN002\nSN003...`}
              disabled={submitting}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>Se convertirán a mayúsculas.</span>
            <span>
              {serialNumbers.split(/[\n,]+/).filter(s => s.trim().length > 0).length} detectados
            </span>
          </div>
        </div>

      </div>

      {/* Footer */}
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
          disabled={submitting || !selectedProductId || !serialNumbers.trim()} 
          className="px-6 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/30 transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {submitting ? (
            <>
              <FiLoader className="animate-spin" /> Procesando...
            </>
          ) : (
            <>
              <FiUploadCloud /> Cargar Lote
            </>
          )}
        </button>
      </div>
    </Modal>
  );
};

export default BatchEntryModal;