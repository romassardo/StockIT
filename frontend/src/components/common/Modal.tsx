// frontend/src/components/common/Modal.tsx
import React, { ReactNode, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl'; // Tamaños predefinidos
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
    lg: 'max-w-lg',
    xl: 'max-w-xl',
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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-out-expo"
        onClick={onClose} 
        aria-hidden="true"
      ></div>

      {/* Contenedor del Modal con Glassmorphism */} 
      <div
        className={`relative z-10 rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 ease-out-expo \
                    ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'} \
                    ${sizeClasses[size]} w-full \
                    ${theme === 'dark' 
                      ? 'bg-slate-800/70 border border-slate-700/50 text-slate-100'
                      : 'bg-white/70 border border-slate-300/50 text-slate-900'
                    } backdrop-blur-lg ${className}`}
      >
        {/* Cabecera del Modal */} 
        {
          <div 
            className={`flex items-center justify-between p-5 border-b \
                        ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-300/50'}`}
          >
            {title && (
              <h3 
                id="modal-title" 
                className={`text-xl font-semibold tracking-tight \
                            ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}
              >
                {title}
              </h3>
            )}
            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-lg transition-all duration-200 ease-out-expo \
                          ${theme === 'dark' 
                            ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-700/50' 
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                          }`}
              aria-label="Cerrar modal"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
        }

        {/* Cuerpo del Modal */} 
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {children}
        </div>
        
        {/* Opcional: Pie de Modal (se puede agregar mediante children si es necesario) */}
      </div>
    </div>
  );
};

export default Modal;
