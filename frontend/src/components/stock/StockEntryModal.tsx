import React, { useState, useEffect, useCallback } from 'react';
import { Package, Hash, FileText, Loader, CheckCircle } from 'lucide-react';
import { stockService } from '../../services/stock.service';
import { Product } from '../../types';
import Modal from '../common/Modal';
import ProductSearchSelect from '../common/ProductSearchSelect';
import { useNotification } from '../../contexts/NotificationContext';

interface StockEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedProduct: { producto_id: number; stock_actual: number }) => void;
  selectedProductId?: number;
}

const StockEntryModal: React.FC<StockEntryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  selectedProductId
}) => {
  const { addNotification } = useNotification();
  
  const [formData, setFormData] = useState({
    producto_id: selectedProductId?.toString() || '',
    cantidad: '',
    motivo: '',
    motivo_personalizado: '',
    observaciones: ''
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Cargar productos que no usan número de serie para el dropdown
  const loadProducts = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    try {
      const productsData = await stockService.getAvailableProducts();
      
      // Convertir ProductoStock a Product (filtrando productos sin ID válido)
      const convertedProducts: Product[] = productsData
        .filter(prod => prod.producto_id !== undefined && prod.producto_id !== null)
        .map(prod => ({
          id: prod.producto_id,
          producto_id: prod.producto_id,
          marca: prod.nombre_marca || '',
          modelo: '',
          nombre_producto: prod.nombre_producto,
          nombre_marca: prod.nombre_marca,
          nombre_categoria: prod.nombre_categoria,
          descripcion: prod.descripcion_producto,
          categoria_id: prod.categoria_id,
          usa_numero_serie: false,
          stock_minimo: prod.min_stock,
          cantidad_actual: prod.cantidad_actual,
          activo: true,
          created_at: '',
          updated_at: ''
        }));
      
      setProducts(convertedProducts);
    } catch (err: any) {
      addNotification({ type: 'error', message: err.response?.data?.message || 'Error al cargar productos' });
    } finally {
      setLoading(false);
    }
  }, [isOpen, addNotification]);

  useEffect(() => {
    loadProducts();
    if (selectedProductId) {
      setFormData(prev => ({ ...prev, producto_id: selectedProductId.toString() }));
    }
  }, [loadProducts, selectedProductId]);

  const handleSubmit = async () => {
    if (submitting) return;

    // Validaciones
    if (!formData.producto_id) {
      addNotification({ type: 'warning', message: 'Por favor seleccione un producto.' });
      return;
    }

    const cantidad = parseInt(formData.cantidad);
    if (isNaN(cantidad) || cantidad <= 0) {
      addNotification({ type: 'warning', message: 'La cantidad debe ser un número positivo.' });
      return;
    }

    if (!formData.motivo) {
      addNotification({ type: 'warning', message: 'Por favor seleccione un motivo.' });
      return;
    }

    if (formData.motivo === 'Otro motivo' && (!formData.motivo_personalizado || formData.motivo_personalizado.length < 5)) {
      addNotification({ type: 'warning', message: 'Especifique el motivo (mín. 5 caracteres).' });
      return;
    }

    setSubmitting(true);

    try {
      const motivoFinal = formData.motivo === 'Otro motivo' ? formData.motivo_personalizado : formData.motivo;

      const entryData = {
        producto_id: parseInt(formData.producto_id),
        cantidad,
        motivo: motivoFinal,
        observaciones: formData.observaciones.trim() || undefined,
      };

      const response = await stockService.createStockEntry(entryData);
      
      // La notificación de éxito se muestra en Stock.tsx -> handleEntrySuccess
      const currentProduct = products.find(p => p.producto_id === entryData.producto_id);
      const newStock = (currentProduct?.cantidad_actual || 0) + cantidad;
      
      onSuccess({ 
        producto_id: entryData.producto_id, 
        stock_actual: response.stockActual || newStock
      });
      handleClose();

    } catch (err: any) {
      addNotification({ type: 'error', message: err.response?.data?.message || err.message || 'Error al registrar la entrada' });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleClose = () => {
    if (submitting) return;
    setFormData({
      producto_id: '',
      cantidad: '',
      motivo: '',
      motivo_personalizado: '',
      observaciones: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Registrar Entrada de Stock"
      size="lg"
    >
      <div className="p-6 space-y-6">
        {loading ? (
          <div className="text-center py-8">
            <Loader className="h-8 w-8 animate-spin mx-auto text-indigo-500 mb-3" />
            <p className="text-slate-600 dark:text-slate-400">Cargando productos...</p>
          </div>
        ) : (
          <>
            {/* Selector de Producto */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Producto <span className="text-red-500">*</span>
              </label>
              <ProductSearchSelect
                products={products}
                selectedProductId={formData.producto_id}
                onProductSelect={(productId) => setFormData(prev => ({ ...prev, producto_id: productId }))}
                disabled={loading || submitting || !!selectedProductId}
                placeholder={loading ? 'Cargando productos...' : 'Buscar producto por nombre, marca o categoría...'}
              />
              {products.length === 0 && !loading && (
                <p className="text-xs text-amber-500 mt-1">
                  * No hay productos de stock general disponibles.
                </p>
              )}
            </div>

            {/* Cantidad */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Cantidad <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Hash className="h-4 w-4" />
                </div>
                <input
                  type="number"
                  min="1"
                  value={formData.cantidad}
                  onChange={(e) => setFormData(prev => ({ ...prev, cantidad: e.target.value }))}
                  disabled={submitting}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                  placeholder="Cantidad a añadir"
                  required
                />
              </div>
            </div>

            {/* Motivo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Motivo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Package className="h-4 w-4" />
                </div>
                <select
                  value={formData.motivo}
                  onChange={(e) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      motivo: e.target.value,
                      motivo_personalizado: e.target.value === 'Otro motivo' ? prev.motivo_personalizado : ''
                    }));
                  }}
                  disabled={submitting}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none"
                  required
                >
                  <option value="">Seleccionar motivo</option>
                  <option value="Compra">Compra</option>
                  <option value="Devolucion por Prestamo">Devolución por Préstamo</option>
                  <option value="Ajuste de Inventario">Ajuste de Inventario</option>
                  <option value="Recuperacion">Recuperación</option>
                  <option value="Otro motivo">Otro motivo</option>
                </select>
              </div>
              
              {formData.motivo === 'Otro motivo' && (
                <input
                  type="text"
                  value={formData.motivo_personalizado}
                  onChange={(e) => setFormData(prev => ({ ...prev, motivo_personalizado: e.target.value }))}
                  disabled={submitting}
                  className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                  placeholder="Especifique el motivo (mín. 5 caracteres)"
                  minLength={5}
                  required
                />
              )}
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Observaciones (Opcional)
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none text-slate-400">
                  <FileText className="h-4 w-4" />
                </div>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                  disabled={submitting}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 min-h-[80px]"
                  placeholder="Información adicional opcional..."
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer con Botones */}
      <div className="flex justify-end items-center gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-2xl">
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
          disabled={submitting || loading || !formData.producto_id || !formData.cantidad || !formData.motivo} 
          className="px-6 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-500/30 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {submitting ? (
            <>
              <Loader className="h-4 w-4 animate-spin" /> Registrando...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" /> Registrar Entrada
            </>
          )}
        </button>
      </div>
    </Modal>
  );
};

export default StockEntryModal;
