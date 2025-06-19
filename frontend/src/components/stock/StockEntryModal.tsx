import React, { useState, useEffect, useCallback } from 'react';
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
    observaciones: ''
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showCustomMotivo, setShowCustomMotivo] = useState(false);

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

      const entryData = {
        producto_id: parseInt(formData.producto_id),
        cantidad,
        motivo: formData.motivo,
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
      observaciones: ''
    });
    setError('');
    setSuccess('');
    setShowCustomMotivo(false); // Limpiar estado del motivo personalizado
    onClose();
  };

  if (!isOpen) return null;

  // Mostrar loading spinner mientras cargan los productos
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
        <div className="glass-card-deep w-full max-w-lg p-6 rounded-2xl">
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Cargando productos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
      {/* Modal Container */}
      <div className="glass-card-deep w-full max-w-lg p-6 rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/20 dark:border-slate-700/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg text-white">
              <FiPlus className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
              Registrar Entrada de Stock
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200 disabled:opacity-50"
            type="button"
          >
            <FiX className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="pt-6 space-y-6">
          {/* Producto */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
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
              placeholder="Cantidad a añadir"
              required
            />
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Motivo *
            </label>
            <select
              value={showCustomMotivo ? 'Otro motivo' : formData.motivo}
              onChange={(e) => {
                if (e.target.value === 'Otro motivo') {
                  setShowCustomMotivo(true);
                  setFormData(prev => ({ ...prev, motivo: '' }));
                } else {
                  setShowCustomMotivo(false);
                  setFormData(prev => ({ ...prev, motivo: e.target.value }));
                }
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
            {showCustomMotivo && (
              <input
                type="text"
                value={formData.motivo}
                onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
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
              placeholder="Información adicional (opcional)"
            />
          </div>

          {/* Mensajes de error y éxito */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50/80 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 rounded-lg">
              <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/50 rounded-lg">
              <FiCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-4 pt-4 border-t border-slate-200/20 dark:border-slate-700/30">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.producto_id || !formData.cantidad || !formData.motivo}
              className="btn-primary"
            >
              {submitting ? 'Registrando...' : 'Registrar Entrada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockEntryModal;
