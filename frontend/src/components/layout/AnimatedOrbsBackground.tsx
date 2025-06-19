import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const AnimatedOrbsBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useTheme();

  return (
    <div className="relative min-h-screen w-full">
      {/* Fondo y Orbes */}
      <div className="absolute inset-0 z-0">
        {/* 🌌 IMPLEMENTACIÓN OBLIGATORIA EN TODAS LAS PÁGINAS DEL PROYECTO */}
        <div className={`fixed inset-0 pointer-events-none transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-900' 
            : 'bg-gradient-to-br from-slate-50 via-slate-100/90 to-slate-200'
        }`} />
        
        {/* Orbe 1: Top-left - Primary */}
        <div className={`absolute top-20 left-10 w-32 h-32 rounded-full blur-2xl animate-float transition-all duration-500 ${
          theme === 'dark' 
            ? 'bg-primary-500/20' 
            : 'bg-primary-500/10'
        }`} />
        
        {/* Orbe 2: Top-right - Secondary */}
        <div className={`absolute top-40 right-20 w-24 h-24 rounded-full blur-xl animate-float transition-all duration-500 ${
          theme === 'dark' 
            ? 'bg-secondary-500/20' 
            : 'bg-secondary-500/10'
        }`} style={{animationDelay: '2s', animationDuration: '8s'}}></div>
        
        {/* Orbe 3: Bottom-left - Success */}
        <div className={`absolute bottom-32 left-1/4 w-20 h-20 rounded-full blur-lg animate-float transition-all duration-500 ${
          theme === 'dark' 
            ? 'bg-success-500/20' 
            : 'bg-success-500/10'
        }`} style={{animationDelay: '4s', animationDuration: '10s'}}></div>
        
        {/* Orbe 4: Bottom-right - Info */}
        <div className={`absolute bottom-20 right-1/3 w-28 h-28 rounded-full blur-xl animate-float transition-all duration-500 ${
          theme === 'dark' 
            ? 'bg-info-500/20' 
            : 'bg-info-500/10'
        }`} style={{animationDelay: '1s', animationDuration: '9s'}}></div>
      </div>

      {/* Contenido de la página */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default AnimatedOrbsBackground; 