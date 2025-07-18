import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  FiMenu, FiX, FiLogOut, FiSun, FiMoon, FiBell, FiSettings,
  FiPackage, FiList, FiFileText, FiTool, FiSearch, FiHome, FiChevronDown
} from 'react-icons/fi';
import { Package } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import AnimatedOrbsBackground from './AnimatedOrbsBackground';
import type { IconType } from 'react-icons';

// Interfaces y constantes de navegación (sin cambios)
interface SubNavItem {
  to: string;
  label: string;
  Icon: IconType;
}

interface NavItem {
  id: string;
  to?: string;
  label: string;
  Icon: IconType;
  submenu?: SubNavItem[];
}

const navItems: NavItem[] = [
  { id: 'dashboard', to: '/', label: 'Dashboard', Icon: FiHome },
  {
    id: 'gestion',
    label: 'Gestión',
    Icon: FiPackage,
    submenu: [
      { to: '/inventory', label: 'Inventario', Icon: FiPackage },
      { to: '/assignments', label: 'Asignaciones', Icon: FiList },
      { to: '/repairs', label: 'Reparaciones', Icon: FiTool },
    ],
  },
  {
    id: 'catalogos',
    label: 'Catálogos',
    Icon: FiFileText,
    submenu: [
      { to: '/stock', label: 'Stock General', Icon: FiPackage },
      { to: '/product-management', label: 'Productos', Icon: FiPackage },
    ],
  },
  { to: '/reports', id: 'reports', label: 'Reportes', Icon: FiFileText },
  { to: '/vault', id: 'vault', label: 'Bóveda', Icon: FiSearch },
];

const adminNavItem: NavItem = {
  id: 'admin',
  to: '/admin',
  label: 'Administración',
  Icon: FiHome, // Assuming FiHome is the correct icon for admin
};

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);

  const toggleSubmenu = (id: string) => {
    setOpenSubmenus(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const isMenuActive = useCallback((item: NavItem) => {
    if (item.to && location.pathname === item.to) return true;
    if (item.submenu) {
      return item.submenu.some(subItem => location.pathname.startsWith(subItem.to));
    }
    return false;
  }, [location.pathname]);

  useEffect(() => {
    const activeParent = navItems.find(isMenuActive);
    if (activeParent && activeParent.submenu) {
      if (!openSubmenus.includes(activeParent.id)) {
        setOpenSubmenus(prev => [...prev, activeParent.id]);
      }
    }
  }, [location.pathname, isMenuActive, openSubmenus]);

  const handleLogout = () => {
    logout();
    addNotification({ type: 'success', message: 'Sesión cerrada exitosamente.' });
    navigate('/login');
  };

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${
      theme === 'dark' ? 'bg-slate-900 text-slate-300' : 'bg-slate-100 text-slate-700'
    }`}>
      {isSidebarOpen && window.innerWidth < 768 && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-30"
          />
        )}
      
      <aside
        style={{ width: isSidebarOpen ? (window.innerWidth < 768 ? '280px' : '260px') : '73px' }}
        className={`fixed md:relative top-0 left-0 h-full bg-slate-900/95 dark:bg-slate-800/80 backdrop-blur-xl border-r ${
          theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200/80'
        } z-40 flex flex-col shadow-2xl transition-all duration-300 ease-in-out`}
      >
        <div className="flex items-center justify-between h-20 px-4 shrink-0">
          {isSidebarOpen && (
              <img 
                src="/LogoStockITHoriz.png" 
                alt="StockIT" 
                className="h-10"
              />
            )}
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)} 
            className={`hidden md:flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
              isSidebarOpen 
                ? 'bg-slate-700/50 hover:bg-slate-600/50'
                : 'bg-transparent hover:bg-slate-700/50'
            }`}
          >
            {isSidebarOpen ? <FiX className="w-5 h-5 text-slate-400" /> : <FiMenu className="w-5 h-5 text-slate-400" />}
          </button>
        </div>

        <nav className="flex-1 px-4 pb-4 overflow-y-auto overflow-x-hidden">
          <ul className="space-y-2">
            {[...navItems, ...(user?.rol === 'admin' ? [adminNavItem] : [])].map(item => {
              const isActive = isMenuActive(item);
              const isSubmenuOpen = openSubmenus.includes(item.id);

              return (
                <li key={item.id}>
                  <div
                    className={`relative flex items-center justify-between p-2.5 rounded-xl transition-all duration-300 cursor-pointer group ${
                      isActive ? 'bg-gradient-to-r from-primary-500/10 to-secondary-500/10' : 'hover:bg-slate-700/50'
                    }`}
                    onClick={() => item.submenu ? toggleSubmenu(item.id) : (item.to && navigate(item.to))}
                  >
                    <div className="flex items-center gap-3">
                      <item.Icon className={`w-5 h-5 shrink-0 transition-colors duration-300 ${isActive ? 'text-primary-400' : 'text-slate-400 group-hover:text-slate-300'}`} />
                        {isSidebarOpen && (
                          <span 
                            className={`font-semibold text-sm whitespace-nowrap ${isActive ? 'text-slate-100' : 'text-slate-300 group-hover:text-slate-200'}`}
                          >
                            {item.label}
                          </span>
                        )}
                    </div>
                    {item.submenu && isSidebarOpen && (
                      <FiChevronDown
                        className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${
                          isSubmenuOpen ? 'rotate-180 text-slate-300' : ''
                        }`}
                      />
                    )}
                  </div>
                  {isSubmenuOpen && isSidebarOpen && item.submenu && (
                      <ul
                        className="overflow-hidden space-y-1 pl-4 mt-2"
                      >
                        {item.submenu.map(subItem => {
                          const isSubMenuActive = location.pathname.startsWith(subItem.to);
                          return (
                            <li key={subItem.to}>
                              <Link
                                to={subItem.to}
                                className={`flex items-center gap-3 py-2 px-3 rounded-lg transition-all duration-200 group relative ${
                                  isSubMenuActive ? 'text-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                                }`}
                              >
                                {isSubMenuActive && (
                                  <div 
                                    className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 rounded-r-full"
                                  />
                                )}
                                <subItem.Icon className={`w-4 h-4 shrink-0 ml-4 transition-colors duration-300 ${isSubMenuActive ? 'text-primary-400' : 'text-slate-500 group-hover:text-slate-400'}`} />
                                <span className="text-sm font-medium">{subItem.label}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-auto p-4 border-t border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary-500 to-secondary-500 flex items-center justify-center">
                <span className="text-lg font-bold text-white">{user?.nombre?.[0].toUpperCase()}</span>
              </div>
                {isSidebarOpen && (
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-slate-100 whitespace-nowrap">{user?.nombre}</p>
                    <p className="text-xs text-slate-400 whitespace-nowrap">{user?.rol}</p>
                  </div>
                )}
            </div>
              {isSidebarOpen && (
                <button 
                  onClick={handleLogout} 
                  className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg"
                  title="Cerrar sesión"
                >
                  <FiLogOut className="w-5 h-5" />
                </button>
              )}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between h-20 px-6 shrink-0 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-lg relative z-20">
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="md:hidden p-2 -ml-2">
            <FiMenu className="w-6 h-6" />
          </button>
          <div className="flex-1"></div>
          
          <div className="flex items-center gap-3">
            <button
              title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
              onClick={toggleTheme} 
              className="w-10 h-10 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/50 transition-colors"
            >
              {theme === 'dark' ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
            </button>
            <button
              title="Notificaciones"
              className="w-10 h-10 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/50 transition-colors relative"
            >
              <FiBell className="w-5 h-5" />
            </button>
            <button
              title="Configuración"
              className="w-10 h-10 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/50 transition-colors"
            >
              <FiSettings className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <AnimatedOrbsBackground>
            <Outlet />
          </AnimatedOrbsBackground>
        </main>
      </div>
    </div>
  );
};

export default MainLayout; 