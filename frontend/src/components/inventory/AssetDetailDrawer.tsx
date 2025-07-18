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

        // Mapear historial a eventos de timeline
        const timelineEvents: TimelineEvent[] = (inventoryDetails.history || []).map((log, index) => {
          let event: Partial<TimelineEvent> = {
            id: log.id || index,
            date: log.fecha_hora,
            user: log.usuario_nombre,
          };

          try {
            const details = JSON.parse(log.descripcion);
            if (details.accion) {
              event.title = details.accion;
              event.description = details.observaciones;
            } else if (log.tabla_afectada === 'Reparaciones') {
              if (log.accion === 'INSERT') {
                event = {
                  ...event,
                  title: 'Envío a Reparación',
                  description: `A ${details.proveedor || 'proveedor'}. Problema: ${details.problema_descripcion || 'No especificado.'}`
                };
              } else if (log.accion === 'UPDATE') {
                event = {
                  ...event,
                  title: `Retorno de Reparación`,
                  description: `Estado: ${details.estado_reparacion || 'N/A'}. Solución: ${details.solucion_descripcion || 'No especificada.'}`
                };
              }
            } else if (log.tabla_afectada === 'Asignaciones') {
              if (log.accion === 'INSERT') {
                event = {
                  ...event,
                  title: 'Nueva Asignación',
                  description: `Asignado a ${details.empleado_nombre || 'N/A'} en ${details.sector_nombre || 'N/A'} / ${details.sucursal_nombre || 'N/A'}`
                };
              } else if (log.accion === 'UPDATE' && (details.activa === 0 || details.activa === "0")) {
                event = {
                  ...event,
                  title: 'Devolución de Activo',
                  description: `El activo fue devuelto y está nuevamente disponible.`
                };
              }
            } else {
              event.title = `${log.accion} en ${log.tabla_afectada}`;
              event.description = log.descripcion;
            }
          } catch (e) {
            event.title = `${log.accion} en ${log.tabla_afectada}`;
            event.description = log.descripcion;
          }

          return event as TimelineEvent;
        });

        // Ordenar todos los eventos por fecha descendente
        timelineEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setTimeline(timelineEvents);
      } catch (err: any) {
        setError(err.message || 'Error al cargar el historial del activo.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [assetId]);

  useEffect(() => {
    // Mapear logs de actividad
    activityLogs?.forEach((log: ActivityLog) => {
      if (log.tabla_afectada === 'Asignaciones') {
        // Lógica para asignaciones
      } else if (log.tabla_afectada === 'Reparaciones') {
        // Lógica para reparaciones
      }
    });

    const reparacionesFormateadas = repairs?.map(rep => ({
      id: rep.reparacion_id,
      date: rep.fecha_envio,
      user: rep.usuario_envia_nombre,
      accion: 'Enviado a Reparación',
      observaciones: `A ${rep.proveedor}. Problema: ${rep.problema_descripcion}`
    }));

    if(repairs[0]?.fecha_retorno){
      reparacionesFormateadas.push({
        id: repairs[0].reparacion_id + 1000,
        date: repairs[0].fecha_retorno,
        user: repairs[0].usuario_recibe_nombre,
        accion: `Reparación Finalizada (${repairs[0].estado_reparacion})`,
        observaciones: `Solución: ${repairs[0].solucion_descripcion || 'No especificada.'}`,
      });
    }

    setTimeline([...reparacionesFormateadas].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, [repairs]);

  useEffect(() => {
    // Para la animación de entrada
    const timer = setTimeout(() => setIsVisible(true), 10); 
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 500); // Esperar que la animación de salida termine
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

