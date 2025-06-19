import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FiGrid, FiList, FiFilter, FiRefreshCw, FiSearch, FiPlus, FiChevronLeft, FiChevronRight, FiSend, FiTool, FiClock, FiHash, FiPackage } from 'react-icons/fi';
import * as inventoryService from '../services/inventory.service';
import { InventoryItem, PaginatedSearchResponse } from '../types';
import Loading from '../components/common/Loading';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import NotificationContainer from '../components/common/NotificationContainer';
import { AssignmentModal } from '../components/assignment/AssignmentModal';
import { InventoryEntryModal } from '../components/inventory/InventoryEntryModal';
import SendToRepairModal from '../components/modals/SendToRepairModal';
import InventoryDetail from '../components/inventory/InventoryDetail';
import BatchEntryModal from '../components/inventory/BatchEntryModal';

interface InventoryFilters {
  page: number;
  pageSize: number;
  search?: string;
  estado?: string;
  categoria_id?: number;
}

const Inventory: React.FC = () => {
  const { theme } = useTheme();
  const { addNotification } = useNotification();
  
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<InventoryFilters>({
    page: 1,
    pageSize: 28,
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  const [pagination, setPagination] = useState<PaginatedSearchResponse<InventoryItem>['pagination']>({
    currentPage: 1,
    pageSize: 28,
    totalItems: 0,
    totalPages: 0,
  });

  const [quickFilter, setQuickFilter] = useState<'todos' | 'notebooks' | 'celulares'>('todos');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentTargetItem, setAssignmentTargetItem] = useState<InventoryItem | null>(null);

  const [showEntryModal, setShowEntryModal] = useState(false);

  const [showRepairModal, setShowRepairModal] = useState(false);
  const [repairTargetItem, setRepairTargetItem] = useState<InventoryItem | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [showBatchEntryModal, setShowBatchEntryModal] = useState(false);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await inventoryService.getInventoryItems(filters);
      setInventoryItems(response.data);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error al cargar inventario:', error);
      setError('Error al cargar el inventario');
      addNotification({
        type: 'error',
        message: 'No se pudo cargar el inventario.',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, addNotification]);

  useEffect(() => {
    loadInventory();
  }, [filters, loadInventory]);

  const handleGlobalSearch = async () => {
    if (!searchTerm.trim()) {
      loadInventory();
      return;
    }
    try {
      setLoading(true);
      const searchFilters: InventoryFilters = {
        ...filters,
        search: searchTerm.trim(),
        page: 1
      };
      
      const response = await inventoryService.getInventoryItems(searchFilters);
      
      setInventoryItems(response.data);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setInventoryItems([]);
        setPagination({ currentPage: 1, pageSize: 25, totalItems: 0, totalPages: 0 });
      } else {
        setError(err.response?.data?.error || 'Error en la búsqueda');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<InventoryFilters>) => {
    setFilters((prev: InventoryFilters) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleStatusFilterClick = (estado: string | null) => {
    setStatusFilter(estado);
    setQuickFilter('todos');
    handleFilterChange({ estado: estado || undefined, categoria_id: undefined });
  };
  
  const handleQuickFilterClick = (filter: 'todos' | 'notebooks' | 'celulares') => {
    setQuickFilter(filter);
    setStatusFilter(null);
    const categoria_id = filter === 'notebooks' ? 1 : filter === 'celulares' ? 2 : undefined;
    handleFilterChange({ categoria_id, estado: undefined });
  };

  const handlePageChange = (page: number) => {
    setFilters((prev: InventoryFilters) => ({ ...prev, page }));
  };

  const getStatusColor = (estado: string) => {
    if (!estado) return 'bg-slate-500 text-white border-slate-500 font-medium';
    const estadoNormalizado = estado.toLowerCase().trim();
    
    if (estadoNormalizado.includes('reparac')) {
      return 'bg-amber-500 text-white border-amber-500 font-medium';
    }
    
    switch (estadoNormalizado) {
      case 'disponible':
        return 'bg-emerald-500 text-white border-emerald-500 font-medium';
      case 'dado de baja':
        return 'bg-red-500 text-white border-red-500 font-medium';
      case 'asignado':
        return 'bg-cyan-500 text-white border-cyan-500 font-medium';
      default:
        return 'bg-slate-500 text-white border-slate-500 font-medium';
    }
  };

  const normalizeStatusText = (estado: string) => {
    if (!estado) return 'Desconocido';
    const estadoNormalizado = estado.toLowerCase().trim();
    if (estadoNormalizado.includes('reparac')) return 'En Reparación';
    if (estadoNormalizado === 'disponible') return 'Disponible';
    if (estadoNormalizado === 'dado de baja') return 'Dado de Baja';
    if (estadoNormalizado === 'asignado') return 'Asignado';
    return estado;
  };

  const handleOpenHistory = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  const resetFilters = () => {
    setFilters({ page: 1, pageSize: 28 });
    setQuickFilter('todos');
    setStatusFilter(null);
    setSearchTerm('');
  };

  const handleRefresh = () => {
    loadInventory();
  };

  const openAssignmentModal = (item?: InventoryItem) => {
    setAssignmentTargetItem(item || null);
    setShowAssignmentModal(true);
  };

  const closeAssignmentModal = () => {
    setShowAssignmentModal(false);
    setAssignmentTargetItem(null);
  };

  const handleAssignmentSuccess = () => {
    closeAssignmentModal();
    addNotification({ type: 'success', message: 'Asignación creada exitosamente.' });
    loadInventory();
  };

  const openEntryModal = () => {
    setShowEntryModal(true);
  };

  const closeEntryModal = () => {
    setShowEntryModal(false);
  };

  const handleEntrySuccess = () => {
    closeEntryModal();
    addNotification({ type: 'success', message: 'Inventario actualizado exitosamente.' });
    loadInventory();
  };

  const openBatchEntryModal = () => {
    setShowBatchEntryModal(true);
  };

  const closeBatchEntryModal = () => {
    setShowBatchEntryModal(false);
  };

  const handleBatchEntrySuccess = (result: { Creados: number; Duplicados: string | null }) => {
    closeBatchEntryModal();
    const message = `Alta masiva completa. Creados: ${result.Creados}. Duplicados: ${result.Duplicados || 'Ninguno'}.`;
    addNotification({ type: 'success', message: message });
    loadInventory();
  };

  const openRepairModal = (item: InventoryItem) => {
    setRepairTargetItem(item);
    setShowRepairModal(true);
  };

  const closeRepairModal = () => {
    setShowRepairModal(false);
    setRepairTargetItem(null);
  };

  const handleRepairSuccess = () => {
    closeRepairModal();
    addNotification({ type: 'success', message: 'Activo enviado a reparación.' });
    loadInventory();
  };
  
  const columns = React.useMemo(() => [
      { Header: 'N° Serie', accessor: 'numero_serie' },
      { Header: 'Producto', accessor: 'producto' },
      { Header: 'Estado', accessor: 'estado' },
      { Header: 'Acciones', accessor: 'actions' },
  ], []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 🌌 ORBES DE FONDO ANIMADOS - IMPLEMENTACIÓN OBLIGATORIA */}
      <div className={`fixed inset-0 pointer-events-none transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95' 
          : 'bg-gradient-to-br from-slate-50/95 via-slate-100/90 to-slate-200/95'
      }`}>
        {/* Orbe 1: Top-left - Primary */}
        <div className={`absolute top-20 left-10 w-32 h-32 rounded-full blur-xl animate-float transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-primary-500/20' 
            : 'bg-primary-500/10'
        }`}></div>
        
        {/* Orbe 2: Top-right - Secondary */}
        <div className={`absolute top-40 right-20 w-24 h-24 rounded-full blur-lg animate-float transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-secondary-500/20' 
            : 'bg-secondary-500/10'
        }`} style={{animationDelay: '2s'}}></div>
        
        {/* Orbe 3: Bottom-left - Success */}
        <div className={`absolute bottom-32 left-1/4 w-20 h-20 rounded-full blur-lg animate-float transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-success-500/20' 
            : 'bg-success-500/10'
        }`} style={{animationDelay: '4s'}}></div>
        
        {/* Orbe 4: Bottom-right - Info */}
        <div className={`absolute bottom-20 right-1/3 w-28 h-28 rounded-full blur-xl animate-float transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-info-500/20' 
            : 'bg-info-500/10'
        }`} style={{animationDelay: '1s'}}></div>
      </div>

      {/* Contenido principal */}
      <div className={`relative z-10 p-4 sm:p-6 transition-colors duration-300 min-h-screen ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
       <header className="mb-6">
         <h1 className="text-3xl font-bold text-gradient-primary">Inventario General</h1>
         <p className={`mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
           Visualiza y gestiona todos los activos serializados.
         </p>
       </header>
       
       <div className="glass-card p-4 mb-6">
         <div className="flex flex-wrap items-center justify-between gap-4">
             <div className="flex-grow flex items-center bg-slate-500/10 rounded-lg">
                 <FiSearch className="mx-3 text-slate-400"/>
                 <input
                     type="text"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && handleGlobalSearch()}
                     placeholder="Buscar por serie, marca, modelo, etc..."
                     className="w-full bg-transparent p-2 focus:outline-none"
                 />
             </div>
             <div className="flex items-center gap-2">
                 <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary p-2"><FiFilter /></button>
                 <button onClick={handleRefresh} className="btn-secondary p-2"><FiRefreshCw/></button>
                 <button onClick={openEntryModal} className="btn-secondary flex items-center gap-2 p-2"><FiPlus/><span>Nuevo Item</span></button>
                 <button onClick={openBatchEntryModal} className="btn-primary flex items-center gap-2 p-2"><FiPlus/><span>Añadir Lote</span></button>
             </div>
         </div>
         {showFilters && (
             <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => handleQuickFilterClick('todos')} className={`btn-filter ${quickFilter === 'todos' ? 'active' : ''}`}>Todos</button>
                  <button onClick={() => handleQuickFilterClick('notebooks')} className={`btn-filter ${quickFilter === 'notebooks' ? 'active' : ''}`}>Notebooks</button>
                  <button onClick={() => handleQuickFilterClick('celulares')} className={`btn-filter ${quickFilter === 'celulares' ? 'active' : ''}`}>Celulares</button>
                  <button onClick={() => handleStatusFilterClick('Disponible')} className={`btn-filter ${statusFilter === 'Disponible' ? 'active' : ''}`}>Disponibles</button>
                  <button onClick={() => handleStatusFilterClick('Asignado')} className={`btn-filter ${statusFilter === 'Asignado' ? 'active' : ''}`}>Asignados</button>
                  <button onClick={() => handleStatusFilterClick('En Reparación')} className={`btn-filter ${statusFilter === 'En Reparación' ? 'active' : ''}`}>En Reparación</button>
                  <button onClick={() => handleStatusFilterClick('Dado de Baja')} className={`btn-filter ${statusFilter === 'Dado de Baja' ? 'active' : ''}`}>Dados de Baja</button>
             </div>
         )}
       </div>
 
       <div className="flex items-center justify-between mb-4">
         <div className="text-sm">
           Mostrando <span className="font-bold">{inventoryItems.length}</span> de <span className="font-bold">{pagination.totalItems}</span> activos.
         </div>
         <div className="flex items-center gap-2">
           <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary-500/20 text-primary-500' : 'bg-slate-500/10'}`}><FiGrid/></button>
           <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary-500/20 text-primary-500' : 'bg-slate-500/10'}`}><FiList/></button>
         </div>
       </div>

       {loading && <Loading text="Cargando inventario..." />}
       {!loading && error && <div className="text-red-500 text-center">{error}</div>}
       {!loading && !error && inventoryItems.length === 0 && (
         <div className="text-center py-10">
           <p>No se encontraron activos con los filtros actuales.</p>
           <button onClick={resetFilters} className="mt-4 btn-secondary">Limpiar Filtros</button>
         </div>
       )}
 
       {!loading && !error && inventoryItems.length > 0 && (
         <>
             {viewMode === 'grid' ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                     {inventoryItems.map(item => (
                         <div key={item.id} className="glass-card p-4 flex flex-col justify-between cursor-pointer" onClick={() => handleOpenHistory(item)}>
                             <div>
                                 <div className="flex justify-between items-start">
                                     <span className={`px-2 py-1 text-xs rounded-full border shadow-sm ${getStatusColor(item.estado)}`}>{normalizeStatusText(item.estado)}</span>
                                     <FiPackage className="text-slate-400"/>
                                 </div>
                                 <h3 className="font-bold mt-2">{item.producto?.marca} {item.producto?.modelo}</h3>
                                 <p className="text-sm text-slate-400">{item.producto?.categoria?.nombre}</p>
                                 <p className="text-xs font-mono mt-2 text-slate-500">{item.numero_serie}</p>
                             </div>
                             <div className="mt-4 flex gap-2">
                                 <button onClick={(e) => { e.stopPropagation(); openAssignmentModal(item); }} disabled={item.estado !== 'Disponible'} className="btn-action-grid flex-1"><FiSend/> Asignar</button>
                                 <button onClick={(e) => { e.stopPropagation(); openRepairModal(item); }} disabled={item.estado.toLowerCase().includes('reparac') || item.estado === 'Dado de Baja'} className="btn-action-grid flex-1"><FiTool/> Reparar</button>
                             </div>
                         </div>
                     ))}
                 </div>
             ) : (
                 <div className="overflow-x-auto glass-card p-4 mt-6">
                     <table className="min-w-full">
                         <thead className={`border-b ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'}`}>
                             <tr>
                                 {columns.map(col => <th key={col.Header} className="p-3 text-left text-xs font-semibold uppercase tracking-wider">{col.Header}</th>)}
                             </tr>
                         </thead>
                         <tbody>
                             {inventoryItems.map((item) => (
                             <tr key={item.id} className={`border-b transition-colors duration-200 ${theme === 'dark' ? 'border-slate-800 hover:bg-slate-800/50' : 'border-slate-100 hover:bg-slate-50/50'}`}>
                                 <td className="p-3"><div className="flex items-center"><FiHash className="mr-2 text-slate-500"/>{item.numero_serie}</div></td>
                                 <td className="p-3">
                                   <div className="flex flex-col">
                                     <span className="font-semibold">{item.producto?.modelo}</span>
                                     <span className="text-xs text-slate-400">{item.producto?.marca}</span>
                                   </div>
                                 </td>
                                 <td className="p-3"><span className={`px-2 py-1 rounded-lg text-xs font-medium border backdrop-blur-sm ${getStatusColor(item.estado)}`}>{normalizeStatusText(item.estado)}</span></td>
                                 <td className="p-3">
                                     <div className="flex items-center justify-end space-x-1">
                                         <button onClick={() => handleOpenHistory(item)} className="btn-table-action" title="Ver Historial"><FiClock/></button>
                                         <button onClick={() => openAssignmentModal(item)} disabled={item.estado !== 'Disponible'} className="btn-table-action" title="Asignar"><FiSend/></button>
                                         <button onClick={() => openRepairModal(item)} disabled={item.estado.toLowerCase().includes('reparac') || item.estado === 'Dado de Baja'} className="btn-table-action" title="Enviar a reparar"><FiTool/></button>
                                     </div>
                                 </td>
                             </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>
             )}
 
             <div className="flex justify-center mt-6">
               <nav className="flex items-center gap-2">
                 <button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage <= 1} className="btn-secondary p-2"><FiChevronLeft/></button>
                 <span className="text-sm">Página {pagination.currentPage} de {pagination.totalPages}</span>
                 <button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage >= pagination.totalPages} className="btn-secondary p-2"><FiChevronRight/></button>
               </nav>
             </div>
         </>
       )}
      
       {showAssignmentModal && (
         <AssignmentModal
           isOpen={showAssignmentModal}
           onClose={closeAssignmentModal}
           onSuccess={handleAssignmentSuccess}
           inventoryItem={assignmentTargetItem}
         />
       )}
       {showEntryModal && (
         <InventoryEntryModal
           isOpen={showEntryModal}
           onClose={closeEntryModal}
           onSuccess={handleEntrySuccess}
         />
       )}
       {showBatchEntryModal && (
        <BatchEntryModal
          isOpen={showBatchEntryModal}
          onClose={closeBatchEntryModal}
          onSuccess={handleBatchEntrySuccess}
        />
       )}
       {showRepairModal && repairTargetItem && (
         <SendToRepairModal
           isOpen={showRepairModal}
           onClose={closeRepairModal}
           onRepairSubmitted={handleRepairSuccess}
           preselectedAsset={{
             inventario_individual_id: repairTargetItem.id,
             numero_serie: repairTargetItem.numero_serie,
             producto_info: `${repairTargetItem.producto?.marca || ''} ${repairTargetItem.producto?.modelo || ''}`.trim(),
           }}
         />
       )}
       {isDetailModalOpen && selectedItem && createPortal(
         <InventoryDetail
           item={selectedItem}
           onClose={() => setIsDetailModalOpen(false)}
           onRefresh={loadInventory}
         />,
         document.body
       )}
 
       <NotificationContainer/>
       </div>
     </div>
   );
};

export default Inventory;

