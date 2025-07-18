import React, { useState } from 'react';
import { FiList } from 'react-icons/fi';
import ActiveAssignmentsTable from '../components/assignments/ActiveAssignmentsTable';
import InventoryDetail from '../components/inventory/InventoryDetail';
import { InventoryItem } from '../types';
import * as inventoryService from '../services/inventory.service';
import { useNotification } from '../contexts/NotificationContext';
import AnimatedOrbsBackground from '../components/layout/AnimatedOrbsBackground';

const Assignments: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState<InventoryItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const { addNotification } = useNotification();

  const handleViewHistory = async (serial: string) => {
    try {
      const response = await inventoryService.getInventoryBySerial(serial);
      if (response.success && response.data) {
        setSelectedAsset(response.data);
        setIsDetailModalOpen(true);
      } else {
        addNotification({ type: 'error', message: response.message || 'No se encontró el activo.' });
      }
    } catch (error) {
      if (error instanceof Error) {
        addNotification({ type: 'error', message: 'Error al buscar el activo.' });
      }
    }
  };

  const handleSearchById = async (id: number) => {
    try {
      const item = await inventoryService.getInventoryById(id);
      if (item) {
        setSelectedAsset(item);
        setIsDetailModalOpen(true);
      } else {
        addNotification({ type: 'error', message: 'No se encontró el activo.' });
      }
    } catch (error) {
      if (error instanceof Error) {
        addNotification({ type: 'error', message: 'Error al buscar el activo.' });
      }
    }
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedAsset(null);
  };

  return (
    <AnimatedOrbsBackground>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8 text-center sm:text-left">
          <div className="flex items-center space-x-4">
            <FiList className="w-8 h-8 text-primary-500" strokeWidth={2.5} />
            <div>
              <h1 className="text-2xl md:text-5xl font-bold bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-500 bg-clip-text text-transparent">
                Gestión de Asignaciones
              </h1>
              <p className="mt-2 text-body-large text-slate-600 dark:text-slate-400">
                Activos actualmente en uso por empleados, sectores y sucursales.
              </p>
            </div>
          </div>
        </div>
        
        <div className="glass-card p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
            Asignaciones Activas
          </h2>
          <ActiveAssignmentsTable />
        </div>
      </div>

      {isDetailModalOpen && selectedAsset && (
        <InventoryDetail 
          item={selectedAsset}
          onClose={handleCloseDetailModal}
          onRefresh={handleCloseDetailModal}
        />
      )}
    </AnimatedOrbsBackground>
  );
};

export default Assignments;


