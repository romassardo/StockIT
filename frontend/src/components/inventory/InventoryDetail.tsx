import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  FiX, 
  FiClock, 
  FiCalendar, 
  FiTag,
  FiPackage,
  FiHash,
  FiRefreshCw,
  FiActivity,
  FiCheckCircle,
  FiAlertCircle,
  FiXCircle
} from 'react-icons/fi';
import { InventoryItem } from '../../types';
import * as inventoryService from '../../services/inventory.service';
import { useNotification } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import AssetTimeline, { TimelineEvent } from './AssetTimeline';
import { AssignmentModal } from '../assignment/AssignmentModal';
import SendToRepairModal from '../modals/SendToRepairModal';
import ReturnAssignmentModal from '../modals/ReturnAssignmentModal';
import RepairReturnModal from '../modals/RepairReturnModal';
import Button from '../common/Button';

interface InventoryDetailProps {
  item: InventoryItem;
  onClose: () => void;
  onRefresh: () => void;
}

interface ActivityLog {
  id: number;
  usuario_id: number;
  tabla_afectada: string;
  accion: string;
  registro_id: number;
  descripcion: string;
  fecha_hora: string;
  nombre_usuario: string;
}

const parseLogToAction = (log: ActivityLog): TimelineEvent => {
  let accion = 'Actividad';
  let observaciones = '';

  try {
    const desc = JSON.parse(log.descripcion);
    
    if (log.tabla_afectada === 'InventarioIndividual') {
      if (desc.accion === 'Creación' || desc.accion === 'Creacion') {
        accion = 'Activo Creado';
        observaciones = `Item registrado en el sistema con S/N: ${desc.numero_serie}`;
      } else if (desc.accion === 'Cambio de Estado') {
        accion = `Cambio de estado: ${desc.estado_nuevo}`;
        observaciones = `Estado anterior: ${desc.estado_anterior}. ${desc.observaciones || ''}`;
      }
    } else if (log.tabla_afectada === 'Asignaciones') {
      if (desc.accion === 'Nueva Asignación' || desc.accion === 'Nueva Asignacion') {
        accion = `Asignado a ${desc.empleado}`;
        observaciones = `Ubicación: ${desc.sector} / ${desc.sucursal}.`;
      } else if (desc.accion === 'Devolución' || desc.accion === 'Devolucion') {
        accion = 'Activo Devuelto';
        observaciones = `El activo fue devuelto y está disponible.`;
      }
    } else if (log.tabla_afectada === 'Reparaciones') {
      if (desc.accion === 'Envío a Reparación' || desc.accion === 'Envio a Reparacion') {
        accion = `Enviado a Reparación`;
        observaciones = `Proveedor: ${desc.proveedor || 'No especificado'}. Problema: ${desc.problema || 'No especificado'}`;
      } else if (desc.accion === 'Retorno de Reparación' || desc.accion === 'Retorno de Reparacion') {
        accion = `Retorno de Reparación (${desc.estado_reparacion || 'N/A'})`;
        observaciones = `Solución: ${desc.solucion || 'No especificada'}. El activo ahora está ${desc.estado_inventario || 'N/A'}.`;
      }
    }
  } catch (error) {
    // Si la descripción no es un JSON, o es un log simple.
    accion = `${log.tabla_afectada} - ${log.accion}`;
    observaciones = log.descripcion;
  }

  return {
    id: log.id.toString(),
    fecha: log.fecha_hora,
    accion,
    usuario: log.nombre_usuario || 'Sistema',
    observaciones,
  };
};

const InventoryDetail: React.FC<InventoryDetailProps> = ({ item, onClose, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<TimelineEvent[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showSendToRepairModal, setShowSendToRepairModal] = useState(false);
  const [selectedAssetForRepair, setSelectedAssetForRepair] = useState<InventoryItem | null>(null);
  const [showReturnAssignmentModal, setShowReturnAssignmentModal] = useState(false);
  const [showRepairReturnModal, setShowRepairReturnModal] = useState(false);

  const { addNotification } = useNotification();
  const { theme } = useTheme();

  // Cargar historial del item
  useEffect(() => {
    if (!item || !item.id) {
      setHistory([]);
      return;
    }

    const loadHistory = async () => {
      try {
        setLoading(true);
        const response = await inventoryService.getInventoryHistory(item.id);
        
        if (response.success && Array.isArray(response.data)) {
          const allEvents = response.data
            .map(parseLogToAction)
            .sort((a: TimelineEvent, b: TimelineEvent) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
          
          setHistory(allEvents);
        }
      } catch (error) {
        console.error('Error cargando historial:', error);
        addNotification({
          type: 'error',
          message: 'No se pudo cargar el historial del activo.',
        });
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [item.id, addNotification]);

  const handleSendToRepair = (asset: InventoryItem) => {
    setSelectedAssetForRepair(asset);
    setShowSendToRepairModal(true);
  };

  const handleActionSuccess = () => {
    onRefresh();
    // No cerramos el modal principal para permitir ver el cambio en el historial, 
    // pero recargamos el historial
    if (item.id) {
      setLoading(true);
      inventoryService.getInventoryHistory(item.id)
        .then(response => {
          if (response.success && Array.isArray(response.data)) {
            setHistory(response.data.map(parseLogToAction).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
          }
        })
        .finally(() => setLoading(false));
    }
  };

  // Función para obtener el color del estado
  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'Disponible':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Asignado':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'En Reparación':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Dado de Baja':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const modalContent = (
    <>
      {/* 🔒 Modal Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
        onClick={onClose}
      />
      
      {/* 🔒 Modal Container */}
      <div 
        className="fixed inset-0 flex items-center justify-center p-4 z-[9999]"
      >
        <div 
          className={`glass-card w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl ${
            theme === 'dark' ? 'bg-slate-900/90 border-slate-700' : 'bg-white/95 border-white/50'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex justify-between items-center shrink-0 bg-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <FiPackage className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-slate-800'
                }`}>
                  Detalle del Activo
                </h2>
                <div className="flex items-center gap-2 text-sm opacity-80">
                  <span className="font-mono bg-white/10 px-1.5 rounded text-xs">{item.numero_serie}</span>
                  <span className="text-xs">•</span>
                  <span>{item.producto?.categoria?.nombre}</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <FiX className={`w-6 h-6 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`} />
            </button>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
              
              {/* Columna Izquierda: Info y Acciones (1/3 ancho) */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Tarjeta de Estado */}
                <div className={`p-5 rounded-2xl border ${
                  theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="mb-4">
                    <span className="text-xs font-semibold uppercase tracking-wider opacity-60">Estado Actual</span>
                    <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold border ${getStatusColor(item.estado)}`}>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(item.estado).replace('bg-', 'bg-').split(' ')[0].replace('/10', '')}`} />
                      {item.estado}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <div>
                      <span className="text-xs opacity-60 block mb-1">Marca</span>
                      <p className="font-semibold text-lg">{item.producto?.marca}</p>
                    </div>
                    <div>
                      <span className="text-xs opacity-60 block mb-1">Modelo</span>
                      <p className="font-semibold text-lg">{item.producto?.modelo}</p>
                    </div>
                    <div>
                      <span className="text-xs opacity-60 block mb-1">Ingresado</span>
                      <div className="flex items-center gap-2">
                        <FiCalendar />
                        <span>{formatDate(item.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botones de Acción */}
                {item.estado !== 'Dado de Baja' && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider opacity-60 px-1">Acciones Rápidas</h3>
                    
                    {item.estado === 'Disponible' && (
                      <>
                        <button 
                          onClick={() => setShowAssignModal(true)}
                          className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                        >
                          <FiCheckCircle /> Asignar Activo
                        </button>
                        <button 
                          onClick={() => handleSendToRepair(item)}
                          className="w-full py-3 px-4 rounded-xl border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 font-semibold transition-all flex items-center justify-center gap-2"
                        >
                          <FiAlertCircle /> Enviar a Reparación
                        </button>
                      </>
                    )}

                    {item.estado === 'Asignado' && (
                      <>
                        <button 
                          onClick={() => setShowReturnAssignmentModal(true)}
                          className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                        >
                          <FiRefreshCw /> Registrar Devolución
                        </button>
                        <button 
                          onClick={() => handleSendToRepair(item)}
                          className="w-full py-3 px-4 rounded-xl border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 font-semibold transition-all flex items-center justify-center gap-2"
                        >
                          <FiAlertCircle /> Enviar a Reparación
                        </button>
                      </>
                    )}

                    {item.estado === 'En Reparación' && (
                      <button 
                        onClick={() => setShowRepairReturnModal(true)}
                        className="w-full py-3 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2"
                      >
                        <FiCheckCircle /> Gestionar Retorno
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {/* Columna Derecha: Historial (2/3 ancho) */}
              <div className="lg:col-span-2 flex flex-col h-full">
                <div className={`flex-1 rounded-2xl border overflow-hidden flex flex-col ${
                  theme === 'dark' ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="p-4 border-b border-white/10 flex items-center gap-2 bg-white/5">
                    <FiActivity className="text-indigo-500" />
                    <h3 className="font-bold">Línea de Tiempo</h3>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 relative">
                    {loading ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-50">
                        <FiRefreshCw className="w-8 h-8 animate-spin mb-2" />
                        <p>Cargando historial...</p>
                      </div>
                    ) : history.length > 0 ? (
                      <AssetTimeline history={history} loading={loading} />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40">
                        <FiClock className="w-12 h-12 mb-3" />
                        <p>No hay actividad registrada</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-white/10 flex justify-end bg-white/5">
            <button
              onClick={onClose}
              className={`px-6 py-2.5 rounded-xl font-medium transition-colors ${
                theme === 'dark'
                  ? 'bg-slate-700 hover:bg-slate-600 text-white'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
              }`}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return typeof document !== 'undefined' ? (
    <>
      {createPortal(modalContent, document.body)}
      
      {/* Modales Secundarios */}
      {showAssignModal && (
        <AssignmentModal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          onSuccess={handleActionSuccess}
        />
      )}
      {showSendToRepairModal && selectedAssetForRepair && (
        <SendToRepairModal
          isOpen={showSendToRepairModal}
          onClose={() => {
            setShowSendToRepairModal(false);
            setSelectedAssetForRepair(null);
          }}
          onRepairSubmitted={handleActionSuccess}
          preselectedAsset={{
            inventario_individual_id: selectedAssetForRepair.id,
            producto_info: `${selectedAssetForRepair.producto?.marca ?? ''} ${selectedAssetForRepair.producto?.modelo ?? ''}`.trim(),
            numero_serie: selectedAssetForRepair.numero_serie,
            empleado_info: selectedAssetForRepair.asignacion_actual ? `${selectedAssetForRepair.asignacion_actual.empleado?.nombre ?? ''} ${selectedAssetForRepair.asignacion_actual.empleado?.apellido ?? ''}`.trim() : undefined,
          }}
          zIndex={10010}
        />
      )}
      {showReturnAssignmentModal && item.asignacion_actual && (
        <ReturnAssignmentModal
          isOpen={showReturnAssignmentModal}
          onClose={() => setShowReturnAssignmentModal(false)}
          onAssignmentReturned={handleActionSuccess}
          assignment={{
            id: item.asignacion_actual.id,
            numero_serie: item.numero_serie,
            producto_info: `${item.producto?.marca ?? ''} ${item.producto?.modelo ?? ''}`.trim(),
            empleado_info: `${item.asignacion_actual.empleado?.nombre ?? ''} ${item.asignacion_actual.empleado?.apellido ?? ''}`.trim(),
          }}
          zIndex={10010}
        />
      )}
       {showRepairReturnModal && item.reparacion_actual && (
        <RepairReturnModal 
          isOpen={true} 
          onClose={() => setShowRepairReturnModal(false)}
          onRepairReturned={handleActionSuccess}
          repair={item.reparacion_actual}
          zIndex={10001}
        />
      )}
    </>
  ) : null;
};

export default InventoryDetail;