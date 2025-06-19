import React from 'react';
import LoginForm from '../components/common/LoginForm';
import '../styles/Login.css';

/**
 * Página de inicio de sesión - Modern Design System 2025
 * Implementa glassmorphism, partículas animadas y efectos modernos
 * Siguiendo estrictamente design-UX-UI-guide.md
 */

const Login: React.FC = () => {
  return (
    <div className="login-container">
      {/* Fondo con partículas animadas */}
      <div className="bg-particles">
        {/* Partículas decorativas flotantes */}
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 8 + 4}px`,
              height: `${Math.random() * 8 + 4}px`,
              animationDelay: `${Math.random() * 6}s`,
              opacity: Math.random() * 0.3 + 0.1,
            }}
          />
        ))}
      </div>

      {/* Tarjeta principal con glassmorphism */}
      <div className="login-card glass-card animate-glass-appear">
        {/* Header con gradientes modernos */}
        <div className="login-header">
          {/* 🎨 Logo PNG con efectos modernos - Optimizado */}
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/LogoStockITHoriz.png" 
              alt="StockIT Logo" 
              className={`
                h-14 w-auto transition-all duration-300 ease-out-expo
                hover:scale-105 hover:drop-shadow-lg
                filter brightness-110
              `}
              onError={(e) => {
                // Fallback al texto si la imagen no carga
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            {/* Fallback de texto (oculto por defecto) */}
            <h1 className="hidden text-gradient-primary text-4xl font-extrabold tracking-tight">
              StockIT
            </h1>
          </div>
          <h2 className="text-base leading-relaxed">Sistema de Inventario y Gestión de Activos IT</h2>
          <div className="header-decoration"></div>
        </div>
        
        {/* Componente de formulario modernizado */}
        <LoginForm />
        
        {/* Footer con glassmorphism sutil */}
        <div className="login-footer">
          <p>&copy; 2025 StockIT - Powered by Modern Design System</p>
          <div className="footer-glow"></div>
        </div>
      </div>

      {/* Efectos de luz de fondo */}
      <div className="background-lights">
        <div className="light-orb light-orb-1"></div>
        <div className="light-orb light-orb-2"></div>
        <div className="light-orb light-orb-3"></div>
      </div>
    </div>
  );
};

export default Login;
