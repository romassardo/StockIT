import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FiX, FiLock, FiPhone, FiMail, FiKey, FiShield, FiSmartphone, FiCopy, FiLoader } from 'react-icons/fi';
import { useNotification } from '../../contexts/NotificationContext';
import { motion } from 'framer-motion';
import { SearchResult, Assignment, ResultType } from '../../types';
import { getAssignmentDetails } from '../../services/assignment.service';

type SensitiveAsset = SearchResult & {
  marca?: string;
  modelo?: string;
  nombre_empleado?: string;
  password_encriptacion?: string;
  numero_telefono?: string;
  cuenta_gmail?: string;
  password_gmail?: string;
  codigo_2fa_whatsapp?: string;
  imei_1?: string;
  imei_2?: string;
  numero_serie?: string;
};

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

  const colorClasses = {
    yellow: 'from-amber-400/80 to-amber-500/80 border-amber-400/90',
    blue: 'from-sky-400/80 to-sky-500/80 border-sky-400/90',
    red: 'from-red-400/80 to-red-500/80 border-red-400/90',
    purple: 'from-purple-400/80 to-purple-500/80 border-purple-400/90',
    green: 'from-green-400/80 to-green-500/80 border-green-400/90',
    cyan: 'from-cyan-400/80 to-cyan-500/80 border-cyan-400/90',
    teal: 'from-teal-400/80 to-teal-500/80 border-teal-400/90',
  };

  const shadowClasses = {
    yellow: 'shadow-amber-500/20',
    blue: 'shadow-sky-500/20',
    red: 'shadow-red-500/20',
    purple: 'shadow-purple-500/20',
    green: 'shadow-green-500/20',
    cyan: 'shadow-cyan-500/20',
    teal: 'shadow-teal-500/20',
  }

  return (
    <div className={`relative p-4 rounded-xl border bg-gradient-to-br ${colorClasses[color]} shadow-lg ${shadowClasses[color]}`}>
      <div className="flex items-center">
        <div className={`mr-3 p-2 rounded-full bg-white/20`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-bold text-white">{label}</p>
          <p className="text-lg font-mono text-white tracking-wider">{value}</p>
        </div>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-2 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-colors duration-200"
        >
          <FiCopy />
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
  const [details, setDetails] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (initialAsset.resultType !== ResultType.ASSIGNMENT) {
        setError('No hay datos sensibles para este tipo de resultado.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const assignmentDetails = await getAssignmentDetails(initialAsset.itemId);
        setDetails(assignmentDetails);
      } catch (err: any) {
        setError(err.message || 'Error al cargar los detalles del activo.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [initialAsset]);
  
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
      return <p className="text-center text-red-400">{error}</p>;
    }

    if (!details) {
      return <p className="text-center text-slate-400">No se encontraron detalles.</p>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SensitiveDataCard icon={<FiLock />} label="Contraseña Encriptación" value={details.password_encriptacion} color="yellow" />
        <SensitiveDataCard icon={<FiPhone />} label="Número Teléfono" value={details.numero_telefono} color="blue" />
        <SensitiveDataCard icon={<FiMail />} label="Cuenta Gmail" value={details.cuenta_gmail} color="red" />
        <SensitiveDataCard icon={<FiKey />} label="Password Gmail" value={details.password_gmail} color="purple" />
        <SensitiveDataCard icon={<FiShield />} label="2FA WhatsApp" value={details.codigo_2fa_whatsapp} color="green" />
        <SensitiveDataCard icon={<FiSmartphone />} label="IMEI 1" value={details.imei_1} color="cyan" />
        <SensitiveDataCard icon={<FiSmartphone />} label="IMEI 2" value={details.imei_2} color="teal" />
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
        className="glass-card-deep w-full max-w-2xl m-4 rounded-2xl shadow-2xl p-6 border border-white/10"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">{initialAsset.title}</h2>
            <p className="text-slate-300">N/S: {initialAsset.serialNumber || 'No disponible'}</p>
            {initialAsset.relatedInfo && <p className="text-indigo-300 font-semibold">{initialAsset.relatedInfo}</p>}
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