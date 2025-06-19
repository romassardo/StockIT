import React from 'react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  fullScreen?: boolean;
  text?: string;
}

/**
 * Componente de carga reutilizable que puede mostrar diferentes tamaños
 * y opcionalmente ocupar toda la pantalla con un texto personalizado
 */
const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  color = '#3F51B5',
  fullScreen = false,
  text = 'Cargando...'
}) => {
  // Determinar el tamaño del spinner según la prop size
  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'h-5 w-5';
      case 'lg':
        return 'h-12 w-12';
      case 'md':
      default:
        return 'h-8 w-8';
    }
  };

  // Componente spinner básico
  const Spinner = () => (
    <div className={`animate-spin rounded-full border-b-2 ${getSizeClass()}`} style={{ borderColor: color }}></div>
  );

  // Si es pantalla completa, muestra un overlay con el spinner centrado
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white bg-opacity-80 z-50">
        <Spinner />
        {text && <p className="mt-4 text-[#495057] font-medium">{text}</p>}
      </div>
    );
  }

  // Si no es pantalla completa, solo muestra el spinner
  return (
    <div className="flex flex-col items-center justify-center py-4">
      <Spinner />
      {text && <p className="mt-2 text-[#495057] text-sm">{text}</p>}
    </div>
  );
};

/**
 * Componente de carga para botones, ideal para mostrar estado de carga
 * dentro de un botón mientras se procesa una acción
 */
export const ButtonLoading: React.FC<{ size?: 'sm' | 'md' | 'lg'; color?: string }> = ({
  size = 'sm',
  color = 'currentColor'
}) => {
  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4';
      case 'lg':
        return 'h-6 w-6';
      case 'md':
      default:
        return 'h-5 w-5';
    }
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-b-transparent ${getSizeClass()}`} style={{ borderColor: `${color} transparent ${color} ${color}` }}></div>
  );
};

/**
 * Componente de esqueleto para mostrar mientras se cargan datos
 * Muestra un rectángulo con animación de pulso
 */
export const Skeleton: React.FC<{ height?: string; width?: string; rounded?: string; className?: string }> = ({
  height = 'h-6',
  width = 'w-full',
  rounded = 'rounded-md',
  className = ''
}) => {
  return (
    <div className={`animate-pulse bg-gray-200 ${height} ${width} ${rounded} ${className}`}></div>
  );
};

/**
 * Componente de carga para tablas, muestra filas de esqueletos
 */
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4
}) => {
  return (
    <div className="w-full">
      {/* Encabezados */}
      <div className="flex mb-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={`header-${i}`} className="flex-1 pr-2">
            <Skeleton height="h-8" />
          </div>
        ))}
      </div>

      {/* Filas */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex mb-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={`cell-${rowIndex}-${colIndex}`} className="flex-1 pr-2">
              <Skeleton height="h-6" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Loading;
