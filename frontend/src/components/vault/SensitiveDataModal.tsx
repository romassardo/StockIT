import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FiX, FiLock, FiPhone, FiMail, FiKey, FiShield, FiSmartphone, FiCopy, FiLoader, FiUser, FiMapPin, FiHome } from 'react-icons/fi';
import { useNotification } from '../../contexts/NotificationContext';
import { motion } from 'framer-motion';
import { SearchResult, Assignment, ResultType } from '../../types';
import { getAssignmentDetails, assignmentService } from '../../services/assignment.service';

type SensitiveDataCardProps = {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  color: 'yellow' | 'blue' | 'red' | 'purple' | 'green' | 'cyan' | 'teal';
};

const SensitiveDataCard: React.FC<SensitiveDataCardProps> = ({ icon, label, value, color }) => {
  const { addNotification } = useNotification();

  const handleCopy = () => {
    if (value) {
      navigator.clipboard.writeText(value);
      addNotification({
        title: 'Copiado',
        message: `${label} copiado al portapapeles.`,
        type: 'success',
      });
    }
  };

  if (!value) return null;

  const colorStyles = {
    yellow: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-200',
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-400'
    },
    blue: {
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/20',
      text: 'text-sky-200',
      iconBg: 'bg-sky-500/20',
      iconColor: 'text-sky-400'
    },
    red: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      text: 'text-red-200',
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-400'
    },
    purple: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      text: 'text-purple-200',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400'
    },
    green: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-200',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400'
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      text: 'text-cyan-200',
      iconBg: 'bg-cyan-500/20',
      iconColor: 'text-cyan-400'
    },
    teal: {
      bg: 'bg-teal-500/10',
      border: 'border-teal-500/20',
      text: 'text-teal-200',
      iconBg: 'bg-teal-500/20',
      iconColor: 'text-teal-400'
    },
  };

  const style = colorStyles[color];

  return (
    <div className={`relative p-4 rounded-xl border ${style.bg} ${style.border} backdrop-blur-sm transition-all duration-300 hover:bg-opacity-20`}>
      <div className="flex items-start">
        <div className={`mr-3 p-2.5 rounded-lg ${style.iconBg} ${style.iconColor}`}>
          {React.cloneElement(icon as React.ReactElement, { size: 20 })}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium uppercase tracking-wider mb-1 opacity-80 ${style.text}`}>{label}</p>
          <p className="text-base font-mono text-white tracking-wide break-all">{value}</p>
        </div>
        <button
          onClick={handleCopy}
          className={`ml-2 p-2 rounded-lg ${style.text} hover:bg-white/10 transition-colors duration-200`}
          title="Copiar"
        >
          <FiCopy size={18} />
        </button>
      </div>
    </div>
  );
};

type SensitiveDataModalProps = {
  initialAsset: SearchResult;
  onClose: () => void;
};

const SensitiveDataModal: React.FC<SensitiveDataModalProps> = ({ initialAsset, onClose }) => {
  // Ahora details puede ser un array para soportar múltiples asignaciones de un empleado
  const [assignmentsList, setAssignmentsList] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (initialAsset.resultType === ResultType.ASSIGNMENT) {
          // Caso 1: Click directo en una asignación
          const assignmentDetails = await getAssignmentDetails(initialAsset.itemId);
          setAssignmentsList([assignmentDetails]);
        } 
        else if (initialAsset.resultType === ResultType.EMPLOYEE) {
          // Caso 2: Click en un empleado -> Buscar sus asignaciones activas
          const response = await assignmentService.getAssignmentsByEmployee(initialAsset.itemId);
          
          if (response.success && Array.isArray(response.data) && response.data.length > 0) {
            setAssignmentsList(response.data);
          } else {
            setError('Este empleado no tiene asignaciones activas con datos sensibles.');
          }
        } 
        else {
          setError('No hay datos sensibles para este tipo de resultado.');
        }
      } catch (err: any) {
        console.error("Error fetching details:", err);
        setError(err.message || 'Error al cargar los detalles.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [initialAsset]);
  
  const renderDetails = (details: Assignment) => {
    // Determinar quién tiene asignado el activo
    const getAsignadoA = () => {
      if (details.empleado) {
        return { tipo: 'Empleado', nombre: `${details.empleado.nombre} ${details.empleado.apellido || ''}`.trim(), icon: <FiUser /> };
      }
      if (details.empleado_nombre) {
        return { tipo: 'Empleado', nombre: details.empleado_nombre, icon: <FiUser /> };
      }
      if (details.sector) {
        return { tipo: 'Sector', nombre: details.sector.nombre, icon: <FiMapPin /> };
      }
      if (details.sector_nombre) {
        return { tipo: 'Sector', nombre: details.sector_nombre, icon: <FiMapPin /> };
      }
      if (details.sucursal) {
        return { tipo: 'Sucursal', nombre: details.sucursal.nombre, icon: <FiHome /> };
      }
      if (details.sucursal_nombre) {
        return { tipo: 'Sucursal', nombre: details.sucursal_nombre, icon: <FiHome /> };
      }
      return null;
    };

    const asignadoA = getAsignadoA();

    return (
      <div key={details.id || Math.random()} className="mb-8 last:mb-0">
        {asignadoA && (
          <div className="mb-4 pb-3 border-b border-white/10 flex items-center gap-2 text-sm">
            <span className="text-slate-400">{asignadoA.tipo}:</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              {asignadoA.icon}
              {asignadoA.nombre}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SensitiveDataCard icon={<FiLock />} label="Contraseña Encriptación" value={details.password_encriptacion} color="yellow" />
          <SensitiveDataCard icon={<FiPhone />} label="Número Teléfono" value={details.numero_telefono} color="blue" />
          <SensitiveDataCard icon={<FiMail />} label="Cuenta Gmail" value={details.cuenta_gmail} color="red" />
          <SensitiveDataCard icon={<FiKey />} label="Password Gmail" value={details.password_gmail} color="purple" />
          <SensitiveDataCard icon={<FiShield />} label="2FA WhatsApp" value={details.codigo_2fa_whatsapp} color="green" />
          <SensitiveDataCard icon={<FiSmartphone />} label="IMEI 1" value={details.imei_1} color="cyan" />
          <SensitiveDataCard icon={<FiSmartphone />} label="IMEI 2" value={details.imei_2} color="teal" />
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-48">
          <FiLoader className="animate-spin text-4xl text-indigo-300" />
          <p className="mt-4 text-slate-300">Cargando datos sensibles...</p>
        </div>
      );
    }

    if (error) {
      return <p className="text-center text-red-400 py-8">{error}</p>;
    }

    if (assignmentsList.length === 0) {
      return <p className="text-center text-slate-400 py-8">No se encontraron detalles.</p>;
    }

    return (
      <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
        {assignmentsList.map(assignment => renderDetails(assignment))}
      </div>
    );
  };

  return ReactDOM.createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="glass-card-deep w-full max-w-2xl m-4 rounded-2xl shadow-2xl p-6 border border-white/10 max-h-[90vh] flex flex-col"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white">{initialAsset.title}</h2>
            {initialAsset.resultType === ResultType.EMPLOYEE && (
              <p className="text-emerald-400 text-sm font-medium mt-1">Mostrando activos asignados</p>
            )}
            {initialAsset.resultType !== ResultType.EMPLOYEE && (
              <p className="text-slate-300">N/S: {initialAsset.serialNumber || 'No disponible'}</p>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-300 hover:bg-white/10 hover:text-white transition-colors">
            <FiX size={24} />
          </button>
        </div>
        
        {renderContent()}

      </motion.div>
    </motion.div>,
    document.body
  );
};

export default SensitiveDataModal;