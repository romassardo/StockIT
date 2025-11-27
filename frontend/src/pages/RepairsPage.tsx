import React, { useState, useEffect, useCallback } from 'react';
import { FiTool, FiSearch, FiRefreshCw, FiEye, FiCheckCircle, FiCalendar, FiUser, FiAlertCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import { ActiveRepair, Pagination, InventoryItem } from '../types';
import * as repairService from '../services/repair.service';
import * as inventoryService from '../services/inventory.service';
import Loading from '../components/common/Loading';
import RepairReturnModal from '../components/modals/RepairReturnModal';
import InventoryDetail from '../components/inventory/InventoryDetail';
import NotificationContainer from '../components/common/NotificationContainer';

// Componentes UI Reutilizables (GlassCard)
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

const RepairsPage: React.FC = () => {
  const { theme } = useTheme();
  const { addNotification } = useNotification();

  const [repairs, setRepairs] = useState<ActiveRepair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
  });

  // Modales
  const [selectedRepair, setSelectedRepair] = useState<ActiveRepair | null>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<InventoryItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const loadRepairs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await repairService.getActiveRepairs(pagination.page, pagination.limit, searchTerm);
      if (response.success && response.data) {
        setRepairs(response.data);
        if (response.pagination) {
          setPagination(prev => ({
            ...prev,
            totalItems: response.pagination?.totalItems || 0,
            totalPages: response.pagination?.totalPages || 0
          }));
        }
      } else {
        setRepairs([]);
      }
    } catch (err: any) {
      setError('No se pudieron cargar las reparaciones.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm]);

  useEffect(() => {
    loadRepairs();
  }, [loadRepairs]);

  // Debounce search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleOpenReturnModal = (repair: ActiveRepair) => {
    setSelectedRepair(repair);
    setIsReturnModalOpen(true);
  };

  const handleViewDetails = async (serialNumber: string) => {
    try {
      const asset = await inventoryService.getInventoryBySerial(serialNumber);
      setSelectedAsset(asset);
      setIsDetailModalOpen(true);
    } catch (error) {
      addNotification({ type: 'error', message: 'No se pudo cargar el detalle del activo.' });
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (pagination.totalPages || 1)) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
               <FiTool size={24} />
             </div>
             <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-600">
               Reparaciones
             </h1>
          </div>
          <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Gestión de activos en servicio técnico
          </p>
        </div>
      </header>

      {/* Toolbar */}
      <GlassCard className="mb-6 !p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="w-full md:w-96 relative group">
            <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
              <FiSearch />
            </div>
            <input
              type="text"
              placeholder="Buscar por serie, modelo, proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`
                w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all border
                ${theme === 'dark' 
                  ? 'bg-slate-800/50 border-slate-700 focus:border-amber-500 text-white placeholder-slate-500' 
                  : 'bg-slate-50 border-slate-200 focus:border-amber-500 text-slate-800 placeholder-slate-400'
                }
              `}
            />
          </div>

          <button 
            onClick={loadRepairs}
            className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}
            title="Recargar tabla"
          >
            <FiRefreshCw size={18} />
          </button>
        </div>
      </GlassCard>

      {/* Tabla */}
      {loading ? (
        <Loading text="Cargando reparaciones..." />
      ) : error ? (
        <div className="text-center py-12 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800">
           <FiAlertCircle size={48} className="mx-auto mb-4 opacity-50" />
           <p className="font-bold">{error}</p>
           <button onClick={loadRepairs} className="mt-4 text-sm underline">Intentar nuevamente</button>
        </div>
      ) : repairs.length === 0 ? (
        <div className="text-center py-20 opacity-60">
          <div className="bg-slate-100 dark:bg-slate-800/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiTool size={40} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-bold mb-2">No hay reparaciones activas</h3>
          <p className="text-sm">Todos los equipos están operativos.</p>
        </div>
      ) : (
        <GlassCard className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`text-xs uppercase tracking-wider font-semibold border-b ${theme === 'dark' ? 'text-slate-400 border-slate-700 bg-slate-800/30' : 'text-slate-500 border-slate-200 bg-slate-50/50'}`}>
                  <th className="px-6 py-4">Activo</th>
                  <th className="px-6 py-4">Proveedor</th>
                  <th className="px-6 py-4">Problema</th>
                  <th className="px-6 py-4">Fecha Envío</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                {repairs.map((repair, index) => (
                  <tr 
                    key={`repair-${repair.reparacion_id || repair.id || index}`} 
                    className={`transition-colors group ${theme === 'dark' ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={`font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                          {repair.producto_marca || repair.marca} {repair.producto_modelo || repair.modelo}
                        </span>
                        <button 
                          onClick={() => handleViewDetails(repair.numero_serie)}
                          className="text-xs font-mono text-left text-amber-500 hover:underline mt-1 w-fit"
                        >
                          SN: {repair.numero_serie}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm">
                        <FiUser className="text-slate-400" />
                        {repair.proveedor}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm line-clamp-2 max-w-xs" title={repair.problema_descripcion}>
                        {repair.problema_descripcion}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-sm">
                        <div className="flex items-center gap-2">
                          <FiCalendar className="text-slate-400" />
                          {new Date(repair.fecha_envio).toLocaleDateString()}
                        </div>
                        {repair.dias_en_reparacion !== undefined && (
                          <span className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                            {repair.dias_en_reparacion} días en taller
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleViewDetails(repair.numero_serie)}
                          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-amber-500 transition-colors"
                          title="Ver Detalle"
                        >
                          <FiEye size={18} />
                        </button>
                        <button 
                          onClick={() => handleOpenReturnModal(repair)}
                          className="p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 transition-colors"
                          title="Registrar Retorno (Solucionado)"
                        >
                          <FiCheckCircle size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="flex justify-between items-center p-4 border-t border-slate-200 dark:border-slate-700">
             <p className="text-xs opacity-60">
               Mostrando {repairs.length} de {pagination.totalItems} reparaciones
             </p>
             <div className="flex gap-2">
               <button 
                 onClick={() => handlePageChange(pagination.page - 1)}
                 disabled={pagination.page <= 1}
                 className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
               >
                 <FiChevronLeft />
               </button>
               <span className="px-4 py-2 text-sm font-medium bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                 {pagination.page} / {pagination.totalPages || 1}
               </span>
               <button 
                 onClick={() => handlePageChange(pagination.page + 1)}
                 disabled={pagination.page >= pagination.totalPages}
                 className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
               >
                 <FiChevronRight />
               </button>
             </div>
          </div>
        </GlassCard>
      )}

      {isReturnModalOpen && selectedRepair && (
        <RepairReturnModal
          isOpen={isReturnModalOpen}
          onClose={() => setIsReturnModalOpen(false)}
          repair={selectedRepair}
          onRepairReturned={() => {
            setIsReturnModalOpen(false);
            loadRepairs();
          }}
        />
      )}

      {isDetailModalOpen && selectedAsset && (
        <InventoryDetail
          item={selectedAsset}
          onClose={() => setIsDetailModalOpen(false)}
          onRefresh={loadRepairs}
        />
      )}

      <NotificationContainer/>
    </div>
  );
};

export default RepairsPage;