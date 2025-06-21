import React from 'react';
import { FiMail, FiLock, FiZap } from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import LoginForm from '../components/common/LoginForm';
import '../styles/Login.css';

/**
 * Página de inicio de sesión - Modern Design System 2025
 * Implementa glassmorphism, orbes animados estándar y efectos modernos
 * Siguiendo estrictamente design-UX-UI-guide.md
 * 🌙 Optimizado para modo oscuro
 */

const Login: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      
      {/* 🌌 ORBES DE FONDO ANIMADOS - ESTÁNDAR DEL PROYECTO MODO OSCURO */}
      <div className={`fixed inset-0 pointer-events-none transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95' 
          : 'bg-gradient-to-br from-slate-50/95 via-slate-100/90 to-slate-200/95'
      }`}>
        {/* Orbe 1: Top-left - Primary */}
        <div className={`absolute top-20 left-10 w-32 h-32 rounded-full blur-xl animate-float transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-primary-500/20' 
            : 'bg-primary-500/10'
        }`}></div>
        
        {/* Orbe 2: Top-right - Secondary */}
        <div className={`absolute top-40 right-20 w-24 h-24 rounded-full blur-lg animate-float transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-secondary-500/20' 
            : 'bg-secondary-500/10'
        }`} style={{animationDelay: '2s'}}></div>
        
        {/* Orbe 3: Bottom-left - Success */}
        <div className={`absolute bottom-32 left-1/4 w-20 h-20 rounded-full blur-lg animate-float transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-success-500/20' 
            : 'bg-success-500/10'
        }`} style={{animationDelay: '4s'}}></div>
        
        {/* Orbe 4: Bottom-right - Info */}
        <div className={`absolute bottom-20 right-1/3 w-28 h-28 rounded-full blur-xl animate-float transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-info-500/20' 
            : 'bg-info-500/10'
        }`} style={{animationDelay: '1s'}}></div>
      </div>

      {/* 🔮 TARJETA PRINCIPAL CON GLASSMORPHISM MODERNO MODO OSCURO */}
      <div className="relative z-10 w-full max-w-md">
        <div className={`backdrop-blur-20 border rounded-3xl shadow-2xl p-8 relative overflow-hidden transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-slate-900/80 border-slate-700/50 shadow-dark-xl' 
            : 'bg-white/80 border-white/20'
        }`}>
          
          {/* Gradiente de fondo sutil */}
          <div className={`absolute inset-0 pointer-events-none rounded-3xl transition-all duration-300 ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-primary-500/10 via-secondary-500/5 to-transparent'
              : 'bg-gradient-to-br from-primary-500/5 via-secondary-500/3 to-transparent'
          }`}></div>
          
          {/* Header con logo y título */}
          <div className="relative text-center mb-8">
            {/* Logo moderno */}
            <div className="flex items-center justify-center mb-6">
              <div className={`p-4 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-primary-500/30 to-secondary-500/30 border-primary-400/30'
                  : 'bg-gradient-to-br from-primary-500/20 to-secondary-500/20 border-primary-400/20'
              }`}>
                <img 
                  src="/LogoStockITHoriz.png" 
                  alt="StockIT Logo" 
                  className="h-12 w-auto transition-all duration-300 hover:scale-105 filter brightness-110"
                  onError={(e) => {
                    // Fallback con icono moderno
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
                {/* Fallback con icono */}
                <FiZap className="hidden text-3xl text-primary-500" />
              </div>
            </div>
            
            {/* Título principal con gradiente */}
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-400 via-primary-500 to-secondary-500 bg-clip-text text-transparent mb-2">
              StockIT
            </h1>
            
            {/* Subtítulo */}
            <p className={`text-sm leading-relaxed transition-colors duration-300 ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Sistema de Inventario y Gestión de Activos IT
            </p>
            
            {/* Línea decorativa */}
            <div className="w-16 h-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full mx-auto mt-4 shadow-lg shadow-primary-500/30"></div>
          </div>
          
          {/* Formulario de login */}
          <LoginForm />
          
          {/* Footer */}
          <div className={`relative text-center mt-8 pt-8 border-t transition-colors duration-300 ${
            theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200/50'
          }`}>
            <p className={`text-xs transition-colors duration-300 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}>
              ¿Olvidaste tu contraseña? Contacta al administrador del sistema.
            </p>
            <p className={`text-xs mt-2 transition-colors duration-300 ${
              theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
            }`}>
              © 2025 StockIT - Powered by Modern Design System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
