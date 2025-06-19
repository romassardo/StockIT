import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { InventoryItem, Assignment, ActiveRepair, ActivityLog, TimelineEvent } from '../../types';
import * as inventoryService from '../services/inventory.service';
import AssetTimeline from './AssetTimeline';
import { FiX, FiLoader, FiAlertTriangle } from 'react-icons/fi';

interface AssetDetailDrawerProps {
  assetId: number;
  onClose: () => void;
}

const AssetDetailDrawer: React.FC<AssetDetailDrawerProps> = ({ assetId, onClose }) => {
  const [asset, setAsset] = useState<InventoryItem | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!assetId) return;
      setIsLoading(true);
      setError(null);
      try {
        const historyData = await inventoryService.getInventoryHistory(assetId);
        const { inventoryDetails, activityLogs, assignments, repairs } = historyData.data ?? {};

        setAsset(inventoryDetails);

        const combinedEvents: TimelineEvent[] = [];

        // Mapear logs de actividad
        activityLogs?.forEach((log: ActivityLog) => {
          combinedEvents.push({
            id: `log-${log.id}`,
            fecha: log.fecha_hora,
            accion: log.accion,
            usuario: log.usuario_nombre,
            observaciones: log.descripcion || 'Sin observaciones.',
          });
        });

        // Mapear asignaciones
        assignments?.forEach((asg: Assignment) => {
          combinedEvents.push({
            id: `asg-${asg.id}`,
            fecha: asg.fecha_asignacion,
            accion: 'Asignado',
            usuario: asg.usuario_asigna_nombre,
            observaciones: `Asignado a ${asg.empleado_nombre} en ${asg.sector_nombre} (${asg.sucursal_nombre}).`,
          });
          if (asg.fecha_devolucion) {
            combinedEvents.push({
              id: `dev-${asg.id}`,
              fecha: asg.fecha_devolucion,
              accion: 'Devuelto',
              usuario: asg.usuario_recibe_nombre || 'Sistema',
              observaciones: 'El activo fue devuelto al inventario.',
            });
          }
        });

        // Mapear reparaciones
        repairs?.forEach((rep: ActiveRepair) => {
          combinedEvents.push({
            id: `rep-${rep.reparacion_id}`,
            fecha: rep.fecha_envio,
            accion: 'Enviado a ReparaciÃ³n',
            usuario: rep.usuario_envia_nombre,
            observaciones: `Enviado a ${rep.proveedor}. Problema: ${rep.problema_descripcion}`,
          });
          if (rep.fecha_retorno) {
            combinedEvents.push({
              id: `ret-${rep.reparacion_id}`,
              fecha: rep.fecha_retorno,
              accion: `ReparaciÃ³n Finalizada (${rep.estado_reparacion})`,
              usuario: rep.usuario_recibe_nombre || 'Sistema',
              observaciones: `SoluciÃ³n: ${rep.solucion_descripcion || 'No especificada.'}`,
            });
          }
        });

        // Ordenar todos los eventos por fecha descendente
        combinedEvents.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        
        setTimeline(combinedEvents);
      } catch (err: any) {
        setError(err.message || 'Error al cargar el historial del activo.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [assetId]);

  useEffect(() => {
    // Para la animaciÃ³n de entrada
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10); // Un pequeÃ±o delay para asegurar que la transiciÃ³n ocurra
    
    // Para la animaciÃ³n de salida con la tecla Escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 500); // Esperar que la animaciÃ³n de salida termine
  };

  const drawerContent = (
    <div 
      className={`fixed inset-0 bg-black/80 backdrop-blur-md z-modal-backdrop transition-opacity duration-500 ease-out-expo ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
    >
      <aside 
        className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-slate-100 dark:bg-slate-900/95 border-l border-slate-200 dark:border-slate-700 shadow-2xl z-modal transform transition-transform duration-500 ease-out-expo flex flex-col ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-lg z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
              Historial del Activo
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {asset?.producto ? `${asset.producto.marca} ${asset.producto.modelo}` : 'Cargando...'}
            </p>
          </div>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <FiX className="h-6 w-6 text-slate-600 dark:text-slate-300" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
              <div className="flex justify-center items-center h-full">
                <FiLoader className="animate-spin text-4xl text-primary-500" />
              </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center text-center text-red-500 h-full">
              <FiAlertTriangle className="h-12 w-12 mb-4" />
              <h3 className="text-lg font-semibold">Error al cargar</h3>
              <p>{error}</p>
            </div>
          )}
          
          {!isLoading && !error && (
            <AssetTimeline history={timeline} loading={isLoading} />
          )}
        </div>
      </aside>
    </div>
  );

  return ReactDOM.createPortal(drawerContent, document.body);
};

export default AssetDetailDrawer; 

