import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiPackage, FiSave, FiGrid } from 'react-icons/fi';
import Loading from './common/Loading';
import { productService, ProductCreateData } from '../services/product.service';
import { useNotification } from '../contexts/NotificationContext';
import { useTheme } from '../contexts/ThemeContext';

interface Product {
  id: number;
  categoria_id: number;
  categoria_nombre: string;
  marca: string;
  modelo: string;
  descripcion: string | null;
  stock_minimo: number;
  usa_numero_serie: boolean;
  activo: boolean;
}

interface Category {
  id: number;
  nombre: string;
  categoria_padre_id: number | null;
  requiere_serie: boolean;
  permite_asignacion: boolean;
  permite_reparacion: boolean;
  activo: boolean;
  nivel: number;
  ruta_completa: string;
}

interface ProductFormProps {
  product?: Product | null;
  onClose: () => void;
  onSubmit: (data: ProductCreateData) => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  product,
  onClose,
  onSubmit
}) => {
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Estados del formulario
  const [formData, setFormData] = useState<ProductCreateData>({
    categoria_id: 0,
    marca: '',
    modelo: '',
    descripcion: '',
    stock_minimo: 0,
    usa_numero_serie: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar categorías al montar el componente
  useEffect(() => {
    loadCategories();
  }, []);

  // Inicializar formulario si estamos editando
  useEffect(() => {
    if (product) {
      setFormData({
        categoria_id: product.categoria_id,
        marca: product.marca,
        modelo: product.modelo,
        descripcion: product.descripcion || '',
        stock_minimo: product.stock_minimo,
        usa_numero_serie: product.usa_numero_serie
      });
    }
  }, [product]);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await productService.getAllCategoriesForSelect();
      
      if (response.success) {
        setCategories(response.data || []);
      } else {
        addNotification({ message: 'Error al cargar categorías', type: 'error' });
      }
    } catch (error: any) {
      console.error('Error cargando categorías:', error);
      addNotification({ message: error.message || 'Error al cargar categorías', type: 'error' });
    } finally {
      setLoadingCategories(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.categoria_id || formData.categoria_id === 0) {
      newErrors.categoria_id = 'La categoría es obligatoria';
    }

    if (!formData.marca?.trim()) {
      newErrors.marca = 'La marca es obligatoria';
    }

    if (!formData.modelo?.trim()) {
      newErrors.modelo = 'El modelo es obligatorio';
    }

    if ((formData.stock_minimo || 0) < 0) {
      newErrors.stock_minimo = 'El stock mínimo no puede ser negativo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      addNotification({ message: 'Por favor, corrige los errores en el formulario', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      // Preparar datos para envío
      const dataToSubmit = {
        ...formData,
        marca: formData.marca.trim(),
        modelo: formData.modelo.trim(),
        descripcion: formData.descripcion?.trim() || undefined,
        stock_minimo: Number(formData.stock_minimo) || 0
      };

      await onSubmit(dataToSubmit);
    } catch (error: any) {
      console.error('Error en formulario:', error);
      addNotification({ message: error.message || 'Error al procesar producto', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof ProductCreateData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpiar error del campo modificado
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Obtener la categoría seleccionada para mostrar sus propiedades
  const selectedCategory = categories.find(cat => cat.id === formData.categoria_id);

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[9999] p-4" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col relative overflow-hidden">
        
        {/* Gradiente de fondo sutil */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none"></div>
        
        {/* Header */}
        <div className="relative p-6 border-b border-slate-700/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg backdrop-blur-sm border border-indigo-400/20">
                <FiPackage className="text-xl text-indigo-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-50">
                  {product ? 'Editar Producto' : 'Nuevo Producto'}
                </h2>
                <p className="text-sm text-slate-300">
                  {product ? 'Modifica los datos del producto' : 'Completa los datos del nuevo producto'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg transition-all duration-200 hover:scale-105"
            >
              <FiX className="text-xl" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="relative flex-1 overflow-y-auto p-6 space-y-6">
          {/* Categoría */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200">
              Categoría <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.categoria_id}
              onChange={(e) => setFormData({ ...formData, categoria_id: parseInt(e.target.value) })}
              disabled={loadingCategories}
              className="w-full px-4 py-3 bg-slate-800/60 backdrop-blur-sm border border-slate-600/50 rounded-xl text-slate-100 
                       focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/20 focus:bg-slate-800/80
                       transition-all duration-200 hover:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
              required
            >
              <option value="">
                {loadingCategories ? 'Cargando categorías...' : 'Selecciona una categoría'}
              </option>
              {!loadingCategories && categories
                .filter(cat => cat.categoria_padre_id !== null) // 🎯 SOLO subcategorías específicas
                .map(cat => (
                  <option key={cat.id} value={cat.id} className="bg-slate-800 text-slate-100">
                    {cat.ruta_completa}
                  </option>
                ))}
            </select>
            <p className="text-xs text-slate-400">
              {loadingCategories 
                ? 'Cargando lista de categorías disponibles...' 
                : 'Los productos se asignan a categorías específicas, no a categorías padre'
              }
            </p>
          </div>

          {/* Marca */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200">
              Marca <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.marca}
              onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800/60 backdrop-blur-sm border border-slate-600/50 rounded-xl text-slate-100 
                       placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/20 focus:bg-slate-800/80
                       transition-all duration-200 hover:border-slate-500"
              placeholder="Ej: Dell, HP, Samsung..."
              required
            />
          </div>

          {/* Modelo */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200">
              Modelo <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.modelo}
              onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800/60 backdrop-blur-sm border border-slate-600/50 rounded-xl text-slate-100 
                       placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/20 focus:bg-slate-800/80
                       transition-all duration-200 hover:border-slate-500"
              placeholder="Ej: Latitude 5520, EliteDesk 800..."
              required
            />
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200">
              Descripción
            </label>
            <textarea
              value={formData.descripcion || ''}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-slate-800/60 backdrop-blur-sm border border-slate-600/50 rounded-xl text-slate-100 
                       placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/20 focus:bg-slate-800/80
                       transition-all duration-200 hover:border-slate-500 resize-none"
              placeholder="Descripción opcional del producto..."
            />
          </div>

          {/* Stock Mínimo */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200">
              Stock Mínimo
            </label>
            <input
              type="number"
              value={formData.stock_minimo}
              onChange={(e) => setFormData({ ...formData, stock_minimo: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-3 bg-slate-800/60 backdrop-blur-sm border border-slate-600/50 rounded-xl text-slate-100 
                       placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/20 focus:bg-slate-800/80
                       transition-all duration-200 hover:border-slate-500"
              placeholder="0"
              min="0"
            />
          </div>

          {/* Switches */}
          <div className="grid grid-cols-1 gap-4">
            {/* Usa Número de Serie */}
            <div className="flex items-center justify-between p-4 bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50">
              <div>
                <span className="text-sm font-medium text-slate-200">Número de Serie</span>
                <p className="text-xs text-slate-400 mt-1">Solo para Notebooks y Celulares</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.usa_numero_serie}
                  onChange={(e) => setFormData({ ...formData, usa_numero_serie: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-400/20 rounded-full peer 
                             peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] 
                             after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r 
                             peer-checked:from-indigo-500 peer-checked:to-purple-500"></div>
              </label>
            </div>
          </div>

          {/* Información adicional */}
          {selectedCategory && (
            <div className="p-4 bg-indigo-500/10 backdrop-blur-sm rounded-xl border border-indigo-400/20">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                <span className="text-sm font-medium text-indigo-300">Información de la categoría</span>
              </div>
              <div className="text-xs text-slate-300 space-y-1">
                <p><span className="text-slate-400">Permite serie:</span> <span className="text-indigo-300">{selectedCategory.requiere_serie ? 'Sí' : 'No'}</span></p>
                <p><span className="text-slate-400">Permite asignación:</span> <span className="text-indigo-300">{selectedCategory.permite_asignacion ? 'Sí' : 'No'}</span></p>
                <p><span className="text-slate-400">Permite reparación:</span> <span className="text-indigo-300">{selectedCategory.permite_reparacion ? 'Sí' : 'No'}</span></p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="relative p-6 border-t border-slate-700/50 flex-shrink-0">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-slate-300 hover:text-slate-100 bg-slate-800/50 hover:bg-slate-700/50 
                       border border-slate-600/50 hover:border-slate-500 rounded-xl transition-all duration-200 
                       backdrop-blur-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 
                       text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg 
                       hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                       flex items-center justify-center space-x-2 border border-indigo-400/20"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <FiSave className="text-lg" />
                  <span>{product ? 'Actualizar' : 'Crear'} Producto</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}; 