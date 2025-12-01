import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Pencil, ToggleLeft, ToggleRight,
  Search, UserCheck, UserX, Shield, User, RefreshCw
} from 'lucide-react';
import userService, { UserCreateData, UserUpdateData, UserFilters, UserStats } from '../../services/user.service';
import type { SystemUser } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import Modal from '../common/Modal';
import Loading from '../common/Loading';

// 🎯 GlassCard idéntico al de Inventory.tsx
const GlassCard = ({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => {
  const { theme } = useTheme();
  return (
    <div 
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl transition-all duration-300
        ${onClick ? 'cursor-pointer hover:scale-[1.01] hover:shadow-lg' : ''}
        ${theme === 'dark' 
          ? 'bg-slate-900/60 border border-slate-700/50 shadow-lg shadow-slate-900/20 backdrop-blur-xl' 
          : 'bg-white/80 border border-slate-200/60 shadow-xl shadow-slate-200/40 backdrop-blur-xl'
        }
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// 🎯 Badge de Rol estilizado
const RoleBadge = ({ rol }: { rol: string }) => {
  const isAdmin = rol === 'admin';
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5
      ${isAdmin 
        ? 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400' 
        : 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400'
      }`}>
      <div className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-purple-500' : 'bg-blue-500'}`} />
      {isAdmin ? 'Administrador' : 'Usuario'}
    </span>
  );
};

// 🎯 Badge de Estado estilizado
const StatusBadge = ({ activo }: { activo: boolean }) => {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5
      ${activo 
        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400' 
        : 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400'
      }`}>
      <div className={`w-1.5 h-1.5 rounded-full ${activo ? 'bg-emerald-500' : 'bg-red-500'}`} />
      {activo ? 'Activo' : 'Inactivo'}
    </span>
  );
};

// --- Formulario de Usuario ---
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

  const validateForm = () => {
    const newErrors: Partial<UserFormData> = {};
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El formato del email no es válido';
    }
    if (!user && !formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Mínimo 6 caracteres';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    await onSave({
      nombre: formData.nombre,
      email: formData.email,
      rol: formData.rol,
      activo: formData.activo,
      ...(formData.password && { password: formData.password })
    });
  };

  const inputClass = `w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all border ${
    theme === 'dark' 
      ? 'bg-slate-800/50 border-slate-700 focus:border-indigo-500 text-white placeholder-slate-500' 
      : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-800 placeholder-slate-400'
  }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            <User size={14} className="text-indigo-500" />
            Nombre Completo
          </label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
            className={inputClass}
            placeholder="Ej: Juan Pérez"
            autoComplete="off"
          />
          {errors.nombre && <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">⚠ {errors.nombre}</p>}
        </div>
        <div>
          <label className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            <span className="text-indigo-500">@</span>
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className={inputClass}
            placeholder="usuario@empresa.com"
            autoComplete="off"
          />
          {errors.email && <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">⚠ {errors.email}</p>}
        </div>
        <div>
          <label className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            <Shield size={14} className="text-indigo-500" />
            Rol
          </label>
          <select
            value={formData.rol}
            onChange={(e) => setFormData(prev => ({ ...prev, rol: e.target.value as 'admin' | 'usuario' }))}
            className={inputClass}
          >
            <option value="usuario">Usuario Estándar</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <div>
          <label className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            🔒 {user ? 'Nueva Contraseña' : 'Contraseña'}
          </label>
          <input
            type="password"
            value={formData.password || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            className={inputClass}
            placeholder={user ? 'Dejar vacío para mantener' : 'Mínimo 6 caracteres'}
            autoComplete="new-password"
          />
          {errors.password && <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">⚠ {errors.password}</p>}
        </div>
      </div>

      <div className={`flex items-center justify-between p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
        <div>
          <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>Estado del Usuario</p>
          <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
            {formData.activo ? 'El usuario puede acceder al sistema' : 'El usuario está deshabilitado'}
          </p>
        </div>
        <label className="cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={formData.activo}
              onChange={(e) => setFormData(prev => ({ ...prev, activo: e.target.checked }))}
              className="sr-only peer"
            />
            <div className={`w-12 h-7 rounded-full transition-all peer-checked:bg-emerald-500 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-300'}`}>
              <div className="w-5 h-5 bg-white rounded-full shadow-md transition-transform absolute top-1 left-1 peer-checked:translate-x-5" />
            </div>
          </div>
        </label>
      </div>

      {/* Botones de acción */}
      <div className={`flex justify-end gap-3 pt-4 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'}`}>
        <button 
          type="button" 
          onClick={onCancel} 
          className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
            theme === 'dark' 
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700' 
              : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
          }`}
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          disabled={isLoading}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              {user ? 'Actualizar Usuario' : 'Crear Usuario'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

// --- Componente Principal ---
const UserManagement: React.FC = () => {
  const { theme } = useTheme();
  const { addNotification } = useNotification();
  
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [stats, setStats] = useState<UserStats>({ total: 0, admins: 0, usuarios: 0, activos: 0, inactivos: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<UserFilters>({});
  const [quickFilter, setQuickFilter] = useState<'todos' | 'admins' | 'usuarios' | 'activos' | 'inactivos'>('todos');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAll({ page: currentPage, pageSize, filters });
      const userData = (response as any)?.data?.data || (response as any)?.data || response || [];
      const items = (response as any)?.data?.totalItems || (response as any)?.totalItems || userData.length;
      setUsers(Array.isArray(userData) ? userData : []);
      setTotalItems(items);
    } catch (error) {
      addNotification({ type: 'error', title: 'Error', message: 'Error al cargar usuarios' });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await userService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  useEffect(() => { loadUsers(); }, [currentPage, filters]);
  useEffect(() => { loadStats(); }, [users]);

  const handleQuickFilter = (type: typeof quickFilter) => {
    setQuickFilter(type);
    let newFilters: UserFilters = {};
    if (type === 'admins') newFilters.rol = 'admin';
    if (type === 'usuarios') newFilters.rol = 'usuario';
    if (type === 'activos') newFilters.activo = true;
    if (type === 'inactivos') newFilters.activo = false;
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleCreateUser = async (userData: UserCreateData | UserUpdateData) => {
    try {
      setActionLoading(true);
      await userService.create(userData as UserCreateData);
      addNotification({ type: 'success', title: 'Éxito', message: `Usuario ${userData.nombre} creado` });
      setShowCreateModal(false);
      loadUsers();
      loadStats();
    } catch (error: any) {
      addNotification({ type: 'error', title: 'Error', message: error.response?.data?.error || 'Error al crear usuario' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUser = async (userData: UserUpdateData) => {
    if (!editingUser) return;
    try {
      setActionLoading(true);
      await userService.update(editingUser.id, userData);
      addNotification({ type: 'success', title: 'Éxito', message: `Usuario ${userData.nombre} actualizado` });
      setShowEditModal(false);
      setEditingUser(null);
      loadUsers();
      loadStats();
    } catch (error: any) {
      addNotification({ type: 'error', title: 'Error', message: error.response?.data?.error || 'Error al actualizar' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (user: SystemUser) => {
    try {
      await userService.toggleActive(user.id);
      addNotification({ type: 'success', title: 'Éxito', message: `Usuario ${user.activo ? 'desactivado' : 'activado'}` });
      loadUsers();
      loadStats();
    } catch (error: any) {
      addNotification({ type: 'error', title: 'Error', message: 'Error al cambiar estado' });
    }
  };

  const statCards = [
    { label: 'Total', value: stats.total, icon: Users, color: 'indigo' },
    { label: 'Admins', value: stats.admins, icon: Shield, color: 'purple' },
    { label: 'Usuarios', value: stats.usuarios, icon: User, color: 'blue' },
    { label: 'Activos', value: stats.activos, icon: UserCheck, color: 'emerald' },
    { label: 'Inactivos', value: stats.inactivos, icon: UserX, color: 'red' },
  ];

  const filterButtons = [
    { id: 'todos', label: 'Todos', icon: Users },
    { id: 'admins', label: 'Admins', icon: Shield },
    { id: 'usuarios', label: 'Usuarios', icon: User },
    { id: 'activos', label: 'Activos', icon: UserCheck },
    { id: 'inactivos', label: 'Inactivos', icon: UserX },
  ];

  return (
    <div className="space-y-6">
      
      {/* Tarjetas de Estadísticas - Estilo Inventory */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const colorClasses: Record<string, string> = {
            indigo: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
            purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
            blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
            red: 'bg-red-500/10 text-red-500 border-red-500/20',
          };
          return (
            <GlassCard key={stat.label} className="!p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${colorClasses[stat.color]}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                    {stat.value}
                  </p>
                  <p className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    {stat.label}
                  </p>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Barra de Herramientas - Estilo Inventory */}
      <GlassCard className="!p-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
          
          {/* Buscador con filtrado en tiempo real */}
          <div className="w-full lg:w-80 relative">
            <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              autoComplete="off"
              onChange={(e) => {
                setSearchTerm(e.target.value);
                // Filtrar automáticamente al escribir
                setFilters(prev => ({ ...prev, search: e.target.value }));
                setCurrentPage(1);
              }}
              className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm outline-none transition-all border ${
                theme === 'dark' 
                  ? 'bg-slate-800/50 border-slate-700 focus:border-indigo-500 text-white placeholder-slate-500' 
                  : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-800 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Filtros Rápidos */}
          <div className={`flex p-1 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-100/50 border-slate-200'}`}>
            {filterButtons.map((filter) => {
              const Icon = filter.icon;
              return (
                <button
                  key={filter.id}
                  onClick={() => handleQuickFilter(filter.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    quickFilter === filter.id 
                      ? 'bg-indigo-500 text-white shadow-md' 
                      : `${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-indigo-500'}`
                  }`}
                >
                  <Icon size={14} /> {filter.label}
                </button>
              );
            })}
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center gap-2">
            <button 
              onClick={loadUsers}
              className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}
              title="Recargar"
            >
              <RefreshCw size={18} />
            </button>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30 flex items-center gap-2"
            >
              <Plus size={18} /> Nuevo Usuario
            </button>
          </div>

        </div>
      </GlassCard>

      {/* Tabla de Usuarios - Estilo Inventory */}
      {loading ? (
        <Loading text="Cargando usuarios..." />
      ) : users.length === 0 ? (
        <div className="text-center py-20 opacity-60">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
            <Users size={40} className="text-slate-400" />
          </div>
          <h3 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>No se encontraron usuarios</h3>
          <p className="text-sm text-slate-500">Intenta ajustar los filtros o crear uno nuevo.</p>
        </div>
      ) : (
        <GlassCard className="!p-0 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`text-xs uppercase tracking-wider font-semibold border-b ${
                theme === 'dark' 
                  ? 'text-slate-400 border-slate-700 bg-slate-800/30' 
                  : 'text-slate-500 border-slate-200 bg-slate-50/50'
              }`}>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Último Acceso</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
              {users.map((user) => (
                <tr 
                  key={user.id} 
                  className={`transition-colors ${theme === 'dark' ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        user.rol === 'admin' 
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                          : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                      }`}>
                        {user.rol === 'admin' ? <Shield size={14} className="text-white" /> : <User size={14} className="text-white" />}
                      </div>
                      <span className={`font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                        {user.nombre}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs text-indigo-500 font-mono bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded">
                      {user.email}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <RoleBadge rol={user.rol} />
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge activo={user.activo} />
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      {user.ultimo_acceso ? new Date(user.ultimo_acceso).toLocaleDateString() : 'Nunca'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end items-center gap-1">
                      <button 
                        onClick={() => { setEditingUser(user); setShowEditModal(true); }}
                        className={`p-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-slate-700 text-indigo-400' : 'hover:bg-indigo-50 text-indigo-500'}`}
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => handleToggleActive(user)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          user.activo 
                            ? theme === 'dark' ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-50 text-red-500'
                            : theme === 'dark' ? 'hover:bg-emerald-900/30 text-emerald-400' : 'hover:bg-emerald-50 text-emerald-500'
                        }`}
                        title={user.activo ? 'Desactivar' : 'Activar'}
                      >
                        {user.activo ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Paginación simple */}
          {totalItems > pageSize && (
            <div className={`px-6 py-4 border-t flex justify-between items-center ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
              <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Mostrando {users.length} de {totalItems} usuarios
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                    theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  Anterior
                </button>
                <button 
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={users.length < pageSize}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                    theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </GlassCard>
      )}

      {/* Modal Crear Usuario */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Crear Nuevo Usuario" size="lg">
        <UserForm onSave={handleCreateUser} onCancel={() => setShowCreateModal(false)} isLoading={actionLoading} />
      </Modal>

      {/* Modal Editar Usuario */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditingUser(null); }} title="Editar Usuario" size="lg">
        <UserForm user={editingUser || undefined} onSave={handleUpdateUser} onCancel={() => { setShowEditModal(false); setEditingUser(null); }} isLoading={actionLoading} />
      </Modal>
    </div>
  );
};

export default UserManagement;
