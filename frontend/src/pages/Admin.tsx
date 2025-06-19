import React, { useState } from 'react';
import { 
  FiUsers, FiPackage, FiSettings, FiDatabase 
} from 'react-icons/fi';
import { FaUserFriends } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import EntitiesManagement from '../components/admin/EntitiesManagement';
import UserManagement from '../components/admin/UserManagement';
import ProductManagement from './ProductManagement';
import { AnimatePresence, motion } from 'framer-motion';

// 🎯 Secciones administrativas
interface AdminSection {
  id: string;
  name: string;
  icon: React.ReactNode;
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
      <div className="flex items-center justify-center h-full">
        <div className={`
          glass-card p-8 text-center max-w-md
          ${theme === 'dark' ? 'bg-slate-900/80' : 'bg-white/80'}
        `}>
          <h2 className="text-2xl font-bold text-red-500 mb-4">Acceso Denegado</h2>
          <p className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
            No tienes permisos para acceder a esta sección.
          </p>
        </div>
      </div>
    );
  }

  // ⚙️ Definición de secciones administrativas
  const adminSections: AdminSection[] = [
    {
      id: 'users',
      name: 'Gestión de Usuarios',
      icon: <FiUsers className="h-6 w-6" />,
      description: 'Administrar usuarios, roles y permisos del sistema',
      component: UserManagement
    },
    {
      id: 'products',
      name: 'Gestión de Productos',
      icon: <FiPackage className="h-6 w-6" />,
      description: 'Catálogo de productos, categorías y configuración',
      component: ProductManagement
    },
    {
      id: 'entities',
      name: 'Gestión de Entidades',
      icon: <FaUserFriends className="h-6 w-6" />,
      description: 'Empleados, sectores y sucursales',
      component: EntitiesManagement
    },
    {
      id: 'system',
      name: 'Configuración del Sistema',
      icon: <FiSettings className="h-6 w-6" />,
      description: 'Configuraciones generales y mantenimiento'
    }
  ];

  const ActiveComponent = adminSections.find(section => section.id === activeSection)?.component;

  return (
    <div className={`
      min-h-screen transition-all duration-300 relative
      ${theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95' 
        : 'bg-gradient-to-br from-slate-50/95 via-slate-100/90 to-slate-200/95'
      }
    `}>
      {/* 🌌 IMPLEMENTACIÓN OBLIGATORIA EN TODAS LAS PÁGINAS DEL PROYECTO */}
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

      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* 📋 Header de Administración */}
        <div className="mb-8">
          <h1 className={`
            text-4xl font-bold mb-4 transition-colors duration-300
            ${theme === 'dark' 
              ? 'text-white drop-shadow-lg' 
              : 'text-slate-900 drop-shadow-md'
            }
          `}>
            ⚙️ Panel de Administración
          </h1>
          <p className={`
            text-lg transition-colors duration-300
            ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}
          `}>
            Gestión centralizada del sistema StockIT
          </p>
        </div>

        {/* 🎛️ Navegación de secciones administrativas */}
        <div className="mb-8">
          <div className={`
            glass-card p-2 transition-all duration-300
            ${theme === 'dark' 
              ? 'bg-slate-900/80 border-slate-700/50' 
              : 'bg-white/80 border-white/30'
            }
          `}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              {adminSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`
                    group relative p-6 rounded-xl transition-all duration-300 ease-out-expo
                    text-left overflow-hidden
                    ${activeSection === section.id
                      ? theme === 'dark'
                        ? 'bg-gradient-to-br from-primary-600/90 to-primary-700/90 text-white shadow-primary/30 shadow-2xl scale-105'
                        : 'bg-gradient-to-br from-primary-500/90 to-primary-600/90 text-white shadow-primary/30 shadow-2xl scale-105'
                      : theme === 'dark'
                        ? 'hover:bg-slate-800/50 text-slate-300 hover:text-white hover:scale-102'
                        : 'hover:bg-white/20 text-slate-600 hover:text-slate-900 hover:scale-102'
                    }
                    backdrop-blur-sm border border-white/10 hover:border-white/20
                  `}
                >
                  {/* Efecto de brillo en hover */}
                  <div className="
                    absolute inset-0 opacity-0 group-hover:opacity-100
                    bg-gradient-to-r from-transparent via-white/5 to-transparent
                    translate-x-[-100%] group-hover:translate-x-[100%]
                    transition-all duration-1000 ease-out-expo
                    pointer-events-none
                  " />
                  
                  <div className="relative z-10">
                    <div className={`
                      mb-4 p-3 rounded-xl transition-all duration-300 inline-block
                      ${activeSection === section.id
                        ? 'bg-white/20 text-white'
                        : theme === 'dark'
                          ? 'bg-slate-700/50 text-primary-400 group-hover:bg-primary-500/20 group-hover:text-primary-300'
                          : 'bg-slate-100/80 text-primary-600 group-hover:bg-primary-500/20 group-hover:text-primary-700'
                      }
                      group-hover:scale-110 group-hover:rotate-12
                    `}>
                      {section.icon}
                    </div>
                    
                    <h3 className="text-lg font-semibold mb-2 group-hover:translate-x-1 transition-transform duration-300">
                      {section.name}
                    </h3>
                    
                    <p className={`
                      text-sm opacity-80 group-hover:opacity-100 transition-opacity duration-300
                      ${activeSection === section.id 
                        ? 'text-white/90' 
                        : theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }
                    `}>
                      {section.description}
                    </p>
                  </div>

                  {/* Indicador activo */}
                  {activeSection === section.id && (
                    <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-white/80 animate-pulse shadow-lg" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 📱 Contenido de la sección activa */}
        <div className={`
          glass-card min-h-[600px] transition-all duration-300
          ${theme === 'dark' 
            ? 'bg-slate-900/80 border-slate-700/50' 
            : 'bg-white/80 border-white/30'
          }
        `}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {ActiveComponent ? (
                <ActiveComponent />
              ) : (
                <div className="p-8 text-center">
                  <div className={`
                    inline-flex items-center justify-center w-20 h-20 rounded-full mb-6
                    ${theme === 'dark' 
                      ? 'bg-slate-800/50 text-slate-400' 
                      : 'bg-slate-100/80 text-slate-500'
                    }
                  `}>
                    <FiDatabase className="h-10 w-10" />
                  </div>
                  
                  <h3 className={`
                    text-2xl font-bold mb-4 transition-colors duration-300
                    ${theme === 'dark' ? 'text-white' : 'text-slate-900'}
                  `}>
                    Sección en Desarrollo
                  </h3>
                  
                  <p className={`
                    text-lg transition-colors duration-300 max-w-md mx-auto
                    ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}
                  `}>
                    Esta funcionalidad estará disponible próximamente. Las secciones "Gestión de Usuarios" y "Gestión de Entidades" ya están implementadas.
                  </p>
                  
                  <div className="mt-6 flex gap-3 justify-center">
                    <button
                      type="button"
                      onClick={() => setActiveSection('users')}
                      className="btn-primary px-6 py-3"
                    >
                      👤 Ver Gestión de Usuarios
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSection('entities')}
                      className="btn-secondary px-6 py-3"
                    >
                      ⚡ Ver Gestión de Entidades
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Admin; 