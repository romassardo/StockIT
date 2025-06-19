import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { 
  FiMenu, FiX, FiHome, FiClipboard, FiTool, FiBarChart2, 
  FiUser, FiLogOut, FiSettings,
  FiChevronRight, FiTerminal, FiSmartphone, FiArchive, FiUserCheck, FiShield
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../common/ThemeToggle';
import UserProfileModal from '../common/UserProfileModal';

// ðŸŽ¯ Interfaces para la navegaciÃ³n moderna
interface SubMenuItem {
  name: string;
  path: string;
  icon?: React.ReactNode;
}

interface NavigationItem {
  name: string;
  icon: React.ReactNode;
  path: string;
  visible: boolean;
  submenu?: SubMenuItem[];
}

const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const { user, isAdmin, logout } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();

  // ðŸ§­ DefiniciÃ³n de navegaciÃ³n principal - REESTRUCTURADA Y MODERNA
    const mainNavigation: NavigationItem[] = [
    { 
      name: 'Dashboard', 
      icon: <FiHome />, 
      path: '/dashboard', 
      visible: true 
    },
    { 
      name: 'Notebooks & Celulares', 
      icon: <FiSmartphone />, 
      path: '/inventory',
      visible: true,
    },
    { 
      name: 'Stock General', 
      icon: <FiArchive />, 
      path: '/stock',
      visible: true,
    },
    { 
      name: 'Asignaciones', 
      icon: <FiUserCheck />, 
      path: '/assignments', 
      visible: true 
    },
    { 
      name: 'Reparaciones', 
      icon: <FiTool />, 
      path: '/repairs', 
      visible: true 
    },
    { 
      name: 'Reportes', 
      icon: <FiBarChart2 />, 
      path: '/reports', 
      visible: true 
    },
    { 
      name: 'Bóveda', 
      icon: <FiShield />, 
      path: '/vault', 
      visible: true 
    }
  ];

  // âš™ï¸ NavegaciÃ³n administrativa - ENLACE DIRECTO (navegaciÃ³n por pestaÃ±as en panel central)
  const adminNavigation: NavigationItem[] = [
    { 
      name: 'Administración', 
      icon: <FiSettings />, 
      path: '/admin',
      visible: isAdmin()
      // Sin submenu - toda la navegaciÃ³n se hace por pestaÃ±as en el panel central
    }
  ];

  // Combinar navegaciones
  const allNavigation = [...mainNavigation, ...adminNavigation];

  // ðŸŽ›ï¸ Funciones de control del sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  // ðŸ"‚ Control de submenÃºs expandidos
  const toggleSubmenu = (menuName: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuName) 
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    );
  };

  // ðŸ" Verificar si un menÃº estÃ¡ activo
  const isMenuActive = (item: NavigationItem): boolean => {
    if (item.submenu) {
      return item.submenu.some(sub => location.pathname === sub.path);
    }
    return location.pathname === item.path;
  };

  // ðŸŽ¯ Auto-expandir menÃºs activos
  useEffect(() => {
    allNavigation.forEach(item => {
      if (item.submenu && isMenuActive(item)) {
        if (!expandedMenus.includes(item.name)) {
          setExpandedMenus(prev => [...prev, item.name]);
        }
      }
    });
  }, [location.pathname]);

  // ðŸšª Manejar el cierre de sesiÃ³n
  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className={`flex h-screen transition-all duration-300 ${
      theme === 'dark' 
        ? 'bg-slate-900' 
        : 'bg-slate-50'
    }`}>
      {/* ðŸŒŒ ORBES TEMPORALMENTE DESHABILITADOS PARA DEBUG */}

      {/* Overlay para dispositivos mÃ³viles */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 z-overlay bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* ðŸŒŒ Sidebar Moderno con Glassmorphism - REESTRUCTURADO COMPLETAMENTE */}
      <div className={`
        fixed inset-y-0 left-0 z-sidebar w-80 transform transition-all duration-300 ease-out-expo
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:z-auto
        ${theme === 'dark' 
          ? 'bg-slate-900/80 border-slate-700/50' 
          : 'bg-primary-600/95 border-primary-500/20'
        }
        backdrop-blur-xl border-r shadow-2xl
      `}>
        {/* ✨ Logo y título con glassmorphism */}
        <div className={`
          relative flex items-center justify-center h-16 px-6 
          ${theme === 'dark' 
            ? 'border-b border-slate-700/50' 
            : 'border-b border-primary-500/30'
          }
          backdrop-blur-sm
        `}>
          <button 
            type="button"
            className={`
              md:hidden absolute left-4 top-1/2 transform -translate-y-1/2
              p-3 rounded-xl transition-all duration-300 ease-out-expo focus:outline-none z-10
              ${theme === 'dark' 
                ? 'text-slate-300 hover:text-white hover:bg-slate-800/50' 
                : 'text-white/80 hover:text-white hover:bg-white/10'
              }
              backdrop-blur-sm
            `}
            onClick={toggleSidebar}
          >
            <FiX className="h-6 w-6" />
          </button>

          <Link to="/dashboard" className="flex items-center justify-center group">
            <div className="flex items-center justify-center">
              <img 
                src="/LogoStockITHoriz.png" 
                alt="StockIT Logo" 
                className={`
                  h-12 w-auto transition-all duration-300 ease-out-expo
                  group-hover:scale-105 group-hover:drop-shadow-lg
                  ${theme === 'dark' 
                    ? 'filter brightness-110' 
                    : 'filter brightness-100'
                  }
                `}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <span className={`
                hidden text-3xl font-extrabold transition-all duration-300 ease-out-expo
                text-gradient-primary group-hover:scale-105
                ${theme === 'dark' ? 'text-white' : 'text-white'}
                tracking-tight text-center
              `}>
                ðŸ'» StockIT
              </span>
            </div>
          </Link>
        </div>

        {/* ðŸ§­ NavegaciÃ³n moderna con submenÃºs */}
        <nav className="px-6 py-8 space-y-2 overflow-y-auto flex-1">
          {allNavigation.map((item) => 
            item.visible && (
              <div key={item.name} className="space-y-1">
                {/* ðŸ"‹ Item principal del menÃº */}
                <div className="relative">
                  {item.submenu ? (
                    // MenÃº con submenÃºs
                    <button
                      type="button"
                      onClick={() => toggleSubmenu(item.name)}
                      className={`
                        group w-full flex items-center justify-between px-6 py-4 text-base font-semibold rounded-2xl
                        transition-all duration-300 ease-out-expo relative overflow-hidden
                        ${isMenuActive(item) 
                          ? theme === 'dark'
                            ? 'bg-gradient-primary text-white shadow-primary/50 shadow-lg scale-105'
                            : 'bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/30 scale-105'
                          : theme === 'dark'
                            ? 'text-slate-300 hover:text-white hover:bg-slate-800/50 hover:scale-102'
                            : 'text-white/80 hover:text-white hover:bg-white/10 hover:scale-102'
                        }
                        hover:shadow-xl
                      `}
                    >
                      <div className="flex items-center">
                        <span className={`
                          mr-5 transition-all duration-300 ease-out-expo text-xl
                          group-hover:scale-110 group-hover:rotate-12
                          ${isMenuActive(item) ? 'drop-shadow-lg' : ''}
                        `}>
                          {item.icon}
                        </span>
                        <span className="relative z-10 tracking-wide">{item.name}</span>
                      </div>
                      
                      {/* Icono de expansiÃ³n */}
                      <span className={`
                        transition-transform duration-300 ease-out-expo
                        ${expandedMenus.includes(item.name) ? 'rotate-90' : ''}
                      `}>
                        <FiChevronRight className="h-4 w-4" />
                      </span>

                      {/* Efecto de brillo */}
                      <div className="
                        absolute inset-0 opacity-0 group-hover:opacity-100
                        bg-gradient-to-r from-transparent via-white/5 to-transparent
                        translate-x-[-100%] group-hover:translate-x-[100%]
                        transition-all duration-1000 ease-out-expo
                        pointer-events-none
                      " />
                    </button>
                  ) : (
                    // MenÃº simple sin submenÃºs
                    <Link
                      to={item.path}
                      className={`
                        group flex items-center px-6 py-4 text-base font-semibold rounded-2xl
                        transition-all duration-300 ease-out-expo relative overflow-hidden
                        ${location.pathname === item.path 
                          ? theme === 'dark'
                            ? 'bg-gradient-primary text-white shadow-primary/50 shadow-lg scale-105'
                            : 'bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/30 scale-105'
                          : theme === 'dark'
                            ? 'text-slate-300 hover:text-white hover:bg-slate-800/50 hover:scale-102'
                            : 'text-white/80 hover:text-white hover:bg-white/10 hover:scale-102'
                        }
                        hover:shadow-xl
                      `}
                      onClick={closeSidebarOnMobile}
                    >
                      <span className={`
                        mr-5 transition-all duration-300 ease-out-expo text-xl
                        group-hover:scale-110 group-hover:rotate-12
                        ${location.pathname === item.path ? 'drop-shadow-lg' : ''}
                      `}>
                        {item.icon}
                      </span>
                      <span className="relative z-10 tracking-wide">{item.name}</span>
                      
                      {/* Indicador activo */}
                      {location.pathname === item.path && (
                        <div className={`
                          absolute right-4 w-3 h-3 rounded-full animate-pulse
                          ${theme === 'dark' ? 'bg-white shadow-white/50' : 'bg-white shadow-white/50'}
                          shadow-lg
                        `} />
                      )}

                      {/* Efecto de brillo */}
                      <div className="
                        absolute inset-0 opacity-0 group-hover:opacity-100
                        bg-gradient-to-r from-transparent via-white/5 to-transparent
                        translate-x-[-100%] group-hover:translate-x-[100%]
                        transition-all duration-1000 ease-out-expo
                        pointer-events-none
                      " />
                    </Link>
                  )}
                </div>

                {/* ðŸ"‚ SubmenÃºs expandibles */}
                {item.submenu && expandedMenus.includes(item.name) && (
                  <div className="ml-6 space-y-1 overflow-hidden">
                    {item.submenu.map((subItem) => (
                      <Link
                        key={subItem.path}
                        to={subItem.path}
                        className={`
                          group flex items-center px-4 py-3 text-sm font-medium rounded-xl
                          transition-all duration-300 ease-out-expo relative
                          ${location.pathname === subItem.path 
                            ? theme === 'dark'
                              ? 'bg-primary-500/20 text-white border-l-4 border-primary-400'
                              : 'bg-white/15 text-white border-l-4 border-white/60'
                            : theme === 'dark'
                              ? 'text-slate-400 hover:text-white hover:bg-slate-800/30 hover:border-l-4 hover:border-slate-600'
                              : 'text-white/70 hover:text-white hover:bg-white/10 hover:border-l-4 hover:border-white/40'
                          }
                          hover:translate-x-2
                        `}
                        onClick={closeSidebarOnMobile}
                      >
                        {subItem.icon && (
                          <span className={`
                            mr-3 text-base transition-all duration-300 ease-out-expo
                            group-hover:scale-110
                            ${location.pathname === subItem.path ? 'text-white' : ''}
                          `}>
                            {subItem.icon}
                          </span>
                        )}
                        <span className="tracking-wide">{subItem.name}</span>
                        
                        {/* Indicador de submenÃº activo */}
                        {location.pathname === subItem.path && (
                          <div className={`
                            absolute right-3 w-2 h-2 rounded-full
                            ${theme === 'dark' ? 'bg-primary-400' : 'bg-white'}
                            shadow-lg animate-pulse
                          `} />
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          )}
        </nav>

        {/* ðŸŒŸ Footer de la sidebar */}
        <div className={`
          p-6
          ${theme === 'dark' 
            ? 'border-t border-slate-700/50 bg-slate-900/50' 
            : 'border-t border-primary-500/30 bg-primary-600/30'
          }
          backdrop-blur-sm
        `}>
          <div className={`
            text-center text-sm opacity-75
            ${theme === 'dark' ? 'text-slate-400' : 'text-white/70'}
          `}>
            <p className="font-medium">Modern Design System 2025</p>
            <p className="text-xs mt-1">v1.0.41 - StockIT</p>
          </div>
        </div>
      </div>

      {/* ðŸ"± Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ðŸŽ¯ Header Moderno con Glassmorphism */}
        <header className={`
          relative z-header transition-all duration-300 ease-out-expo
          ${theme === 'dark' 
            ? 'bg-slate-900/50 border-slate-700/50 shadow-2xl' 
            : 'bg-white/30 border-white/20 shadow-lg'
          }
          backdrop-blur-xl border-b
        `}>
          <div className="flex items-center justify-between h-16 pl-6 pr-6">
            {/* ðŸ" BotÃ³n de menÃº mÃ³vil */}
            <button
              type="button"
              className={`
                md:hidden p-2 rounded-lg transition-all duration-300 ease-out-expo focus:outline-none
                ${theme === 'dark' 
                  ? 'text-slate-300 hover:text-white hover:bg-slate-800/50' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/20'
                }
                backdrop-blur-sm
              `}
              onClick={toggleSidebar}
            >
              <FiMenu className="h-5 w-5" />
            </button>

            {/* 🔹 Espacio central del header */}
            <div className="flex-1"></div>

            {/* âš¡ Iconos de acciones modernos */}
            <div className="flex items-center space-x-3">
              {/* ðŸŒ™ Toggle de tema moderno */}
              <ThemeToggle />


              
              {/* ðŸ' Perfil de usuario moderno */}
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(true)}
                  className={`
                    flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ease-out-expo focus:outline-none
                    ${theme === 'dark' 
                      ? 'hover:bg-slate-800/50 text-slate-300 hover:text-white' 
                      : 'hover:bg-white/20 text-slate-600 hover:text-slate-900'
                    }
                    backdrop-blur-sm hover:scale-105
                  `}
                >
                  <div className={`
                    p-1.5 rounded-lg shadow-sm transition-all duration-300
                    ${theme === 'dark' 
                      ? 'bg-slate-800 text-primary-400' 
                      : 'bg-white/50 text-primary-600'
                    }
                    backdrop-blur-sm border border-white/20
                  `}>
                    <FiUser className="h-4 w-4" />
                  </div>
                  <span className={`
                    hidden md:block text-sm font-medium transition-colors duration-300
                    ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}
                  `}>
                    {user?.nombre || user?.email || 'Usuario'}
                  </span>
                </button>
              </div>

              {/* ðŸšª BotÃ³n de logout moderno */}
              <button
                type="button"
                onClick={handleLogout}
                className={`
                  p-2 rounded-lg transition-all duration-300 ease-out-expo focus:outline-none
                  text-red-500 hover:text-white hover:bg-red-500/20 hover:scale-105
                  backdrop-blur-sm border border-red-500/20 hover:border-red-500/50
                `}
                title="Cerrar sesiÃ³n"
              >
                <FiLogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* ðŸ" Contenido principal con glassmorphism */}
        <main className={`
          flex-1 overflow-y-auto transition-colors duration-300 relative
          ${theme === 'dark' 
            ? 'bg-slate-900/30' 
            : 'bg-white/10'
          }
          backdrop-blur-sm
        `}>
          <Outlet />
        </main>
      </div>

      {/* Modal de perfil de usuario */}
      <UserProfileModal 
        isOpen={profileModalOpen} 
        onClose={() => setProfileModalOpen(false)} 
      />
    </div>
  );
};

export default MainLayout;



