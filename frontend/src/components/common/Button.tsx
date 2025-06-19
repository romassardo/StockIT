import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info' | 'outline-primary' | 'outline-secondary' | 'ghost'; // Extendido para más opciones
  size?: 'sm' | 'md' | 'lg' | 'xl'; // Tamaños según design-UX-UI-guide.md
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {

  // Base styles - comunes a todos los botones
  const baseStyles = `
    font-semibold 
    rounded-xl 
    transition-all duration-300 ease-out-expo 
    focus:outline-none focus:ring-4 
    flex items-center justify-center
    disabled:opacity-50 disabled:cursor-not-allowed
    whitespace-nowrap
  `;

  // Styles por variante - según design-UX-UI-guide.md y extensiones lógicas
  const variantStyles = {
    primary: `
      bg-gradient-to-r from-primary-500 to-purple-500 text-white 
      border border-transparent 
      shadow-primary 
      hover:from-primary-600 hover:to-purple-600 hover:shadow-2xl hover:shadow-primary/50 
      focus:ring-primary-300/50
      active:scale-95
    `,
    secondary: `
      bg-slate-200 text-primary-700 
      border border-slate-300 
      hover:bg-slate-300 hover:border-slate-400 hover:text-primary-800 
      focus:ring-slate-400/50
      active:scale-95
    `,
    // btn-secondary de la guía parece más un 'outline' o 'ghost'. Adaptando:
    'outline-primary': `
      bg-transparent text-primary-500 
      border border-primary-500 
      hover:bg-primary-500/10 hover:text-primary-600 hover:border-primary-600 
      focus:ring-primary-300/50
      active:scale-95
    `,
    'outline-secondary': `
      bg-transparent text-slate-600 
      border border-slate-400 
      hover:bg-slate-500/10 hover:text-slate-700 hover:border-slate-500 
      focus:ring-slate-300/50
      active:scale-95
    `,
    danger: `
      bg-gradient-to-r from-red-500 to-pink-600 text-white 
      border border-transparent 
      shadow-danger 
      hover:from-red-600 hover:to-pink-700 hover:shadow-2xl hover:shadow-danger/50 
      focus:ring-red-300/50
      active:scale-95
    `,
    success: `
      bg-gradient-to-r from-green-500 to-emerald-600 text-white 
      border border-transparent 
      shadow-success 
      hover:from-green-600 hover:to-emerald-700 hover:shadow-2xl hover:shadow-success/50 
      focus:ring-green-300/50
      active:scale-95
    `,
    warning: `
      bg-gradient-to-r from-amber-500 to-orange-600 text-white 
      border border-transparent 
      shadow-warning 
      hover:from-amber-600 hover:to-orange-700 hover:shadow-2xl hover:shadow-warning/50 
      focus:ring-amber-300/50
      active:scale-95
    `,
    info: `
      bg-gradient-to-r from-cyan-500 to-sky-600 text-white 
      border border-transparent 
      shadow-info 
      hover:from-cyan-600 hover:to-sky-700 hover:shadow-2xl hover:shadow-info/50 
      focus:ring-cyan-300/50
      active:scale-95
    `,
    ghost: `
      bg-transparent text-slate-700 
      hover:bg-slate-100 
      focus:ring-slate-300/50
      active:scale-95
    `,
  };

  // Styles por tamaño - según design-UX-UI-guide.md (padding y font-size)
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs leading-5',       // Body Small/Caption ~12-14px
    md: 'px-5 py-2.5 text-sm leading-5',       // Body ~16px
    lg: 'px-6 py-3 text-base leading-6',       // Body Large ~18px
    xl: 'px-8 py-4 text-lg leading-7',       // H3 (subtítulos) ~20-24px
  };

  // Construir clases finales
  const combinedClassName = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${isLoading ? 'cursor-wait' : ''}
    ${className}
  `.replace(/\s+/g, ' ').trim(); // Limpiar espacios extra

  return (
    <button
      type="button" // Default type
      disabled={disabled || isLoading}
      className={combinedClassName}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <>
          {leftIcon && <span className="mr-2 -ml-1 h-5 w-5">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="ml-2 -mr-1 h-5 w-5">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
