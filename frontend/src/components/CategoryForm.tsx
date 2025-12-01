import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Folder, Save } from 'lucide-react';
import { CategoryCreateData } from '../services/product.service';
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
    if (!formData.nombre?.trim()) {
      addNotification({ message: 'El nombre es obligatorio', type: 'error' });
      return false;
    }

    // Validar longitud del nombre
    if (formData.nombre && formData.nombre.trim().length < 2) {
      addNotification({ message: 'El nombre debe tener al menos 2 caracteres', type: 'error' });
      return false;
    }

    if (formData.nombre && formData.nombre.trim().length > 100) {
      addNotification({ message: 'El nombre no puede exceder 100 caracteres', type: 'error' });
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[9999] p-4">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden">
        
        {/* Gradiente de fondo sutil */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent pointer-events-none"></div>
        
        {/* Header compacto */}
        <div className="relative px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg border border-indigo-400/20">
              <Folder size={18} className="text-indigo-300" />
            </div>
            <h2 className="text-lg font-bold text-slate-50">
              {category ? 'Editar Categoría' : 'Nueva Categoría'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body compacto */}
        <div className="relative p-5 space-y-4">
          {/* Nombre + Categoría Padre en grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Nombre *</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800/60 border border-slate-600/50 rounded-lg text-sm text-slate-100 
                         placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-colors"
                placeholder="Notebooks, Periféricos..."
              />
            </div>
          </div>

          {/* Categoría Padre */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Categoría Padre</label>
            <select
              value={formData.categoria_padre_id || ''}
              onChange={(e) => setFormData({ ...formData, categoria_padre_id: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full px-3 py-2 bg-slate-800/60 border border-slate-600/50 rounded-lg text-sm text-slate-100 
                       focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-colors"
            >
              <option value="" className="bg-slate-800">Sin padre (Principal)</option>
              {parentCategories.map(cat => (
                <option key={cat.id} value={cat.id} className="bg-slate-800">{cat.ruta_completa}</option>
              ))}
            </select>
          </div>

          {/* Switches en fila compacta */}
          <div className="grid grid-cols-3 gap-2">
            {/* Requiere Serie */}
            <div className="flex flex-col items-center p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
              <label className="relative inline-flex items-center cursor-pointer mb-1.5">
                <input
                  type="checkbox"
                  checked={formData.requiere_serie}
                  onChange={(e) => setFormData({ ...formData, requiere_serie: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full 
                             after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white 
                             after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-500"></div>
              </label>
              <span className="text-[10px] text-slate-400 text-center">Nº Serie</span>
            </div>

            {/* Permite Asignación */}
            <div className="flex flex-col items-center p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
              <label className="relative inline-flex items-center cursor-pointer mb-1.5">
                <input
                  type="checkbox"
                  checked={formData.permite_asignacion}
                  onChange={(e) => setFormData({ ...formData, permite_asignacion: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full 
                             after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white 
                             after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
              <span className="text-[10px] text-slate-400 text-center">Asignación</span>
            </div>

            {/* Permite Reparación */}
            <div className="flex flex-col items-center p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
              <label className="relative inline-flex items-center cursor-pointer mb-1.5">
                <input
                  type="checkbox"
                  checked={formData.permite_reparacion}
                  onChange={(e) => setFormData({ ...formData, permite_reparacion: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full 
                             after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white 
                             after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
              <span className="text-[10px] text-slate-400 text-center">Reparación</span>
            </div>
          </div>

          {/* Preview compacto */}
          <div className="flex items-center gap-2 px-3 py-2 bg-indigo-500/10 rounded-lg border border-indigo-400/20">
            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
            <span className="text-xs text-slate-300">Ruta: <span className="text-indigo-300">{getPreviewPath()}</span></span>
          </div>
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
            <span>{category ? 'Actualizar' : 'Crear'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}; 