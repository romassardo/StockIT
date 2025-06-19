import React from 'react';
import { useTheme } from '../../contexts/ThemeContext'; // Asumiendo que existe este contexto

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

const Textarea: React.FC<TextareaProps> = ({
  label,
  name,
  id,
  value,
  onChange,
  placeholder,
  disabled = false,
  error,
  rows = 4, // Default rows
  className = '',
  containerClassName = '',
  ...props
}) => {
  const { theme } = useTheme();

  // Base styles adapted from .input-glass in design-UX-UI-guide.md
  const baseTextareaStyle = `
    w-full 
    border 
    rounded-xl 
    py-3 px-4 
    transition-all duration-300 ease-out-expo 
    focus:outline-none 
    resize-vertical /* Allow vertical resize, can be 'none' or 'both' */
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

  const combinedClassName = `
    ${baseTextareaStyle}
    ${theme === 'dark' ? darkModeStyles : lightModeStyles}
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
      <textarea
        id={id || name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={combinedClassName}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};

export default Textarea;
