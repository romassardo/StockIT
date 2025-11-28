// frontend/src/components/common/Modal.tsx
import React, { ReactNode, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
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
                      ? 'bg-slate-900 border border-slate-800 text-slate-100'
                      : 'bg-white border border-slate-200 text-slate-900'
                    } ${className}`}
      >
        {/* Cabecera del Modal */} 
        {
          <div 
            className={`flex items-center justify-between p-5 border-b \
                        ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}
          >
            {title && (
              <h3 
                id="modal-title" 
                className={`text-lg font-bold tracking-tight \
                            ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
              >
                {title}
              </h3>
            )}
            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-lg transition-all duration-200 ease-out-expo \
                          ${theme === 'dark' 
                            ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
                            : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                          }`}
              aria-label="Cerrar modal"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
        }

        {/* Cuerpo del Modal - Removemos padding fijo para permitir control total desde el hijo si es necesario */} 
        <div className="overflow-y-auto max-h-[85vh]">
          {children}
        </div>
        
        {/* Opcional: Pie de Modal (se puede agregar mediante children si es necesario) */}
      </div>
    </div>
  );
};

export default Modal;
