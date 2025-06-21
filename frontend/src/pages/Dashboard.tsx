import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiPackage, FiShoppingCart, FiAlertCircle, FiClock, FiBarChart2, FiArrowUp, FiArrowDown, FiClipboard, FiRefreshCw, FiTool, FiEdit3, FiUser, FiTrendingUp } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import api from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { useTheme } from '../contexts/ThemeContext';
import DataTable from '../components/common/DataTable';
import Loading from '../components/common/Loading';
import StatCard from '../components/common/StatCard';

// Interfaces para los datos del dashboard
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

// 🎯 Componente Tooltip personalizado para forzar colores
const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  const { theme } = useTheme();
  
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        borderRadius: '12px',
        padding: '12px',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <p style={{ 
          color: theme === 'dark' ? '#F8FAFC' : '#0F172A',
          margin: 0,
          fontWeight: '500'
        }}>
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ 
            color: theme === 'dark' ? '#F8FAFC' : '#0F172A',
            margin: '4px 0 0 0',
            fontWeight: '600'
          }}>
            {`${entry.name}: ${entry.value}${entry.name === 'Porcentaje (%)' ? '%' : entry.dataKey === 'value' && label !== 'Utilización' ? ' equipos' : ''}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC = () => {
  const { addNotification } = useNotification();
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Estados para los datos del dashboard
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [kpis, setKPIs] = useState<InventoryKPIs | null>(null);

  // Función memoizada para cargar todos los datos del dashboard
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Obtener estadísticas generales
      const statsResponse = await api.get('/dashboard/stats');

      // Obtener alertas de stock
      const alertsResponse = await api.get('/dashboard/alerts');

      // Obtener actividad reciente
      const activityResponse = await api.get('/dashboard/activity', {
        params: { limit: 10 }
      });

      // Obtener KPIs de inventario
      const kpisResponse = await api.get('/dashboard/kpis');

      // Establecer todos los datos en los estados
      setStats(statsResponse.data.data);
      setStockAlerts(alertsResponse.data.data);
      setRecentActivity(activityResponse.data.data);
      setKPIs(kpisResponse.data.data);
    } catch (error: any) {
      console.error('❌ Error al cargar los datos del dashboard:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los datos del dashboard. ' + (error.response?.data?.message || error.message)
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  // Cargar los datos al montar el componente
  useEffect(() => {
    loadDashboardData();
    
    // Actualizar los datos cada 10 minutos (reducido de 5 minutos para mejor rendimiento)
    const interval = setInterval(loadDashboardData, 10 * 60 * 1000);
    return () => {
      clearInterval(interval);
    };
  }, [loadDashboardData]);

  // Preparar datos para gráficos - MEMOIZADOS para evitar re-renders constantes
  const inventoryStatusData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Disponibles', value: stats.ItemsDisponiblesInventarioIndividual, color: '#28A745' },
      { name: 'Asignados', value: stats.ItemsAsignadosInventarioIndividual, color: '#17A2B8' },
      { name: 'En Reparación', value: stats.ItemsEnReparacionInventarioIndividual, color: '#FFC107' },
      { name: 'Dados de Baja', value: stats.ItemsBajaInventarioIndividual, color: '#DC3545' }
    ];
  }, [stats]);

  // Preparar datos para el gráfico de barras de KPIs - MEMOIZADO
  const kpisData = useMemo(() => {
    if (!kpis) return [];
    return [
      { name: 'Stock Bajo', value: kpis.lowStockPercentage, color: '#FFC107' },
      { name: 'Utilización', value: kpis.utilizationRate, color: '#17A2B8' },
      { name: 'Rotación', value: kpis.rotationRate * 10, color: '#3F51B5' } // Multiplicamos por 10 para mejor visualización
    ];
  }, [kpis]);

  // Formato para fechas - memoizado
  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Determinar el icono y color para la actividad según su tipo - memoizado
  const getActivityIcon = useCallback((activity: RecentActivity) => {
    const actionType = activity.Accion.toLowerCase();
    const tableType = activity.TablaAfectada.toLowerCase();
    
    // Iconos específicos por tabla y acción
    if (tableType.includes('asignacion')) {
      if (actionType === 'insert') return <FiArrowUp className="text-success-500 w-4 h-4" />;
      if (actionType === 'update') return <FiRefreshCw className="text-info-500 w-4 h-4" />;
    } else if (tableType.includes('reparacion')) {
      return <FiTool className="text-warning-500 w-4 h-4" />;
    } else if (tableType.includes('inventarioindividual')) {
      if (actionType === 'insert') return <FiPackage className="text-success-500 w-4 h-4" />;
      if (actionType === 'update') return <FiEdit3 className="text-info-500 w-4 h-4" />;
    } else if (tableType.includes('usuario')) {
      return <FiUser className="text-info-500 w-4 h-4" />;
    } else if (tableType.includes('movimientosstock')) {
      if (actionType === 'insert') return <FiTrendingUp className="text-primary-500 w-4 h-4" />;
    }
    
    // Iconos por acción general
    if (actionType === 'insert') return <FiArrowUp className="text-success-500 w-4 h-4" />;
    if (actionType === 'update') return <FiClipboard className="text-info-500 w-4 h-4" />;
    if (actionType === 'delete') return <FiArrowDown className="text-danger-500 w-4 h-4" />;
    return <FiClock className="text-slate-400 w-4 h-4" />;
  }, []);

  // Determinar el color del porcentaje de stock - memoizado
  const getStockPercentageColor = useCallback((percentage: number): string => {
    if (percentage <= 25) return 'text-[#DC3545]';
    if (percentage <= 50) return 'text-[#FFC107]';
    if (percentage <= 75) return 'text-[#17A2B8]';
    return 'text-[#28A745]';
  }, []);

  // Función para formatear la descripción de actividad - agregar después de las otras funciones helper
  const formatActivityDescription = useCallback((activity: RecentActivity): { title: string; subtitle: string } => {
    let title = `${activity.TablaAfectada} - ${activity.Accion}`;
    let subtitle = activity.Descripcion;

    // Corregir problemas de codificación UTF-8 comunes
    subtitle = subtitle
      .replace(/ActualizaciÃ³n/g, 'Actualización')
      .replace(/creaciÃ³n/g, 'creación')
      .replace(/modificaciÃ³n/g, 'modificación')
      .replace(/AsignaciÃ³n/g, 'Asignación')
      .replace(/DevoluciÃ³n/g, 'Devolución')
      .replace(/ReparaciÃ³n/g, 'Reparación')
      .replace(/EnvÃ­o/g, 'Envío')
      .replace(/ubicaciÃ³n/g, 'ubicación')
      .replace(/estÃ¡/g, 'está')
      .replace(/soluciÃ³n/g, 'solución');

    // Intentar parsear si es JSON
    try {
      // Detectar si parece JSON (empieza con { y contiene :)
      if (subtitle.trim().startsWith('{') && subtitle.includes(':')) {
        const data = JSON.parse(subtitle);
        
        // Formatear según el tipo de actividad
        if (activity.TablaAfectada === 'Asignaciones') {
          if (activity.Accion === 'UPDATE' && (data.activa === '0' || data.activa === 0)) {
            title = '📤 Devolución de Asignación';
            if (data.fecha_devolucion) {
              const fecha = new Date(data.fecha_devolucion);
              subtitle = `Activo devuelto el ${fecha.toLocaleDateString()} a las ${fecha.toLocaleTimeString()}`;
            } else {
              subtitle = 'Asignación devuelta';
            }
          } else if (activity.Accion === 'INSERT') {
            title = '📥 Nueva Asignación';
            subtitle = 'Nuevo activo asignado a empleado';
          } else if (data.estado === 'Activa' || data.activa === 1) {
            title = '📥 Nueva Asignación';
            subtitle = `Activo asignado ${data.fecha_asignacion ? `el ${formatDate(data.fecha_asignacion)}` : 'recientemente'}`;
          }
        } else if (activity.TablaAfectada === 'Reparaciones') {
          if (activity.Accion === 'Retorno' && data.estado_reparacion) {
            title = '🔧 Retorno de Reparación';
            const estado = data.estado_reparacion === 'Reparado' ? '✅ Reparado' : '❌ Sin reparar';
            const solucion = data.solucion && data.solucion.trim() ? `: ${data.solucion}` : '';
            subtitle = `${estado}${solucion}`;
          } else if (activity.Accion === 'INSERT' && data.proveedor) {
            title = '🛠️ Nueva Reparación';
            const proveedor = data.proveedor ? ` a ${data.proveedor}` : '';
            const problema = data.problema ? `: ${data.problema}` : '';
            subtitle = `Enviado${proveedor}${problema}`;
          } else if (data.accion === 'Retorno de Reparación') {
            title = '🔧 Retorno de Reparación';
            const estado = data.estado_reparacion === 'Reparado' ? '✅ Reparado' : '❌ Sin reparar';
            const solucion = data.solucion && data.solucion.trim() ? `: ${data.solucion}` : '';
            subtitle = `${estado}${solucion}`;
          } else if (data.proveedor || data.problema) {
            title = '🛠️ Nueva Reparación';
            const proveedor = data.proveedor ? ` a ${data.proveedor}` : '';
            const problema = data.problema ? `: ${data.problema}` : '';
            subtitle = `Enviado${proveedor}${problema}`;
          }
        } else if (activity.TablaAfectada === 'InventarioIndividual') {
          if (data.inventario_individual_id && data.producto_id === 0) {
            title = '🔄 Cambio de Estado';
            subtitle = `Activo ID: ${data.inventario_individual_id} actualizado`;
          } else if (data.estado_nuevo) {
            title = `🔄 Cambio de Estado`;
            subtitle = `De "${data.estado_anterior || 'N/A'}" a "${data.estado_nuevo}"`;
          } else if (data.numero_serie) {
            title = '📦 Nuevo Activo';
            subtitle = `Serie: ${data.numero_serie}`;
          }
        } else if (activity.TablaAfectada === 'Usuarios') {
          title = '👤 Actualización de Usuario';
          if (data.nombre || data.email) {
            subtitle = `Actualizado: ${[data.nombre, data.email].filter(Boolean).join(', ')}`;
          }
        } else if (activity.TablaAfectada === 'MovimientosStock') {
          if (data.tipo_movimiento === 'Entrada') {
            title = '📈 Entrada de Stock';
            subtitle = `+${data.cantidad || 'N/A'} unidades`;
          } else if (data.tipo_movimiento === 'Salida') {
            title = '📉 Salida de Stock';
            subtitle = `-${data.cantidad || 'N/A'} unidades`;
          }
        } else {
          // Formateo genérico para otros JSON no reconocidos
          const entries = Object.entries(data);
          if (entries.length <= 2) {
            subtitle = entries.map(([key, value]) => `${key}: ${value}`).join(', ');
          } else {
            subtitle = `${entries.length} campos modificados`;
          }
        }
      }
    } catch (error) {
      // Si no es JSON válido, usar la descripción tal como está (ya corregida la codificación)
      console.debug('Descripción no es JSON válido:', subtitle);
    }

    // Limpiar texto adicional si es muy largo
    if (subtitle.length > 100) {
      subtitle = subtitle.substring(0, 100) + '...';
    }

    return { title, subtitle };
  }, [formatDate]);

  // Columnas para la tabla de alertas de stock - memoizadas
  const stockAlertsColumns = useMemo(() => [
    {
      id: 'producto',
      header: 'Producto',
      accessor: (alert: StockAlert) => (
        <div className="flex flex-col">
          <span className="font-medium">{alert.Marca} {alert.Modelo}</span>
          <span className="text-xs text-[#6C757D]">{alert.CategoriaNombre}</span>
        </div>
      ),
      width: '40%'
    },
    {
      id: 'stock',
      header: 'Stock Actual',
      accessor: (alert: StockAlert) => (
        <span className="font-medium">{alert.CantidadActual}</span>
      ),
      width: '15%'
    },
    {
      id: 'minimo',
      header: 'Mínimo',
      accessor: (alert: StockAlert) => (
        <span className="font-medium">{alert.StockMinimo}</span>
      ),
      width: '15%'
    },
    {
      id: 'porcentaje',
      header: 'Estado',
      accessor: (alert: StockAlert) => {
        // 🎯 Estados claros y descriptivos
        const getEstadoStock = () => {
          if (alert.CantidadActual === 0) {
            return {
              label: 'Sin Stock',
              detalle: `0/${alert.StockMinimo}`,
              color: 'text-danger-600',
              bgColor: 'bg-danger-500/10 border-danger-500/20',
              icon: '❌'
            };
          } else if (alert.CantidadActual <= alert.StockMinimo) {
            return {
              label: 'Bajo Mínimo', 
              detalle: `${alert.CantidadActual}/${alert.StockMinimo}`,
              color: 'text-warning-600',
              bgColor: 'bg-warning-500/10 border-warning-500/20',
              icon: '⚠️'
            };
          } else {
            return {
              label: 'En Mínimo',
              detalle: `${alert.CantidadActual}/${alert.StockMinimo}`,
              color: 'text-success-600',
              bgColor: 'bg-success-500/10 border-success-500/20',
              icon: '✅'
            };
          }
        };

        const estado = getEstadoStock();

        return (
          <div className={`
            flex items-center justify-between p-2 rounded-lg border
            ${estado.bgColor}
            transition-all duration-200
          `}>
            <div className="flex items-center space-x-2">
              <span className="text-sm">{estado.icon}</span>
              <div className="flex flex-col">
                <span className={`font-medium text-sm ${estado.color}`}>
                  {estado.label}
                </span>
                <span className="text-xs opacity-75">
                  {estado.detalle}
                </span>
              </div>
            </div>
          </div>
        );
      },
      width: '30%'
    }
  ], [getStockPercentageColor]);

  // Columnas para la tabla de actividad reciente - memoizadas - MODIFICAR la definición existente
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
      accessor: (activity: RecentActivity) => {
        const formatted = formatActivityDescription(activity);
        return (
          <div className="flex flex-col">
            <span className="font-medium text-slate-200">{formatted.title}</span>
            <span className="text-xs text-slate-400 mt-1">{formatted.subtitle}</span>
          </div>
        );
      },
      width: '60%'
    },
    {
      id: 'usuario',
      header: 'Usuario',
      accessor: (activity: RecentActivity) => (
        <span className="text-slate-300">{activity.UsuarioNombre || 'Usuario ' + activity.UsuarioID}</span>
      ),
      width: '15%'
    },
    {
      id: 'fecha',
      header: 'Fecha',
      accessor: (activity: RecentActivity) => (
        <span className="text-slate-300">{formatDate(activity.FechaHora)}</span>
      ),
      width: '20%'
    }
  ], [getActivityIcon, formatActivityDescription, formatDate]);

  if (loading) {
    return <Loading />;
  }
  


  return (
    <div className={`relative w-full min-h-screen overflow-hidden transition-all duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200'
    }`}>
      
      {/* 🌌 Fondo moderno con partículas animadas */}
      <div className={`fixed inset-0 pointer-events-none transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95' 
          : 'bg-gradient-to-br from-slate-50/95 via-slate-100/90 to-slate-200/95'
      }`}>
        <div className={`absolute top-20 left-10 w-32 h-32 rounded-full blur-xl animate-float transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-primary-500/20' 
            : 'bg-primary-500/10'
        }`}></div>
        <div className={`absolute top-40 right-20 w-24 h-24 rounded-full blur-lg animate-float transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-secondary-500/20' 
            : 'bg-secondary-500/10'
        }`} style={{animationDelay: '2s'}}></div>
        <div className={`absolute bottom-32 left-1/4 w-20 h-20 rounded-full blur-lg animate-float transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-success-500/20' 
            : 'bg-success-500/10'
        }`} style={{animationDelay: '4s'}}></div>
        <div className={`absolute bottom-20 right-1/3 w-28 h-28 rounded-full blur-xl animate-float transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-info-500/20' 
            : 'bg-info-500/10'
        }`} style={{animationDelay: '1s'}}></div>
      </div>

      {/* 📊 Contenido principal con glassmorphism */}
      <div className="relative z-10 p-6 space-y-8">
        
        {/* ✨ Cabecera moderna */}
        <div className="glass-card p-6 flex flex-col md:flex-row md:justify-between md:items-center">
          {/* 🎯 HEADER ESTÁNDAR MODERN DESIGN SYSTEM 2025 */}
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <FiBarChart2 className="w-8 h-8 text-primary-500" strokeWidth={2.5} />
            <div>
              <h1 className="text-2xl md:text-5xl font-bold bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-500 bg-clip-text text-transparent">
                Panel de Control
              </h1>
              <p className={`text-lg transition-colors duration-300 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
              }`}>
                StockIT - Sistema de Inventario Moderno
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* 🔄 Botón actualizar con glassmorphism */}
            <button 
              onClick={loadDashboardData}
              className="btn-glass-secondary group flex items-center space-x-2"
            >
              <FiBarChart2 className="w-5 h-5 transition-transform group-hover:rotate-12" strokeWidth={2.5} /> 
              <span>Actualizar Datos</span>
            </button>
            
            {/* 💫 Indicador de estado */}
            <div className={`
              px-3 py-1.5 rounded-full text-xs font-medium
              ${loading 
                ? 'bg-warning-500/20 text-warning-700 border border-warning-500/30' 
                : 'bg-success-500/20 text-success-700 border border-success-500/30'
              }
              backdrop-blur-sm animate-pulse-glow
            `}>
              {loading ? '🔄 Cargando...' : '✅ Datos actualizados'}
            </div>
          </div>
        </div>

        {/* 📊 Tarjetas de Estadísticas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="👥 Usuarios Activos"
            value={stats?.TotalUsuariosActivos || 0} 
            icon={<FiUsers className="h-6 w-6" />}
            color="primary"
            subValue="Total de usuarios en sistema"
            trend="up"
            trendValue="+5.2% este mes"
          />
          <StatCard 
            title="💻 Equipos Gestionados"
            value={stats?.TotalItemsInventarioIndividual || 0} 
            icon={<FiPackage className="h-6 w-6" />}
            color="info"
            subValue={`${stats?.ItemsAsignadosInventarioIndividual || 0} equipos asignados`}
            trend="neutral"
            trendValue="Sin cambios"
          />
          <StatCard 
            title="📦 Stock Disponible"
            value={stats?.TotalUnidadesStockGeneral || 0} 
            icon={<FiShoppingCart className="h-6 w-6" />}
            color="success"
            subValue={`${stats?.ProductosEnStockGeneralDistintos || 0} productos únicos`}
            trend="up"
            trendValue="+12.8% stock"
          />
          <StatCard 
            title="⚠️ Alertas de Stock"
            value={stockAlerts?.length || 0} 
            icon={<FiAlertCircle className="h-6 w-6" />}
            color="warning"
            subValue="Productos bajo stock mínimo"
            trend={stockAlerts?.length > 5 ? "down" : "up"}
            trendValue={stockAlerts?.length > 5 ? "Crítico" : "Bajo control"}
          />
        </div>

        {/* 📈 Gráficos y Análisis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 🥧 Gráfico de estado de inventario con glassmorphism */}
          <div className="chart-glass">
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold text-gradient-primary`}>
                📊 Estado del Inventario
              </h2>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
                <span className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                  En tiempo real
                </span>
              </div>
            </div>
            
            <div className="h-80 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={inventoryStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {inventoryStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 📊 Gráfico de KPIs con efectos modernos */}
          <div className="chart-glass">
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold text-gradient-secondary`}>
                📈 Métricas de Rendimiento
              </h2>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-info-500 rounded-full animate-pulse"></div>
                <span className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                  KPIs actualizados
                </span>
              </div>
            </div>
            
            <div className="h-80 relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={kpisData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke={theme === 'dark' ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.3)'} 
                  />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: theme === 'dark' ? '#CBD5E1' : '#475569', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: theme === 'dark' ? '#CBD5E1' : '#475569', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="value" name="Porcentaje (%)" radius={[4, 4, 0, 0]}>
                    {kpisData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* 📊 Métricas adicionales con glassmorphism */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="glass-card p-4 text-center hover-lift">
                <p className={`text-xs font-medium mb-1 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  ⏱️ Tiempo Reparación
                </p>
                <p style={{ 
                  color: theme === 'dark' ? '#FFFFFF !important' : '#000000 !important',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  textShadow: theme === 'dark' ? '0 0 10px rgba(255,255,255,0.8)' : 'none',
                  WebkitTextFillColor: theme === 'dark' ? '#FFFFFF' : '#000000',
                  WebkitTextStroke: theme === 'dark' ? '0.5px rgba(255,255,255,0.3)' : 'none'
                }}>
                  {kpis?.avgRepairTime || 0} días
                </p>
              </div>
              <div className="glass-card p-4 text-center hover-lift">
                <p className={`text-xs font-medium mb-1 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  💻 Utilización
                </p>
                <p style={{ 
                  color: theme === 'dark' ? '#FFFFFF !important' : '#000000 !important',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  textShadow: theme === 'dark' ? '0 0 10px rgba(255,255,255,0.8)' : 'none',
                  WebkitTextFillColor: theme === 'dark' ? '#FFFFFF' : '#000000',
                  WebkitTextStroke: theme === 'dark' ? '0.5px rgba(255,255,255,0.3)' : 'none'
                }}>
                  {kpis?.utilizationRate || 0}%
                </p>
              </div>
              <div className="glass-card p-4 text-center hover-lift">
                <p className={`text-xs font-medium mb-1 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  🔄 Rotación
                </p>
                <p style={{ 
                  color: theme === 'dark' ? '#FFFFFF !important' : '#000000 !important',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  textShadow: theme === 'dark' ? '0 0 10px rgba(255,255,255,0.8)' : 'none',
                  WebkitTextFillColor: theme === 'dark' ? '#FFFFFF' : '#000000',
                  WebkitTextStroke: theme === 'dark' ? '0.5px rgba(255,255,255,0.3)' : 'none'
                }}>
                  {kpis?.rotationRate ? kpis.rotationRate.toFixed(1) : 0}/día
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 🚨 Alertas y Actividad Reciente */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* ⚠️ Alertas de Stock con diseño moderno */}
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h2 className={`text-xl font-bold text-gradient-warning`}>
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
                  onRowClick={(alert) => navigate(`/stock-general?producto=${alert.ProductoID}`)}
                  emptyMessage="No hay alertas de stock para mostrar"
                />
              ) : (
                <div className="text-center py-12 space-y-4">
                  <div className="relative inline-block">
                    <FiAlertCircle className={`mx-auto h-16 w-16 transition-colors duration-300 ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`} />
                    <div className="absolute inset-0 h-16 w-16 bg-success-500/20 rounded-full blur-xl animate-pulse"></div>
                  </div>
                  <div>
                    <p className={`text-lg font-medium transition-colors duration-300 ${
                      theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
                    }`}>
                      ✅ Todo bajo control
                    </p>
                    <p className={`text-sm transition-colors duration-300 ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      No hay alertas de stock críticas
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 🔄 Actividad Reciente con glassmorphism */}
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h2 className={`text-xl font-bold text-gradient-info`}>
                  🔄 Actividad Reciente
                </h2>
                <div className={`
                  px-3 py-1 rounded-full text-xs font-medium
                  bg-info-500/20 text-info-700 border border-info-500/30
                  backdrop-blur-sm
                `}>
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
                    <FiClock className={`mx-auto h-16 w-16 transition-colors duration-300 ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`} />
                    <div className="absolute inset-0 h-16 w-16 bg-info-500/20 rounded-full blur-xl animate-pulse"></div>
                  </div>
                  <div>
                    <p className={`text-lg font-medium transition-colors duration-300 ${
                      theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
                    }`}>
                      🌅 Sistema en calma
                    </p>
                    <p className={`text-sm transition-colors duration-300 ${
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
        
        {/* 💫 Footer con información del sistema */}
        <div className="glass-card p-4">
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
    </div>
  );
};

export default Dashboard;