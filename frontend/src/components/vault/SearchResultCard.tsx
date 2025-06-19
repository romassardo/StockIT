import React from 'react';
import { SearchResult, ResultType, EntityType } from '../../types';
import { FiCopy, FiHardDrive, FiSmartphone, FiPrinter, FiUser, FiPackage, FiTool, FiBox, FiArchive } from 'react-icons/fi';
import { useNotification } from '../../contexts/NotificationContext';
import { motion } from 'framer-motion';

interface SearchResultCardProps {
  result: SearchResult;
  onClick: (item: SearchResult) => void;
}

const getIcon = (resultType: ResultType, entityType?: EntityType) => {
  const iconClass = "w-7 h-7";
  switch (resultType) {
    case ResultType.INVENTORY:
      if (entityType === EntityType.NOTEBOOK) return <FiHardDrive className={`${iconClass} text-primary-500`} />;
      if (entityType === EntityType.CELULAR) return <FiSmartphone className={`${iconClass} text-primary-500`} />;
      if (entityType === EntityType.PERIFERICO) return <FiPrinter className={`${iconClass} text-info-500`} />;
      return <FiBox className={`${iconClass} text-slate-500`} />;
    case ResultType.ASSIGNMENT:
      if (entityType === EntityType.NOTEBOOK) return <FiHardDrive className={`${iconClass} text-success-500`} />;
      if (entityType === EntityType.CELULAR) return <FiSmartphone className={`${iconClass} text-success-500`} />;
      return <FiUser className={`${iconClass} text-success-500`} />;
    case ResultType.EMPLOYEE:
      return <FiUser className={`${iconClass} text-cyan-500`} />;
    case ResultType.PRODUCT:
      return <FiPackage className={`${iconClass} text-amber-500`} />;
    case ResultType.REPAIR:
        return <FiTool className={`${iconClass} text-rose-500`} />;
    default:
      return <FiArchive className={`${iconClass} text-slate-500`} />;
  }
};

const SearchResultCard: React.FC<SearchResultCardProps> = ({ result, onClick }) => {
  const { addNotification } = useNotification();

  const handleCopy = (e: React.MouseEvent, text: string | undefined, fieldName: string) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    addNotification({
      type: 'success',
      title: 'Copiado',
      message: `${fieldName} copiado al portapapeles.`,
    });
  };

  const hasSensitiveData = result.encryptionPassword || result.serialNumber;

  return (
    <div 
      className="h-full glass-card hover-lift flex flex-col p-5 cursor-pointer"
      onClick={() => onClick(result)}
    >
      <div className="flex items-start mb-4">
        <div className="mr-4 text-3xl opacity-80">
          {getIcon(result.resultType, result.entityType)}
        </div>
        <div className='flex-1'>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">{result.resultType}</p>
          <h3 className="font-bold text-slate-900 dark:text-slate-50 text-lg leading-tight">{result.title}</h3>
        </div>
      </div>
      
      <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 flex-grow">{result.description}</p>
      
      {hasSensitiveData && (
        <div className="border-t border-white/10 dark:border-white/5 pt-4 mt-auto">
          <div className="flex items-center space-x-2">
            {result.encryptionPassword && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => handleCopy(e, result.encryptionPassword, 'Contraseña')}
                className="flex-1 text-xs inline-flex items-center justify-center px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-lg transition-colors duration-200"
              >
                <FiCopy className="mr-1.5" /> Pass
              </motion.button>
            )}
            {result.serialNumber && (
               <motion.button
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={(e) => handleCopy(e, result.serialNumber, 'Nº de Serie')}
                 className="flex-1 text-xs inline-flex items-center justify-center px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 rounded-lg transition-colors duration-200"
               >
                 <FiCopy className="mr-1.5" /> Serie
               </motion.button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResultCard; 