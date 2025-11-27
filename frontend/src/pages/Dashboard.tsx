import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiBox, FiAlertCircle, FiShoppingCart,
  FiSearch, FiCheck, FiUser, FiClock
} from 'react-icons/fi';
import { 
  ResponsiveContainer, Tooltip as RechartsTooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell
} from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

// --- Interfaces ---
interface SystemStats {
  TotalItemsInventarioIndividual: number;
  ItemsDisponiblesInventarioIndividual: number;
  ItemsAsignadosInventarioIndividual: number;
  ItemsEnReparacionInventarioIndividual: number;
  ItemsBajaInventarioIndividual: number;
  TotalCategoriasActivas: number;
  TotalUsuariosActivos: number;
  TotalAsignacionesActivas: number;
}

interface StockAlert {
  ProductoID: number;
  Marca: string;
  Modelo: string;
  CategoriaNombre: string;
  CantidadActual: number;
  StockMinimo: number;
}

interface InventoryKPIs {
  lowStockPercentage: number;
  utilizationRate: number;
  avgRepairTime: number;
  healthScore?: number; // Nuevo KPI calculado
}

// --- Componentes UI Modernos ---

const GlassCard = ({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => {
  const { theme } = useTheme();
  return (
    <div 
      onClick={onClick}
      className={`
        relative overflow-visible rounded-3xl p-5 transition-all duration-300
        ${onClick ? 'cursor-pointer hover:scale-[1.01] hover:shadow-xl' : ''}
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

interface StatBadgeProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  colorClass: string;
}

const StatBadge = ({ icon: Icon, label, value, colorClass }: StatBadgeProps) => (
  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-500/5 border border-slate-500/10">
    <div className={`p-2 rounded-xl ${colorClass} bg-opacity-10`}>
      <Icon className={colorClass.replace('bg-', 'text-')} size={18} />
    </div>
    <div>
      <p className="text-xs font-medium opacity-60">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  </div>
);

const InfoTooltip = ({ text }: { text: string }) => {
  return (
    <div className="group relative inline-block ml-2">
      <div className="cursor-help opacity-50 hover:opacity-100 transition-opacity">
        <FiAlertCircle size={14} />
      </div>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none text-center">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
      </div>
    </div>
  );
};

const ProgressBar = ({ value, color, label, tooltip }: { value: number, color: string, label: string, tooltip?: string }) => {
  const { theme } = useTheme();
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center">
          <span className="font-medium opacity-80">{label}</span>
          {tooltip && <InfoTooltip text={tooltip} />}
        </div>
        <span className="font-bold">{value}%</span>
      </div>
      <div className={`h-3 w-full rounded-full overflow-hidden ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
        <div 
          className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};

const StockAlertRow = ({ alert }: { alert: StockAlert }) => {
  const { theme } = useTheme();
  const percentage = Math.min((alert.CantidadActual / alert.StockMinimo) * 100, 100);
  const isCritical = alert.CantidadActual === 0;

  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border ${theme === 'dark' ? 'border-slate-700/50 hover:bg-slate-800/50' : 'border-slate-100 hover:bg-slate-50'} transition-colors`}>
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isCritical ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
          <FiAlertCircle size={20} />
        </div>
        <div>
          <p className={`font-semibold text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
            {alert.Marca} {alert.Modelo}
          </p>
          <p className="text-xs text-slate-500">{alert.CategoriaNombre}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="w-24 hidden sm:block">
          <div className="flex justify-between text-[10px] mb-1 opacity-70">
            <span>Stock: {alert.CantidadActual}</span>
            <span>Min: {alert.StockMinimo}</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${isCritical ? 'bg-red-500' : 'bg-amber-500'}`} 
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
        <button className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-slate-700 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'}`}>
          <FiShoppingCart size={18} />
        </button>
      </div>
    </div>
  );
};

// --- Dashboard Principal ---

const Dashboard: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [kpis, setKpis] = useState<InventoryKPIs | null>(null);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, kpisRes, alertsRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/kpis'),
        api.get('/dashboard/alerts')
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (kpisRes.data.success) setKpis(kpisRes.data.data);
      if (alertsRes.data.success) setStockAlerts(alertsRes.data.data?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cálculos derivados
  const healthScore = stats ? Math.round(
    (1 - (stats.ItemsEnReparacionInventarioIndividual / stats.TotalItemsInventarioIndividual)) * 100
  ) : 100;

  const barData = [
    { name: 'Laptops', value: 45 },
    { name: 'Monitores', value: 32 },
    { name: 'Periféricos', value: 78 },
    { name: 'Celulares', value: 12 },
    { name: 'Otros', value: 25 },
  ]; // Mock data para ejemplo visual, idealmente vendría del backend

  if (loading) return <div className="flex h-96 items-center justify-center"><div className="animate-pulse text-indigo-500">Cargando Command Center...</div></div>;

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const subTextColor = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-5 pb-12">
      
      {/* 1. Header & Health Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Welcome Card */}
        <GlassCard className="col-span-1 lg:col-span-2 flex flex-col justify-center bg-gradient-to-r from-indigo-600/90 to-purple-600/90 !border-none !shadow-indigo-500/20 !p-5">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold backdrop-blur-md border border-white/20 uppercase tracking-wide">
                Command Center
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                  Hola, {user?.nombre?.split(' ')[0] || 'Admin'}
                </h1>
                <p className="text-indigo-100 text-sm sm:text-base max-w-md leading-relaxed">
                  Tu inventario opera al <span className="font-bold text-white">{healthScore}% de salud</span>. 
                  Hay {stats?.ItemsDisponiblesInventarioIndividual} equipos listos.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button 
                  onClick={() => navigate('/inventory')}
                  className="px-4 py-2 rounded-xl bg-white text-indigo-600 text-sm font-bold shadow-lg hover:bg-indigo-50 transition-colors flex items-center gap-2"
                >
                  <FiSearch size={16} /> Explorar
                </button>
                <button 
                  onClick={() => navigate('/assignments')}
                  className="px-4 py-2 rounded-xl bg-indigo-800/50 text-white text-sm font-semibold border border-indigo-400/30 hover:bg-indigo-800/70 transition-colors"
                >
                  Asignar
                </button>
              </div>
            </div>
          </div>
          
          {/* Decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-24 pointer-events-none"></div>
        </GlassCard>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 gap-4">
          <GlassCard className="flex-1 flex flex-col justify-center !p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <FiBox size={20} />
              </div>
              <span className="text-emerald-500 font-bold text-xs bg-emerald-500/10 px-2 py-1 rounded-lg">+12% mes</span>
            </div>
            <h3 className={`text-2xl font-bold ${textColor}`}>{stats?.TotalItemsInventarioIndividual}</h3>
            <p className={`text-xs ${subTextColor}`}>Total Activos Registrados</p>
          </GlassCard>

          <GlassCard className="flex-1 flex flex-col justify-center !p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                <FiCheck size={20} />
              </div>
              <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className={`w-6 h-6 rounded-full border-2 ${theme === 'dark' ? 'border-slate-800 bg-slate-700' : 'border-white bg-slate-200'} flex items-center justify-center text-[10px]`}>
                    <FiUser size={10} />
                  </div>
                ))}
              </div>
            </div>
            <h3 className={`text-2xl font-bold ${textColor}`}>{stats?.TotalAsignacionesActivas}</h3>
            <p className={`text-xs ${subTextColor}`}>Asignaciones Activas</p>
          </GlassCard>
        </div>
      </div>

      {/* 2. Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Stock Alerts Panel (4 cols) - Replaces Donut Chart */}
        <GlassCard className="lg:col-span-4 flex flex-col h-[450px]">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h3 className={`text-lg font-bold flex items-center gap-2 ${textColor}`}>
              <FiAlertCircle className="text-amber-500" /> Stock Crítico
            </h3>
            <span className="text-xs font-medium px-2 py-1 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
              {stockAlerts.length} Alertas
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
            {stockAlerts.length > 0 ? (
              stockAlerts.map((alert) => (
                <StockAlertRow key={alert.ProductoID} alert={alert} />
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 opacity-50">
                <FiCheck size={40} className="mb-2 text-emerald-500" />
                <p className="text-sm font-medium">Todo en orden</p>
                <p className="text-xs">No hay productos con stock bajo</p>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => navigate('/stock')}
            className="mt-4 w-full py-2 rounded-xl text-xs font-bold text-indigo-500 hover:bg-indigo-500/10 transition-colors border border-indigo-500/20"
          >
            Gestionar Inventario General
          </button>
        </GlassCard>

        {/* Main Metrics & Categories (8 cols) */}
        <div className="lg:col-span-8 grid grid-cols-1 gap-5">
          {/* KPI Bars */}
          <GlassCard>
            <h3 className={`text-lg font-bold mb-6 ${textColor}`}>Métricas de Eficiencia</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ProgressBar 
                label="Tasa de Utilización" 
                value={Math.round(kpis?.utilizationRate || 0)} 
                color="bg-gradient-to-r from-blue-500 to-indigo-600"
                tooltip="Porcentaje de equipos actualmente asignados a un usuario o ubicación vs total de equipos."
              />
              <ProgressBar 
                label="Índice de Salud" 
                value={healthScore} 
                color="bg-gradient-to-r from-emerald-500 to-teal-400"
                tooltip="Indicador general basado en la proporción de equipos operativos vs equipos dañados o en reparación."
              />
            </div>
            <div className="mt-8 grid grid-cols-3 gap-4">
               <StatBadge 
                  icon={FiCheck} 
                  label="Disponibles" 
                  value={stats?.ItemsDisponiblesInventarioIndividual || 0} 
                  colorClass="bg-emerald-500 text-emerald-500" 
               />
               <StatBadge 
                  icon={FiAlertCircle} 
                  label="Stock Crítico" 
                  value={`${Math.round(kpis?.lowStockPercentage || 0)}%`} 
                  colorClass="bg-red-500 text-red-500" 
               />
               <StatBadge 
                  icon={FiClock} 
                  label="Tiem. Reparación" 
                  value={`${kpis?.avgRepairTime?.toFixed(1) || 0}d`} 
                  colorClass="bg-amber-500 text-amber-500"
               />
            </div>
          </GlassCard>

          {/* Category Demand */}
          <GlassCard className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold ${textColor}`}>Categorías Más Populares</h3>
              <button 
                onClick={() => navigate('/reports')}
                className="text-xs text-indigo-500 font-medium hover:text-indigo-400 transition-colors"
              >
                Ver reporte completo
              </button>
            </div>
            <div className="flex-1 min-h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }} 
                    width={80}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartsTooltip
                    cursor={{ fill: theme === 'dark' ? '#334155' : '#f1f5f9', opacity: 0.4 }}
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#1e293b' : '#fff',
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                    {barData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'][index % 5]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
