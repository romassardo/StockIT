import React from 'react';
import { FiUsers } from 'react-icons/fi';
import AssignmentsByDestinationReport from '../../components/reports/AssignmentsByDestinationReport';

const AssignmentsByEmployeeReport: React.FC = () => {
  return (
    <AssignmentsByDestinationReport
      reportType="Empleado"
      title="Asignaciones por Empleado"
      description="Reporte detallado de activos asignados organizados por empleado"
      icon={FiUsers}
      color="success"
    />
  );
};

export default AssignmentsByEmployeeReport;