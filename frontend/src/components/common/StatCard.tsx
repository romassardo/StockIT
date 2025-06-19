import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

/**
 * 🎨 StatCard Moderna con Glassmorphism - Design System 2025
 * 
 * Componente de tarjeta estadística que implementa el nuevo design system moderno:
 * - Glassmorphism con backdrop-filter blur
 * - Gradientes vibrantes y sombras coloridas
 * - Animaciones fluidas y microinteracciones
 * - Soporte completo para modo oscuro
 * - Efectos hover con lift y scale
 */
const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  color, 
  subValue, 
  trend, 
  trendValue 
}) => {
  const { theme } = useTheme();
  
  // 🎨 Sistema de colores moderno con gradientes
  const getColorClasses = () => {
    const colorMap = {
      primary: {
        icon: 'text-primary-500',
        gradient: 'from-primary-500/20 to-purple-500/10',
        glow: 'hover:shadow-primary',
        border: 'border-primary-200/30'
      },
      secondary: {
        icon: 'text-secondary-500', 
        gradient: 'from-secondary-500/20 to-amber-500/10',
        glow: 'hover:shadow-secondary',
        border: 'border-secondary-200/30'
      },
      success: {
        icon: 'text-success-500',
        gradient: 'from-success-500/20 to-emerald-400/10', 
        glow: 'hover:shadow-success',
        border: 'border-success-200/30'
      },
      danger: {
        icon: 'text-danger-500',
        gradient: 'from-danger-500/20 to-red-400/10',
        glow: 'hover:shadow-danger', 
        border: 'border-danger-200/30'
      },
      warning: {
        icon: 'text-warning-500',
        gradient: 'from-warning-500/20 to-yellow-400/10',
        glow: 'hover:shadow-warning',
        border: 'border-warning-200/30'
      },
      info: {
        icon: 'text-info-500',
        gradient: 'from-info-500/20 to-cyan-400/10', 
        glow: 'hover:shadow-info',
        border: 'border-info-200/30'
      }
    };
    return colorMap[color];
  };

  // 🎯 Colores para tendencias
  const getTrendClasses = () => {
    if (trend === 'up') return 'text-success-500 bg-success-50 dark:bg-success-900/20';
    if (trend === 'down') return 'text-danger-500 bg-danger-50 dark:bg-danger-900/20';
    return theme === 'dark' ? 'text-slate-400 bg-slate-800/50' : 'text-slate-500 bg-slate-100';
  };

  // 🎨 Iconos para tendencias
  const getTrendIcon = () => {
    if (trend === 'up') return '↗️';
    if (trend === 'down') return '↘️';
    return '→';
  };

  const colorConfig = getColorClasses();

  return (
    <div className={`
      group relative 
      glass-card
      p-6 
      animate-glass-appear
      hover-lift
      ${colorConfig.glow}
      ${theme === 'dark' ? 'glass-dark' : ''}
      overflow-hidden
      cursor-pointer
    `}>
      
      {/* 🌈 Gradiente de fondo dinámico */}
      <div className={`
        absolute inset-0 opacity-0 group-hover:opacity-100 
        transition-opacity duration-500 ease-out-expo
        bg-gradient-to-br ${colorConfig.gradient}
        pointer-events-none
      `} />
      
      {/* ✨ Efecto de brillo en hover */}
      <div className="
        absolute inset-0 opacity-0 group-hover:opacity-100
        bg-gradient-to-r from-transparent via-white/10 to-transparent
        translate-x-[-100%] group-hover:translate-x-[100%]
        transition-all duration-1000 ease-out-expo
        pointer-events-none
      " />

      {/* 📊 Contenido principal */}
      <div className="relative z-10 flex items-start justify-between h-full">
        
        {/* 📝 Información de la métrica */}
        <div className="flex-1 space-y-3">
          
          {/* 🏷️ Título */}
          <h3 className={`
            text-sm font-medium 
            transition-colors duration-300 ease-out-expo
            ${theme === 'dark' 
              ? 'text-slate-300 group-hover:text-slate-200' 
              : 'text-slate-600 group-hover:text-slate-700'
            }
          `}>
            {title}
          </h3>
          
          {/* 📊 Valor principal */}
          <div className="space-y-1">
            <p className={`
              text-3xl font-bold 
              transition-all duration-300 ease-out-expo
              group-hover:scale-105
              ${theme === 'dark' 
                ? 'text-slate-50' 
                : 'text-slate-900'
              }
            `}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            
            {/* 📈 Valor secundario */}
            {subValue && (
              <p className={`
                text-xs 
                transition-colors duration-300 ease-out-expo
                ${theme === 'dark' 
                  ? 'text-slate-400' 
                  : 'text-slate-500'
                }
              `}>
                {subValue}
              </p>
            )}
          </div>
          
          {/* 📈 Indicador de tendencia */}
          {trend && trendValue && (
            <div className={`
              inline-flex items-center gap-1.5 
              px-2.5 py-1 
              rounded-full text-xs font-medium
              transition-all duration-300 ease-out-expo
              group-hover:scale-105
              ${getTrendClasses()}
            `}>
              <span className="text-xs">{getTrendIcon()}</span>
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        
        {/* 🎯 Icono con efectos */}
        <div className={`
          relative ml-4 p-3
          rounded-2xl
          transition-all duration-300 ease-out-expo
          group-hover:scale-110 group-hover:rotate-3
          ${theme === 'dark'
            ? 'bg-slate-800/50 group-hover:bg-slate-700/70'
            : 'bg-white/50 group-hover:bg-white/80'
          }
          backdrop-blur-sm
          border border-white/20
          shadow-lg group-hover:shadow-xl
        `}>
          
          {/* ✨ Glow effect detrás del icono */}
          <div className={`
            absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100
            transition-opacity duration-300 ease-out-expo
            ${colorConfig.icon === 'text-primary-500' ? 'bg-primary-500/20' : ''}
            ${colorConfig.icon === 'text-success-500' ? 'bg-success-500/20' : ''}
            ${colorConfig.icon === 'text-danger-500' ? 'bg-danger-500/20' : ''}
            ${colorConfig.icon === 'text-warning-500' ? 'bg-warning-500/20' : ''}
            ${colorConfig.icon === 'text-info-500' ? 'bg-info-500/20' : ''}
            ${colorConfig.icon === 'text-secondary-500' ? 'bg-secondary-500/20' : ''}
            blur-md
          `} />
          
          {/* 🎯 Icono principal */}
          <div className={`
            relative z-10 w-6 h-6 flex items-center justify-center
            transition-colors duration-300 ease-out-expo
            ${colorConfig.icon}
            group-hover:drop-shadow-lg
          `}>
            {icon}
          </div>
        </div>
      </div>
      
      {/* 🔮 Borde inferior con gradiente sutil */}
      <div className={`
        absolute bottom-0 left-0 right-0 h-0.5
        bg-gradient-to-r ${colorConfig.gradient}
        opacity-0 group-hover:opacity-100
        transition-opacity duration-500 ease-out-expo
      `} />
      
    </div>
  );
};

export default StatCard;
