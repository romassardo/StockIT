import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Package, Save } from 'lucide-react';
import { productService, ProductCreateData } from '../services/product.service';
import { useNotification } from '../contexts/NotificationContext';

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
      console.log('🔍 Cargando categorías...');
      const response = await productService.getAllCategoriesForSelect();
      
      console.log('📊 Respuesta completa del servicio:', response);
      
      if (response.success) {
        console.log('✅ Categorías obtenidas exitosamente:', response.data);
        console.log('📝 Número de categorías:', response.data?.length || 0);
        
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          // 🔧 FILTRAR: Solo mostrar subcategorías (que tienen categoria_padre_id)
          // Los productos se asignan a subcategorías específicas, no a categorías padre
          const subcategorias = response.data.filter(cat => cat.categoria_padre_id !== null);
          
          setCategories(subcategorias);
          console.log('✅ Subcategorías cargadas para productos:', subcategorias.length);
          console.log('🔍 Estructura de la primera subcategoría:', subcategorias[0]);
          console.log('🔍 Propiedades disponibles:', Object.keys(subcategorias[0] || {}));
          
          // Para debugging global
          (window as any).lastLoadedCategories = subcategorias;
          (window as any).allCategories = response.data;
          
          if (subcategorias.length === 0) {
            console.warn('⚠️ No se encontraron subcategorías disponibles');
            addNotification({ 
              message: 'No hay subcategorías disponibles. Debe crear subcategorías antes de agregar productos.', 
              type: 'warning' 
            });
          }
        } else {
          console.warn('⚠️ No se encontraron categorías en la respuesta');
          addNotification({ 
            message: 'No se encontraron categorías disponibles. Contacte al administrador.', 
            type: 'warning' 
          });
        }
      } else {
        console.error('❌ Error en respuesta del servicio:', response.message);
        addNotification({ message: response.message || 'Error al cargar categorías', type: 'error' });
      }
    } catch (error: any) {
      console.error('💥 Error completo cargando categorías:', error);
      console.error('💥 Mensaje del error:', error.message);
      console.error('💥 Stack del error:', error.stack);
      addNotification({ message: error.message || 'Error al cargar categorías', type: 'error' });
    }
  };

  const validateForm = (): boolean => {
    if (!formData.categoria_id || formData.categoria_id === 0) {
      addNotification({ message: 'La categoría es obligatoria', type: 'error' });
      return false;
    }

    if (!formData.marca?.trim()) {
      addNotification({ message: 'La marca es obligatoria', type: 'error' });
      return false;
    }

    if (!formData.modelo?.trim()) {
      addNotification({ message: 'El modelo es obligatorio', type: 'error' });
      return false;
    }

    if ((formData.stock_minimo || 0) < 0) {
      addNotification({ message: 'El stock mínimo no puede ser negativo', type: 'error' });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
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

  // Obtener la categoría seleccionada para mostrar sus propiedades
  const selectedCategory = categories.find(cat => cat.id === formData.categoria_id);

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[9999] p-4">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-xl relative overflow-hidden">
        
        {/* Gradiente de fondo sutil */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent pointer-events-none"></div>
        
        {/* Header compacto */}
        <div className="relative px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg border border-indigo-400/20">
              <Package size={18} className="text-indigo-300" />
            </div>
            <h2 className="text-lg font-bold text-slate-50">
              {product ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body compacto */}
        <div className="relative p-5 space-y-4">
          {/* Categoría */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Categoría *</label>
            <select
              value={formData.categoria_id}
              onChange={(e) => setFormData({ ...formData, categoria_id: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-800/60 border border-slate-600/50 rounded-lg text-sm text-slate-100 
                       focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-colors"
            >
              <option value="">{categories.length === 0 ? 'Cargando...' : 'Selecciona categoría'}</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id} className="bg-slate-800">{cat.ruta_completa || cat.nombre}</option>
              ))}
            </select>
          </div>

          {/* Grid Marca + Modelo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Marca *</label>
              <input
                type="text"
                value={formData.marca}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800/60 border border-slate-600/50 rounded-lg text-sm text-slate-100 
                         placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-colors"
                placeholder="Dell, HP..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Modelo *</label>
              <input
                type="text"
                value={formData.modelo}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800/60 border border-slate-600/50 rounded-lg text-sm text-slate-100 
                         placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-colors"
                placeholder="Latitude 5520..."
              />
            </div>
          </div>

          {/* Grid Stock Mínimo + Switch Serie */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Stock Mínimo</label>
              <input
                type="number"
                value={formData.stock_minimo}
                onChange={(e) => setFormData({ ...formData, stock_minimo: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-800/60 border border-slate-600/50 rounded-lg text-sm text-slate-100 
                         focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-colors"
                min="0"
              />
            </div>
            <div className="flex items-center justify-between px-3 py-2 bg-slate-800/40 rounded-lg border border-slate-700/50">
              <span className="text-xs font-medium text-slate-300">Usa Nº Serie</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.usa_numero_serie}
                  onChange={(e) => setFormData({ ...formData, usa_numero_serie: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full 
                             after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white 
                             after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
              </label>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Descripción (opcional)</label>
            <input
              type="text"
              value={formData.descripcion || ''}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800/60 border border-slate-600/50 rounded-lg text-sm text-slate-100 
                       placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-colors"
              placeholder="Descripción breve..."
            />
          </div>

          {/* Info categoría compacta */}
          {selectedCategory && (
            <div className="flex items-center gap-4 px-3 py-2 bg-indigo-500/10 rounded-lg border border-indigo-400/20 text-xs">
              <span className="text-indigo-300 font-medium">Categoría:</span>
              <span className={selectedCategory.requiere_serie ? 'text-emerald-400' : 'text-slate-400'}>
                Serie: {selectedCategory.requiere_serie ? '✓' : '✗'}
              </span>
              <span className={selectedCategory.permite_asignacion ? 'text-emerald-400' : 'text-slate-400'}>
                Asignación: {selectedCategory.permite_asignacion ? '✓' : '✗'}
              </span>
              <span className={selectedCategory.permite_reparacion ? 'text-emerald-400' : 'text-slate-400'}>
                Reparación: {selectedCategory.permite_reparacion ? '✓' : '✗'}
              </span>
            </div>
          )}
        </div>

        {/* Footer compacto */}
        <div className="relative px-5 py-4 border-t border-slate-700/50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 
                     border border-slate-600/50 rounded-lg transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 
                     text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Save size={16} />
            )}
            <span>{product ? 'Actualizar' : 'Crear'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}; 