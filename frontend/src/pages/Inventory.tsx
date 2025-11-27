import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  FiGrid, FiList, FiRefreshCw, FiSearch, FiPlus, 
  FiChevronLeft, FiChevronRight, FiSend, FiTool, FiClock, 
  FiPackage, FiSmartphone, FiMonitor, FiAlertCircle 
} from 'react-icons/fi';
import * as inventoryService from '../services/inventory.service';
import Loading from '../components/common/Loading';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import NotificationContainer from '../components/common/NotificationContainer';
import { AssignmentModal } from '../components/assignment/AssignmentModal';
import { InventoryEntryModal } from '../components/inventory/InventoryEntryModal';
import SendToRepairModal from '../components/modals/SendToRepairModal';
import InventoryDetail from '../components/inventory/InventoryDetail';
import BatchEntryModal from '../components/inventory/BatchEntryModal';

// --- Interfaces y Tipos ---

// Interfaz alineada con la respuesta real del Backend
interface BackendInventoryItem {
  id: number;
  numero_serie: string;
  estado: string;
  fecha_ingreso: string;
  fecha_creacion: string;
  producto: {
    id: number;
    marca: string;
    modelo: string;
    descripcion: string;
    categoria: {
      id: number;
      nombre: string;
    } | null;
  };
}

interface InventoryFilters {
  page: number;
  pageSize: number;
  search?: string;
  estado?: string;
  categoria_id?: number;
}

// --- Componentes UI Estilizados ---

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

const StatusBadge = ({ status }: { status: string }) => {
  const normalizedStatus = status?.toLowerCase().trim() || 'desconocido';
  
  let colorClass = '';
  let label = status;

  if (normalizedStatus === 'disponible') {
    colorClass = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    label = 'Disponible';
  } else if (normalizedStatus === 'asignado') {
    colorClass = 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    label = 'Asignado';
  } else if (normalizedStatus.includes('repara')) {
    colorClass = 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    label = 'En Reparación';
  } else if (normalizedStatus.includes('baja')) {
    colorClass = 'bg-red-500/10 text-red-600 border-red-500/20';
    label = 'Dado de Baja';
  } else {
    colorClass = 'bg-slate-500/10 text-slate-600 border-slate-500/20';
  }

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${colorClass} inline-flex items-center gap-1`}>
      <div className={`w-1.5 h-1.5 rounded-full ${colorClass.replace('/10', '').replace('text-', 'bg-').split(' ')[0]}`} />
      {label}
    </span>
  );
};

// --- Componente Principal ---

const Inventory: React.FC = () => {
  const { theme } = useTheme();
  const { addNotification } = useNotification();
  
  // Estados de Datos
  const [inventoryItems, setInventoryItems] = useState<BackendInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de Filtro y UI
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<InventoryFilters>({
    page: 1,
    pageSize: 20,
  });
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [quickFilter, setQuickFilter] = useState<'todos' | 'notebooks' | 'celulares'>('todos');

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 20,
  });

  // Modales
  const [selectedItem, setSelectedItem] = useState<BackendInventoryItem | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showBatchEntryModal, setShowBatchEntryModal] = useState(false);
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Carga de Datos
  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await inventoryService.getInventoryItems(filters);
      
      // El backend ya devuelve los datos con la estructura correcta gracias al mapeo robusto del controlador
      const items = (response.data || []) as unknown as BackendInventoryItem[];

      setInventoryItems(items);
      setPagination({
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalItems: response.totalItems,
        pageSize: filters.pageSize,
      });
      setError(null);
    } catch (err) {
      console.error('Error cargando inventario:', err);
      setError('No se pudo cargar el inventario.');
      addNotification({ type: 'error', message: 'Error de conexión.' });
    } finally {
      setLoading(false);
    }
  }, [filters, addNotification]);

  useEffect(() => {
    loadInventory();
  }, [filters, loadInventory]);

  // Handlers de Filtros
  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
  };

  const handleQuickFilter = (type: 'todos' | 'notebooks' | 'celulares') => {
    setQuickFilter(type);
    let catId: number | undefined = undefined;
    if (type === 'notebooks') catId = 1; // Asumiendo ID 1 para Notebooks
    if (type === 'celulares') catId = 2; // Asumiendo ID 2 para Celulares
    
    setFilters(prev => ({ ...prev, categoria_id: catId, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }));
    }
  };

  // Handlers de Acciones
  const openAssignment = (item: BackendInventoryItem) => {
    // Adaptador simple para el modal existente
    setSelectedItem(item);
    setShowAssignmentModal(true);
  };

  const openRepair = (item: BackendInventoryItem) => {
    setSelectedItem(item);
    setShowRepairModal(true);
  };

  const openHistory = (item: BackendInventoryItem) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
      
      {/* Header Principal */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
               <FiPackage size={24} />
             </div>
             <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
               Inventario
             </h1>
          </div>
          <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Gestión centralizada de activos de IT
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowEntryModal(true)}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
          >
            <FiPlus /> Individual
          </button>
          <button 
            onClick={() => setShowBatchEntryModal(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30 flex items-center gap-2"
          >
            <FiPlus /> Cargar Lote
          </button>
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
              placeholder="Buscar por serie, modelo, marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className={`
                w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all border
                ${theme === 'dark' 
                  ? 'bg-slate-800/50 border-slate-700 focus:border-indigo-500 text-white placeholder-slate-500' 
                  : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-800 placeholder-slate-400'
                }
              `}
            />
          </div>

          {/* Filtros Rápidos */}
          <div className={`flex p-1 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-100/50 border-slate-200'}`}>
            {[
              { id: 'todos', label: 'Todos', icon: FiPackage },
              { id: 'notebooks', label: 'Notebooks', icon: FiMonitor },
              { id: 'celulares', label: 'Celulares', icon: FiSmartphone },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => handleQuickFilter(filter.id as any)}
                className={`
                  px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all
                  ${quickFilter === filter.id 
                    ? 'bg-indigo-500 text-white shadow-md' 
                    : 'text-slate-500 hover:text-indigo-500'
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
               onClick={loadInventory}
               className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}
               title="Recargar tabla"
             >
               <FiRefreshCw size={18} />
             </button>
             <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
               <button 
                 onClick={() => setViewMode('list')}
                 className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-500' : 'text-slate-400'}`}
               >
                 <FiList size={16} />
               </button>
               <button 
                 onClick={() => setViewMode('grid')}
                 className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-500' : 'text-slate-400'}`}
               >
                 <FiGrid size={16} />
               </button>
             </div>
          </div>

        </div>
      </GlassCard>

      {/* Contenido Principal: Tabla o Grid */}
      {loading ? (
        <Loading text="Cargando activos..." />
      ) : error ? (
        <div className="text-center py-12 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800">
           <FiAlertCircle size={48} className="mx-auto mb-4 opacity-50" />
           <p className="font-bold">{error}</p>
           <button onClick={loadInventory} className="mt-4 text-sm underline">Intentar nuevamente</button>
        </div>
      ) : inventoryItems.length === 0 ? (
        <div className="text-center py-20 opacity-60">
          <div className="bg-slate-100 dark:bg-slate-800/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiPackage size={40} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-bold mb-2">No se encontraron activos</h3>
          <p className="text-sm">Intenta ajustar los filtros o buscar otro término.</p>
        </div>
      ) : (
        <>
          {viewMode === 'list' ? (
            <GlassCard className="!p-0 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`text-xs uppercase tracking-wider font-semibold border-b ${theme === 'dark' ? 'text-slate-400 border-slate-700 bg-slate-800/30' : 'text-slate-500 border-slate-200 bg-slate-50/50'}`}>
                    <th className="px-6 py-4">Activo / Serie</th>
                    <th className="px-6 py-4">Categoría</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                  {inventoryItems.map((item) => (
                    <tr 
                      key={item.id} 
                      className={`transition-colors group ${theme === 'dark' ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className={`font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                            {item.producto?.marca} {item.producto?.modelo}
                          </span>
                          <span className="text-xs font-mono text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded w-fit mt-1">
                            {item.numero_serie}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm opacity-80">
                        {item.producto?.categoria?.nombre || 'General'}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={item.estado} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => openHistory(item)}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-500 transition-colors"
                            title="Ver Historial"
                          >
                            <FiClock size={18} />
                          </button>
                          <button 
                            onClick={() => openAssignment(item)}
                            disabled={item.estado !== 'Disponible'}
                            className={`p-2 rounded-lg transition-colors ${item.estado === 'Disponible' ? 'hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-500' : 'opacity-30 cursor-not-allowed'}`}
                            title="Asignar"
                          >
                            <FiSend size={18} />
                          </button>
                          <button 
                            onClick={() => openRepair(item)}
                            disabled={item.estado === 'En Reparación' || item.estado === 'Dado de Baja'}
                            className={`p-2 rounded-lg transition-colors ${item.estado !== 'En Reparación' ? 'hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-500' : 'opacity-30 cursor-not-allowed'}`}
                            title="Enviar a Reparación"
                          >
                            <FiTool size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {inventoryItems.map((item) => (
                <GlassCard key={item.id} className="flex flex-col p-5 hover:shadow-xl transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <StatusBadge status={item.estado} />
                    <button 
                      onClick={() => openHistory(item)} 
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-400 hover:text-indigo-500 transition-colors"
                      title="Ver historial"
                    >
                      <FiClock size={18} />
                    </button>
                  </div>
                  
                  <div className="flex-1 mb-6">
                    <div className="text-xs font-bold text-indigo-500 dark:text-indigo-400 mb-1 uppercase tracking-wider">
                      {item.producto?.categoria?.nombre || 'General'}
                    </div>
                    <h3 className={`font-bold text-xl mb-2 leading-tight ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>
                      {item.producto?.marca} {item.producto?.modelo}
                    </h3>
                    
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-xs text-slate-500 uppercase font-semibold">S/N:</span>
                      <code className="bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded text-sm font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/50">
                        {item.numero_serie}
                      </code>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-auto pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                    <button 
                      onClick={() => openAssignment(item)}
                      disabled={item.estado !== 'Disponible'}
                      className={`
                        flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all
                        ${item.estado === 'Disponible' 
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        }
                      `}
                    >
                      <FiSend size={16} /> Asignar
                    </button>
                    <button 
                      onClick={() => openRepair(item)}
                      disabled={item.estado === 'En Reparación' || item.estado === 'Dado de Baja'}
                      className={`
                        px-3 py-2.5 rounded-xl text-sm font-bold transition-all border
                        ${item.estado !== 'En Reparación' 
                          ? 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800' 
                          : 'border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                        }
                      `}
                      title="Reparar"
                    >
                      <FiTool size={18} />
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}

          {/* Paginación */}
          <div className="flex justify-between items-center mt-6">
             <p className="text-xs opacity-60">
               Mostrando {inventoryItems.length} de {pagination.totalItems} resultados
             </p>
             <div className="flex gap-2">
               <button 
                 onClick={() => handlePageChange(pagination.currentPage - 1)}
                 disabled={pagination.currentPage <= 1}
                 className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
               >
                 <FiChevronLeft />
               </button>
               <span className="px-4 py-2 text-sm font-medium bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                 {pagination.currentPage} / {pagination.totalPages || 1}
               </span>
               <button 
                 onClick={() => handlePageChange(pagination.currentPage + 1)}
                 disabled={pagination.currentPage >= pagination.totalPages}
                 className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
               >
                 <FiChevronRight />
               </button>
             </div>
          </div>
        </>
      )}

      {/* Modales */}
      {showAssignmentModal && (
         <AssignmentModal
           isOpen={showAssignmentModal}
           onClose={() => setShowAssignmentModal(false)}
           onSuccess={() => {
             setShowAssignmentModal(false);
             addNotification({ type: 'success', message: 'Asignación exitosa' });
             loadInventory();
           }}
           inventoryItem={selectedItem as any} // Casting temporal hasta actualizar modal
         />
       )}
       
       {showEntryModal && (
         <InventoryEntryModal
           isOpen={showEntryModal}
           onClose={() => setShowEntryModal(false)}
           onSuccess={() => {
             setShowEntryModal(false);
             loadInventory();
           }}
         />
       )}

       {showBatchEntryModal && (
        <BatchEntryModal
          isOpen={showBatchEntryModal}
          onClose={() => setShowBatchEntryModal(false)}
          onSuccess={() => {
             setShowBatchEntryModal(false);
             loadInventory();
          }}
        />
       )}

       {showRepairModal && selectedItem && (
         <SendToRepairModal
           isOpen={showRepairModal}
           onClose={() => setShowRepairModal(false)}
           onRepairSubmitted={() => {
             setShowRepairModal(false);
             addNotification({ type: 'success', message: 'Equipo enviado a reparación' });
             loadInventory();
           }}
           preselectedAsset={{
             inventario_individual_id: selectedItem.id,
             numero_serie: selectedItem.numero_serie,
             producto_info: `${selectedItem.producto.marca} ${selectedItem.producto.modelo}`
           }}
         />
       )}

       {isDetailModalOpen && selectedItem && createPortal(
         <InventoryDetail
           item={selectedItem as any}
           onClose={() => setIsDetailModalOpen(false)}
           onRefresh={loadInventory}
         />,
         document.body
       )}

       <NotificationContainer/>
    </div>
  );
};

export default Inventory;
