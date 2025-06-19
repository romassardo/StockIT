import React from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * 🌙 ThemeToggle Mini - Design System 2025 - v2.1.0
 * Última actualización: 2025-06-01 20:52:30
 * 
 * Componente toggle de tema súper compacto
 */
const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`
        relative inline-flex items-center h-5 w-9 rounded-full transition-all duration-300 
        focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-primary-500/50
        border shadow-sm hover:scale-105
        ${theme === 'dark' 
          ? 'bg-indigo-600 border-indigo-500' 
          : 'bg-slate-300 hover:bg-slate-400 border-slate-400'
        }
      `}
      title={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
      aria-label={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
    >
      {/* 🌌 Slider mini */}
      <span
        className={`
          inline-flex items-center justify-center h-3 w-3 rounded-full 
          bg-white shadow-sm transform transition-all duration-300
          ${theme === 'dark' 
            ? 'translate-x-5' 
            : 'translate-x-1'
          }
        `}
      >
        {/* ✨ Icono mini dentro del slider */}
        {theme === 'dark' ? (
          <FiMoon className="h-1.5 w-1.5 text-indigo-600" />
        ) : (
          <FiSun className="h-1.5 w-1.5 text-amber-500" />
        )}
      </span>
    </button>
  );
};

export default ThemeToggle; 