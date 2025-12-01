// frontend/src/components/common/Modal.tsx
import React, { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'; // Tamaños predefinidos
  className?: string; // Para personalización adicional
  zIndex?: number;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className = '',
  zIndex = 50,
}) => {
  const { theme } = useTheme();

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden'; // Evitar scroll del fondo
      window.addEventListener('keydown', handleEscKey);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-5xl',
    '2xl': 'max-w-7xl',
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 transition-opacity duration-300 ease-out-expo ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ zIndex }}
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Fondo con backdrop-blur */} 
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-out-expo"
        onClick={onClose} 
        aria-hidden="true"
      ></div>

      {/* Contenedor del Modal con Glassmorphism */} 
      <div
        className={`relative z-10 rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 ease-out-expo \
                    ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'} \
                    ${sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.md} w-full \
                    ${theme === 'dark' 
                      ? 'bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 text-slate-100 shadow-xl shadow-black/20'
                      : 'bg-white/95 backdrop-blur-xl border border-slate-200 text-slate-900 shadow-xl shadow-slate-200/50'
                    } ${className}`}
      >
        {/* Cabecera del Modal */} 
        {title && (
          <div 
            className={`flex items-center justify-between px-6 py-4 border-b \
                        ${theme === 'dark' ? 'border-slate-700/50 bg-slate-800/30' : 'border-slate-100 bg-slate-50/50'}`}
          >
            <h3 
              id="modal-title" 
              className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600"
            >
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl transition-all duration-200 \
                          ${theme === 'dark' 
                            ? 'text-slate-400 hover:text-white hover:bg-slate-700' 
                            : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                          }`}
              aria-label="Cerrar modal"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Cuerpo del Modal con padding */} 
        <div className="overflow-y-auto max-h-[80vh] p-6">
          {children}
        </div>
        
        {/* Opcional: Pie de Modal (se puede agregar mediante children si es necesario) */}
      </div>
    </div>
  );
};

export default Modal;
