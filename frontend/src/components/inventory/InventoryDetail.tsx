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
  FiCheckCircle,
  FiUserCheck,
  FiTool,
  FiXCircle,
  FiHelpCircle,
  FiZap,
  FiCornerUpLeft,
  FiUserPlus,
  FiCheckSquare
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
      if (desc.accion === 'CreaciÃ³n') {
        accion = 'Activo Creado';
        observaciones = `Item registrado en el sistema con S/N: ${desc.numero_serie}`;
      } else if (desc.accion === 'Cambio de Estado') {
        accion = `Cambio de estado: ${desc.estado_nuevo}`;
        observaciones = `Estado anterior: ${desc.estado_anterior}. ${desc.observaciones || ''}`;
      }
    } else if (log.tabla_afectada === 'Asignaciones') {
      if (desc.accion === 'Nueva AsignaciÃ³n') {
        accion = `Asignado a ${desc.empleado}`;
        observaciones = `UbicaciÃ³n: ${desc.sector} / ${desc.sucursal}.`;
      } else if (desc.accion === 'DevoluciÃ³n') {
        accion = 'Activo Devuelto';
        observaciones = `El activo fue devuelto y estÃ¡ disponible.`;
      }
    } else if (log.tabla_afectada === 'Reparaciones') {
      console.log('Procesando log de reparaciÃ³n:', log);
      if (desc.accion === 'EnvÃ­o a ReparaciÃ³n') {
        accion = `Enviado a ReparaciÃ³n`;
        observaciones = `Proveedor: ${desc.proveedor || 'No especificado'}. Problema: ${desc.problema || 'No especificado'}`;
      } else if (desc.accion === 'Retorno de ReparaciÃ³n') {
        accion = `Retorno de ReparaciÃ³n (${desc.estado_reparacion || 'N/A'})`;
        observaciones = `SoluciÃ³n: ${desc.solucion || 'No especificada'}. El activo ahora estÃ¡ ${desc.estado_inventario || 'N/A'}.`;
      }
    }
  } catch (error) {
    // Si la descripciÃ³n no es un JSON, o es un log simple.
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
    const loadHistory = async () => {
      try {
        setLoading(true);
        const response = await inventoryService.getInventoryHistory(item.id);
        
        console.log('Respuesta completa del historial desde la API:', JSON.stringify(response, null, 2));

        if (response.success && response.data && response.data.activityLogs) {
          const allEvents = response.data.activityLogs
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
    onClose();
  };

  // FunciÃ³n para obtener el color del estado
  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'Disponible':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Asignado':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'En reparaciÃ³n':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Dado de Baja':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
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
      {/* ðŸŽ­ Modal Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />
      
      {/* ðŸ”® Modal Container */}
      <div 
        className="fixed inset-0 flex items-center justify-center p-3"
        style={{ zIndex: 9999 }}
      >
        <div className={`border rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-slate-800/90 backdrop-blur-20 border-slate-700/30'
            : 'bg-white/90 backdrop-blur-20 border-white/30'
        }`} onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b transition-all duration-300 ${
            theme === 'dark' ? 'border-slate-700/20' : 'border-white/20'
          }`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center">
                <FiPackage className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${
                  theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
                }`}>Detalle del Item</h2>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>{item.numero_serie}</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200 ${
                theme === 'dark'
                  ? 'bg-slate-700 hover:bg-slate-600'
                  : 'bg-slate-100 hover:bg-slate-200'
              }`}
            >
              <FiX className={`w-5 h-5 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
              }`} />
            </button>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Columna Izquierda: InformaciÃ³n y Acciones */}
              <div className="space-y-8">
                {/* InformaciÃ³n principal */}
                <div className="space-y-6">
                  {/* Datos bÃ¡sicos */}
                  <div className={`border rounded-xl p-6 transition-all duration-300 ${
                    theme === 'dark' ? 'border-slate-700/50 bg-slate-800/50' : 'border-slate-200/80 bg-slate-50/50'
                  }`}>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                      {/* Estado */}
                      <div className="col-span-2">
                        <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Estado Actual</p>
                        <div className={`inline-flex items-center gap-2 mt-1 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(item.estado)}`}>
                          {item.estado}
                        </div>
                      </div>
                      
                      {/* Info bÃ¡sica */}
                      <div className="flex items-center gap-3">
                        <FiTag className={`w-5 h-5 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'}`} />
                        <div>
                          <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Marca</p>
                          <p className={`font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{item.producto?.marca ?? 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FiPackage className={`w-5 h-5 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'}`} />
                        <div>
                          <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Modelo</p>
                          <p className={`font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{item.producto?.modelo ?? 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FiHash className={`w-5 h-5 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'}`} />
                        <div>
                          <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>CategorÃ­a</p>
                          <p className={`font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{item.producto?.categoria?.nombre ?? 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FiCalendar className={`w-5 h-5 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'}`} />
                        <div>
                          <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Fecha de Ingreso</p>
                          <p className={`font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{formatDate(item.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Acciones RÃ¡pidas */}
                {item.estado !== 'Dado de Baja' && (
                  <div>
                    <h3 className={`text-lg font-bold mb-4 ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                      }`}>Acciones RÃ¡pidas</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {item.estado === 'Disponible' && (
                        <>
                          <Button 
                            variant="primary" 
                            onClick={() => setShowAssignModal(true)}
                          >
                            Asignar Activo
                          </Button>
                          <Button 
                            variant="warning"
                            onClick={() => handleSendToRepair(item)}
                          >
                            Enviar a Reparar
                          </Button>
                        </>
                      )}
                      {item.estado === 'Asignado' && (
                        <>
                          <Button 
                            variant="secondary"
                            onClick={() => setShowReturnAssignmentModal(true)}
                          >
                            Registrar DevoluciÃ³n
                          </Button>
                          <Button 
                            variant="warning"
                            onClick={() => handleSendToRepair(item)}
                          >
                            Enviar a Reparar
                          </Button>
                        </>
                      )}
                      {item.estado === 'En reparaciÃ³n' && (
                        <Button 
                          variant="success"
                          onClick={() => setShowRepairReturnModal(true)}
                        >
                          Gestionar Retorno
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Columna Derecha: Historial */}
              <div className="space-y-6">
                <div className={`border rounded-xl p-6 transition-all duration-300 h-full ${
                  theme === 'dark' ? 'border-slate-700/50 bg-slate-800/50' : 'border-slate-200/80 bg-slate-50/50'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    <FiClock className={`w-5 h-5 ${
                      theme === 'dark' ? 'text-purple-400' : 'text-purple-500'
                    }`} />
                    <h3 className={`text-lg font-bold ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                    }`}>Historial del Activo</h3>
                  </div>
                  {loading ? (
                    <div className="flex justify-center items-center h-48">
                      <FiRefreshCw className="animate-spin text-2xl text-slate-400" />
                    </div>
                  ) : (
                    <AssetTimeline history={history} loading={loading} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={`border-t p-6 transition-all duration-300 ${
            theme === 'dark' ? 'border-slate-700/20' : 'border-white/20'
          }`}>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className={`py-2 px-6 rounded-xl font-semibold transition-colors duration-200 ${
                  theme === 'dark'
                    ? 'bg-slate-600 hover:bg-slate-500 text-slate-200'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return typeof document !== 'undefined' ? (
    <>
      {createPortal(modalContent, document.body)}
      
      {/* ðŸŸ£ Portales de Modales Secundarios (fuera del principal) */}
      {showAssignModal && (
        <AssignmentModal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          onSuccess={handleActionSuccess}
          zIndex={10010}
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

