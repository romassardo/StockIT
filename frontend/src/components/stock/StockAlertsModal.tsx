import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, AlertCircle, Package, RefreshCw, Filter, Search } from 'lucide-react';
import { stockService, AlertaStock, AlertsResponse } from '../../services/stock.service';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';

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
        color: 'text-danger-600',
        bg: theme === 'dark' ? 'bg-danger-900/20 border-danger-500/30' : 'bg-danger-50 border-danger-200',
        icon: AlertCircle,
        label: 'Sin Stock'
      };
    } else if (alert.cantidad_actual <= alert.min_stock) {
      return {
        level: 'warning',
        color: 'text-warning-600', 
        bg: theme === 'dark' ? 'bg-warning-900/20 border-warning-500/30' : 'bg-warning-50 border-warning-200',
        icon: AlertTriangle,
        label: 'Stock Bajo'
      };
    }
    return {
      level: 'normal',
      color: 'text-success-600',
      bg: theme === 'dark' ? 'bg-success-900/20 border-success-500/30' : 'bg-success-50 border-success-200',
      icon: Package,
      label: 'Normal'
    };
  };

  // Formatear porcentaje
  const formatPercentage = (percentage: number) => {
    return `${Math.round(percentage)}%`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      {/* 🌌 ORBES DE FONDO OBLIGATORIOS */}
      <div className={`fixed inset-0 pointer-events-none transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95' 
          : 'bg-gradient-to-br from-slate-50/95 via-slate-100/90 to-slate-200/95'
      }`}>
        {/* Orbe 1: Top-left - Primary */}
        <div className={`absolute top-20 left-10 w-32 h-32 rounded-full blur-xl animate-float transition-all duration-300 ${
          theme === 'dark' ? 'bg-primary-500/20' : 'bg-primary-500/10'
        }`}></div>
        
        {/* Orbe 2: Top-right - Secondary */}
        <div className={`absolute top-40 right-20 w-24 h-24 rounded-full blur-lg animate-float transition-all duration-300 ${
          theme === 'dark' ? 'bg-secondary-500/20' : 'bg-secondary-500/10'
        }`} style={{animationDelay: '2s'}}></div>
        
        {/* Orbe 3: Bottom-left - Success */}
        <div className={`absolute bottom-32 left-1/4 w-20 h-20 rounded-full blur-lg animate-float transition-all duration-300 ${
          theme === 'dark' ? 'bg-success-500/20' : 'bg-success-500/10'
        }`} style={{animationDelay: '4s'}}></div>
        
        {/* Orbe 4: Bottom-right - Info */}
        <div className={`absolute bottom-20 right-1/3 w-28 h-28 rounded-full blur-xl animate-float transition-all duration-300 ${
          theme === 'dark' ? 'bg-info-500/20' : 'bg-info-500/10'
        }`} style={{animationDelay: '1s'}}></div>
      </div>

      <div className={`
        w-full max-w-5xl max-h-[90vh] overflow-hidden
        backdrop-filter backdrop-blur-20 border border-white/20
        ${theme === 'dark' 
          ? 'bg-slate-800/90 text-slate-100' 
          : 'bg-white/90 text-slate-900'
        }
        rounded-3xl shadow-glass animate-glassAppear
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-warning-500 to-danger-500">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-warning-500 to-danger-500 bg-clip-text text-transparent">
                Alertas de Stock
              </h2>
              <p className="text-sm opacity-75">
                {alertsData.summary.total} productos requieren atención
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={loadAlerts}
              disabled={loading}
              className={`
                p-2 rounded-xl transition-all duration-200 hover:scale-105
                ${theme === 'dark' 
                  ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50' 
                  : 'bg-slate-100/50 text-slate-600 hover:bg-slate-200/50'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={onClose}
              className={`
                p-2 rounded-xl transition-all duration-200 hover:scale-105
                ${theme === 'dark' 
                  ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50' 
                  : 'bg-slate-100/50 text-slate-600 hover:bg-slate-200/50'
                }
              `}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Resumen de alertas */}
        <div className={`
          p-4 border-b border-white/10
          ${theme === 'dark' ? 'bg-slate-900/30' : 'bg-slate-50/30'}
        `}>
          <div className="grid grid-cols-3 gap-4">
            <div className={`
              p-4 rounded-2xl border backdrop-filter backdrop-blur-10
              ${theme === 'dark' 
                ? 'bg-danger-900/20 border-danger-500/30' 
                : 'bg-danger-50 border-danger-200'
              }
            `}>
              <div className="text-center">
                <div className="text-2xl font-bold text-danger-600 mb-1">
                  {alertsData.summary.critical}
                </div>
                <div className="text-sm font-medium text-danger-600">Sin Stock</div>
              </div>
            </div>
            
            <div className={`
              p-4 rounded-2xl border backdrop-filter backdrop-blur-10
              ${theme === 'dark' 
                ? 'bg-warning-900/20 border-warning-500/30' 
                : 'bg-warning-50 border-warning-200'
              }
            `}>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning-600 mb-1">
                  {alertsData.summary.lowStock}
                </div>
                <div className="text-sm font-medium text-warning-600">Stock Bajo</div>
              </div>
            </div>
            
            <div className={`
              p-4 rounded-2xl border backdrop-filter backdrop-blur-10
              ${theme === 'dark' 
                ? 'bg-primary-900/20 border-primary-500/30' 
                : 'bg-primary-50 border-primary-200'
              }
            `}>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 mb-1">
                  {alertsData.summary.total}
                </div>
                <div className="text-sm font-medium text-primary-600">Total Alertas</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros y tabs */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            {/* Tabs */}
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('all')}
                className={`
                  px-4 py-2 rounded-xl font-medium transition-all duration-200
                  ${activeTab === 'all'
                    ? 'bg-primary-500 text-white shadow-primary'
                    : theme === 'dark'
                      ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                      : 'bg-slate-100/50 text-slate-600 hover:bg-slate-200/50'
                  }
                `}
              >
                Todas ({alertsData.summary.total})
              </button>
              <button
                onClick={() => setActiveTab('critical')}
                className={`
                  px-4 py-2 rounded-xl font-medium transition-all duration-200
                  ${activeTab === 'critical'
                    ? 'bg-danger-500 text-white shadow-danger'
                    : theme === 'dark'
                      ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                      : 'bg-slate-100/50 text-slate-600 hover:bg-slate-200/50'
                  }
                `}
              >
                Críticas ({alertsData.summary.critical})
              </button>
              <button
                onClick={() => setActiveTab('low')}
                className={`
                  px-4 py-2 rounded-xl font-medium transition-all duration-200
                  ${activeTab === 'low'
                    ? 'bg-warning-500 text-white shadow-warning'
                    : theme === 'dark'
                      ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                      : 'bg-slate-100/50 text-slate-600 hover:bg-slate-200/50'
                  }
                `}
              >
                Stock Bajo ({alertsData.summary.lowStock})
              </button>
            </div>

            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`
                  pl-10 pr-4 py-2 rounded-xl border border-white/20
                  backdrop-filter backdrop-blur-10 w-64
                  ${theme === 'dark' 
                    ? 'bg-slate-800/50 text-slate-100' 
                    : 'bg-white/50 text-slate-900'
                  }
                  focus:ring-2 focus:ring-primary-500 focus:border-transparent
                `}
              />
            </div>
          </div>
        </div>

        {/* Lista de alertas */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              <span className="ml-3">Cargando alertas...</span>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-16 h-16 mx-auto opacity-50 mb-4" />
              <p className="text-lg font-medium opacity-75">
                {searchTerm 
                  ? 'No se encontraron productos que coincidan con la búsqueda'
                  : activeTab === 'all'
                    ? '¡Excelente! No hay alertas de stock'
                    : activeTab === 'critical'
                      ? 'No hay productos sin stock'
                      : 'No hay productos con stock bajo'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map((alert) => {
                const alertLevel = getAlertLevel(alert);
                const Icon = alertLevel.icon;
                
                return (
                  <div
                    key={alert.producto_id}
                    className={`
                      p-4 rounded-2xl border backdrop-filter backdrop-blur-10 ${alertLevel.bg}
                      hover:scale-[1.02] transition-all duration-200
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`
                          p-2 rounded-xl 
                          ${alert.cantidad_actual === 0 
                            ? 'bg-danger-500/20 text-danger-600' 
                            : 'bg-warning-500/20 text-warning-600'
                          }
                        `}>
                          <Icon className="w-5 h-5" />
                        </div>
                        
                        <div>
                          <h4 className="font-semibold">
                            {alert.nombre_marca} {alert.nombre_producto}
                          </h4>
                          <p className="text-sm opacity-75">{alert.nombre_categoria}</p>
                          <div className="flex items-center space-x-4 text-xs opacity-50 mt-1">
                            <span>Stock Mínimo: {alert.min_stock}</span>
                            <span>Diferencia: {alert.diferencia}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${alertLevel.color} mb-1`}>
                          {alert.cantidad_actual}
                        </div>
                        <div className={`text-sm font-medium ${alertLevel.color} mb-1`}>
                          {alertLevel.label}
                        </div>
                        {alert.cantidad_actual > 0 && (
                          <div className="text-xs opacity-50">
                            {formatPercentage(alert.porcentaje_disponible)} del mínimo
                          </div>
                        )}
                        
                        {/* Barra de progreso */}
                        <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              alert.cantidad_actual === 0 
                                ? 'bg-danger-500' 
                                : alert.cantidad_actual <= alert.min_stock
                                  ? 'bg-warning-500'
                                  : 'bg-success-500'
                            }`}
                            style={{ 
                              width: `${Math.min(100, Math.max(0, (alert.cantidad_actual / Math.max(alert.min_stock, 1)) * 100))}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer con resumen */}
        {filteredAlerts.length > 0 && (
          <div className="flex items-center justify-between p-6 border-t border-white/10">
            <div className="text-sm opacity-75">
              Mostrando {filteredAlerts.length} de {alertsData.summary.total} alertas
              {searchTerm && ` para "${searchTerm}"`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockAlertsModal; 