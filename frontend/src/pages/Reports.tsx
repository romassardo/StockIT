import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  AlertTriangle, 
  Users, 
  ClipboardList, 
  Package, 
  Truck, 
  List, 
  ArrowRight,
  BarChart3
} from 'lucide-react';
import { getStockAlertsCount } from '../services/report.service';
import { useNotification } from '../contexts/NotificationContext';
import { useTheme } from '../contexts/ThemeContext';

// --- Componentes UI Estilizados ---

const GlassCard = ({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => {
  const { theme } = useTheme();
  return (
    <div 
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl transition-all duration-300 h-full
        ${onClick ? 'cursor-pointer hover:scale-[1.02] hover:shadow-lg' : ''}
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

interface ReportCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  to: string;
  count?: number;
  color: 'indigo' | 'emerald' | 'amber' | 'red' | 'blue' | 'purple';
  disabled?: boolean;
}

const ReportCard: React.FC<ReportCardProps> = ({ icon: Icon, title, description, to, count, color, disabled = false }) => {
  const { addNotification } = useNotification();
  const { theme } = useTheme();

  const colorStyles = {
    indigo: {
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-500',
      border: 'border-indigo-500/20',
      hover: 'group-hover:border-indigo-500/50'
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-500',
      border: 'border-emerald-500/20',
      hover: 'group-hover:border-emerald-500/50'
    },
    amber: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-500',
      border: 'border-amber-500/20',
      hover: 'group-hover:border-amber-500/50'
    },
    red: {
      bg: 'bg-red-500/10',
      text: 'text-red-500',
      border: 'border-red-500/20',
      hover: 'group-hover:border-red-500/50'
    },
    blue: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-500',
      border: 'border-blue-500/20',
      hover: 'group-hover:border-blue-500/50'
    },
    purple: {
      bg: 'bg-purple-500/10',
      text: 'text-purple-500',
      border: 'border-purple-500/20',
      hover: 'group-hover:border-purple-500/50'
    }
  };

  const styles = colorStyles[color];

  const content = (
    <GlassCard className={`p-6 flex flex-col justify-between group border-2 border-transparent ${styles.hover}`}>
      <div>
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${styles.bg} ${styles.text} transition-transform group-hover:scale-110 duration-300`}>
            <Icon size={24} strokeWidth={2} />
          </div>
          {count !== undefined && (
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${styles.bg} ${styles.text} border ${styles.border}`}>
              {count}
            </span>
          )}
        </div>
        
        <h3 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>
          {title}
        </h3>
        <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          {description}
        </p>
      </div>

      <div className={`mt-6 flex items-center text-sm font-bold ${styles.text} opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0`}>
        Ver Reporte <ArrowRight size={16} className="ml-2" />
      </div>
    </GlassCard>
  );

  if (disabled) {
    return (
      <div onClick={() => addNotification({ message: 'Funcionalidad en desarrollo', type: 'info' })} className="h-full block">
        {content}
      </div>
    );
  }

  return (
    <Link to={to} className="h-full block outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-2xl">
      {content}
    </Link>
  );
};

const ReportsPage = () => {
  const { theme } = useTheme();
  const [stockAlertsCount, setStockAlertsCount] = useState<number | undefined>();

  useEffect(() => {
    const fetchAlertsCount = async () => {
      try {
        const count = await getStockAlertsCount();
        setStockAlertsCount(count);
      } catch (error) {
        console.error('Error al obtener count de alertas:', error);
        setStockAlertsCount(0); // Fallback
      }
    };

    fetchAlertsCount();
  }, []);

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
      
      {/* Header Principal */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
               <FileText size={28} />
             </div>
             <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
               Hub de Reportes
             </h1>
          </div>
          <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} max-w-2xl`}>
            Genera auditorías, visualiza métricas clave y exporta datos detallados del sistema.
          </p>
        </div>
      </header>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <ReportCard
          title="Alertas de Stock"
          description="Productos críticos por debajo del nivel mínimo de inventario."
          icon={AlertTriangle}
          to="/reports/stock-alerts"
          count={stockAlertsCount}
          color="red"
        />
        <ReportCard
          title="Stock Disponible"
          description="Informe completo de stock actual y disponibilidad para asignar."
          icon={Package}
          to="/reports/inventory/full"
          color="indigo"
        />
        <ReportCard
          title="Asignaciones por Empleado"
          description="Listado de activos asignados agrupados por empleado."
          icon={Users}
          to="/reports/assignments-employee"
          color="emerald"
        />
        <ReportCard
          title="Asignaciones por Sector"
          description="Distribución de equipamiento tecnológico por sectores."
          icon={ClipboardList}
          to="/reports/assignments-sector"
          color="amber"
        />
        <ReportCard
          title="Asignaciones por Sucursal"
          description="Inventario de activos desplegados en cada sucursal."
          icon={Truck}
          to="/reports/assignments-branch"
          color="blue"
        />
        <ReportCard
          title="Historia de Reparaciones"
          description="Bitácora completa de mantenimientos y reparaciones."
          icon={List}
          to="/reports/repair-history"
          color="purple"
        />
        <ReportCard
          title="Auditoría de Movimientos"
          description="Trazabilidad detallada de todos los movimientos de stock."
          icon={BarChart3}
          to="/movements"
          color="indigo"
        />
      </div>
    </div>
  );
};

export default ReportsPage;
