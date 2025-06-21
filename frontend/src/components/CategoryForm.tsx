import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiGrid, FiSave, FiAlertCircle, FiFolder } from 'react-icons/fi';
import Loading from './common/Loading';
import { productService, CategoryCreateData } from '../services/product.service';
import { useNotification } from '../contexts/NotificationContext';

interface Category {
  id: number;
  nombre: string;
  categoria_padre_id: number | null;
  padre_nombre: string | null;
  requiere_serie: boolean;
  permite_asignacion: boolean;
  permite_reparacion: boolean;
  activo: boolean;
  nivel: number;
  ruta_completa: string;
  productos_count: number;
}

interface CategoryFormProps {
  category?: Category | null;
  categories: Category[];
  onClose: () => void;
  onSubmit: (data: CategoryCreateData) => void;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  categories,
  onClose,
  onSubmit
}) => {
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  
  // Estados del formulario
  const [formData, setFormData] = useState<CategoryCreateData>({
    nombre: '',
    categoria_padre_id: null,
    requiere_serie: false,
    permite_asignacion: false,
    permite_reparacion: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Inicializar formulario si estamos editando
  useEffect(() => {
    if (category) {
      setFormData({
        nombre: category.nombre,
        categoria_padre_id: category.categoria_padre_id,
        requiere_serie: category.requiere_serie,
        permite_asignacion: category.permite_asignacion,
        permite_reparacion: category.permite_reparacion
      });
    }
  }, [category]);

  const parentCategories = category
    ? categories.filter(c => c.id !== category.id && c.categoria_padre_id === null)
    : categories.filter(c => c.categoria_padre_id === null);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre?.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }

    // Validar longitud del nombre
    if (formData.nombre && formData.nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }

    if (formData.nombre && formData.nombre.trim().length > 100) {
      newErrors.nombre = 'El nombre no puede exceder 100 caracteres';
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
        nombre: formData.nombre.trim(),
        categoria_padre_id: formData.categoria_padre_id || null
      };

      await onSubmit(dataToSubmit);
    } catch (error: any) {
      console.error('Error en formulario:', error);
      addNotification({ message: error.message || 'Error al procesar categoría', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CategoryCreateData, value: any) => {
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

  // Obtener la categoría padre seleccionada para mostrar información
  const selectedParent = parentCategories.find(cat => cat.id === formData.categoria_padre_id);

  const getPreviewPath = () => {
    if (formData.categoria_padre_id === null) {
      return 'Categoría principal';
    } else if (selectedParent) {
      return selectedParent.ruta_completa;
    } else {
      return 'Categoría no válida';
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[9999] p-4" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col relative overflow-hidden">
        
        {/* Gradiente de fondo sutil */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none"></div>
        
        {/* Header */}
        <div className="relative p-6 border-b border-slate-700/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg backdrop-blur-sm border border-indigo-400/20">
                <FiFolder className="text-xl text-indigo-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-50">
                  {category ? 'Editar Categoría' : 'Nueva Categoría'}
                </h2>
                <p className="text-sm text-slate-300">
                  {category ? 'Modifica los datos de la categoría' : 'Completa los datos de la nueva categoría'}
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
          {/* Nombre */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200">
              Nombre de la Categoría <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800/60 backdrop-blur-sm border border-slate-600/50 rounded-xl text-slate-100 
                       placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/20 focus:bg-slate-800/80
                       transition-all duration-200 hover:border-slate-500"
              placeholder="Ej: Notebooks, Periféricos, Consumibles..."
              required
            />
          </div>

          {/* Categoría Padre */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200">
              Categoría Padre
            </label>
            <select
              value={formData.categoria_padre_id || ''}
              onChange={(e) => setFormData({ ...formData, categoria_padre_id: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full px-4 py-3 bg-slate-800/60 backdrop-blur-sm border border-slate-600/50 rounded-xl text-slate-100 
                       focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/20 focus:bg-slate-800/80
                       transition-all duration-200 hover:border-slate-500"
            >
              <option value="" className="bg-slate-800 text-slate-100">Sin categoría padre (Categoría principal)</option>
              {parentCategories.map(cat => (
                <option key={cat.id} value={cat.id} className="bg-slate-800 text-slate-100">
                  {cat.ruta_completa}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400">
              Selecciona una categoría padre para crear una subcategoría
            </p>
          </div>

          {/* Switches de Configuración */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-200 border-b border-slate-700/50 pb-2">
              Configuración de la Categoría
            </h3>
            
            {/* Requiere Serie */}
            <div className="flex items-center justify-between p-4 bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50">
              <div>
                <span className="text-sm font-medium text-slate-200">Requiere Número de Serie</span>
                <p className="text-xs text-slate-400 mt-1">Solo para productos que necesitan seguimiento individual</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requiere_serie}
                  onChange={(e) => setFormData({ ...formData, requiere_serie: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-400/20 rounded-full peer 
                             peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] 
                             after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r 
                             peer-checked:from-purple-500 peer-checked:to-violet-500"></div>
              </label>
            </div>

            {/* Permite Asignación */}
            <div className="flex items-center justify-between p-4 bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50">
              <div>
                <span className="text-sm font-medium text-slate-200">Permite Asignación</span>
                <p className="text-xs text-slate-400 mt-1">Los productos pueden asignarse a empleados</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.permite_asignacion}
                  onChange={(e) => setFormData({ ...formData, permite_asignacion: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-400/20 rounded-full peer 
                             peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] 
                             after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r 
                             peer-checked:from-emerald-500 peer-checked:to-green-500"></div>
              </label>
            </div>

            {/* Permite Reparación */}
            <div className="flex items-center justify-between p-4 bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50">
              <div>
                <span className="text-sm font-medium text-slate-200">Permite Reparación</span>
                <p className="text-xs text-slate-400 mt-1">Los productos pueden enviarse a reparación</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.permite_reparacion}
                  onChange={(e) => setFormData({ ...formData, permite_reparacion: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-400/20 rounded-full peer 
                             peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] 
                             after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r 
                             peer-checked:from-amber-500 peer-checked:to-orange-500"></div>
              </label>
            </div>
          </div>

          {/* Preview de la ruta */}
          <div className="p-4 bg-indigo-500/10 backdrop-blur-sm rounded-xl border border-indigo-400/20">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
              <span className="text-sm font-medium text-indigo-300">Vista previa de la ruta</span>
            </div>
            <div className="text-sm text-slate-300">
              {getPreviewPath()}
            </div>
          </div>
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
                  <span>{category ? 'Actualizar' : 'Crear'} Categoría</span>
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