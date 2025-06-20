// frontend/src/pages/RepairsPage.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FiTool, FiSearch, FiRefreshCw, FiEye } from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import { ActiveRepair, ApiResponse, Pagination, InventoryItem } from '../types';
import * as repairService from '../services/repair.service';
import * as inventoryService from '../services/inventory.service';
import DataTable, { type Column } from '../components/common/DataTable';
import Loading from '../components/common/Loading';
import RepairReturnModal from '../components/modals/RepairReturnModal';
import InventoryDetail from '../components/inventory/InventoryDetail';
import AnimatedOrbsBackground from '../components/layout/AnimatedOrbsBackground';

const RepairsPage: React.FC = () => {
  const { theme } = useTheme();
  const [repairs, setRepairs] = useState<ActiveRepair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<ActiveRepair | null>(null);
  const { addNotification } = useNotification();
  
  // Estados para el modal de detalle unificado
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<InventoryItem | null>(null);

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');

  const loadRepairs = useCallback(async (page: number, limit: number) => {
    setLoading(true);
    setError(null);
    try {
      const response: ApiResponse<ActiveRepair[]> = await repairService.getActiveRepairs(page, limit);
      if (response.success && response.data) {
        setRepairs(response.data);
        if (response.pagination) {
          setPagination({
            page: response.pagination.page,
            limit: response.pagination.limit,
            totalItems: response.pagination.totalItems || 0,
            totalPages: response.pagination.totalPages || 0,
          });
        }
      } else {
        throw new Error(response.error || 'Error al cargar las reparaciones.');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Ocurrió un error inesperado.';
      setError(errorMessage);
      addNotification({ type: 'error', message: errorMessage });
      // Set safe defaults on error
      setRepairs([]);
      setPagination({
        page: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    loadRepairs(pagination.page, pagination.limit);
  }, [pagination.page, pagination.limit]);

  const handleSearch = () => {
    // La búsqueda se realiza en el lado del cliente por ahora, o se podría implementar en el backend.
    // Como el SP no acepta `search`, esta función no hará una llamada a la API por ahora.
    // Se puede implementar un filtrado local si es necesario.
    addNotification({ type: 'info', message: 'La búsqueda de reparaciones se implementará en una futura versión.' });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (pagination.totalPages || 1)) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };
  
  const handleRefresh = () => {
    setSearchTerm('');
    setPagination(prev => ({ ...prev, page: 1 }));
    loadRepairs(1, pagination.limit);
  };

  const handleOpenReturnModal = (repair: ActiveRepair) => {
    setSelectedRepair(repair);
    setIsReturnModalOpen(true);
  };

  const handleViewDetails = useCallback(async (serialNumber: string) => {
    try {
      // getInventoryBySerial devuelve directamente el InventoryItem
      const asset = await inventoryService.getInventoryBySerial(serialNumber);
      setSelectedAsset(asset);
      setIsDetailModalOpen(true);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al buscar el activo.';
      addNotification({ type: 'error', message: errorMessage });
    }
  }, [addNotification]);

  const columns: Column<ActiveRepair>[] = useMemo(() => [
    { 
      id: 'producto',
      header: 'Producto', 
      accessor: (row: ActiveRepair) => `${row.producto_marca || row.marca} ${row.producto_modelo || row.modelo}`
    },
    {
      id: 'numero_serie',
      header: 'N° Serie',
      accessor: (row: ActiveRepair) => (
        <button
          onClick={() => handleViewDetails(row.numero_serie)}
          className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline focus:outline-none"
          title={`Ver detalles de ${row.numero_serie}`}
        >
          {row.numero_serie}
        </button>
      )
    },
    { 
      id: 'proveedor',
      header: 'Proveedor',
      accessor: (row: ActiveRepair) => row.proveedor
    },
    { 
      id: 'fecha_envio',
      header: 'Fecha Envío',
      accessor: (row: ActiveRepair) => new Date(row.fecha_envio).toLocaleDateString()
    },
    { 
      id: 'problema',
      header: 'Problema Reportado',
      accessor: (row: ActiveRepair) => row.problema_descripcion
    },
    { 
      id: 'enviado_por',
      header: 'Enviado Por',
      accessor: (row: ActiveRepair) => row.usuario_envia_nombre
    },
    {
      id: 'actions',
      header: 'Acciones',
      accessor: (row: ActiveRepair) => (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => handleViewDetails(row.numero_serie)}
            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors p-1"
            title="Ver Detalles e Historial"
          >
            <FiEye />
          </button>
          <button
            onClick={() => handleOpenReturnModal(row)}
            className="btn-primary text-xs px-2 py-1 flex items-center gap-1"
          >
            <FiTool size={12} />
            Retorno
          </button>
        </div>
      ),
    },
  ], [handleViewDetails]);

  // 🔧 FIX: Safe pagination state calculation
  const paginationState = useMemo(() => {
    const totalItems = pagination.totalItems || 0;
    const pageSize = pagination.limit || 10;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const currentPage = Math.max(1, Math.min(pagination.page, totalPages));

    return {
      currentPage,
      pageSize,
      total: totalItems,
    };
  }, [pagination]);

  return (
    <AnimatedOrbsBackground>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <header className="mb-8 text-center sm:text-left">
          {/* 🎯 HEADER ESTÁNDAR MODERN DESIGN SYSTEM 2025 */}
          <div className="flex items-center space-x-4">
            <FiTool className="w-8 h-8 text-primary-500" strokeWidth={2.5} />
            <div>
              <h1 className="text-2xl md:text-5xl font-bold bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-500 bg-clip-text text-transparent">
                Gestión de Reparaciones
              </h1>
              <p className="mt-2 text-body-large text-slate-600 dark:text-slate-400">
                Administre los envíos y retornos de activos en reparación.
              </p>
            </div>
          </div>
        </header>

        <div className="glass-card p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex-grow w-full sm:w-auto flex items-center relative">
                  <FiSearch className="absolute ml-4 text-slate-400 pointer-events-none z-10"/>
                  <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Buscar por N/S, marca, proveedor..."
                      className="input-glass w-full pl-12"
                  />
              </div>
              <div className="flex items-center gap-2">
                  <button onClick={handleSearch} className="btn-primary flex items-center gap-2">
                    <FiSearch />
                    <span>Buscar</span>
                  </button>
                  <button onClick={handleRefresh} className="btn-secondary p-2.5">
                    <FiRefreshCw/>
                  </button>
              </div>
          </div>
        </div>

        {loading ? (
          <Loading text="Cargando reparaciones..." />
        ) : error ? (
          <div className="glass-card p-8 text-center">
            <div className="text-red-500 text-lg font-medium mb-2">Error al cargar datos</div>
            <div className="text-slate-600 dark:text-slate-400 mb-4">{error}</div>
            <button 
              onClick={handleRefresh}
              className="btn-primary"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="glass-card p-4">
            <DataTable
              columns={columns}
              data={repairs}
              keyExtractor={(item: ActiveRepair) => `repair-${item.id}-${item.reparacion_id || 'unknown'}`}
              pagination={paginationState}
              onPageChange={handlePageChange}
              isLoading={loading}
              emptyMessage="No hay reparaciones activas en este momento"
            />
          </div>
        )}
      </div>

      {isReturnModalOpen && selectedRepair && (
        <RepairReturnModal
          isOpen={isReturnModalOpen}
          onClose={() => setIsReturnModalOpen(false)}
          repair={selectedRepair}
          onRepairReturned={() => {
            setIsReturnModalOpen(false);
            addNotification({ type: 'success', message: 'Retorno de reparación procesado con éxito.' });
            handleRefresh();
          }}
        />
      )}

      {isDetailModalOpen && selectedAsset && (
        <InventoryDetail
          item={selectedAsset}
          onClose={() => setIsDetailModalOpen(false)}
          onRefresh={handleRefresh}
        />
      )}
    </AnimatedOrbsBackground>
  );
};

export default RepairsPage;


