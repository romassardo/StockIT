import React from 'react';
import { FiClipboard } from 'react-icons/fi';
import AssignmentsByDestinationReport from '../../components/reports/AssignmentsByDestinationReport';

const AssignmentsBySectorReport: React.FC = () => {
  return (
    <AssignmentsByDestinationReport
      reportType="Sector"
      title="Asignaciones por Sector"
      description="Distribución de activos asignados por departamento o sector organizacional"
      icon={FiClipboard}
      color="warning"
    />
  );
};

export default AssignmentsBySectorReport;