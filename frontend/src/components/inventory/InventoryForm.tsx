import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiPackage, FiHash, FiPlus } from 'react-icons/fi';
import * as inventoryService from '../../services/inventory.service';
import { productService } from '../../services/product.service';
import { Product } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';

interface InventoryFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  producto_id: string;
  numero_serie: string;
}

interface FormErrors {
  producto_id?: string;
  numero_serie?: string;
  general?: string;
}

const InventoryForm: React.FC<InventoryFormProps> = ({ onClose, onSuccess }) => {
  // Estados
  const [formData, setFormData] = useState<FormData>({
    producto_id: '',
    numero_serie: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  // Context
  const { addNotification } = useNotification();
  const { theme } = useTheme();

  // Cargar productos disponibles
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        // Obtener solo productos que manejan números de serie (Notebooks y Celulares)
        const response = await productService.getSerialNumberProducts();
        
        if (response.success && response.data) {
          setProducts(response.data);
        } else {
          addNotification({ type: 'error', message: 'Error al cargar productos' });
        }
      } catch (error: any) {
        console.error('Error cargando productos:', error);
        addNotification({ type: 'error', message: 'Error al cargar productos' });
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [addNotification]);

  // Validación en tiempo real
  const validateField = (name: keyof FormData, value: string): string | undefined => {
    switch (name) {
      case 'producto_id':
        if (!value) return 'Debe seleccionar un producto';
        if (isNaN(Number(value))) return 'ID de producto inválido';
        return undefined;
        
      case 'numero_serie':
        if (!value.trim()) return 'El número de serie es requerido';
        if (value.trim().length < 3) return 'El número de serie debe tener al menos 3 caracteres';
        if (value.trim().length > 50) return 'El número de serie no puede exceder 50 caracteres';
        // Validar caracteres permitidos (letras, números, guiones)
        if (!/^[A-Za-z0-9\-_]+$/.test(value.trim())) {
          return 'Solo se permiten letras, números, guiones y guiones bajos';
        }
        return undefined;
        
      default:
        return undefined;
    }
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar error del campo
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }

    // Validar en tiempo real
    const error = validateField(name as keyof FormData, value);
    if (error) {
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  // Validación completa del formulario
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Validar cada campo
    (Object.keys(formData) as Array<keyof FormData>).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      addNotification({ type: 'error', message: 'Por favor, corrija los errores en el formulario' });
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const requestData: CreateInventoryItemRequest = {
        producto_id: parseInt(formData.producto_id),
        numero_serie: formData.numero_serie.trim().toUpperCase()
      };

      const response = await inventoryService.createInventoryItem(requestData);

      if (response.success) {
        addNotification({ type: 'success', message: 'Item de inventario creado exitosamente' });
        onSuccess();
      } else {
        setErrors({ general: response.message || 'Error al crear el item' });
      }
    } catch (error: any) {
      console.error('Error creando item:', error);
      
      let errorMessage = 'Error al crear el item de inventario';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setErrors({ general: errorMessage });
      addNotification({ type: 'error', message: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  // Obtener información del producto seleccionado
  const selectedProduct = products.find(p => p.id === parseInt(formData.producto_id));

  const modalContent = (
    <>
      {/* ðŸŽ­ Modal Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />
      
      {/* ðŸ"® Modal Container */}
      <div 
        className="fixed inset-0 flex items-center justify-center p-3"
        style={{ zIndex: 9999 }}
      >
        <div className="glass-card max-w-lg w-full animate-glass-appear" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b transition-all duration-300 ${
            theme === 'dark' ? 'border-slate-700/20' : 'border-white/20'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-primary animate-pulse-glow">
                <FiPackage className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gradient-primary">Nuevo Item de Inventario</h2>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>Agregar Notebook o Celular</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="btn-glass-secondary hover-lift w-10 h-10 rounded-full flex items-center justify-center"
            >
              <FiX className={`w-5 h-5 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
              }`} />
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error general */}
            {errors.general && (
              <div className={`glass-card p-4 text-sm ${
                theme === 'dark'
                  ? 'bg-danger-900/50 border-danger-800/50 text-danger-300'
                  : 'bg-danger-50 border-danger-200 text-danger-700'
              }`}>
                {errors.general}
              </div>
            )}

            {/* Selector de producto */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Producto *
              </label>
              <div className="relative">
                <select
                  name="producto_id"
                  value={formData.producto_id}
                  onChange={handleInputChange}
                  disabled={loading}
                  className={`input-glass w-full pr-10 ${
                    errors.producto_id 
                      ? 'border-danger-500/50 focus:ring-danger-500/50'
                      : ''
                  }`}
                >
                  <option value="">
                    {loading ? 'Cargando productos...' : 'Seleccione un producto'}
                  </option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.marca} {product.modelo} - {product.categoria?.nombre}
                    </option>
                  ))}
                </select>
                <FiPackage className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-400'
                }`} />
              </div>
              {errors.producto_id && (
                <p className={`mt-1 text-sm ${
                  theme === 'dark' ? 'text-danger-400' : 'text-danger-600'
                }`}>{errors.producto_id}</p>
              )}
              
              {/* Información del producto seleccionado */}
              {selectedProduct && (
                <div className={`mt-3 glass-card p-3 ${
                  theme === 'dark'
                    ? 'bg-info-900/20 border-info-800/30'
                    : 'bg-info-50 border-info-200'
                }`}>
                  <div className={`text-sm ${
                    theme === 'dark' ? 'text-info-300' : 'text-info-800'
                  }`}>
                    <div className="font-medium">{selectedProduct.marca} {selectedProduct.modelo}</div>
                    <div className={`${
                      theme === 'dark' ? 'text-info-400' : 'text-info-600'
                    }`}>
                      Categoría: {selectedProduct.categoria?.nombre}
                    </div>
                    {selectedProduct.descripcion && (
                      <div className={`text-xs mt-1 ${
                        theme === 'dark' ? 'text-info-400' : 'text-info-600'
                      }`}>
                        {selectedProduct.descripcion}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Número de serie */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Número de Serie *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="numero_serie"
                  value={formData.numero_serie}
                  onChange={handleInputChange}
                  placeholder="Ej: ABC123DEF456"
                  maxLength={50}
                  className={`input-glass w-full pl-11 uppercase ${
                    errors.numero_serie 
                      ? 'border-danger-500/50 focus:ring-danger-500/50'
                      : ''
                  }`}
                />
                <FiHash className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-400'
                }`} />
              </div>
              {errors.numero_serie && (
                <p className={`mt-1 text-sm ${
                  theme === 'dark' ? 'text-danger-400' : 'text-danger-600'
                }`}>{errors.numero_serie}</p>
              )}
              <p className={`mt-1 text-xs ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Ingrese el número de serie único del equipo. Se convertirá automáticamente a mayúsculas.
              </p>
            </div>

            {/* Botones */}
            <div className={`flex gap-3 pt-6 border-t transition-all duration-300 ${
              theme === 'dark' ? 'border-slate-700/20' : 'border-white/20'
            }`}>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="btn-glass-secondary hover-lift flex-1 py-3 px-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                disabled={submitting || loading}
                className="btn-glass-primary hover-lift flex-1 py-3 px-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <FiPlus className="w-4 h-4" />
                    Crear Item
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );

  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
};

export default InventoryForm; 

