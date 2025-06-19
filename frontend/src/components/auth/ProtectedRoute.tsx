import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  requiredRoles?: string[];
}

/**
 * Componente para proteger rutas que requieren autenticación
 * Verifica que el usuario esté autenticado y tenga los roles necesarios
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRoles }) => {
  const { state } = useAuth();
  const { isAuthenticated, user, isLoading } = state;
  const [hasRequiredRole, setHasRequiredRole] = useState<boolean>(true);
  const location = useLocation();

  useEffect(() => {
    // Verificar roles si se requieren
    if (isAuthenticated && user && requiredRoles && requiredRoles.length > 0) {
      const userHasRequiredRole = requiredRoles.includes(user.rol);
      setHasRequiredRole(userHasRequiredRole);
    } else {
      setHasRequiredRole(true); // Si no se requieren roles específicos, asumimos que tiene acceso
    }
  }, [isAuthenticated, user, requiredRoles]);

  // Si isLoading es true, significa que estamos validando el token inicial.
  // En este estado, no debemos renderizar nada para evitar flashes de contenido
  // o redirecciones incorrectas hasta que sepamos si el usuario está autenticado o no.
  if (isLoading) {
    return null; // Devuelve null para esperar a que termine la validación.
  }

  // Si después de la carga, el usuario NO está autenticado, lo redirigimos al login.
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si está autenticado, pero no tiene el rol requerido, lo mandamos a "acceso denegado".
  if (!hasRequiredRole) {
    return <Navigate to="/acceso-denegado" replace />;
  }
  
  // Si todo está en orden (autenticado y con rol), renderizamos la ruta hija.
  return <Outlet />;
};

export default ProtectedRoute;
