import React, { useState } from 'react';
import { 
  Users, Package, Settings, Building2, Database, ShieldAlert 
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import EntitiesManagement from '../components/admin/EntitiesManagement';
import UserManagement from '../components/admin/UserManagement';
import ProductManagement from './ProductManagement';
import { AnimatePresence, motion } from 'framer-motion';

// 🎯 Componente GlassCard Reutilizable (Local para consistencia inmediata)
const GlassCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const { theme } = useTheme();
  return (
    <div className={`
      relative overflow-hidden rounded-2xl transition-all duration-300
      ${theme === 'dark' 
        ? 'bg-slate-900/60 border border-slate-700/50 shadow-lg shadow-slate-900/20 backdrop-blur-xl' 
        : 'bg-white/80 border border-slate-200/60 shadow-xl shadow-slate-200/40 backdrop-blur-xl'
      }
      ${className}
    `}>
      {children}
    </div>
  );
};

// 🎯 Secciones administrativas
interface AdminSection {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  component?: React.ComponentType;
}

const Admin: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('users');
  const { theme } = useTheme();
  const { isAdmin } = useAuth();

  // 🔐 Verificar permisos de administrador
  if (!isAdmin()) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <GlassCard className="p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-red-500 mb-2">Acceso Denegado</h2>
          <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            No tienes permisos suficientes para acceder a la configuración del sistema.
          </p>
        </GlassCard>
      </div>
    );
  }

  // ⚙️ Definición de secciones administrativas
  const adminSections: AdminSection[] = [
    {
      id: 'users',
      name: 'Usuarios',
      icon: Users,
      description: 'Gestión de acceso',
      component: UserManagement
    },
    {
      id: 'products',
      name: 'Productos',
      icon: Package,
      description: 'Catálogo y stock',
      component: ProductManagement
    },
    {
      id: 'entities',
      name: 'Entidades',
      icon: Building2,
      description: 'Empleados y Sucursales',
      component: EntitiesManagement
    },
    {
      id: 'system',
      name: 'Configuración',
      icon: Settings,
      description: 'Ajustes generales',
    }
  ];

  const ActiveComponent = adminSections.find(section => section.id === activeSection)?.component;

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
      
      {/* Header Principal (Idéntico a Inventory.tsx) */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
               <Settings size={24} />
             </div>
             <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
               Administración
             </h1>
          </div>
          <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Panel de control y configuración del sistema
          </p>
        </div>
      </header>

      {/* Barra de Navegación (Tabs) */}
      <GlassCard className="mb-6 !p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className={`flex p-1 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-100/50 border-slate-200'}`}>
            {adminSections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap
                    ${isActive 
                      ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30' 
                      : theme === 'dark' 
                        ? 'text-slate-300 hover:text-white hover:bg-slate-700/50' 
                        : 'text-slate-500 hover:text-indigo-500 hover:bg-slate-100'
                    }
                  `}
                >
                  <Icon size={18} />
                  <span>{section.name}</span>
                </button>
              );
            })}
          </div>
          
          <span className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
            {adminSections.find(s => s.id === activeSection)?.description}
          </span>
        </div>
      </GlassCard>

      {/* Contenido Principal */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {ActiveComponent ? (
            <div className="min-h-[500px]">
              <ActiveComponent />
            </div>
          ) : (
            <GlassCard className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-400">
                <Database size={40} />
              </div>
              
              <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Sección en Construcción
              </h3>
              
              <p className="text-slate-500 max-w-md">
                El módulo de configuración general estará disponible en la próxima actualización del sistema.
              </p>
            </GlassCard>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Admin;