import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';

// Esquema de validación del formulario
const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('El correo electrónico no es válido')
    .required('El correo electrónico es obligatorio'),
  password: Yup.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .required('La contraseña es obligatoria')
});

/**
 * Componente de formulario de inicio de sesión - Modern Design System 2025
 * Implementa glassmorphism, efectos modernos y microinteracciones
 * Siguiendo estrictamente design-UX-UI-guide.md
 */
const LoginForm: React.FC = () => {
  const [formError, setFormError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { state, login } = useAuth();
  const { isLoading, error: authContextError } = state;

  React.useEffect(() => {
    if (authContextError) {
      setFormError(authContextError);
    }
  }, [authContextError]);

  // Función para manejar el envío del formulario
  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: LoginSchema,
    onSubmit: async (values: { email: string; password: string }) => {
      setFormError(null);
      
      try {
        const success = await login(values.email, values.password);
        
        if (success) {
          navigate('/'); 
        } else {
          if (!authContextError) {
            setFormError('Credenciales incorrectas o error desconocido.');
          }
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : typeof error === 'object' && error !== null && 'response' in error && error.response 
            ? (error.response as {data?: {message?: string}}).data?.message || 'Error al iniciar sesión'
            : 'Error al iniciar sesión';
        setFormError(errorMessage);
      }
    },
  });

  return (
    <form className="login-form" onSubmit={formik.handleSubmit}>
      {/* Mensaje de error global con glassmorphism */}
      {formError && (
        <div className="alert-glass alert-danger animate-glass-appear" role="alert">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            fill="currentColor" 
            viewBox="0 0 16 16"
            className="alert-icon"
          >
            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
          </svg>
          <span>{formError}</span>
        </div>
      )}

      {/* Campo de email con glassmorphism */}
      <div className="form-group-glass">
        <label htmlFor="email" className="form-label-glass">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="18" 
            height="18" 
            fill="currentColor" 
            viewBox="0 0 16 16"
            className="label-icon"
          >
            <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
          </svg>
          <span>Correo electrónico</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          className={`input-glass ${formik.touched.email && formik.errors.email ? 'input-glass-error' : ''}`}
          placeholder="tu@empresa.com"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.email}
          disabled={isLoading}
          autoComplete="email"
        />
        {formik.touched.email && formik.errors.email && (
          <div className="error-message-glass animate-glass-appear" role="alert">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              fill="currentColor" 
              viewBox="0 0 16 16"
              className="error-icon"
            >
              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
            </svg>
            <span>{formik.errors.email}</span>
          </div>
        )}
      </div>

      {/* Campo de contraseña con glassmorphism */}
      <div className="form-group-glass">
        <label htmlFor="password" className="form-label-glass">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="18" 
            height="18" 
            fill="currentColor" 
            viewBox="0 0 16 16"
            className="label-icon"
          >
            <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
          </svg>
          <span>Contraseña</span>
        </label>
        <input
          type="password"
          id="password"
          name="password"
          className={`input-glass ${formik.touched.password && formik.errors.password ? 'input-glass-error' : ''}`}
          placeholder="Tu contraseña"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.password}
          disabled={isLoading}
          autoComplete="current-password"
        />
        {formik.touched.password && formik.errors.password && (
          <div className="error-message-glass animate-glass-appear" role="alert">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              fill="currentColor" 
              viewBox="0 0 16 16"
              className="error-icon"
            >
              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
            </svg>
            <span>{formik.errors.password}</span>
          </div>
        )}
      </div>

      {/* Botón de inicio de sesión con glassmorphism */}
      <button
        type="submit"
        className="btn-glass-primary hover-lift"
        disabled={isLoading || !formik.isValid}
      >
        {isLoading ? (
          <>
            <div className="spinner-glass"></div>
            <span>Iniciando sesión...</span>
          </>
        ) : (
          <>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="18" 
              height="18" 
              fill="currentColor" 
              viewBox="0 0 16 16"
              className="button-icon"
            >
              <path d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/>
              <path d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/>
            </svg>
            <span>Iniciar sesión</span>
          </>
        )}
      </button>
      
      {/* Footer del formulario con glassmorphism */}
      <div className="form-footer-glass">
        <span>¿Olvidaste tu contraseña? Contacta al administrador del sistema.</span>
      </div>
    </form>
  );
};

export default LoginForm;
