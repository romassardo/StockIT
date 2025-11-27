import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiList, FiRefreshCw, FiSearch, FiUser, 
  FiChevronLeft, FiChevronRight, FiCornerDownLeft, FiTool, 
  FiSmartphone, FiMonitor, FiAlertCircle, FiBriefcase, FiMapPin, FiGrid, FiClock, FiXCircle
} from 'react-icons/fi';
import { assignmentService } from '../services/assignment.service';
import Loading from '../components/common/Loading';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import NotificationContainer from '../components/common/NotificationContainer';
import InventoryDetail from '../components/inventory/InventoryDetail';
import ReturnAssignmentModal from '../components/modals/ReturnAssignmentModal';
import SendToRepairModal from '../components/modals/SendToRepairModal';
import CancelAssignmentModal from '../components/modals/CancelAssignmentModal';
import { Assignment, InventoryItem } from '../types';

// --- Interfaces y Tipos ---

interface AssignmentFilters {
  page: number;
  pageSize: number;
  search?: string;
  type?: 'all' | 'notebook' | 'cellphone';
}

// --- Componentes UI Estilizados (Copiados de Inventory para consistencia) ---

const GlassCard = ({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => {
  const { theme } = useTheme();
  return (
    <div 
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl transition-all duration-300
        ${onClick ? 'cursor-pointer hover:scale-[1.01] hover:shadow-lg' : ''}
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

const DestinationBadge = ({ assignment }: { assignment: Assignment }) => {
  let icon = <FiUser />;
  let label = 'Desconocido';
  let colorClass = 'bg-slate-500/10 text-slate-600 border-slate-500/20';

  if (assignment.empleado) {
    icon = <FiUser />;
    label = `${assignment.empleado.nombre} ${assignment.empleado.apellido}`;
    colorClass = 'bg-blue-500/10 text-blue-600 border-blue-500/20';
  } else if (assignment.sector) {
    icon = <FiBriefcase />;
    label = assignment.sector.nombre;
    colorClass = 'bg-purple-500/10 text-purple-600 border-purple-500/20';
  } else if (assignment.sucursal) {
    icon = <FiMapPin />;
    label = assignment.sucursal.nombre;
    colorClass = 'bg-orange-500/10 text-orange-600 border-orange-500/20';
  }

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${colorClass} inline-flex items-center gap-1.5`}>
      {icon}
      <span className="truncate max-w-[150px]">{label}</span>
    </span>
  );
};

// --- Componente Principal ---

const Assignments: React.FC = () => {
  const { theme } = useTheme();
  const { addNotification } = useNotification();
  
  // Estados de Datos
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de Filtro y UI
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [activeFilter, setActiveFilter] = useState<'all' | 'notebook' | 'cellphone'>('all');

  // Modales
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState<InventoryItem | null>(null);

  // Carga de Datos
  const loadAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await assignmentService.getActiveAssignments();
      if (response.success) {
        setAssignments(response.data as Assignment[]);
      } else {
        setError('No se pudieron cargar las asignaciones.');
      }
      setError(null);
    } catch (err) {
      console.error('Error cargando asignaciones:', err);
      setError('No se pudieron cargar las asignaciones.');
      addNotification({ type: 'error', message: 'Error de conexión.' });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  // Filtrado local
  const filteredAssignments = assignments.filter(a => {
    const matchesSearch = 
      (a.inventario?.numero_serie?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (a.empleado?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (a.empleado?.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (a.sector?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (a.sucursal?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || false);

    let matchesType = true;
    if (activeFilter === 'notebook') matchesType = a.inventario?.producto?.categoria?.nombre === 'Notebooks';
    if (activeFilter === 'cellphone') matchesType = a.inventario?.producto?.categoria?.nombre === 'Celulares';

    return matchesSearch && matchesType;
  });

  // Handlers de Filtros
  const handleSearch = () => {
    // Reactivo
  };

  const handleQuickFilter = (type: 'all' | 'notebook' | 'cellphone') => {
    setActiveFilter(type);
  };

  // Handlers de Acciones
  const openReturn = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowReturnModal(true);
  };

  const openRepair = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowRepairModal(true);
  };

  const openDetail = (assignment: Assignment) => {
    if (assignment.inventario) {
      setSelectedDetailItem(assignment.inventario);
      setShowDetailModal(true);
    }
  };

  const handleCancelAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowCancelModal(true);
  };

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
      
      {/* Header Principal */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
               <FiBriefcase size={24} />
             </div>
             <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">
               Asignaciones
             </h1>
          </div>
          <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Gestión de activos entregados a empleados, sectores o sucursales
          </p>
        </div>
      </header>

      {/* Barra de Herramientas y Filtros */}
      <GlassCard className="mb-6 !p-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
          
          {/* Buscador */}
          <div className="w-full lg:w-96 relative group">
            <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
              <FiSearch />
            </div>
            <input
              type="text"
              placeholder="Buscar por serie, empleado, sector..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`
                w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all border
                ${theme === 'dark' 
                  ? 'bg-slate-800/50 border-slate-700 focus:border-blue-500 text-white placeholder-slate-500' 
                  : 'bg-slate-50 border-slate-200 focus:border-blue-500 text-slate-800 placeholder-slate-400'
                }
              `}
            />
          </div>

          {/* Filtros Rápidos */}
          <div className={`flex p-1 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-100/50 border-slate-200'}`}>
            {[
              { id: 'all', label: 'Todos', icon: FiBriefcase },
              { id: 'notebook', label: 'Notebooks', icon: FiMonitor },
              { id: 'cellphone', label: 'Celulares', icon: FiSmartphone },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => handleQuickFilter(filter.id as any)}
                className={`
                  px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all
                  ${activeFilter === filter.id 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'text-slate-500 hover:text-blue-500'
                  }
                `}
              >
                <filter.icon size={14} /> {filter.label}
              </button>
            ))}
          </div>

          {/* Controles de Vista y Recarga */}
          <div className="flex items-center gap-2 border-l pl-4 border-slate-200 dark:border-slate-700">
             <button 
               onClick={loadAssignments}
               className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}
               title="Recargar tabla"
             >
               <FiRefreshCw size={18} />
             </button>
             <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
               <button 
                 onClick={() => setViewMode('list')}
                 className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-500' : 'text-slate-400'}`}
               >
                 <FiList size={16} />
               </button>
               <button 
                 onClick={() => setViewMode('grid')}
                 className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-500' : 'text-slate-400'}`}
               >
                 <FiGrid size={16} />
               </button>
             </div>
          </div>

        </div>
      </GlassCard>

      {/* Contenido Principal: Tabla o Grid */}
      {loading ? (
        <Loading text="Cargando asignaciones..." />
      ) : error ? (
        <div className="text-center py-12 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800">
           <FiAlertCircle size={48} className="mx-auto mb-4 opacity-50" />
           <p className="font-bold">{error}</p>
           <button onClick={loadAssignments} className="mt-4 text-sm underline">Intentar nuevamente</button>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="text-center py-20 opacity-60">
          <div className="bg-slate-100 dark:bg-slate-800/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiBriefcase size={40} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-bold mb-2">No hay asignaciones activas</h3>
          <p className="text-sm">Intenta ajustar los filtros o buscar otro término.</p>
        </div>
      ) : (
        <>
          {viewMode === 'list' ? (
            <GlassCard className="!p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`text-xs uppercase tracking-wider font-semibold border-b ${theme === 'dark' ? 'text-slate-400 border-slate-700 bg-slate-800/30' : 'text-slate-500 border-slate-200 bg-slate-50/50'}`}>
                      <th className="px-6 py-4">Activo</th>
                      <th className="px-6 py-4">Asignado A</th>
                      <th className="px-6 py-4">Fecha</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                    {filteredAssignments.map((assignment) => (
                      <tr 
                        key={assignment.id} 
                        className={`transition-colors group ${theme === 'dark' ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className={`font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                              {assignment.inventario?.producto?.marca} {assignment.inventario?.producto?.modelo}
                            </span>
                            <button 
                              onClick={() => openDetail(assignment)}
                              className="text-xs font-mono text-left text-blue-500 hover:underline mt-1 w-fit"
                            >
                              SN: {assignment.inventario?.numero_serie || 'N/A'}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <DestinationBadge assignment={assignment} />
                        </td>
                        <td className="px-6 py-4 text-sm opacity-80">
                          <div className="flex items-center gap-2">
                            <FiClock className="text-slate-400" />
                            {new Date(assignment.fecha_asignacion).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => openDetail(assignment)}
                              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-500 transition-colors"
                              title="Ver Detalle de Activo"
                            >
                              <FiList size={18} />
                            </button>
                            <button 
                              onClick={() => openRepair(assignment)}
                              className="p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-500 transition-colors"
                              title="Enviar a Reparación"
                            >
                              <FiTool size={18} />
                            </button>
                            <button 
                              onClick={() => openReturn(assignment)}
                              className="p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-500 transition-colors"
                              title="Registrar Devolución"
                            >
                              <FiCornerDownLeft size={18} />
                            </button>
                            <button 
                              onClick={() => handleCancelAssignment(assignment)}
                              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                              title="Cancelar Asignación (Error)"
                            >
                              <FiXCircle size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredAssignments.map((assignment) => (
                <GlassCard key={assignment.id} className="flex flex-col hover:border-blue-500/50 transition-all group">
                  <div className="flex justify-between items-start mb-3">
                    <DestinationBadge assignment={assignment} />
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleCancelAssignment(assignment)}
                        className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        title="Cancelar Asignación"
                      >
                        <FiXCircle size={14} />
                      </button>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <FiClock size={12} />
                        {new Date(assignment.fecha_asignacion).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 mb-4">
                    <h3 className={`font-bold text-lg mb-1 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                      {assignment.inventario?.producto?.marca} {assignment.inventario?.producto?.modelo}
                    </h3>
                    <p className="text-xs text-slate-500 mb-3">
                       {assignment.inventario?.producto?.categoria?.nombre || 'General'}
                    </p>
                    <div className="inline-block bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-mono text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      SN: {assignment.inventario?.numero_serie || 'N/A'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                    <button 
                      onClick={() => openRepair(assignment)}
                      className="py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-amber-500/30 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                    >
                      <FiTool size={14} /> Reparar
                    </button>
                    <button 
                      onClick={() => openReturn(assignment)}
                      className="py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20"
                    >
                      <FiCornerDownLeft size={14} /> Devolver
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
          
          {/* Paginación simple (placeholder si la API no pagina en el frontend) */}
           <div className="flex justify-between items-center mt-6">
             <p className="text-xs opacity-60">
               Mostrando {filteredAssignments.length} asignaciones
             </p>
           </div>
        </>
      )}

      {/* Modales */}
      
      {showReturnModal && selectedAssignment && selectedAssignment.inventario && (
        <ReturnAssignmentModal
          isOpen={showReturnModal}
          onClose={() => setShowReturnModal(false)}
          onAssignmentReturned={() => {
            loadAssignments();
            addNotification({ type: 'success', message: 'Devolución registrada exitosamente' });
          }}
          assignment={{
            id: selectedAssignment.id,
            numero_serie: selectedAssignment.inventario.numero_serie,
            producto_info: `${selectedAssignment.inventario.producto?.marca} ${selectedAssignment.inventario.producto?.modelo}`,
            empleado_info: selectedAssignment.empleado 
              ? `${selectedAssignment.empleado.nombre} ${selectedAssignment.empleado.apellido}`
              : selectedAssignment.sector 
                ? `Sector: ${selectedAssignment.sector.nombre}`
                : selectedAssignment.sucursal
                  ? `Sucursal: ${selectedAssignment.sucursal.nombre}`
                  : 'Desconocido'
          }}
        />
      )}
      
      {showCancelModal && selectedAssignment && selectedAssignment.inventario && (
        <CancelAssignmentModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onAssignmentCancelled={() => {
            loadAssignments();
          }}
          assignment={{
            id: selectedAssignment.id,
            numero_serie: selectedAssignment.inventario.numero_serie,
            producto_info: `${selectedAssignment.inventario.producto?.marca} ${selectedAssignment.inventario.producto?.modelo}`,
            empleado_info: selectedAssignment.empleado 
              ? `${selectedAssignment.empleado.nombre} ${selectedAssignment.empleado.apellido}`
              : selectedAssignment.sector 
                ? `Sector: ${selectedAssignment.sector.nombre}`
                : selectedAssignment.sucursal
                  ? `Sucursal: ${selectedAssignment.sucursal.nombre}`
                  : 'Desconocido'
          }}
        />
      )}

      {showRepairModal && selectedAssignment && selectedAssignment.inventario && (
        <SendToRepairModal
          isOpen={showRepairModal}
          onClose={() => setShowRepairModal(false)}
          onRepairSubmitted={() => {
            loadAssignments();
            addNotification({ type: 'success', message: 'Equipo enviado a reparación' });
          }}
          preselectedAsset={{
            inventario_individual_id: selectedAssignment.inventario.id,
            numero_serie: selectedAssignment.inventario.numero_serie,
            producto_info: `${selectedAssignment.inventario.producto?.marca} ${selectedAssignment.inventario.producto?.modelo}`
          }}
        />
      )}

      {showDetailModal && selectedDetailItem && (
        <InventoryDetail
          item={selectedDetailItem}
          onClose={() => setShowDetailModal(false)}
          onRefresh={loadAssignments}
        />
      )}

      <NotificationContainer/>
    </div>
  );
};

export default Assignments;