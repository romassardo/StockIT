import React, { useEffect, useMemo, useState } from 'react';
import { assignmentService } from '../../services/assignment.service';
import { Assignment, InventoryItem } from '../../types';
import DataTable from '../common/DataTable';
import { FaEye } from 'react-icons/fa';
import { FiTool, FiCornerDownLeft } from 'react-icons/fi';
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch';
import SendToRepairModal from '../modals/SendToRepairModal';
import ReturnAssignmentModal from '../modals/ReturnAssignmentModal';
import InventoryDetail from '../inventory/InventoryDetail';

interface ActiveAssignmentsTableProps {
  // Las props onViewHistory y onViewDetails ya no son necesarias, 
  // la lógica se manejará localmente.
}

/**
 * Tabla de Asignaciones Activas
 * – Incluye buscador por N° de serie o nombre de empleado
 * – Filtro rápido Notebook / Celular / Todos
 * use context7
 */
const ActiveAssignmentsTable: React.FC<ActiveAssignmentsTableProps> = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'notebook' | 'cellphone'>('all');
  
  // State for Repair Modal
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [selectedAssetForRepair, setSelectedAssetForRepair] = useState<Assignment | null>(null);
  
  // State for Return Modal
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedAssetForReturn, setSelectedAssetForReturn] = useState<Assignment | null>(null);

  // State for History/Detail Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAssetForDetail, setSelectedAssetForDetail] = useState<InventoryItem | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const debouncedSearch = useDebouncedSearch(search, 300);

  const handleSendToRepair = (assignment: Assignment) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setSelectedAssetForRepair(assignment);
    setIsRepairModalOpen(true);
  };

  const handleReturnAsset = (assignment: Assignment) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setSelectedAssetForReturn(assignment);
    setIsReturnModalOpen(true);
  };
  
  const handleViewDetails = (assignment: Assignment) => {
    if (isProcessing || !assignment.inventario) return;
    setSelectedAssetForDetail(assignment.inventario);
    setIsDetailModalOpen(true);
  };
  
  const handleCloseModals = () => {
    setIsRepairModalOpen(false);
    setSelectedAssetForRepair(null);
    setIsReturnModalOpen(false);
    setSelectedAssetForReturn(null);
    setIsDetailModalOpen(false);
    setSelectedAssetForDetail(null);
    setIsProcessing(false);
  };

  const handleActionCompleted = () => {
    fetchData();
    handleCloseModals();
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const resp = await assignmentService.getActiveAssignments();
      setAssignments(resp.data as Assignment[]);
    } catch (error) {
      console.error('Error cargando asignaciones activas', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtrado memoizado
  const filtered = useMemo(() => {
    return assignments.filter((a) => {
      // Filtrado por búsqueda
      const serial = a.inventario?.numero_serie?.toLowerCase() || '';
      const empleado = `${a.empleado?.nombre || ''} ${a.empleado?.apellido || ''}`.trim().toLowerCase();
      const matchesSearch = serial.includes(debouncedSearch.toLowerCase()) || empleado.includes(debouncedSearch.toLowerCase());

      // Filtrado por tipo de producto
      let matchesType = true;
      if (filterType === 'notebook') matchesType = a.inventario?.producto?.categoria?.nombre === 'Notebooks';
      if (filterType === 'cellphone') matchesType = a.inventario?.producto?.categoria?.nombre === 'Celulares';

      return matchesSearch && matchesType;
    });
  }, [assignments, debouncedSearch, filterType]);

  return (
    <div className="space-y-4">
      {/* Barra de herramientas */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
        {/* Buscador */}
        <input
          type="text"
          placeholder="Buscar por número de serie o empleado..."
          className="w-full md:w-72 px-3 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-slate-100"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {/* Filtro */}
        <div className="flex space-x-2">
          {[
            { label: 'Todos', value: 'all' },
            { label: 'Notebooks', value: 'notebook' },
            { label: 'Celulares', value: 'cellphone' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterType(opt.value as any)}
              className={`px-3 py-1 rounded-md text-sm font-medium border transition-colors ${
                filterType === opt.value
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-primary-500/10'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <DataTable
        data={filtered}
        isLoading={loading}
        columns={[
          {
            id: 'numero_serie',
            header: 'N° Serie',
            accessor: (row: Assignment) => (
              <button 
                onClick={() => handleViewDetails(row)}
                className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline focus:outline-none"
                title={`Ver detalles de ${row.inventario?.numero_serie}`}
              >
                {row.inventario?.numero_serie || '-'}
              </button>
            ),
            sortable: true,
          },
          {
            id: 'producto',
            header: 'Producto',
            accessor: (row: Assignment) => `${row.inventario?.producto?.marca || ''} ${row.inventario?.producto?.modelo || ''}`,
          },
          {
            id: 'destino',
            header: 'Destino',
            accessor: (row: Assignment) => {
              if (row.empleado) return `${row.empleado.nombre} ${row.empleado.apellido}`;
              if (row.sector) return row.sector.nombre;
              if (row.sucursal) return row.sucursal.nombre;
              return '-';
            },
          },
          {
            id: 'fecha',
            header: 'Fecha Asignación',
            accessor: (row: Assignment) => new Date(row.fecha_asignacion).toLocaleDateString(),
          },
        ]}
        actionColumn={(row: Assignment) => (
          <div className="flex items-center justify-center space-x-4 text-lg">
            <button
              onClick={() => handleViewDetails(row)}
              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors disabled:opacity-50"
              title="Ver Detalles e Historial"
              disabled={isProcessing}
            >
              <FaEye />
            </button>
            
            <button
              onClick={() => handleReturnAsset(row)}
              className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors disabled:opacity-50"
              title="Registrar Devolución"
              disabled={isProcessing}
            >
              <FiCornerDownLeft />
            </button>
            
            <button
              onClick={() => handleSendToRepair(row)}
              className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 transition-colors disabled:opacity-50"
              title="Enviar a Reparación"
              disabled={isProcessing}
            >
              <FiTool />
            </button>
          </div>
        )}
        keyExtractor={(row: Assignment) => row.id}
      />

      {isRepairModalOpen && selectedAssetForRepair && selectedAssetForRepair.inventario && (
        <SendToRepairModal
          isOpen={isRepairModalOpen}
          onClose={handleCloseModals}
          onRepairSubmitted={handleActionCompleted}
          preselectedAsset={{
            inventario_individual_id: selectedAssetForRepair.inventario.id,
            numero_serie: selectedAssetForRepair.inventario.numero_serie,
            producto_info: `${selectedAssetForRepair.inventario.producto?.marca || ''} ${selectedAssetForRepair.inventario.producto?.modelo || ''}`,
            empleado_info: selectedAssetForRepair.empleado ? 
              `${selectedAssetForRepair.empleado.nombre} ${selectedAssetForRepair.empleado.apellido}` : 
              undefined
          }}
        />
      )}

      {isReturnModalOpen && selectedAssetForReturn && selectedAssetForReturn.inventario && (
        <ReturnAssignmentModal
          isOpen={isReturnModalOpen}
          onClose={handleCloseModals}
          onAssignmentReturned={handleActionCompleted}
          assignment={{
            id: selectedAssetForReturn.id,
            numero_serie: selectedAssetForReturn.inventario?.numero_serie || '',
            producto_info: `${selectedAssetForReturn.inventario?.producto?.marca || ''} ${selectedAssetForReturn.inventario?.producto?.modelo || ''}`,
            empleado_info: selectedAssetForReturn.empleado ? 
              `${selectedAssetForReturn.empleado.nombre} ${selectedAssetForReturn.empleado.apellido}` : 
              'Sin asignar'
          }}
        />
      )}

      {isDetailModalOpen && selectedAssetForDetail && (
        <InventoryDetail
          item={selectedAssetForDetail}
          onClose={handleCloseModals}
          onRefresh={handleActionCompleted}
        />
      )}
    </div>
  );
};

export default ActiveAssignmentsTable;
