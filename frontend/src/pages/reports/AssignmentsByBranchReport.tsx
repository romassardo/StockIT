import React from 'react';
import { FiTruck } from 'react-icons/fi';
import AssignmentsByDestinationReport from '../../components/reports/AssignmentsByDestinationReport';

const AssignmentsByBranchReport: React.FC = () => {
  return (
    <AssignmentsByDestinationReport
      reportType="Sucursal"
      title="Asignaciones por Sucursal"
      description="Distribución geográfica de activos asignados por sucursal o ubicación"
      icon={FiTruck}
      color="info"
    />
  );
};

export default AssignmentsByBranchReport;