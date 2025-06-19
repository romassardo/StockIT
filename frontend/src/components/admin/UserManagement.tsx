import React, { useState, useEffect } from 'react';
import { 
  FiUsers, 
  FiPlus, 
  FiEdit2, 
  FiLock, 
  FiToggleLeft, 
  FiToggleRight,
  FiSearch,
  FiFilter,
  FiUserCheck,
  FiUserX,
  FiShield,
  FiUser,
  FiEye,
  FiRefreshCw
} from 'react-icons/fi';
import userService, { UserCreateData, UserUpdateData, UserFilters, UserStats } from '../../services/user.service';
import type { SystemUser, PaginatedResponse } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import DataTable from '../common/DataTable';
import Loading from '../common/Loading';

interface UserFormData {
  nombre: string;
  email: string;
  password?: string;
  rol: 'admin' | 'usuario';
  activo: boolean;
}

interface UserFormProps {
  user?: SystemUser;
  onSave: (userData: UserCreateData | UserUpdateData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

const UserForm: React.FC<UserFormProps> = ({ user, onSave, onCancel, isLoading }) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState<UserFormData>({
    nombre: user?.nombre || '',
    email: user?.email || '',
    password: '',
    rol: user?.rol || 'usuario',
    activo: user?.activo ?? true,
  });
  const [errors, setErrors] = useState<Partial<UserFormData>>({});
  const [emailValidating, setEmailValidating] = useState(false);

  const validateForm = () => {
    const newErrors: Partial<UserFormData> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El formato del email no es válido';
    }

    if (!user && !formData.password) {
      newErrors.password = 'La contraseña es requerida para usuarios nuevos';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateEmail = async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    
    setEmailValidating(true);
    try {
      const available = await userService.validateEmail(email, user?.id);
      if (!available) {
        setErrors(prev => ({ ...prev, email: 'Este email ya está registrado' }));
      } else {
        setErrors(prev => ({ ...prev, email: undefined }));
      }
    } catch (error) {
      console.error('Error validando email:', error);
    } finally {
      setEmailValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const userData = {
      nombre: formData.nombre,
      email: formData.email,
      rol: formData.rol,
      activo: formData.activo,
      ...(formData.password && { password: formData.password })
    };

    await onSave(userData);
  };

  const handleInputChange = (field: keyof UserFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Validar email en tiempo real
    if (field === 'email' && value !== user?.email) {
      const debounceTimer = setTimeout(() => validateEmail(value), 500);
      return () => clearTimeout(debounceTimer);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Input
            label="Nombre"
            type="text"
            value={formData.nombre}
            onChange={(e) => handleInputChange('nombre', e.target.value)}
            error={errors.nombre}
            required
            placeholder="Ingrese el nombre completo"
          />
        </div>

        <div>
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            error={errors.email}
            required
            placeholder="usuario@empresa.com"
            loading={emailValidating}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${
            theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
          }`}>
            Rol *
          </label>
          <select
            value={formData.rol}
            onChange={(e) => handleInputChange('rol', e.target.value as 'admin' | 'usuario')}
            className={`
              w-full px-4 py-3 rounded-xl backdrop-blur-sm border transition-all duration-300
              ${theme === 'dark'
                ? 'bg-slate-800/50 border-slate-600 text-white focus:border-primary-400'
                : 'bg-white/50 border-slate-300 text-slate-900 focus:border-primary-500'
              }
              focus:outline-none focus:ring-4 focus:ring-primary-500/20
            `}
          >
            <option value="usuario">Usuario</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        <div>
          <Input
            label={user ? "Nueva Contraseña (opcional)" : "Contraseña"}
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            error={errors.password}
            required={!user}
            placeholder={user ? "Dejar vacío para mantener la actual" : "Mínimo 6 caracteres"}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={formData.activo}
              onChange={(e) => handleInputChange('activo', e.target.checked)}
              className="sr-only"
            />
            <div className={`
              w-12 h-6 rounded-full transition-all duration-300 ${
                formData.activo
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                  : theme === 'dark' 
                    ? 'bg-slate-600' 
                    : 'bg-slate-300'
              }
            `}>
              <div className={`
                w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-300 transform top-0.5 absolute
                ${formData.activo ? 'translate-x-6' : 'translate-x-0.5'}
              `} />
            </div>
          </div>
          <span className={`text-sm font-medium ${
            theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
          }`}>
            Usuario Activo
          </span>
        </label>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          variant="primary" 
          loading={isLoading}
          disabled={Object.keys(errors).length > 0 || emailValidating}
        >
          {user ? 'Actualizar Usuario' : 'Crear Usuario'}
        </Button>
      </div>
    </form>
  );
};

const UserManagement: React.FC = () => {
  const { theme } = useTheme();
  const { addNotification } = useNotification();
  
  // Estados principales
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    admins: 0,
    usuarios: 0,
    activos: 0,
    inactivos: 0
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;
  
  // Filtros
  const [filters, setFilters] = useState<UserFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  
  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);

  // Cargar datos
  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAll({
        page: currentPage,
        pageSize,
        filters
      });
      
      setUsers(response.data.data);
      setTotalPages(response.data.totalPages);
      setTotalItems(response.data.totalItems);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error al cargar usuarios'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await userService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  // Efectos
  useEffect(() => {
    loadUsers();
  }, [currentPage, filters]);

  useEffect(() => {
    loadStats();
  }, [users]);

  // Handlers CRUD
  const handleCreateUser = async (userData: UserCreateData) => {
    try {
      setActionLoading(true);
      await userService.create(userData);
      
      addNotification({
        type: 'success',
        title: 'Usuario Creado',
        message: `Usuario ${userData.nombre} creado exitosamente`
      });
      
      setShowCreateModal(false);
      loadUsers();
      loadStats();
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error || 'Error al crear usuario'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUser = async (userData: UserUpdateData) => {
    if (!editingUser) return;
    
    try {
      setActionLoading(true);
      await userService.update(editingUser.id, userData);
      
      addNotification({
        type: 'success',
        title: 'Usuario Actualizado',
        message: `Usuario ${userData.nombre} actualizado exitosamente`
      });
      
      setShowEditModal(false);
      setEditingUser(null);
      loadUsers();
      loadStats();
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error || 'Error al actualizar usuario'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (user: SystemUser) => {
    try {
      await userService.toggleActive(user.id);
      
      addNotification({
        type: 'success',
        title: 'Estado Actualizado',
        message: `Usuario ${user.activo ? 'desactivado' : 'activado'} exitosamente`
      });
      
      loadUsers();
      loadStats();
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error || 'Error al cambiar estado'
      });
    }
  };

  // Configuración de tabla
  const columns = [
    {
      id: 'usuario',
      header: 'Usuario',
      accessor: (user: SystemUser) => (
        <div className="flex items-center gap-3">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center
            ${user.rol === 'admin' 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
              : 'bg-gradient-to-r from-blue-500 to-cyan-500'
            }
          `}>
            {user.rol === 'admin' ? (
              <FiShield className="h-5 w-5 text-white" />
            ) : (
              <FiUser className="h-5 w-5 text-white" />
            )}
          </div>
          <div>
            <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {user.nombre}
            </p>
            <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              {user.email}
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'rol',
      header: 'Rol',
      accessor: (user: SystemUser) => (
        <span className={`
          inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium
          ${user.rol === 'admin'
            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
          }
        `}>
          {user.rol === 'admin' ? <FiShield className="h-3 w-3" /> : <FiUser className="h-3 w-3" />}
          {user.rol === 'admin' ? 'Administrador' : 'Usuario'}
        </span>
      )
    },
    {
      id: 'estado',
      header: 'Estado',
      accessor: (user: SystemUser) => (
        <span className={`
          inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium
          ${user.activo
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          }
        `}>
          {user.activo ? <FiUserCheck className="h-3 w-3" /> : <FiUserX className="h-3 w-3" />}
          {user.activo ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
    {
      id: 'ultimo_acceso',
      header: 'Último Acceso',
      accessor: (user: SystemUser) => (
        <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
          {user.ultimo_acceso ? new Date(user.ultimo_acceso).toLocaleDateString() : 'Nunca'}
        </span>
      )
    },
    {
      id: 'acciones',
      header: 'Acciones',
      accessor: (user: SystemUser) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingUser(user);
              setShowEditModal(true);
            }}
            className={`
              p-2 rounded-lg transition-all duration-200 hover:scale-110
              ${theme === 'dark' 
                ? 'bg-slate-700 hover:bg-slate-600 text-blue-400' 
                : 'bg-slate-100 hover:bg-slate-200 text-blue-600'
              }
            `}
            title="Editar usuario"
          >
            <FiEdit2 className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => handleToggleActive(user)}
            className={`
              p-2 rounded-lg transition-all duration-200 hover:scale-110
              ${user.activo
                ? theme === 'dark' 
                  ? 'bg-slate-700 hover:bg-slate-600 text-red-400' 
                  : 'bg-slate-100 hover:bg-slate-200 text-red-600'
                : theme === 'dark' 
                  ? 'bg-slate-700 hover:bg-slate-600 text-green-400' 
                  : 'bg-slate-100 hover:bg-slate-200 text-green-600'
              }
            `}
            title={user.activo ? 'Desactivar usuario' : 'Activar usuario'}
          >
            {user.activo ? <FiToggleRight className="h-4 w-4" /> : <FiToggleLeft className="h-4 w-4" />}
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 🌌 ORBES DE FONDO ANIMADOS - IMPLEMENTACIÓN OBLIGATORIA */}
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

      {/* Contenido existente */}
      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        <div className="space-y-6 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Gestión de Usuarios
              </h2>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                Administrar usuarios del sistema y sus permisos
              </p>
            </div>
            
            <Button 
              onClick={() => setShowCreateModal(true)}
              variant="primary"
              icon={<FiPlus className="h-4 w-4" />}
            >
              Nuevo Usuario
            </Button>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className={`
              glass-card p-6 transition-all duration-300
              ${theme === 'dark' 
                ? 'bg-slate-900/80 border-slate-700/50' 
                : 'bg-white/80 border-white/30'
              }
            `}>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500">
                  <FiUsers className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {stats ? stats.total : '-'}
                  </p>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    Total Usuarios
                  </p>
                </div>
              </div>
            </div>

            <div className={`
              glass-card p-6 transition-all duration-300
              ${theme === 'dark' 
                ? 'bg-slate-900/80 border-slate-700/50' 
                : 'bg-white/80 border-white/30'
              }
            `}>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
                  <FiShield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {stats ? stats.admins : '-'}
                  </p>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    Administradores
                  </p>
                </div>
              </div>
            </div>

            <div className={`
              glass-card p-6 transition-all duration-300
              ${theme === 'dark' 
                ? 'bg-slate-900/80 border-slate-700/50' 
                : 'bg-white/80 border-white/30'
              }
            `}>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500">
                  <FiUser className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {stats ? stats.usuarios : '-'}
                  </p>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    Usuarios Estándar
                  </p>
                </div>
              </div>
            </div>

            <div className={`
              glass-card p-6 transition-all duration-300
              ${theme === 'dark' 
                ? 'bg-slate-900/80 border-slate-700/50' 
                : 'bg-white/80 border-white/30'
              }
            `}>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500">
                  <FiUserCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {stats ? stats.activos : '-'}
                  </p>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    Activos
                  </p>
                </div>
              </div>
            </div>

            <div className={`
              glass-card p-6 transition-all duration-300
              ${theme === 'dark' 
                ? 'bg-slate-900/80 border-slate-700/50' 
                : 'bg-white/80 border-white/30'
              }
            `}>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-500">
                  <FiUserX className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {stats ? stats.inactivos : '-'}
                  </p>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    Inactivos
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros y Búsqueda */}
          <div className={`
            glass-card p-6 transition-all duration-300
            ${theme === 'dark' 
              ? 'bg-slate-900/80 border-slate-700/50' 
              : 'bg-white/80 border-white/30'
            }
          `}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  icon={<FiSearch className="h-4 w-4" />}
                  className="w-80"
                />
                
                <Button
                  variant="secondary"
                  onClick={() => setShowFilters(!showFilters)}
                  icon={<FiFilter className="h-4 w-4" />}
                >
                  Filtros
                </Button>
                
                <Button
                  variant="secondary"
                  onClick={loadUsers}
                  icon={<FiRefreshCw className="h-4 w-4" />}
                >
                  Actualizar
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Rol
                  </label>
                  <select
                    value={filters.rol || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, rol: e.target.value }))}
                    className={`
                      w-full px-4 py-2 rounded-lg backdrop-blur-sm border transition-all duration-300
                      ${theme === 'dark'
                        ? 'bg-slate-800/50 border-slate-600 text-white'
                        : 'bg-white/50 border-slate-300 text-slate-900'
                      }
                    `}
                  >
                    <option value="">Todos los roles</option>
                    <option value="admin">Administrador</option>
                    <option value="usuario">Usuario</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Estado
                  </label>
                  <select
                    value={filters.activo === undefined ? '' : filters.activo.toString()}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      activo: e.target.value === '' ? undefined : e.target.value === 'true'
                    }))}
                    className={`
                      w-full px-4 py-2 rounded-lg backdrop-blur-sm border transition-all duration-300
                      ${theme === 'dark'
                        ? 'bg-slate-800/50 border-slate-600 text-white'
                        : 'bg-white/50 border-slate-300 text-slate-900'
                      }
                    `}
                  >
                    <option value="">Todos los estados</option>
                    <option value="true">Activos</option>
                    <option value="false">Inactivos</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setFilters({});
                      setCurrentPage(1);
                    }}
                    className="w-full"
                  >
                    Limpiar Filtros
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Tabla de Usuarios */}
          <div className={`
            glass-card transition-all duration-300
            ${theme === 'dark' 
              ? 'bg-slate-900/80 border-slate-700/50' 
              : 'bg-white/80 border-white/30'
            }
          `}>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loading />
              </div>
            ) : (
              <DataTable
                data={users}
                columns={columns}
                keyExtractor={(user) => user.id.toString()}
                pagination={{
                  currentPage,
                  pageSize,
                  total: totalItems
                }}
                onPageChange={setCurrentPage}
              />
            )}
          </div>

          {/* Modal Crear Usuario */}
          <Modal 
            isOpen={showCreateModal} 
            onClose={() => setShowCreateModal(false)}
            title="Crear Nuevo Usuario"
            size="lg"
          >
            <UserForm
              onSave={handleCreateUser}
              onCancel={() => setShowCreateModal(false)}
              isLoading={actionLoading}
            />
          </Modal>

          {/* Modal Editar Usuario */}
          <Modal 
            isOpen={showEditModal} 
            onClose={() => {
              setShowEditModal(false);
              setEditingUser(null);
            }}
            title="Editar Usuario"
            size="lg"
          >
            <UserForm
              user={editingUser || undefined}
              onSave={handleUpdateUser}
              onCancel={() => {
                setShowEditModal(false);
                setEditingUser(null);
              }}
              isLoading={actionLoading}
            />
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;