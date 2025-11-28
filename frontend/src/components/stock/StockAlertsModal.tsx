import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Package, RefreshCw, Search, ArrowRight } from 'lucide-react';
import { stockService, AlertaStock, AlertsResponse } from '../../services/stock.service';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import Modal from '../common/Modal';

interface StockAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const StockAlertsModal: React.FC<StockAlertsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { theme } = useTheme();
  const { addNotification } = useNotification();

  // Estados principales
  const [alertsData, setAlertsData] = useState<AlertsResponse>({
    alerts: [],
    summary: { total: 0, critical: 0, lowStock: 0 },
    categories: { critical: [], lowStock: [] }
  });
  const [loading, setLoading] = useState(false);

  // Estados de filtros
  const [showOnlyCritical, setShowOnlyCritical] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'low'>('all');

  // Cargar alertas
  const loadAlerts = async () => {
    try {
      setLoading(true);
      const response = await stockService.getLowStockAlerts(undefined, showOnlyCritical);
      setAlertsData(response);
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error de Conexión',
        message: 'No se pudieron cargar las alertas de stock'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAlerts();
    }
  }, [isOpen, showOnlyCritical]);

  // Filtrar alertas según búsqueda y tab activo
  const filteredAlerts = alertsData.alerts.filter(alert => {
    // Filtro de búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (!alert.nombre_producto.toLowerCase().includes(searchLower) &&
          !alert.nombre_marca.toLowerCase().includes(searchLower) &&
          !alert.nombre_categoria.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Filtro por tab
    if (activeTab === 'critical') {
      return alert.cantidad_actual === 0;
    } else if (activeTab === 'low') {
      return alert.cantidad_actual > 0 && alert.cantidad_actual <= alert.min_stock;
    }

    return true; // 'all'
  });

  // Función para obtener el estado de la alerta
  const getAlertLevel = (alert: AlertaStock) => {
    if (alert.cantidad_actual === 0) {
      return {
        level: 'critical',
        color: 'text-red-500',
        bg: theme === 'dark' ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-100',
        icon: AlertCircle,
        label: 'Sin Stock'
      };
    } else if (alert.cantidad_actual <= alert.min_stock) {
      return {
        level: 'warning',
        color: 'text-amber-500', 
        bg: theme === 'dark' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-100',
        icon: AlertTriangle,
        label: 'Stock Bajo'
      };
    }
    return {
      level: 'normal',
      color: 'text-emerald-500',
      bg: theme === 'dark' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100',
      icon: Package,
      label: 'Normal'
    };
  };

  // Formatear porcentaje con seguridad contra NaN
  const formatPercentage = (percentage: number) => {
    if (isNaN(percentage) || percentage === null || percentage === undefined) return '0%';
    return `${Math.round(percentage)}%`;
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Alertas de Stock" size="xl">
      <div className="p-6 space-y-6">
        
        {/* 1. KPI Cards Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`
            relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 hover:scale-[1.02]
            ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}
          `}>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <AlertCircle className="w-16 h-16 text-red-500" />
            </div>
            <div className="relative z-10">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sin Stock</p>
              <h3 className="text-3xl font-bold text-red-500 mt-1">{alertsData.summary.critical}</h3>
              <p className="text-xs text-red-500/80 font-medium mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Acción inmediata
              </p>
            </div>
          </div>

          <div className={`
            relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 hover:scale-[1.02]
            ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}
          `}>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <AlertTriangle className="w-16 h-16 text-amber-500" />
            </div>
            <div className="relative z-10">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Stock Bajo</p>
              <h3 className="text-3xl font-bold text-amber-500 mt-1">{alertsData.summary.lowStock}</h3>
              <p className="text-xs text-amber-500/80 font-medium mt-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Planificar reposición
              </p>
            </div>
          </div>

          <div className={`
            relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 hover:scale-[1.02]
            ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}
          `}>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Package className="w-16 h-16 text-indigo-500" />
            </div>
            <div className="relative z-10">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Alertas</p>
              <h3 className="text-3xl font-bold text-indigo-500 mt-1">{alertsData.summary.total}</h3>
              <p className="text-xs text-indigo-500/80 font-medium mt-2 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Actualizado ahora
              </p>
            </div>
          </div>
        </div>

        {/* 2. Filtros y Búsqueda */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className={`
            flex p-1 rounded-xl border
            ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}
          `}>
            {[
              { id: 'all', label: 'Todas' },
              { id: 'critical', label: 'Críticas' },
              { id: 'low', label: 'Stock Bajo' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200
                  ${activeTab === tab.id
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`
                w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none transition-all font-medium text-sm
                ${theme === 'dark' 
                  ? 'bg-slate-800 border-slate-700 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50' 
                  : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50'
                }
              `}
            />
          </div>
        </div>

        {/* 3. Lista de Alertas */}
        <div className={`
          rounded-2xl border overflow-hidden min-h-[300px] max-h-[400px] overflow-y-auto custom-scrollbar
          ${theme === 'dark' ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50/50 border-slate-200'}
        `}>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
              <p className="text-slate-500 font-medium">Analizando inventario...</p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-8">
              <div className={`p-4 rounded-full mb-4 ${theme === 'dark' ? 'bg-slate-800 text-slate-600' : 'bg-white text-slate-300 shadow-sm'}`}>
                <Package className="w-12 h-12" />
              </div>
              <h3 className={`text-lg font-bold mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                ¡Todo bajo control!
              </h3>
              <p className="text-slate-500 text-sm max-w-xs">
                No se encontraron alertas que coincidan con tus filtros actuales.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700/50">
              {filteredAlerts.map((alert) => {
                const alertLevel = getAlertLevel(alert);
                const Icon = alertLevel.icon;
                
                return (
                  <div 
                    key={alert.producto_id}
                    className={`
                      p-4 flex items-center justify-between group transition-colors
                      ${theme === 'dark' ? 'hover:bg-slate-800/50' : 'hover:bg-white'}
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center shrink-0
                        ${alertLevel.bg}
                      `}>
                        <Icon className={`w-6 h-6 ${alertLevel.color}`} />
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`font-bold text-base ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                            {alert.nombre_marca} {alert.nombre_producto}
                          </h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            alertLevel.level === 'critical' 
                              ? 'border-red-500/30 text-red-500 bg-red-500/10' 
                              : 'border-amber-500/30 text-amber-500 bg-amber-500/10'
                          }`}>
                            {alertLevel.label}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 font-medium mb-1">{alert.nombre_categoria}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            Mínimo: <span className="font-mono font-bold">{alert.min_stock}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            Faltante: <span className="font-mono font-bold">{alert.diferencia}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right pl-4">
                      <div className="mb-2">
                        <span className={`text-2xl font-bold font-mono ${alertLevel.color}`}>
                          {alert.cantidad_actual}
                        </span>
                        <span className="text-xs text-slate-500 font-medium ml-1">unid.</span>
                      </div>
                      
                      {/* Barra de Progreso Mini */}
                      <div className="w-32 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-1 ml-auto">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            alert.cantidad_actual === 0 ? 'bg-red-500' : 'bg-amber-500'
                          }`}
                          style={{ 
                            width: `${Math.min(100, Math.max(5, (alert.cantidad_actual / Math.max(alert.min_stock, 1)) * 100))}%` 
                          }}
                        />
                      </div>
                      <div className="text-[10px] font-medium text-slate-400">
                        {formatPercentage(alert.porcentaje_disponible)} disponible
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Footer Actions */}
      <div className="flex justify-end pt-6 border-t border-slate-200 dark:border-slate-700 mt-6">
        <button
          onClick={onClose}
          className={`
            px-6 py-2.5 rounded-xl text-sm font-bold transition-all
            ${theme === 'dark' 
              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }
          `}
        >
          Cerrar
        </button>
      </div>
    </Modal>
  );
};

export default StockAlertsModal;