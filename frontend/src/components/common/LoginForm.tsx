import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { FiMail, FiLock, FiArrowRight, FiAlertTriangle, FiLoader } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

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
 * 🌙 Optimizado para modo oscuro
 */
const LoginForm: React.FC = () => {
  const [formError, setFormError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { state, login } = useAuth();
  const { theme } = useTheme();
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
    <form className="relative space-y-8" onSubmit={formik.handleSubmit}>
      
      {/* Mensaje de error global con glassmorphism moderno modo oscuro */}
      {formError && (
        <div className={`p-4 backdrop-blur-sm border rounded-xl flex items-center space-x-3 transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-danger-500/20 border-danger-500/30 text-danger-300'
            : 'bg-danger-500/10 border-danger-500/20 text-danger-700'
        }`}>
          <FiAlertTriangle className="text-danger-500 flex-shrink-0" />
          <span className="text-sm font-medium">{formError}</span>
        </div>
      )}

      {/* Campo de email con glassmorphism moderno modo oscuro */}
      <div className="space-y-3">
        <label htmlFor="email" className={`block text-sm font-medium flex items-center space-x-2 transition-colors duration-300 ${
          theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
        }`}>
          <FiMail className="text-primary-500" />
          <span>Correo electrónico</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          disabled={isLoading}
          autoComplete="email"
          placeholder="admin@stockit.com"
          className={`
            w-full px-6 py-4 
            backdrop-blur-sm border rounded-xl
            transition-all duration-300 ease-out-expo
            focus:outline-none focus:ring-4
            hover:border-slate-400
            disabled:opacity-50 disabled:cursor-not-allowed
            ${theme === 'dark' 
              ? 'bg-slate-800/60 border-slate-600/50 text-slate-100 placeholder:text-slate-400 focus:bg-slate-800/80 hover:bg-slate-800/70' 
              : 'bg-white/60 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white/80 hover:bg-white/70'
            }
            ${formik.touched.email && formik.errors.email 
              ? 'border-danger-400 focus:border-danger-500 focus:ring-danger-500/20' 
              : 'focus:border-primary-500 focus:ring-primary-500/20'
            }
          `}
        />
        {formik.touched.email && formik.errors.email && (
          <div className={`flex items-center space-x-2 text-sm transition-colors duration-300 ${
            theme === 'dark' ? 'text-danger-400' : 'text-danger-600'
          }`}>
            <FiAlertTriangle className="text-xs" />
            <span>{formik.errors.email}</span>
          </div>
        )}
      </div>

      {/* Campo de contraseña con glassmorphism moderno modo oscuro */}
      <div className="space-y-3">
        <label htmlFor="password" className={`block text-sm font-medium flex items-center space-x-2 transition-colors duration-300 ${
          theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
        }`}>
          <FiLock className="text-primary-500" />
          <span>Contraseña</span>
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          disabled={isLoading}
          autoComplete="current-password"
          placeholder="••••••••"
          className={`
            w-full px-6 py-4 
            backdrop-blur-sm border rounded-xl
            transition-all duration-300 ease-out-expo
            focus:outline-none focus:ring-4
            hover:border-slate-400
            disabled:opacity-50 disabled:cursor-not-allowed
            ${theme === 'dark' 
              ? 'bg-slate-800/60 border-slate-600/50 text-slate-100 placeholder:text-slate-400 focus:bg-slate-800/80 hover:bg-slate-800/70' 
              : 'bg-white/60 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white/80 hover:bg-white/70'
            }
            ${formik.touched.password && formik.errors.password 
              ? 'border-danger-400 focus:border-danger-500 focus:ring-danger-500/20' 
              : 'focus:border-primary-500 focus:ring-primary-500/20'
            }
          `}
        />
        {formik.touched.password && formik.errors.password && (
          <div className={`flex items-center space-x-2 text-sm transition-colors duration-300 ${
            theme === 'dark' ? 'text-danger-400' : 'text-danger-600'
          }`}>
            <FiAlertTriangle className="text-xs" />
            <span>{formik.errors.password}</span>
          </div>
        )}
      </div>

      {/* Botón de inicio de sesión con glassmorphism y gradientes modernos modo oscuro */}
      <button
        type="submit"
        disabled={isLoading || !formik.isValid}
        className={`
          w-full px-6 py-4
          bg-gradient-to-r from-primary-500 to-secondary-500
          hover:from-primary-600 hover:to-secondary-600
          text-white font-semibold rounded-xl
          border border-primary-400/20
          backdrop-blur-sm
          shadow-lg shadow-primary-500/25
          transition-all duration-300 ease-out-expo
          transform hover:scale-[1.02] hover:shadow-xl hover:shadow-primary-500/30
          focus:outline-none focus:ring-4 focus:ring-primary-500/20
          disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg
          flex items-center justify-center space-x-3
          group
        `}
      >
        {isLoading ? (
          <>
            <FiLoader className="animate-spin text-lg" />
            <span>Iniciando sesión...</span>
          </>
        ) : (
          <>
            <span>Iniciar sesión</span>
            <FiArrowRight className="text-lg transition-transform duration-300 group-hover:translate-x-1" />
          </>
        )}
      </button>
    </form>
  );
};

export default LoginForm;
