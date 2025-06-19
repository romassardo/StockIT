import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/auth.service';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

type AuthAction = 
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'TOKEN_REFRESH'; payload: { token: string } };

const AuthContext = createContext<{
  state: AuthState;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: () => boolean;
} | null>(null);

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        error: null
      };
    case 'TOKEN_REFRESH':
      return {
        ...state,
        token: action.payload.token
      };
    default:
      return state;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    token: localStorage.getItem('token'),
    isLoading: false,
    isAuthenticated: false,
    error: null
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch({ type: 'LOGIN_START' });
      authService.validateToken()
        .then((userData) => {
          if (userData) {
            dispatch({ type: 'LOGIN_SUCCESS', payload: { user: userData, token } });
          } else {
            // Si no hay datos de usuario, consideramos que el token no es válido.
            throw new Error('Token inválido o sesión no encontrada');
          }
        })
        .catch(() => {
          // Si la validación del token falla por cualquier motivo,
          // lo más seguro es realizar un logout completo.
          // Esto limpia el localStorage y resetea el estado a sus valores iniciales.
          authService.logout(); // Limpia localStorage y podría redirigir
          dispatch({ type: 'LOGOUT' }); // Limpia el estado de React
        });
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const response = await authService.login(email, password);
      if (response && response.token && typeof response.token === 'string' && response.token.trim() !== '') {
        localStorage.setItem('token', response.token); // Guardar el token válido
        
        dispatch({ 
          type: 'LOGIN_SUCCESS', 
          payload: { 
            user: response.user, 
            token: response.token 
          } 
        });
        return true;
      } else {
        // Si el token de la respuesta no es válido, tratar como un fallo de login.
        const errorMessage = 'Respuesta de login inválida: token no encontrado o inválido.';
        dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
        return false;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al iniciar sesión';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      return false;
    }
  };

  const logout = () => {
    authService.logout();
    dispatch({ type: 'LOGOUT' });
  };

  const isAdmin = (): boolean => {
    return state.user?.rol === 'admin';
  };

  return (
    <AuthContext.Provider value={{ state, user: state.user, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
