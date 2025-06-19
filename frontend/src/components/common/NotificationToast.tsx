import React, { useEffect, useState } from 'react';
import { FiAlertCircle, FiCheckCircle, FiInfo, FiX, FiAlertTriangle } from 'react-icons/fi';
import { Notification, NotificationType } from '../../contexts/NotificationContext';

interface NotificationToastProps {
  notification: Notification;
  onClose: (id: string) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progressWidth, setProgressWidth] = useState(100);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  // Configuraciones según el tipo de notificación
  const getNotificationConfig = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return {
          icon: <FiCheckCircle className="h-5 w-5" />,
          bgColor: 'bg-[#28A745]',
          textColor: 'text-white',
        };
      case 'error':
        return {
          icon: <FiAlertCircle className="h-5 w-5" />,
          bgColor: 'bg-[#DC3545]',
          textColor: 'text-white',
        };
      case 'warning':
        return {
          icon: <FiAlertTriangle className="h-5 w-5" />,
          bgColor: 'bg-[#FFC107]',
          textColor: 'text-[#212529]',
        };
      case 'info':
      default:
        return {
          icon: <FiInfo className="h-5 w-5" />,
          bgColor: 'bg-[#17A2B8]',
          textColor: 'text-white',
        };
    }
  };

  const config = getNotificationConfig(notification.type);

  // Manejar la barra de progreso y eliminación automática
  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const totalSteps = 100;
      const stepDuration = notification.duration / totalSteps;
      
      const id = setInterval(() => {
        setProgressWidth((prevWidth) => {
          const newWidth = prevWidth - (100 / totalSteps);
          return newWidth <= 0 ? 0 : newWidth;
        });
      }, stepDuration);
      
      setIntervalId(id);
      
      return () => {
        if (id) clearInterval(id);
      };
    }
  }, [notification.duration]);

  // Cuando la barra de progreso llega a 0, inicia la animación de salida
  useEffect(() => {
    if (progressWidth === 0) {
      if (intervalId) clearInterval(intervalId);
      handleClose();
    }
  }, [progressWidth]);

  // Manejar el cierre de la notificación
  const handleClose = () => {
    setIsExiting(true);
    
    // Esperar a que termine la animación antes de eliminar la notificación
    setTimeout(() => {
      onClose(notification.id);
    }, 300);
  };

  return (
    <div
      className={`
        max-w-md w-full shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 mb-3
        transform transition-all duration-300 ease-in-out z-50
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
        ${config.bgColor} ${config.textColor}
      `}
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {config.icon}
          </div>
          <div className="ml-3 flex-1">
            {notification.title && (
              <p className="text-sm font-medium">
                {notification.title}
              </p>
            )}
            <p className={`text-sm ${!notification.title ? 'font-medium' : ''}`}>
              {notification.message}
            </p>
          </div>
        </div>
      </div>
      <div className="flex">
        <button
          onClick={handleClose}
          className={`w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium focus:outline-none`}
        >
          <FiX className="h-5 w-5" />
        </button>
      </div>
      
      {/* Barra de progreso */}
      {notification.duration !== 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-10">
          <div 
            className="h-full bg-white bg-opacity-30 transition-all ease-linear"
            style={{ width: `${progressWidth}%` }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default NotificationToast;
