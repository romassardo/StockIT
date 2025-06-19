import React, { useEffect, useState } from 'react';
import { assignmentService, DetailedAssignmentData } from '../../services/assignment.service';
import { FaTimes, FaSpinner, FaKey, FaEnvelope, FaMobileAlt, FaWhatsapp, FaInfoCircle, FaUserShield } from 'react-icons/fa';

interface AssignmentDetailsModalProps {
  assignmentId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

const SensitiveField: React.FC<{ label: string; value?: string | null; icon: React.ReactNode }> = ({ label, value, icon }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
      <span className="mt-1 text-primary-500">{icon}</span>
      <div className="flex flex-col">
        <span className="font-medium leading-none">{label}</span>
        <span className="break-all leading-snug text-slate-600 dark:text-slate-200">{value}</span>
      </div>
    </div>
  );
};

const AssignmentDetailsModal: React.FC<AssignmentDetailsModalProps> = ({ assignmentId, isOpen, onClose }) => {
  const [details, setDetails] = useState<DetailedAssignmentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showContent, setShowContent] = useState(false); // Estado para la animación del contenido

  useEffect(() => {
    if (isOpen && assignmentId) {
      const fetchDetails = async () => {
        setLoading(true);
        setError(null);
        setDetails(null);
        try {
          const response = await assignmentService.getAssignmentDetails(assignmentId);
          if (response.success) {
            setDetails(response.data);
          } else {
            setError(response.message || 'Error al cargar los detalles de la asignación.');
          }
        } catch (err: any) {
          console.error('Error fetching assignment details:', err);
          setError(err.message || 'Ocurrió un error inesperado.');
        }
        setLoading(false);
      };
      fetchDetails();
    }

    // Controlar la animación del contenido
    if (isOpen) {
      // Pequeño retraso para permitir que el DOM se actualice y la transición se aplique
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 50); 
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isOpen, assignmentId]);

  // No renderizar nada si no está abierto, pero controlar la opacidad del backdrop con clases
  const backdropClasses = isOpen 
    ? 'opacity-100'
    : 'opacity-0 pointer-events-none'; // pointer-events-none para que no interfiera cuando está oculto

  const contentClasses = showContent
    ? 'scale-100 opacity-100'
    : 'scale-95 opacity-0';

  const isSensitiveProduct = details && (details.categoria_nombre === 'Notebooks' || details.categoria_nombre === 'Celulares');

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out ${backdropClasses}`}
      onClick={onClose}
    >
      {/* Solo renderizar el contenido del modal si isOpen es true, para permitir la animación de salida si se desea */} 
      {isOpen && (
        <div 
          className={`bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 transform transition-all duration-300 ease-in-out ${contentClasses}`}
          onClick={(e) => e.stopPropagation()} // Evita que el clic dentro del modal lo cierre
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Detalles de la Asignación</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <FaTimes size={20} />
          </button>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-10">
            <FaSpinner className="animate-spin text-primary-500 text-4xl" />
            <p className="mt-3 text-slate-600 dark:text-slate-300">Cargando detalles...</p>
          </div>
        )}

        {error && (
          <div className="py-10 text-center">
            <FaInfoCircle className="text-red-500 text-4xl mx-auto mb-3" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button 
              onClick={onClose} 
              className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
            >
              Cerrar
            </button>
          </div>
        )}

        {details && !loading && !error && (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 py-3">
              <div><span className="text-sm font-medium text-slate-500 dark:text-slate-400">ID Asignación:</span> <span className="text-sm text-slate-700 dark:text-slate-200">{details.asignacion_id}</span></div>
              <div><span className="text-sm font-medium text-slate-500 dark:text-slate-400">Fecha Asignación:</span> <span className="text-sm text-slate-700 dark:text-slate-200">{new Date(details.fecha_asignacion).toLocaleDateString()}</span></div>
              <div><span className="text-sm font-medium text-slate-500 dark:text-slate-400">Producto:</span> <span className="text-sm text-slate-700 dark:text-slate-200">{details.producto_marca} {details.producto_modelo} ({details.categoria_nombre})</span></div>
              <div><span className="text-sm font-medium text-slate-500 dark:text-slate-400">N° Serie:</span> <span className="text-sm text-slate-700 dark:text-slate-200">{details.numero_serie}</span></div>
              {details.empleado_nombre && 
                <div><span className="text-sm font-medium text-slate-500 dark:text-slate-400">Empleado:</span> <span className="text-sm text-slate-700 dark:text-slate-200">{details.empleado_nombre} {details.empleado_apellido || ''}</span></div>
              }
              {details.sector_nombre && 
                <div><span className="text-sm font-medium text-slate-500 dark:text-slate-400">Sector:</span> <span className="text-sm text-slate-700 dark:text-slate-200">{details.sector_nombre}</span></div>
              }
              {details.sucursal_nombre && 
                <div><span className="text-sm font-medium text-slate-500 dark:text-slate-400">Sucursal:</span> <span className="text-sm text-slate-700 dark:text-slate-200">{details.sucursal_nombre}</span></div>
              }
              <div><span className="text-sm font-medium text-slate-500 dark:text-slate-400">Estado Activo:</span> <span className={`text-sm px-2 py-0.5 rounded-full ${details.asignacion_activa ? 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100' : 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100'}`}>{details.asignacion_activa ? 'Sí' : 'No'}</span></div>
              {details.fecha_devolucion && 
                <div><span className="text-sm font-medium text-slate-500 dark:text-slate-400">Fecha Devolución:</span> <span className="text-sm text-slate-700 dark:text-slate-200">{new Date(details.fecha_devolucion).toLocaleDateString()}</span></div>
              }
              <div><span className="text-sm font-medium text-slate-500 dark:text-slate-400">Asignado por:</span> <span className="text-sm text-slate-700 dark:text-slate-200">{details.usuario_asigna_nombre}</span></div>
              {details.usuario_recibe_nombre && 
                <div><span className="text-sm font-medium text-slate-500 dark:text-slate-400">Recibido por:</span> <span className="text-sm text-slate-700 dark:text-slate-200">{details.usuario_recibe_nombre}</span></div>
              }
            </div>
            {details.asignacion_observaciones && (
              <div className="py-3">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Observaciones:</span>
                <p className="text-sm text-slate-700 dark:text-slate-200 mt-1 whitespace-pre-wrap">{details.asignacion_observaciones}</p>
              </div>
            )}

            {isSensitiveProduct && (
              <div className="py-4">
                <h3 className="text-md font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center">
                  <FaUserShield className="mr-2 text-primary-500" /> Datos Sensibles del Equipo
                </h3>
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Contraseña Encriptación', value: details.password_encriptacion, icon: <FaKey /> },
                    { label: 'Cuenta Gmail', value: details.cuenta_gmail, icon: <FaEnvelope /> },
                    { label: 'Password Gmail', value: details.password_gmail, icon: <FaKey /> },
                    { label: 'Número Teléfono', value: details.numero_telefono, icon: <FaMobileAlt /> },
                    { label: 'Código 2FA WhatsApp', value: details.codigo_2fa_whatsapp, icon: <FaWhatsapp /> },
                    { label: 'IMEI 1', value: details.imei_1, icon: <FaMobileAlt /> },
                    { label: 'IMEI 2', value: details.imei_2, icon: <FaMobileAlt /> },
                  ].map(({ label, value, icon }) => (
                    <SensitiveField key={label} label={label} value={value} icon={icon} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      )}
    </div>
  );
};

export default AssignmentDetailsModal;
