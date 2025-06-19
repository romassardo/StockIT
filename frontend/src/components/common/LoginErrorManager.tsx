// src/components/common/LoginErrorManager.tsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Componente dedicado a manejar errores de autenticación y ofrecer una solución al usuario.
 * Muestra un botón para limpiar el estado de la aplicación si hay un error persistente en la página de login.
 */
const LoginErrorManager: React.FC = () => {
  const auth = useAuth();

  const forceCleanAndReload = () => {
    console.log("Forzando limpieza de localStorage y recarga...");
    // Limpia todo el almacenamiento local, eliminando tokens corruptos o estados inválidos.
    localStorage.clear();
    // Redirige al login para un nuevo intento limpio.
    window.location.href = '/login';
  };

  // Este componente solo renderiza algo si hay un error de autenticación y estamos en la página de login.
  if (!auth || !auth.state.error || auth.state.isAuthenticated || !window.location.pathname.includes('/login')) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(239, 68, 68, 0.85)', // Color 'danger' con alta visibilidad
      color: 'white',
      padding: '12px 24px',
      borderRadius: '12px',
      zIndex: 10000, // Siempre visible por encima de otros elementos
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.25)',
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' // Sombra glassmorphism
    }}>
      <span style={{ fontWeight: 500 }}>Parece que hay un problema para iniciar sesión.</span>
      <button 
        onClick={forceCleanAndReload}
        style={{
          padding: '8px 16px',
          border: '1px solid white',
          borderRadius: '8px',
          backgroundColor: 'transparent',
          color: 'white',
          cursor: 'pointer',
          fontWeight: 'bold',
          transition: 'background-color 0.2s, transform 0.2s',
        }}
        onMouseOver={e => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseOut={e => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        Limpiar y Reintentar
      </button>
    </div>
  );
};

export default LoginErrorManager;
