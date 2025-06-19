import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { IconType } from 'react-icons';

interface ActionCardProps {
  title: string;
  description: string;
  icon: IconType;
  color: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'indigo' | 'pink' | 'blue' | 'yellow' | 'green' | 'purple';
  onClick: () => void;
}

const ActionCard = ({ title, description, icon: Icon, color, onClick }: ActionCardProps): JSX.Element => {
  const { theme } = useTheme();

  const colorMap = {
    primary: {
        icon: 'text-primary-500',
        glow: 'hover:shadow-primary',
    },
    secondary: {
        icon: 'text-secondary-500', 
        glow: 'hover:shadow-secondary',
    },
    success: {
        icon: 'text-success-500',
        glow: 'hover:shadow-success',
    },
    danger: {
        icon: 'text-danger-500',
        glow: 'hover:shadow-danger', 
    },
    warning: {
        icon: 'text-warning-500',
        glow: 'hover:shadow-warning',
    },
    info: {
        icon: 'text-info-500', 
        glow: 'hover:shadow-info',
    },
    indigo: {
      icon: 'text-indigo-500',
      glow: 'hover:shadow-[0_10px_15px_-3px_rgba(99,102,241,0.2),0_4px_6px_-2px_rgba(99,102,241,0.1)]',
    },
    pink: {
      icon: 'text-pink-500',
      glow: 'hover:shadow-[0_10px_15px_-3px_rgba(236,72,153,0.2),0_4px_6px_-2px_rgba(236,72,153,0.1)]',
    },
     blue: {
      icon: 'text-blue-500',
      glow: 'hover:shadow-[0_10px_15px_-3px_rgba(59,130,246,0.2),0_4px_6px_-2px_rgba(59,130,246,0.1)]',
    },
     yellow: {
      icon: 'text-yellow-500',
      glow: 'hover:shadow-[0_10px_15px_-3px_rgba(245,158,11,0.2),0_4px_6px_-2px_rgba(245,158,11,0.1)]',
    },
     green: {
      icon: 'text-green-500',
      glow: 'hover:shadow-[0_10px_15px_-3px_rgba(34,197,94,0.2),0_4px_6px_-2px_rgba(34,197,94,0.1)]',
    },
     purple: {
      icon: 'text-purple-500',
      glow: 'hover:shadow-[0_10px_15px_-3px_rgba(139,92,246,0.2),0_4px_6px_-2px_rgba(139,92,246,0.1)]',
    },
  };

  const selectedColor = colorMap[color] || colorMap.primary;

  return (
    <div
      onClick={onClick}
      className={`
        group relative 
        glass-card p-6 animate-glass-appear hover-lift
        ${selectedColor.glow}
        ${theme === 'dark' ? 'glass-dark' : ''}
        overflow-hidden cursor-pointer rounded-2xl
        flex flex-col justify-between
      `}
    >
      <div className="relative z-10">
        <div className={`
          relative inline-flex items-center justify-center
          p-3 mb-4 rounded-xl
          transition-all duration-300 ease-out-expo
          group-hover:scale-110 group-hover:-rotate-6
          ${theme === 'dark' ? 'bg-slate-800/60' : 'bg-white/70'}
          backdrop-blur-sm border border-white/20 shadow-lg
        `}>
          <Icon className={`w-6 h-6 transition-colors duration-300 ${selectedColor.icon}`} />
        </div>
        
        <h3 className={`
          text-lg font-bold
          ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}
        `}>
          {title}
        </h3>
        
        <p className={`
          mt-1 text-sm
          ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}
          min-h-[40px]
        `}>
          {description}
        </p>
      </div>

      <div className="relative z-10 mt-4">
        <div className={`
          flex items-center text-sm font-semibold
          transition-all duration-300 ease-out-expo
          group-hover:pl-2
          ${selectedColor.icon}
        `}>
          Generar Reporte
          <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">→</span>
        </div>
      </div>
    </div>
  );
};

export default ActionCard; 