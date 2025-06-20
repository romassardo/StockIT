import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiPlus, FiPackage, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { stockService } from '../../services/stock.service';
import { Product } from '../../types';
import ProductSearchSelect from '../common/ProductSearchSelect';

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
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Cargar productos que no usan número de serie para el dropdown
  const loadProducts = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    setError('');
    try {
      console.log('🔄 Cargando productos para stock general...');
      const productsData = await stockService.getAvailableProducts();
      
      // Convertir ProductoStock a Product
      const convertedProducts: Product[] = productsData.map(prod => ({
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
      
      console.log('✅ Productos cargados:', convertedProducts.length, 'productos');
      console.log('📦 Primeros 3 productos:', convertedProducts.slice(0, 3));
      setProducts(convertedProducts);
    } catch (err: any) {
      console.error('❌ Error cargando productos para stock:', err);
      console.error('📋 Detalles del error:', err.response?.data);
      setError(err.response?.data?.message || err.message || 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    loadProducts();
    if (selectedProductId) {
      setFormData(prev => ({ ...prev, producto_id: selectedProductId.toString() }));
    }
  }, [loadProducts, selectedProductId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const cantidad = parseInt(formData.cantidad);
      if (isNaN(cantidad) || cantidad <= 0) {
        throw new Error('La cantidad debe ser un número positivo');
      }

      // Usar motivo personalizado si se seleccionó "Otro motivo"
      const motivoFinal = formData.motivo === 'Otro motivo' ? formData.motivo_personalizado : formData.motivo;

      const entryData = {
        producto_id: parseInt(formData.producto_id),
        cantidad,
        motivo: motivoFinal,
        observaciones: formData.observaciones.trim() || undefined,
      };

      console.log('📤 Enviando entrada de stock:', entryData);

      const response = await stockService.createStockEntry(entryData);
      
      console.log('✅ Respuesta del servidor:', response);

      setSuccess(response.message || 'Entrada registrada con éxito.');
      
      // Calcular el nuevo stock y llamar onSuccess con la estructura correcta
      const currentProduct = products.find(p => p.producto_id === entryData.producto_id);
      const newStock = (currentProduct?.cantidad_actual || 0) + cantidad;
      
      console.log('📊 Stock calculado:', {
        productoId: entryData.producto_id,
        stockAnterior: currentProduct?.cantidad_actual,
        cantidad: cantidad,
        stockNuevo: newStock,
        stockDelBackend: response.stockActual
      });
      
      setTimeout(() => {
        onSuccess({ 
          producto_id: entryData.producto_id, 
          stock_actual: response.stockActual || newStock // Usar el stock devuelto por el backend si está disponible
        });
        handleClose();
      }, 1500);

    } catch (err: any) {
      console.error('❌ Error en entrada de stock:', err);
      console.error('📋 Detalles del error:', err.response?.data);
      setError(err.response?.data?.message || err.message || 'Error al registrar la entrada');
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
    setError('');
    setSuccess('');
    onClose();
  };

  if (!isOpen) return null;

  // Mostrar loading spinner mientras cargan los productos
  if (loading) {
    return createPortal(
      <div className="modal-overlay-protection flex items-center justify-center p-6 overflow-y-auto">
        <div className="relative z-[10000] w-full max-w-lg max-h-[75vh] flex flex-col my-auto">
          <div className="modal-glass h-full flex flex-col">
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Cargando productos...</p>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="modal-overlay-protection flex items-center justify-center p-6 overflow-y-auto">
      {/* Backdrop clickeable */}
      <div 
        className="absolute inset-0"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative z-[10000] w-full max-w-2xl max-h-[75vh] flex flex-col my-auto">
        <div className="modal-glass h-full flex flex-col">
          {/* 🎯 Header - Modern Design System 2025 - SUCCESS THEME */}
          <div style={{
            background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
            borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0',
            boxShadow: 'var(--shadow-success)'
          }} className="text-white p-8 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm" style={{borderRadius: 'var(--radius-lg)'}}>
                <FiPlus className="w-7 h-7" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Registrar Entrada de Stock</h2>
                <p className="text-white/80 text-base mt-1">Agregar productos al inventario</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={submitting}
              className="p-3 hover:bg-white/20 transition-all"
              style={{
                borderRadius: 'var(--radius-lg)',
                transitionDuration: 'var(--duration-normal)',
                transitionTimingFunction: 'var(--ease-out-expo)'
              }}
            >
              <FiX className="w-6 h-6" strokeWidth={2.5} />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                {/* 🎯 Selector de producto - Modern Design */}
                <div>
                  <label className="block text-base font-semibold mb-3 text-slate-900 dark:text-slate-50">
                    Producto *
                  </label>
                  <ProductSearchSelect
                    products={products}
                    selectedProductId={formData.producto_id}
                    onProductSelect={(productId) => setFormData(prev => ({ ...prev, producto_id: productId }))}
                    disabled={loading || submitting || !!selectedProductId}
                    placeholder={loading ? 'Cargando productos...' : 'Buscar producto por nombre, marca o categoría...'}
                  />
                </div>

                {/* Cantidad */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.cantidad}
                    onChange={(e) => setFormData(prev => ({ ...prev, cantidad: e.target.value }))}
                    disabled={submitting}
                    className="input-glass w-full"
                    placeholder="Cantidad a añadir al stock"
                    required
                  />
                </div>

                {/* Motivo */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Motivo *
                  </label>
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
                    className="input-glass w-full mb-2"
                    required
                  >
                    <option value="">Seleccionar motivo</option>
                    <option value="Compra">Compra</option>
                    <option value="Devolucion por Prestamo">Devolución por Préstamo</option>
                    <option value="Ajuste de Inventario">Ajuste de Inventario</option>
                    <option value="Recuperacion">Recuperación</option>
                    <option value="Otro motivo">Otro motivo</option>
                  </select>
                  
                  {/* Campo de texto libre si selecciona "Otro motivo" */}
                  {formData.motivo === 'Otro motivo' && (
                    <input
                      type="text"
                      value={formData.motivo_personalizado}
                      onChange={(e) => setFormData(prev => ({ ...prev, motivo_personalizado: e.target.value }))}
                      disabled={submitting}
                      className="input-glass w-full"
                      placeholder="Especifique el motivo (mínimo 5 caracteres)"
                      minLength={5}
                      required
                    />
                  )}
                </div>

                {/* Observaciones */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Observaciones
                  </label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                    disabled={submitting}
                    className="input-glass w-full h-20 resize-none"
                    placeholder="Información adicional opcional..."
                  />
                </div>

                {/* Mensajes de estado */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                    <FiCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p>
                  </div>
                )}
              </div>
              
              {/* 🔘 Footer con botones fijos - Modern Design System 2025 */}
              <div className="border-t border-slate-200 dark:border-slate-700 p-6 flex gap-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm flex-shrink-0">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={submitting}
                  className="btn-glass-secondary-modern flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formData.producto_id || !formData.cantidad || !formData.motivo || (formData.motivo === 'Otro motivo' && !formData.motivo_personalizado)}
                  className="btn-glass-primary-modern flex-1 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <FiPlus className="w-5 h-5" strokeWidth={2.5} />
                      Registrar Entrada
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default StockEntryModal;
