import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { 
  FiUser, FiMail, FiShield, FiLock, FiEye, FiEyeOff, 
  FiCheck, FiAlertTriangle, FiLoader, FiKey
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import { authService } from '../services/auth.service';

// Validación para cambio de contraseña
const PasswordSchema = Yup.object().shape({
  currentPassword: Yup.string()
    .required('La contraseña actual es obligatoria'),
  newPassword: Yup.string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .matches(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .matches(/[a-z]/, 'Debe contener al menos una minúscula')
    .matches(/[0-9]/, 'Debe contener al menos un número')
    .required('La nueva contraseña es obligatoria'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Las contraseñas no coinciden')
    .required('Confirma la nueva contraseña')
});

/**
 * Página de Perfil de Usuario
 * Permite ver información del usuario y cambiar contraseña
 * Diseño Glassmorphism consistente con el resto del sistema
 */
const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { addNotification } = useNotification();
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    validationSchema: PasswordSchema,
    onSubmit: async (values, { resetForm }) => {
      setIsSubmitting(true);
      try {
        const response = await authService.changePassword(values.currentPassword, values.newPassword);
        if (response.success) {
          addNotification({ type: 'success', message: 'Contraseña actualizada correctamente' });
          resetForm();
        } else {
          addNotification({ type: 'error', message: response.message || 'Error al cambiar contraseña' });
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'Error al cambiar contraseña';
        addNotification({ type: 'error', message: errorMessage });
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  // Estilos comunes para inputs
  const inputClassName = `
    w-full px-4 py-3 pr-12
    backdrop-blur-sm border rounded-xl
    transition-all duration-300
    focus:outline-none focus:ring-4
    disabled:opacity-50 disabled:cursor-not-allowed
    ${theme === 'dark' 
      ? 'bg-slate-800/60 border-slate-600/50 text-slate-100 placeholder:text-slate-500' 
      : 'bg-white/60 border-slate-200 text-slate-800 placeholder:text-slate-400'
    }
  `;

  const labelClassName = `text-sm font-medium flex items-center gap-2 ${
    theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
  }`;

  // Indicador de fortaleza de contraseña
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formik.values.newPassword);
  const strengthLabels = ['Muy débil', 'Débil', 'Regular', 'Buena', 'Excelente'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${
          theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
        }`}>
          Mi Perfil
        </h1>
        <p className={`mt-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
          Gestiona tu información personal y seguridad
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card: Información del Usuario */}
        <div className={`
          p-6 rounded-2xl border backdrop-blur-xl
          ${theme === 'dark' 
            ? 'bg-slate-800/40 border-slate-700/50' 
            : 'bg-white/60 border-slate-200/80'
          }
        `}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-xl ${
              theme === 'dark' ? 'bg-primary-500/20' : 'bg-primary-100'
            }`}>
              <FiUser className="w-5 h-5 text-primary-500" />
            </div>
            <h2 className={`text-xl font-semibold ${
              theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
            }`}>
              Información Personal
            </h2>
          </div>

          {/* Avatar grande */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
              <span className="text-4xl font-bold text-white">
                {user?.nombre?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          </div>

          {/* Info fields */}
          <div className="space-y-4">
            <div className={`p-4 rounded-xl ${
              theme === 'dark' ? 'bg-slate-700/30' : 'bg-slate-100/80'
            }`}>
              <div className="flex items-center gap-3">
                <FiUser className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
                <div>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                    Nombre
                  </p>
                  <p className={`font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
                    {user?.nombre || 'Usuario'}
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-xl ${
              theme === 'dark' ? 'bg-slate-700/30' : 'bg-slate-100/80'
            }`}>
              <div className="flex items-center gap-3">
                <FiMail className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
                <div>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                    Correo electrónico
                  </p>
                  <p className={`font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
                    {user?.email || 'email@ejemplo.com'}
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-xl ${
              theme === 'dark' ? 'bg-slate-700/30' : 'bg-slate-100/80'
            }`}>
              <div className="flex items-center gap-3">
                <FiShield className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
                <div>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                    Rol
                  </p>
                  <p className={`font-medium capitalize ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
                    {user?.rol || 'Usuario'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card: Cambiar Contraseña */}
        <div className={`
          p-6 rounded-2xl border backdrop-blur-xl
          ${theme === 'dark' 
            ? 'bg-slate-800/40 border-slate-700/50' 
            : 'bg-white/60 border-slate-200/80'
          }
        `}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-xl ${
              theme === 'dark' ? 'bg-amber-500/20' : 'bg-amber-100'
            }`}>
              <FiKey className="w-5 h-5 text-amber-500" />
            </div>
            <h2 className={`text-xl font-semibold ${
              theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
            }`}>
              Cambiar Contraseña
            </h2>
          </div>

          <form onSubmit={formik.handleSubmit} className="space-y-5" autoComplete="off">
            {/* Contraseña actual */}
            <div className="space-y-2">
              <label htmlFor="currentPassword" className={labelClassName}>
                <FiLock className="text-primary-500 w-4 h-4" />
                Contraseña actual
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  id="currentPassword"
                  name="currentPassword"
                  value={formik.values.currentPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={isSubmitting}
                  autoComplete="off"
                  className={`${inputClassName} ${formik.touched.currentPassword && formik.errors.currentPassword ? 'border-red-400' : 'focus:border-primary-500 focus:ring-primary-500/20'}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                  tabIndex={-1}
                >
                  {showCurrentPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
              {formik.touched.currentPassword && formik.errors.currentPassword && (
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <FiAlertTriangle className="w-4 h-4" />
                  {formik.errors.currentPassword}
                </div>
              )}
            </div>

            {/* Nueva contraseña */}
            <div className="space-y-2">
              <label htmlFor="newPassword" className={labelClassName}>
                <FiKey className="text-primary-500 w-4 h-4" />
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  value={formik.values.newPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                  className={`${inputClassName} ${formik.touched.newPassword && formik.errors.newPassword ? 'border-red-400' : 'focus:border-primary-500 focus:ring-primary-500/20'}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                  tabIndex={-1}
                >
                  {showNewPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
              {formik.touched.newPassword && formik.errors.newPassword && (
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <FiAlertTriangle className="w-4 h-4" />
                  {formik.errors.newPassword}
                </div>
              )}
            </div>

            {/* Indicador de fortaleza */}
            {formik.values.newPassword && (
              <div className="space-y-2">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        i < passwordStrength 
                          ? strengthColors[passwordStrength - 1] 
                          : theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  Fortaleza: <span className="font-medium">{strengthLabels[passwordStrength - 1] || 'Muy débil'}</span>
                </p>
              </div>
            )}

            {/* Confirmar contraseña */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className={labelClassName}>
                <FiCheck className="text-primary-500 w-4 h-4" />
                Confirmar nueva contraseña
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                  className={`${inputClassName} ${formik.touched.confirmPassword && formik.errors.confirmPassword ? 'border-red-400' : 'focus:border-primary-500 focus:ring-primary-500/20'}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
              {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <FiAlertTriangle className="w-4 h-4" />
                  {formik.errors.confirmPassword}
                </div>
              )}
            </div>

            {/* Requisitos de contraseña */}
            <div className={`p-4 rounded-xl text-sm ${
              theme === 'dark' ? 'bg-slate-700/30 text-slate-400' : 'bg-slate-100/80 text-slate-600'
            }`}>
              <p className="font-medium mb-2">Requisitos de la contraseña:</p>
              <ul className="space-y-1">
                {[
                  { check: formik.values.newPassword.length >= 8, text: 'Mínimo 8 caracteres' },
                  { check: /[A-Z]/.test(formik.values.newPassword), text: 'Al menos una mayúscula' },
                  { check: /[a-z]/.test(formik.values.newPassword), text: 'Al menos una minúscula' },
                  { check: /[0-9]/.test(formik.values.newPassword), text: 'Al menos un número' },
                ].map((req, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <FiCheck className={`w-4 h-4 ${req.check ? 'text-green-500' : 'text-slate-500'}`} />
                    <span className={req.check ? 'text-green-500' : ''}>{req.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !formik.isValid || !formik.dirty}
              className={`
                w-full py-3 px-4 rounded-xl font-semibold
                transition-all duration-300
                flex items-center justify-center gap-2
                ${isSubmitting || !formik.isValid || !formik.dirty
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:shadow-lg hover:shadow-primary-500/25 hover:scale-[1.02]'
                }
              `}
            >
              {isSubmitting ? (
                <>
                  <FiLoader className="w-5 h-5 animate-spin" />
                  Actualizando...
                </>
              ) : (
                <>
                  <FiCheck className="w-5 h-5" />
                  Cambiar Contraseña
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
