import React from 'react';
import { FiGitCommit, FiUser, FiInfo, FiTool, FiCheckCircle, FiClock, FiCalendar } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';

export interface TimelineEvent {
  id: string;
  fecha: string;
  accion: string;
  usuario: string;
  observaciones?: string;
}

interface AssetTimelineProps {
  history: TimelineEvent[];
  loading: boolean;
}

const AssetTimeline: React.FC<AssetTimelineProps> = ({ history, loading }) => {
  const { theme } = useTheme();

  const getIconForEvent = (accion: string) => {
    const lowerCaseAccion = accion.toLowerCase();
    if (lowerCaseAccion.includes('creado') || lowerCaseAccion.includes('disponible')) {
      return <FiCheckCircle className="w-5 h-5 text-emerald-500" />;
    }
    if (lowerCaseAccion.includes('asignado') || lowerCaseAccion.includes('finalizada')) {
      return <FiUser className="w-5 h-5 text-blue-500" />;
    }
    if (lowerCaseAccion.includes('reparación')) {
      return <FiTool className="w-5 h-5 text-amber-500" />;
    }
    if (lowerCaseAccion.includes('baja')) {
      return <FiInfo className="w-5 h-5 text-red-500" />;
    }
    return <FiGitCommit className="w-5 h-5 text-slate-500" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700"></div>
              <div className="absolute top-12 left-1/2 w-0.5 h-full bg-slate-200 dark:bg-slate-700"></div>
            </div>
            <div className="flex-1 space-y-2 py-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!history.length) {
    return (
      <div className="text-center py-10">
        <FiClock className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-200">Sin historial</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">No hay eventos registrados para este item.</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {history.map((event, eventIdx) => (
          <li key={event.id}>
            <div className="relative pb-8">
              {eventIdx !== history.length - 1 ? (
                <span className={`absolute top-5 left-5 -ml-px h-full w-0.5 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`} aria-hidden="true" />
              ) : null}
              <div className="relative flex items-start space-x-4">
                <div className={`relative p-3 rounded-full flex items-center justify-center ${
                  theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'
                }`}>
                  {getIconForEvent(event.accion)}
                </div>
                <div className="min-w-0 flex-1 pt-2">
                  <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                    {event.accion}
                  </p>
                  <p className={`mt-0.5 text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    {event.observaciones}
                  </p>
                  <div className={`mt-2 flex items-center gap-x-3 text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                    <span className="flex items-center gap-1">
                      <FiUser className="h-3 w-3" />
                      {event.usuario}
                    </span>
                    <time dateTime={event.fecha} className="flex items-center gap-1">
                      <FiCalendar className="h-3 w-3" />
                      {formatDate(event.fecha)}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AssetTimeline; 