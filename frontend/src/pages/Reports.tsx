import React, { useState, useEffect } from 'react';
import { IconType } from 'react-icons';
import { FiFileText, FiAlertTriangle, FiUsers, FiClipboard, FiPackage, FiTruck, FiList, FiTrendingUp } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { getStockAlertsCount } from '../services/report.service';
import { useNotification } from '../contexts/NotificationContext';

// Un componente de tarjeta reutilizable para los reportes
interface ReportCardProps {
  icon: IconType;
  title: string;
  description: string;
  to: string;
  count?: number;
  color: string;
  disabled?: boolean;
}

const ReportCard: React.FC<ReportCardProps> = ({ icon: Icon, title, description, to, count, color, disabled = false }) => {
  const { addNotification } = useNotification();

  const content = (
    <div className={`relative p-6 rounded-2xl overflow-hidden transition-all duration-300 ease-out-expo group h-full min-h-[140px] flex flex-col justify-between ${
      disabled 
        ? 'bg-slate-700/50 cursor-not-allowed'
        : `bg-slate-800/60 hover:bg-slate-700/80 hover:shadow-xl hover:-translate-y-1 hover:shadow-${color}-500/10`
    } backdrop-blur-lg border border-slate-700`}>
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-lg bg-${color}-500/10`}>
          <Icon className={`w-6 h-6 text-${color}-400`} />
        </div>
        {count !== undefined && (
          <span className={`px-3 py-1 text-xs font-bold rounded-full bg-${color}-500/20 text-${color}-300`}>
            {count}
          </span>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-lg font-bold text-slate-100 font-display">{title}</h3>
        <p className="mt-1 text-sm text-slate-400 line-clamp-2">{description}</p>
      </div>
    </div>
  );

  if (disabled) {
    return (
      <div onClick={() => addNotification({ message: 'Funcionalidad en desarrollo', type: 'info' })}>
        {content}
      </div>
    );
  }

  return <Link to={to}>{content}</Link>;
};


const ReportsPage = () => {
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
    <div className="relative min-h-screen text-white p-4 sm:p-6 md:p-8 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-900">
      {/* Orbes de fondo fijos (sin AnimatedOrbsBackground) */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full blur-2xl bg-primary-500/20 animate-pulse" />
        <div className="absolute top-40 right-20 w-24 h-24 rounded-full blur-xl bg-secondary-500/20 animate-pulse" style={{animationDelay: '2s'}} />
        <div className="absolute bottom-32 left-1/4 w-20 h-20 rounded-full blur-lg bg-success-500/20 animate-pulse" style={{animationDelay: '4s'}} />
        <div className="absolute bottom-20 right-1/3 w-28 h-28 rounded-full blur-xl bg-info-500/20 animate-pulse" style={{animationDelay: '1s'}} />
      </div>
      
      {/* Contenido principal */}
      <div className="relative z-10">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-100 font-display">
            Hub de Reportes y Auditoría
          </h1>
          <p className="mt-2 text-slate-400 max-w-2xl">
            Genera y exporta reportes detallados del inventario, asignaciones y métricas del sistema.
          </p>
        </header>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <ReportCard
            title="Alertas de Stock"
            description="Productos bajo nivel mínimo de stock"
            icon={FiAlertTriangle}
            to="/reports/stock-alerts"
            count={stockAlertsCount}
            color="danger"
          />
          <ReportCard
            title="Stock Disponible"
            description="Stock disponible para asignar"
            icon={FiPackage}
            to="/reports/inventory/full"
            color="primary"
          />
          <ReportCard
            title="Asignaciones por Empleado"
            description="Activos asignados por empleado"
            icon={FiUsers}
            to="/reports/assignments-employee"
            color="success"
          />
          <ReportCard
            title="Asignaciones por Sector"
            description="Distribución de activos por sector"
            icon={FiClipboard}
            to="/reports/assignments-sector"
            color="warning"
          />
          <ReportCard
            title="Asignaciones por Sucursal"
            description="Distribución de activos por sucursal"
            icon={FiTruck}
            to="/reports/assignments-branch"
            color="info"
          />
          <ReportCard
            title="Historia de Reparaciones"
            description="Historial completo de reparaciones realizadas"
            icon={FiFileText}
            to="/reports/repair-history"
            color="secondary"
          />
          <ReportCard
            title="Auditoría de Movimientos"
            description="Historial de movimientos de stock"
            icon={FiList}
            to="/reports/stock-movements"
            color="primary"
          />
          <ReportCard
            title="Rendimiento del Inventario"
            description="Métricas y KPIs de rotación y uso"
            icon={FiTrendingUp}
            to="/reports/performance"
            color="success"
          />
        </div>
      </div>
    </div>
  );
};

export default ReportsPage; 