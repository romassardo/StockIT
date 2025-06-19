import React, { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext'; // Asumiendo que existe este contexto

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
  containerClassName?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  type = 'text',
  name,
  id,
  value,
  onChange,
  placeholder,
  disabled = false,
  leftIcon,
  rightIcon,
  error,
  className = '',
  containerClassName = '',
  ...props
}) => {
  const { theme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;

  // Base styles from design-UX-UI-guide.md (.input-glass)
  const baseInputStyle = `
    w-full 
    border 
    rounded-xl 
    py-3 
    transition-all duration-300 ease-out-expo 
    focus:outline-none 
  `;

  const lightModeStyles = `
    bg-white/10 backdrop-blur-md 
    border-white/20 
    text-slate-800 
    placeholder-slate-400/80 
    focus:bg-white/20 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 
  `;

  const darkModeStyles = `
    bg-slate-800/10 backdrop-blur-md 
    border-slate-700/20 
    text-slate-100 
    placeholder-slate-500/80 
    focus:bg-slate-700/20 focus:border-primary-400 focus:ring-4 focus:ring-primary-400/10 
  `;

  const paddingLeft = leftIcon ? 'pl-12 pr-4' : 'px-4';
  const paddingRight = (rightIcon || type === 'password') ? 'pr-12' : '';

  const combinedClassName = `
    ${baseInputStyle}
    ${theme === 'dark' ? darkModeStyles : lightModeStyles}
    ${paddingLeft} ${paddingRight}
    ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-500/5' : ''}
    ${error ? (theme === 'dark' ? 'border-red-500/50 focus:border-red-500' : 'border-red-500/70 focus:border-red-500') : ''}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  return (
    <div className={`relative ${containerClassName}`}>
      {label && (
        <label 
          htmlFor={id || name}
          className={`block text-sm font-medium mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-xl ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} ${disabled ? 'opacity-50' : ''}`}>
            {leftIcon}
          </div>
        )}
        <input
          type={inputType}
          id={id || name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={combinedClassName}
          {...props}
        />
        {type === 'password' && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-xl ${theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={disabled}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        )}
        {rightIcon && type !== 'password' && (
           <div className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-xl ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} ${disabled ? 'opacity-50' : ''}`}>
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
