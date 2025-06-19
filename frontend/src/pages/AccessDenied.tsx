import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/AccessDenied.css';

/**
 * Página mostrada cuando un usuario intenta acceder a una ruta para la que no tiene permisos
 */
const AccessDenied: React.FC = () => {
  return (
    <div className="access-denied-container">
      <div className="access-denied-card">
        <div className="access-denied-icon">
          <i className="fas fa-lock"></i>
        </div>
        <h1>Acceso Denegado</h1>
        <p className="access-denied-message">
          Lo sentimos, no tienes permisos para acceder a esta página.
        </p>
        <p className="access-denied-description">
          Si crees que esto es un error, por favor contacta al administrador del sistema.
        </p>
        <div className="access-denied-actions">
          <Link to="/dashboard" className="button-primary">
            Volver al Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
