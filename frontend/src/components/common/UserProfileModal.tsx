import React, { useState, useEffect } from 'react';
import { 
  FiUser, FiLock, FiX, FiEye, FiEyeOff, FiCheck, FiAlertCircle,
  FiMail, FiUserCheck, FiClock, FiSave
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { authService } from '../../services/auth.service';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PasswordChangeForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [passwordForm, setPasswordForm] = useState<PasswordChangeForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const { user } = useAuth();
  const { theme } = useTheme();
  const { addNotification } = useNotification();

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setActiveTab('profile');
      setShowPasswords({ current: false, new: false, confirm: false });
    }
  }, [isOpen]);

  // Validaciones de contraseña
  const passwordValidation = {
    isMinLength: passwordForm.newPassword.length >= 8,
    hasUpperCase: /[A-Z]/.test(passwordForm.newPassword),
    hasLowerCase: /[a-z]/.test(passwordForm.newPassword),
    hasNumber: /\d/.test(passwordForm.newPassword),
    passwordsMatch: passwordForm.newPassword === passwordForm.confirmPassword && passwordForm.newPassword.length > 0
  };

  const isPasswordValid = Object.values(passwordValidation).every(Boolean) && passwordForm.currentPassword.length > 0;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPasswordValid) {
      addNotification({ type: 'error', message: 'Por favor completa todos los campos correctamente' });
      return;
    }

    setIsLoading(true);
    try {
      await authService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      addNotification({ type: 'success', message: 'Contraseña cambiada exitosamente' });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      onClose();
    } catch (error: any) {
      addNotification({ type: 'error', message: error.message || 'Error al cambiar la contraseña' });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* ORBES DE FONDO ESTÁNDAR */}
      <div className={`fixed inset-0 pointer-events-none transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95' 
          : 'bg-gradient-to-br from-slate-50/95 via-slate-100/90 to-slate-200/95'
      }`}>
        <div className={`absolute top-20 left-10 w-32 h-32 rounded-full blur-xl animate-float transition-all duration-300 ${
          theme === 'dark' ? 'bg-primary-500/20' : 'bg-primary-500/10'
        }`}></div>
        <div className={`absolute top-40 right-20 w-24 h-24 rounded-full blur-lg animate-float transition-all duration-300 ${
          theme === 'dark' ? 'bg-secondary-500/20' : 'bg-secondary-500/10'
        }`} style={{animationDelay: '2s'}}></div>
        <div className={`absolute bottom-32 left-1/4 w-20 h-20 rounded-full blur-lg animate-float transition-all duration-300 ${
          theme === 'dark' ? 'bg-success-500/20' : 'bg-success-500/10'
        }`} style={{animationDelay: '4s'}}></div>
        <div className={`absolute bottom-20 right-1/3 w-28 h-28 rounded-full blur-xl animate-float transition-all duration-300 ${
          theme === 'dark' ? 'bg-info-500/20' : 'bg-info-500/10'
        }`} style={{animationDelay: '1s'}}></div>
      </div>

      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`
        relative w-full max-w-2xl mx-auto rounded-3xl shadow-2xl
        ${theme === 'dark' 
          ? 'bg-slate-900/90 border-slate-700/50' 
          : 'bg-white/90 border-white/20'
        }
        backdrop-blur-xl border transition-all duration-300 ease-out-expo
      `}>
        {/* Header */}
        <div className={`
          flex items-center justify-between p-6 
          ${theme === 'dark' 
            ? 'border-b border-slate-700/50' 
            : 'border-b border-gray-200/50'
          }
        `}>
          <div className="flex items-center space-x-4">
            <div className={`
              p-3 rounded-2xl shadow-lg transition-all duration-300
              ${theme === 'dark' 
                ? 'bg-slate-800/50 text-primary-400' 
                : 'bg-primary-50/50 text-primary-600'
              }
              backdrop-blur-sm
            `}>
              <FiUser className="h-6 w-6" />
            </div>
            <div>
              <h2 className={`
                text-xl font-semibold transition-colors duration-300
                ${theme === 'dark' ? 'text-white' : 'text-slate-900'}
              `}>
                Perfil de Usuario
              </h2>
              <p className={`
                text-sm transition-colors duration-300
                ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}
              `}>
                Gestiona tu información personal y configuración
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className={`
              p-2 rounded-xl transition-all duration-300 ease-out-expo
              ${theme === 'dark' 
                ? 'hover:bg-slate-800/50 text-slate-400 hover:text-white' 
                : 'hover:bg-gray-100/50 text-gray-500 hover:text-gray-700'
              }
              backdrop-blur-sm hover:scale-105
            `}
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className={`
          flex border-b
          ${theme === 'dark' 
            ? 'border-slate-700/50 bg-slate-900/50' 
            : 'border-gray-200/50 bg-gray-50/50'
          }
          backdrop-blur-sm
        `}>
          <button
            onClick={() => setActiveTab('profile')}
            className={`
              flex-1 flex items-center justify-center space-x-2 px-6 py-4 text-sm font-medium
              transition-all duration-300 ease-out-expo relative
              ${activeTab === 'profile'
                ? theme === 'dark'
                  ? 'text-primary-400 bg-primary-500/10 border-b-2 border-primary-400'
                  : 'text-primary-600 bg-primary-50/50 border-b-2 border-primary-500'
                : theme === 'dark'
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/30'
              }
            `}
          >
            <FiUser className="h-4 w-4" />
            <span>Información Personal</span>
          </button>
          
          <button
            onClick={() => setActiveTab('password')}
            className={`
              flex-1 flex items-center justify-center space-x-2 px-6 py-4 text-sm font-medium
              transition-all duration-300 ease-out-expo relative
              ${activeTab === 'password'
                ? theme === 'dark'
                  ? 'text-primary-400 bg-primary-500/10 border-b-2 border-primary-400'
                  : 'text-primary-600 bg-primary-50/50 border-b-2 border-primary-500'
                : theme === 'dark'
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/30'
              }
            `}
          >
            <FiLock className="h-4 w-4" />
            <span>Cambiar Contraseña</span>
          </button>
        </div>

        {/* Contenido de las pestañas */}
        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Información Personal
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombre */}
                <div className={`p-4 rounded-xl border transition-all duration-300 ${
                  theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white/50 border-gray-200/50'
                } backdrop-blur-sm`}>
                  <div className="flex items-center space-x-3">
                    <FiUser className={`h-5 w-5 ${theme === 'dark' ? 'text-primary-400' : 'text-primary-600'}`} />
                    <div>
                      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                        Nombre Completo
                      </p>
                      <p className={`text-base ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {user?.nombre || 'No especificado'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className={`p-4 rounded-xl border transition-all duration-300 ${
                  theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white/50 border-gray-200/50'
                } backdrop-blur-sm`}>
                  <div className="flex items-center space-x-3">
                    <FiMail className={`h-5 w-5 ${theme === 'dark' ? 'text-info-400' : 'text-info-600'}`} />
                    <div>
                      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                        Correo Electrónico
                      </p>
                      <p className={`text-base ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {user?.email || 'No especificado'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rol */}
                <div className={`p-4 rounded-xl border transition-all duration-300 ${
                  theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white/50 border-gray-200/50'
                } backdrop-blur-sm`}>
                  <div className="flex items-center space-x-3">
                    <FiUserCheck className={`h-5 w-5 ${theme === 'dark' ? 'text-success-400' : 'text-success-600'}`} />
                    <div>
                      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                        Rol en el Sistema
                      </p>
                      <div className="flex items-center space-x-2">
                        <p className={`text-base capitalize ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {user?.rol || 'No especificado'}
                        </p>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          user?.rol === 'admin'
                            ? theme === 'dark'
                              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                              : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            : theme === 'dark'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {user?.rol === 'admin' ? 'Administrador' : 'Usuario'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ID Usuario */}
                <div className={`p-4 rounded-xl border transition-all duration-300 ${
                  theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white/50 border-gray-200/50'
                } backdrop-blur-sm`}>
                  <div className="flex items-center space-x-3">
                    <FiClock className={`h-5 w-5 ${theme === 'dark' ? 'text-secondary-400' : 'text-secondary-600'}`} />
                    <div>
                      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                        ID de Usuario
                      </p>
                      <p className={`text-base ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        #{user?.id || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Cambiar Contraseña
              </h3>

              {/* Contraseña Actual */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  Contraseña Actual *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className={`w-full px-4 py-3 pr-12 rounded-xl border transition-all duration-300 ease-out-expo ${
                      theme === 'dark' 
                        ? 'bg-slate-800/50 border-slate-600/50 text-white placeholder-slate-400 focus:border-primary-400 focus:bg-slate-800/70' 
                        : 'bg-white/70 border-gray-300/50 text-slate-900 placeholder-slate-500 focus:border-primary-500 focus:bg-white/90'
                    } backdrop-blur-sm focus:outline-none focus:ring-4 focus:ring-primary-500/20`}
                    placeholder="Ingresa tu contraseña actual"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-lg transition-all duration-300 ease-out-expo ${
                      theme === 'dark' 
                        ? 'text-slate-400 hover:text-white hover:bg-slate-700/50' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-gray-100/50'
                    }`}
                  >
                    {showPasswords.current ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Nueva Contraseña */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  Nueva Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className={`w-full px-4 py-3 pr-12 rounded-xl border transition-all duration-300 ease-out-expo ${
                      theme === 'dark' 
                        ? 'bg-slate-800/50 border-slate-600/50 text-white placeholder-slate-400 focus:border-primary-400 focus:bg-slate-800/70' 
                        : 'bg-white/70 border-gray-300/50 text-slate-900 placeholder-slate-500 focus:border-primary-500 focus:bg-white/90'
                    } backdrop-blur-sm focus:outline-none focus:ring-4 focus:ring-primary-500/20`}
                    placeholder="Ingresa tu nueva contraseña"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-lg transition-all duration-300 ease-out-expo ${
                      theme === 'dark' 
                        ? 'text-slate-400 hover:text-white hover:bg-slate-700/50' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-gray-100/50'
                    }`}
                  >
                    {showPasswords.new ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                  </button>
                </div>

                {/* Validaciones de contraseña */}
                {passwordForm.newPassword && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center space-x-2">
                      {passwordValidation.isMinLength ? (
                        <FiCheck className="h-4 w-4 text-success-500" />
                      ) : (
                        <FiAlertCircle className="h-4 w-4 text-orange-500" />
                      )}
                      <span className={`text-sm ${
                        passwordValidation.isMinLength 
                          ? 'text-success-500' 
                          : theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
                      }`}>
                        Mínimo 8 caracteres
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {passwordValidation.hasUpperCase ? (
                        <FiCheck className="h-4 w-4 text-success-500" />
                      ) : (
                        <FiAlertCircle className="h-4 w-4 text-orange-500" />
                      )}
                      <span className={`text-sm ${
                        passwordValidation.hasUpperCase 
                          ? 'text-success-500' 
                          : theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
                      }`}>
                        Al menos una mayúscula
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {passwordValidation.hasLowerCase ? (
                        <FiCheck className="h-4 w-4 text-success-500" />
                      ) : (
                        <FiAlertCircle className="h-4 w-4 text-orange-500" />
                      )}
                      <span className={`text-sm ${
                        passwordValidation.hasLowerCase 
                          ? 'text-success-500' 
                          : theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
                      }`}>
                        Al menos una minúscula
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {passwordValidation.hasNumber ? (
                        <FiCheck className="h-4 w-4 text-success-500" />
                      ) : (
                        <FiAlertCircle className="h-4 w-4 text-orange-500" />
                      )}
                      <span className={`text-sm ${
                        passwordValidation.hasNumber 
                          ? 'text-success-500' 
                          : theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
                      }`}>
                        Al menos un número
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirmar Contraseña */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  Confirmar Nueva Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className={`w-full px-4 py-3 pr-12 rounded-xl border transition-all duration-300 ease-out-expo ${
                      theme === 'dark' 
                        ? 'bg-slate-800/50 border-slate-600/50 text-white placeholder-slate-400 focus:border-primary-400 focus:bg-slate-800/70' 
                        : 'bg-white/70 border-gray-300/50 text-slate-900 placeholder-slate-500 focus:border-primary-500 focus:bg-white/90'
                    } backdrop-blur-sm focus:outline-none focus:ring-4 focus:ring-primary-500/20`}
                    placeholder="Confirma tu nueva contraseña"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-lg transition-all duration-300 ease-out-expo ${
                      theme === 'dark' 
                        ? 'text-slate-400 hover:text-white hover:bg-slate-700/50' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-gray-100/50'
                    }`}
                  >
                    {showPasswords.confirm ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                  </button>
                </div>

                {/* Validación de coincidencia */}
                {passwordForm.confirmPassword && (
                  <div className="mt-2 flex items-center space-x-2">
                    {passwordValidation.passwordsMatch ? (
                      <FiCheck className="h-4 w-4 text-success-500" />
                    ) : (
                      <FiAlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm ${
                      passwordValidation.passwordsMatch 
                        ? 'text-success-500' 
                        : 'text-red-500'
                    }`}>
                      {passwordValidation.passwordsMatch ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                    </span>
                  </div>
                )}
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ease-out-expo ${
                    theme === 'dark' 
                      ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700/70 hover:text-white border border-slate-600/50' 
                      : 'bg-gray-100/50 text-gray-700 hover:bg-gray-200/70 hover:text-gray-900 border border-gray-300/50'
                  } backdrop-blur-sm hover:scale-105`}
                >
                  Cancelar
                </button>
                
                <button
                  type="submit"
                  disabled={!isPasswordValid || isLoading}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ease-out-expo flex items-center space-x-2 backdrop-blur-sm hover:scale-105 ${
                    isPasswordValid && !isLoading
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-primary-500/25'
                      : theme === 'dark'
                        ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed border border-slate-600/30'
                        : 'bg-gray-200/50 text-gray-400 cursor-not-allowed border border-gray-300/30'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <FiSave className="h-4 w-4" />
                      <span>Guardar Cambios</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal; 