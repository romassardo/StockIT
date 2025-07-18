import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiActivity, FiAlertCircle, FiBarChart2, FiClock, FiPlusCircle, 
  FiUserCheck, FiUserX, FiEdit3, FiTool, FiTrash2 
} from 'react-icons/fi';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import DataTable from '../components/common/DataTable';
import StatCard from '../components/common/StatCard';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';

// 📊 Interfaces para el tipado
interface SystemStats {
  TotalUsuariosActivos: number;
  TotalCategoriasActivas: number;
  TotalProductosDistintosActivos: number;
  TotalItemsInventarioIndividual: number;
  ItemsDisponiblesInventarioIndividual: number;
  ItemsAsignadosInventarioIndividual: number;
  ItemsEnReparacionInventarioIndividual: number;
  ItemsBajaInventarioIndividual: number;
  ProductosEnStockGeneralDistintos: number;
  TotalUnidadesStockGeneral: number;
  TotalAsignacionesActivas: number;
  TotalReparacionesActivas: number;
}

interface StockAlert {
  ProductoID: number;
  Marca: string;
  Modelo: string;
  Descripcion: string;
  CategoriaID: number;
  CategoriaNombre: string;
  CantidadActual: number;
  StockMinimo: number;
  Porcentaje: number;
}

interface RecentActivity {
  ID: number;
  UsuarioID: number;
  UsuarioNombre: string;
  TablaAfectada: string;
  Accion: string;
  RegistroID: number;
  Descripcion: string;
  FechaHora: string;
  IPAddress: string;
}

interface InventoryKPIs {
  lowStockPercentage: number;
  utilizationRate: number;
  avgRepairTime: number;
  rotationRate: number;
}

// 🎨 Tooltip personalizado para gráficos
const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800/90 backdrop-blur border border-slate-600/50 p-3 rounded-lg shadow-2xl">
        <p className="text-slate-200 font-semibold">{`${label}`}</p>
        <p className="text-primary-400">
          {`${payload[0].name}: ${payload[0].value}${payload[0].unit || ''}`}
        </p>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  // 📊 Estados del dashboard
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [kpis] = useState<InventoryKPIs>({
    lowStockPercentage: 15,
    utilizationRate: 78,
    avgRepairTime: 5.2,
    rotationRate: 2.3
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🎯 Cargar datos del dashboard
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar estadísticas principales
      try {
        const statsResponse = await api.get('/dashboard/stats');
        console.log('📊 Stats response:', statsResponse.data);
        if (statsResponse.data.success) {
          setStats(statsResponse.data.data);
        }
      } catch (statsError) {
        console.error('❌ Error cargando estadísticas:', statsError);
      }

      // Cargar alertas de stock
      try {
        const alertsResponse = await api.get('/dashboard/alerts');
        console.log('🚨 Alerts response:', alertsResponse.data);
        
        if (alertsResponse.data.success) {
          const alertsData = alertsResponse.data.data;
          if (Array.isArray(alertsData)) {
            setStockAlerts(alertsData.slice(0, 5));
          } else {
            console.warn('⚠️ Las alertas no son un array:', alertsData);
            setStockAlerts([]);
          }
        } else {
          console.warn('⚠️ Response no fue exitosa:', alertsResponse.data);
          setStockAlerts([]);
        }
      } catch (alertsError) {
        console.error('❌ Error cargando alertas:', alertsError);
        setStockAlerts([]);
      }

      // Cargar actividad reciente
      try {
        const activityResponse = await api.get('/dashboard/activity');
        console.log('🔄 Activity response:', activityResponse.data);
        
        if (activityResponse.data.success) {
          // Validación defensiva: verificar que data existe y es un array
          const activityData = activityResponse.data.data;
          if (Array.isArray(activityData)) {
            setRecentActivity(activityData);
          } else {
            console.warn('⚠️ La actividad no es un array:', activityData);
            setRecentActivity([]);
          }
        } else {
          console.warn('⚠️ Response no fue exitosa:', activityResponse.data);
          setRecentActivity([]);
        }
      } catch (activityError) {
        console.error('❌ Error cargando actividad:', activityError);
        setRecentActivity([]);
      }

    } catch (err: any) {
      console.error('❌ Error general cargando datos del dashboard:', err);
      setError('Error cargando datos del dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // 🎨 Función para obtener el color de porcentaje de stock
  const getStockPercentageColor = useCallback((percentage: number): string => {
    if (percentage <= 20) return '#EF4444'; // red-500
    if (percentage <= 50) return '#F59E0B'; // amber-500
    return '#10B981'; // emerald-500
  }, []);

  // 🎯 Función para formatear fecha
  const formatDate = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // 🎨 Función para obtener icono de actividad
  const getActivityIcon = useCallback((activity: RecentActivity) => {
    const iconMap: { [key: string]: JSX.Element } = {
      'CREATE': <FiPlusCircle className="text-success-500" />,
      'UPDATE': <FiEdit3 className="text-primary-500" />,
      'DELETE': <FiTrash2 className="text-danger-500" />,
      'ASSIGN': <FiUserCheck className="text-info-500" />,
      'RETURN': <FiUserX className="text-warning-500" />,
      'REPAIR': <FiTool className="text-secondary-500" />
    };
    
    return iconMap[activity.Accion] || <FiActivity className="text-slate-500" />;
  }, []);

  // 🎨 Función para formatear descripción de actividad
  const formatActivityDescription = useCallback((activity: RecentActivity) => {
    let description = activity.Descripcion;
    
    // Intentar parsear JSON si es necesario
    try {
      const parsed = JSON.parse(description);
      if (parsed.activa === "0" || parsed.activa === 0) {
        const fecha = parsed.fecha_devolucion ? 
          new Date(parsed.fecha_devolucion).toLocaleString('es-ES') : '';
        return `📤 Devolución de Asignación${fecha ? ` - devuelto el ${fecha}` : ''}`;
      }
      if (parsed.accion && parsed.accion.toLowerCase().includes('retorno de reparación')) {
        return `🔧 Retorno de Reparación - ${parsed.estado_reparacion}: ${parsed.solucion || ''}`;
      }
    } catch (e) {
      // Si no es JSON, usar la descripción tal como está
    }

    // Limpiar caracteres corruptos
    return description
      .replace(/Ã³/g, 'ó').replace(/Ã±/g, 'ñ').replace(/Ã¡/g, 'á')
      .replace(/Ã©/g, 'é').replace(/Ã­/g, 'í').replace(/Â/g, '')
      .substring(0, 100);
  }, []);

  // 📊 Datos para los gráficos KPI
  const kpisData = useMemo(() => {
    if (!kpis) return [];
    
    return [
      { 
        name: 'Stock Bajo', 
        value: kpis.lowStockPercentage,
        color: getStockPercentageColor(kpis.lowStockPercentage),
        unit: '%'
      },
      { 
        name: 'Utilización', 
        value: kpis.utilizationRate,
        color: '#6366F1',
        unit: '%'
      },
      { 
        name: 'Reparación', 
        value: kpis.avgRepairTime,
        color: '#8B5CF6',
        unit: ' días'
      }
    ];
  }, [kpis, getStockPercentageColor]);

  // 📊 Datos para el gráfico de dona de utilización
  const utilizationData = useMemo(() => {
    if (!stats) return [];

    const assigned = stats.ItemsAsignadosInventarioIndividual || 0;
    const available = stats.ItemsDisponiblesInventarioIndividual || 0;
    const total = assigned + available;

    if (total === 0) return [];

    const utilizationRate = Math.round((assigned / total) * 100);
    
    return [
      { name: 'Asignado', value: assigned, percentage: utilizationRate, color: '#6366F1' },
      { name: 'Disponible', value: available, percentage: 100 - utilizationRate, color: '#334155' }
    ];
  }, [stats]);

  // 📊 Columnas para la tabla de alertas de stock
  const stockAlertsColumns = useMemo(() => [
    {
      id: 'producto',
      header: 'Producto',
      accessor: (alert: StockAlert) => (
        <div className="flex flex-col">
          <span className="font-medium">{alert.Marca} {alert.Modelo}</span>
          <span className="text-xs text-slate-500">{alert.CategoriaNombre}</span>
        </div>
      ),
      width: '50%'
    },
    {
      id: 'stock',
      header: 'Stock',
      accessor: (alert: StockAlert) => (
        <div className="flex flex-col text-center">
          <span className="font-bold">{alert.CantidadActual}</span>
          <span className="text-xs text-slate-500">Min: {alert.StockMinimo}</span>
        </div>
      ),
      width: '25%'
    },
    {
      id: 'estado',
      header: 'Estado',
      accessor: (alert: StockAlert) => {
        const isZero = alert.CantidadActual === 0;
        const isLow = alert.CantidadActual <= alert.StockMinimo;
        
        return (
          <div className={`
            flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium
            ${isZero 
              ? 'bg-red-500/20 text-red-700 border border-red-500/30' 
              : isLow 
                ? 'bg-yellow-500/20 text-yellow-700 border border-yellow-500/30'
                : 'bg-green-500/20 text-green-700 border border-green-500/30'
            }
          `}>
            {isZero ? '❌ Sin Stock' : isLow ? '⚠️ Bajo' : '✅ OK'}
          </div>
        );
      },
      width: '25%'
    }
  ], []);

  // 📊 Columnas para la tabla de actividad reciente
  const activityColumns = useMemo(() => [
    {
      id: 'tipo',
      header: '',
      accessor: (activity: RecentActivity) => getActivityIcon(activity),
      width: '5%'
    },
    {
      id: 'descripcion',
      header: 'Descripción',
      accessor: (activity: RecentActivity) => (
        <div className="flex flex-col">
          <span className="font-medium">{activity.TablaAfectada}</span>
          <span className="text-xs text-slate-500">{formatActivityDescription(activity)}</span>
        </div>
      ),
      width: '50%'
    },
    {
      id: 'usuario',
      header: 'Usuario',
      accessor: (activity: RecentActivity) => (
        <span className="text-sm">{activity.UsuarioNombre || `Usuario ${activity.UsuarioID}`}</span>
      ),
      width: '25%'
    },
    {
      id: 'fecha',
      header: 'Fecha',
      accessor: (activity: RecentActivity) => (
        <span className="text-sm">{formatDate(activity.FechaHora)}</span>
      ),
      width: '20%'
    }
  ], [getActivityIcon, formatActivityDescription, formatDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <FiAlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error al cargar el dashboard</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button 
            onClick={loadDashboardData}
            className="btn-primary"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 📊 Header con título */}
      <div className="flex items-center space-x-4">
        <FiBarChart2 className="w-8 h-8 text-primary-500" strokeWidth={2.5} />
        <div>
          <h1 className="text-2xl md:text-5xl font-bold bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-500 bg-clip-text text-transparent">
            Dashboard
          </h1>
        </div>
      </div>

      {/* 📊 Estadísticas principales */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard
            title="Usuarios Activos"
            value={stats.TotalUsuariosActivos}
            icon={<FiUserCheck />}
            color="primary"
          />
          <StatCard
            title="Items Disponibles"
            value={stats.ItemsDisponiblesInventarioIndividual}
            icon={<FiActivity />}
            color="success"
          />
          <StatCard
            title="Items Asignados"
            value={stats.ItemsAsignadosInventarioIndividual}
            icon={<FiUserCheck />}
            color="info"
          />
          <StatCard
            title="En Reparación"
            value={stats.ItemsEnReparacionInventarioIndividual}
            icon={<FiTool />}
            color="warning"
          />
        </div>
      )}

      {/* 📊 Gráficos KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {utilizationData.length > 0 && (
          <div className="glass-card p-6 relative">
            <h2 className="text-xl font-bold mb-6">📊 Tasa de Utilización de Activos</h2>
            <div className="h-64 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={utilizationData}
                    cx="50%"
                    cy="50%"
                    innerRadius="70%"
                    outerRadius="100%"
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {utilizationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-bold text-slate-100">{utilizationData[0].percentage}%</span>
                <span className="text-sm text-slate-400">Utilización</span>
              </div>
            </div>
          </div>
        )}
        
        {/* 📊 Gráfico de Indicadores de Rendimiento */}
        {kpisData.length > 0 && (
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold mb-6">🚀 Indicadores de Rendimiento</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kpisData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tick={{ fill: theme === 'dark' ? '#cbd5e1' : '#475569' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }}/>
                  <Bar dataKey="value" barSize={30} radius={[0, 10, 10, 0]}>
                    {kpisData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* 🚨 Alertas y Actividad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ⚠️ Alertas de Stock */}
        <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gradient-warning">
                ⚠️ Alertas de Stock
              </h2>
              <div className={`
                px-3 py-1 rounded-full text-xs font-medium
                ${stockAlerts.length > 0 
                  ? 'bg-warning-500/20 text-warning-700 border border-warning-500/30' 
                  : 'bg-success-500/20 text-success-700 border border-success-500/30'
                }
                backdrop-blur-sm
              `}>
                {stockAlerts.length} alertas
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {stockAlerts.length > 0 ? (
              <DataTable
                columns={stockAlertsColumns}
                data={stockAlerts}
                keyExtractor={(alert) => `stock-alert-${alert.ProductoID}`}
                onRowClick={(alert) => navigate(`/stock?producto=${alert.ProductoID}`)}
                emptyMessage="No hay alertas de stock para mostrar"
              />
            ) : (
              <div className="text-center py-12 space-y-4">
                <div className="relative inline-block">
                  <FiAlertCircle className={`mx-auto h-16 w-16 ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`} />
                  <div className="absolute inset-0 h-16 w-16 bg-success-500/20 rounded-full blur-xl animate-pulse"></div>
                </div>
                <div>
                  <p className={`text-lg font-medium ${
                    theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
                  }`}>
                    ✅ Todo bajo control
                  </p>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    No hay alertas de stock críticas
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 🔄 Actividad Reciente */}
        <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gradient-info">
                🔄 Actividad Reciente
              </h2>
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-info-500/20 text-info-700 border border-info-500/30 backdrop-blur-sm">
                {recentActivity.length} actividades
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {recentActivity.length > 0 ? (
              <DataTable
                columns={activityColumns}
                data={recentActivity}
                keyExtractor={(activity) => `activity-${activity.ID}`}
                emptyMessage="No hay actividades recientes para mostrar"
              />
            ) : (
              <div className="text-center py-12 space-y-4">
                <div className="relative inline-block">
                  <FiClock className={`mx-auto h-16 w-16 ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`} />
                  <div className="absolute inset-0 h-16 w-16 bg-info-500/20 rounded-full blur-xl animate-pulse"></div>
                </div>
                <div>
                  <p className={`text-lg font-medium ${
                    theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
                  }`}>
                    🌅 Sistema en calma
                  </p>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    No hay actividades recientes registradas
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 💫 Footer del sistema */}
      <div className="glass-card p-4 relative z-10">
        <div className="flex items-center justify-between text-sm">
          <div className={`flex items-center space-x-4 ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
          }`}>
            <span>🚀 StockIT v2025.1</span>
            <span>•</span>
            <span>Última actualización: {new Date().toLocaleString('es-ES')}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
            <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Sistema operativo
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 