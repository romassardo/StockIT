import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiUser, FiHome, FiMapPin, FiLock, FiPhone, FiMail, FiShield, FiSmartphone, FiPackage, FiChevronDown, FiSearch } from 'react-icons/fi';
import { assignmentService, type AssignmentRequest } from '../../services/assignment.service';
import { employeeService } from '../../services/employee.service';
import { sectorService } from '../../services/sector.service';
import { branchService } from '../../services/branch.service';
import type { Employee, Sector, Branch } from '../../types';
import { getAllInventory, createInventoryItem } from '../../services/inventory.service';
import { useTheme } from '../../contexts/ThemeContext';
import { type InventoryItem } from '../../types';
import Modal from '../common/Modal';

// ðŸŽ¯ Constantes de configuraciÃ³n
const Z_INDEX = {
  MODAL_BACKDROP: 9998,
  MODAL_CONTENT: 9999,
  DROPDOWN: 99999,
  DROPDOWN_OVERLAY: 99998
} as const;

const VALIDATION_RULES = {
  MIN_PASSWORD_LENGTH: 8,
  MIN_PHONE_LENGTH: 10,
  IMEI_LENGTH: 15,
  MIN_EMAIL_LENGTH: 5
} as const;

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  zIndex?: number;
  inventoryItem?: InventoryItem | null; // Para asignaciÃ³n desde tarjeta
  // Si no hay inventoryItem, serÃ¡ un formulario general de asignaciÃ³n
}

interface SearchableSelectProps {
  value: string | number;
  onChange: (value: any) => void;
  options: { id: number; label: string }[];
  placeholder: string;
  theme: 'dark' | 'light';
  emptyLabel: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  theme,
  emptyLabel
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.id === value);

  const handleSelect = (optionValue: any) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      updateDropdownPosition();
    }
    setIsOpen(!isOpen);
  };

  // Actualizar posiciÃ³n cuando se abra o se redimensione la ventana
  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      const handleResize = () => updateDropdownPosition();
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleResize);
      };
    }
  }, [isOpen]);

  const dropdownContent = isOpen && (
    <>
      {/* ðŸŽ¨ Dropdown con Portal */}
      <div 
        className={`fixed animate-glass-appear ${
          theme === 'dark' ? 'glass-dark' : 'glass-card'
        } border border-white/20 shadow-2xl max-h-60 overflow-hidden`}
        style={{
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          width: dropdownPosition.width,
          zIndex: Z_INDEX.DROPDOWN
        }}
      >
        {/* ðŸ” Search input compacto */}
        <div className="p-3 border-b border-white/10">
          <div className="relative">
            <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar..."
              className={`input-glass pl-8 pr-3 py-2 text-sm ${
                theme === 'dark' 
                  ? 'bg-slate-800/50 placeholder-slate-400' 
                  : 'bg-white/50 placeholder-slate-500'
              }`}
              autoFocus
            />
          </div>
        </div>

        {/* ðŸ“‹ Options list compacto */}
        <div className="max-h-40 overflow-y-auto scrollbar-hide">
          {/* Empty option */}
          <button
            type="button"
            onClick={() => handleSelect(undefined)}
            className={`w-full px-3 py-2.5 text-left transition-all duration-200 border-b border-white/5 text-sm ${
              !value ? 'bg-primary-500/20 text-primary-600 dark:text-primary-400' : ''
            } ${
              theme === 'dark'
                ? 'hover:bg-slate-700/50 text-slate-300'
                : 'hover:bg-slate-100/50 text-slate-700'
            }`}
          >
            <span className="font-medium">{emptyLabel}</span>
          </button>

          {/* Filtered options */}
          {filteredOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option.id)}
              className={`w-full px-3 py-2.5 text-left transition-all duration-200 border-b border-white/5 text-sm ${
                value === option.id ? 'bg-primary-500/20 text-primary-600 dark:text-primary-400' : ''
              } ${
                theme === 'dark'
                  ? 'hover:bg-slate-700/50 text-slate-300'
                  : 'hover:bg-slate-100/50 text-slate-700'
              }`}
            >
              <span className="font-medium">{option.label}</span>
            </button>
          ))}

          {/* No results compacto */}
          {filteredOptions.length === 0 && searchTerm && (
            <div className={`px-3 py-4 text-center ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}>
              <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-slate-500/10 flex items-center justify-center">
                <FiSearch className="w-4 h-4" />
              </div>
              <p className="text-sm font-medium">No se encontraron resultados</p>
              <p className="text-xs opacity-75 mt-1">Intenta con otros tÃ©rminos</p>
            </div>
          )}
        </div>
      </div>

      {/* ðŸŽ­ Overlay para cerrar dropdown */}
      <div
        className="fixed inset-0 bg-transparent"
        style={{ zIndex: Z_INDEX.DROPDOWN_OVERLAY }}
        onClick={() => setIsOpen(false)}
      />
    </>
  );

  return (
    <div className="relative">
      {/* ðŸŽ¯ Trigger button compacto */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`glass-card input-glass hover-lift transition-all duration-300 flex items-center justify-between group py-2.5 px-3 ${
          isOpen ? 'ring-2 ring-primary-500/30' : ''
        }`}
      >
        <span className={`font-medium text-sm ${selectedOption ? 'text-current' : 'opacity-60'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <FiChevronDown className={`w-4 h-4 transition-transform duration-300 ${
          isOpen ? 'rotate-180 text-primary-500' : 'text-slate-400 group-hover:text-slate-600'
        }`} />
      </button>

      {/* Renderizar dropdown con Portal */}
      {typeof document !== 'undefined' && createPortal(
        dropdownContent,
        document.body
      )}
    </div>
  );
};

export const AssignmentModal: React.FC<AssignmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  zIndex = 60,
  inventoryItem
}) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [availableItems, setAvailableItems] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  
  // Estado del formulario
  const [formData, setFormData] = useState<AssignmentRequest>({
    inventario_individual_id: inventoryItem?.id || 0,
    empleado_id: undefined,
    sector_id: undefined,
    sucursal_id: undefined,
    observaciones: '',
    
    // Campos especÃ­ficos para notebooks
    password_encriptacion: '',
    
    // Campos especÃ­ficos para celulares
    numero_telefono: '',
    cuenta_gmail: '',
    password_gmail: '',
    codigo_2fa_whatsapp: '',
    imei_1: '',
    imei_2: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Determinar si es notebook o celular (del item seleccionado o preseleccionado)
  const currentItem = inventoryItem || selectedItem;
  const isNotebook = currentItem?.producto?.categoria?.nombre?.toLowerCase().includes('notebook');
  const isCelular = currentItem?.producto?.categoria?.nombre?.toLowerCase().includes('celular');

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      if (inventoryItem) {
        // Si hay item preseleccionado, configurar el ID pero LIMPIAR todos los campos
        setFormData({
          inventario_individual_id: inventoryItem.id,
          empleado_id: undefined,
          sector_id: undefined,
          sucursal_id: undefined,
          observaciones: '',
          password_encriptacion: '',
          numero_telefono: '',
          cuenta_gmail: '',
          password_gmail: '',
          codigo_2fa_whatsapp: '',
          imei_1: '',
          imei_2: ''
        });
      } else {
        // Si no hay item preseleccionado, limpiar todo incluyendo el ID
        setFormData({
          inventario_individual_id: 0,
          empleado_id: undefined,
          sector_id: undefined,
          sucursal_id: undefined,
          observaciones: '',
          password_encriptacion: '',
          numero_telefono: '',
          cuenta_gmail: '',
          password_gmail: '',
          codigo_2fa_whatsapp: '',
          imei_1: '',
          imei_2: ''
        });
        if (!availableItems.length) {
          loadAvailableItems();
        }
      }
      setErrors({});
    }
  }, [isOpen, inventoryItem]);

  // useEffect para cargar datos iniciales cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  // useEffect adicional para limpiar campos cuando cambia el item seleccionado
  useEffect(() => {
    if (selectedItem || inventoryItem) {
      // Limpiar todos los campos del formulario cuando cambia el item
      setFormData({
        inventario_individual_id: inventoryItem?.id || selectedItem?.id || 0,
        empleado_id: undefined,
        sector_id: undefined,
        sucursal_id: undefined,
        observaciones: '',
        password_encriptacion: '',
        numero_telefono: '',
        cuenta_gmail: '',
        password_gmail: '',
        codigo_2fa_whatsapp: '',
        imei_1: '',
        imei_2: ''
      });
      setErrors({});
    }
  }, [selectedItem?.id, inventoryItem?.id]);

  const loadInitialData = async () => {
    try {
      console.log('ðŸ”„ Cargando datos iniciales...');
      
      // Cargar empleados
      try {
        const employeesRes = await employeeService.getActiveEmployees();
        console.log('ðŸ‘¥ Empleados response:', employeesRes);
        if (employeesRes.success) {
          // Asegurarse de que sea un array; manejar posibles envoltorios tipo { employees: [...] } o { data: [...] }
          const empList = Array.isArray(employeesRes.data)
            ? employeesRes.data
            : (employeesRes.data as any)?.employees || (employeesRes.data as any)?.data || [];
          setEmployees(empList);
          console.log('âœ… Empleados cargados:', empList.length);
        } else {
          console.error('âŒ Error empleados:', employeesRes.message);
        }
      } catch (empError) {
        console.error('âŒ Error cargando empleados:', empError);
      }

      // Cargar sectores
      try {
        const sectorsRes = await sectorService.getActiveSectors();
        console.log('ðŸ¢ Sectores response:', sectorsRes);
        if (sectorsRes.success) {
          setSectors(sectorsRes.data);
          console.log('âœ… Sectores cargados:', sectorsRes.data.length);
        } else {
          console.error('âŒ Error sectores:', sectorsRes.message);
        }
      } catch (secError) {
        console.error('âŒ Error cargando sectores:', secError);
      }

      // Cargar sucursales
      try {
        const branchesRes = await branchService.getActiveBranches();
        console.log('ðŸ“ Sucursales response:', branchesRes);
        if (branchesRes.success) {
          setBranches(branchesRes.data);
          console.log('âœ… Sucursales cargadas:', branchesRes.data.length);
        } else {
          console.error('âŒ Error sucursales:', branchesRes.message);
        }
      } catch (branchError) {
        console.error('âŒ Error cargando sucursales:', branchError);
      }

    } catch (error) {
      console.error('âŒ Error general cargando datos:', error);
      setErrors(prev => ({
        ...prev,
        loading: 'Error cargando datos iniciales. Por favor, recarga la pÃ¡gina.'
      }));
    }
  };

  const loadAvailableItems = useCallback(async () => {
    try {
      const response = await getInventoryItems({ estado: 'Disponible', search: '' });
      if (response.success && Array.isArray(response.data)) {
        setAvailableItems(response.data);
      }
    } catch (error) {
      console.error("Error al cargar items disponibles", error);
    }
  }, []);

  const handleItemSelection = (itemId: number) => {
    const item = availableItems.find(i => i.id === itemId);
    setSelectedItem(item || null);
    setFormData(prev => ({
      ...prev,
      inventario_individual_id: item ? item.id : 0
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: any = {};

    // 1. Validar que se haya seleccionado un item
    if (!formData.inventario_individual_id || formData.inventario_individual_id === 0) {
      newErrors.item = 'Debes seleccionar un producto para asignar.';
    }

    // 2. Validar que se haya seleccionado al menos un destino
    const destinationCount = [formData.empleado_id, formData.sector_id, formData.sucursal_id].filter(Boolean).length;
    if (destinationCount === 0) {
      newErrors.destination = 'Debes seleccionar al menos un destino (Empleado, Sector o Sucursal).';
    }

    // 3. Validaciones condicionales basadas en la categorÃ­a del producto
    const selectedItem = availableItems.find(item => item.id === formData.inventario_individual_id);
    if (selectedItem) {
      const categoryName = selectedItem.producto?.categoria?.nombre.toLowerCase();
      if (categoryName === 'notebooks') {
        if (!formData.password_encriptacion) {
          newErrors.password_encriptacion = 'La contraseÃ±a de encriptaciÃ³n es obligatoria para notebooks.';
        }
      } else if (categoryName === 'celulares') {
        if (!formData.numero_telefono) newErrors.numero_telefono = 'El nÃºmero de telÃ©fono es obligatorio para celulares.';
        if (!formData.cuenta_gmail) newErrors.cuenta_gmail = 'La cuenta de Gmail es obligatoria para celulares.';
        if (!formData.password_gmail) newErrors.password_gmail = 'La contraseÃ±a de Gmail es obligatoria para celulares.';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = validateForm();
    if (!isValid) {
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      const response = await assignmentService.createAssignment(formData);
      
      if (response.success) {
        onSuccess();
        onClose();
        // Limpiar formulario
        setFormData({
          inventario_individual_id: 0,
          empleado_id: undefined,
          sector_id: undefined,
          sucursal_id: undefined,
          observaciones: '',
          password_encriptacion: '',
          numero_telefono: '',
          cuenta_gmail: '',
          password_gmail: '',
          codigo_2fa_whatsapp: '',
          imei_1: '',
          imei_2: ''
        });
        setSelectedItem(null);
      }
    } catch (error) {
      let errorMessage = 'Error al crear la asignaciÃ³n. Por favor intente nuevamente.';
      
      // Manejo especÃ­fico de errores
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Error de conexiÃ³n. Verifica tu conexiÃ³n a internet.';
        } else if (error.message.includes('validation')) {
          errorMessage = 'Datos invÃ¡lidos. Revisa los campos e intenta nuevamente.';
        } else if (error.message.includes('permission')) {
          errorMessage = 'No tienes permisos para realizar esta acciÃ³n.';
        }
      }
      
      setErrors({
        submit: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof AssignmentRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <>
      {/* ðŸŽ­ Modal Backdrop con z-index mÃ¡ximo */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
        onClick={onClose}
        style={{ zIndex: Z_INDEX.MODAL_BACKDROP }}
      />
      
      {/* ðŸ”® Modal Container con z-index mÃ¡ximo */}
      <div 
        className="fixed inset-0 flex items-center justify-center p-3 z-[9999]"
        style={{ zIndex: Z_INDEX.MODAL_CONTENT }}
      >
        <div 
          className="glass-card animate-glass-appear relative w-full max-w-5xl max-h-[92vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* âœ¨ Header compacto */}
          <div className="relative p-4 border-b border-white/10">
            {/* Gradiente de fondo del header */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-purple-500/5 to-transparent pointer-events-none" />
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-500 rounded-xl flex items-center justify-center shadow-primary animate-pulse-glow">
                  <FiUser className="w-6 h-6 text-white filter drop-shadow-lg" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gradient-primary mb-1">
                    {inventoryItem ? 'Asignar Item Seleccionado' : 'Nueva AsignaciÃ³n'}
                  </h2>
                  <p className={`text-sm transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    Asignar dispositivo a empleado, sector o sucursal
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 border border-white/10 hover:border-white/20 backdrop-blur-sm transition-all duration-300 hover-lift flex items-center justify-center group"
              >
                <FiX className={`w-5 h-5 transition-colors duration-300 ${
                  theme === 'dark' 
                    ? 'text-slate-400 group-hover:text-white' 
                    : 'text-slate-500 group-hover:text-slate-700'
                }`} />
              </button>
            </div>
          </div>

          {/* ðŸ“± Contenido scrolleable optimizado */}
          <div className="overflow-y-auto max-h-[calc(92vh-120px)] scrollbar-hide">
            <form onSubmit={handleSubmit} className="p-4 space-y-5">
              
              {/* ðŸš¨ Error de carga */}
              {errors.loading && (
                <div className="glass-card border border-red-500/30 bg-red-500/10 backdrop-blur-sm p-4 animate-glass-appear">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                      <span className="text-red-500 text-sm">âš ï¸</span>
                    </div>
                    <div>
                      <p className="text-red-600 dark:text-red-400 font-medium text-sm">{errors.loading}</p>
                      <button 
                        onClick={() => {
                          setErrors(prev => ({ ...prev, loading: '' }));
                          loadInitialData();
                        }}
                        className="text-xs text-red-500 hover:text-red-600 underline mt-1"
                      >
                        Reintentar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ðŸ“¦ Selector/Info de producto estÃ¡tico */}
              {!inventoryItem ? (
                <div className="glass-card border border-blue-500/20 transition-all duration-300 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
                      <FiPackage className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gradient-primary">Seleccionar Producto</h4>
                      <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        Elige el dispositivo que deseas asignar
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Producto para Asignar
                    </label>
                    <SearchableSelect
                      value={formData.inventario_individual_id || ''}
                      onChange={(value) => handleItemSelection(value)}
                      options={availableItems.map(item => ({
                        id: item.id,
                        label: `${item.numero_serie} - ${item.producto?.marca} ${item.producto?.modelo} (${item.producto?.categoria?.nombre})`
                      }))}
                      placeholder="Buscar y seleccionar producto..."
                      theme={theme}
                      emptyLabel="Seleccionar producto a asignar"
                    />
                    {errors.item && (
                      <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
                        <p className="text-red-600 dark:text-red-400 text-sm font-medium flex items-center">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2" />
                          {errors.item}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="glass-card border border-emerald-500/20 transition-all duration-300 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg">
                      <FiPackage className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-gradient-success">Producto Seleccionado</h4>
                      <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        InformaciÃ³n del dispositivo a asignar
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <div className="glass-card p-2 border border-white/5 min-w-0 flex-1">
                      <span className={`text-xs font-medium uppercase tracking-wider block ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Producto
                      </span>
                      <p className={`font-semibold mt-0.5 text-xs truncate ${
                        theme === 'dark' ? 'text-white' : 'text-slate-800'
                      }`} title={`${inventoryItem.producto?.marca} ${inventoryItem.producto?.modelo}`}>
                        {inventoryItem.producto?.marca} {inventoryItem.producto?.modelo}
                      </p>
                    </div>
                    <div className="glass-card p-2 border border-white/5 min-w-0 flex-1">
                      <span className={`text-xs font-medium uppercase tracking-wider block ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        CategorÃ­a
                      </span>
                      <p className={`font-semibold mt-0.5 text-xs truncate ${
                        theme === 'dark' ? 'text-white' : 'text-slate-800'
                      }`}>
                        {inventoryItem.producto?.categoria?.nombre}
                      </p>
                    </div>
                    <div className="glass-card p-2 border border-white/5 min-w-0 flex-1">
                      <span className={`text-xs font-medium uppercase tracking-wider block ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        NÂ° Serie
                      </span>
                      <p className={`font-mono font-semibold mt-0.5 text-xs truncate ${
                        theme === 'dark' ? 'text-white' : 'text-slate-800'
                      }`} title={inventoryItem.numero_serie}>
                        {inventoryItem.numero_serie}
                      </p>
                    </div>
                    <div className="glass-card p-2 border border-white/5 min-w-0 flex-1">
                      <span className={`text-xs font-medium uppercase tracking-wider block ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Estado
                      </span>
                      <p className={`font-semibold mt-0.5 text-xs truncate ${
                        theme === 'dark' ? 'text-white' : 'text-slate-800'
                      }`}>
                        {inventoryItem.estado}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ðŸŽ¯ SecciÃ³n de AsignaciÃ³n estÃ¡tica */}
              <div className="glass-card border border-primary-500/20 transition-all duration-300 p-5">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-500 rounded-xl flex items-center justify-center shadow-primary">
                    <FiUser className="w-5 h-5 text-white filter drop-shadow-lg" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gradient-primary">Destino de AsignaciÃ³n</h4>
                    <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      Selecciona empleado, sector o sucursal (al menos uno es requerido)
                    </p>
                  </div>
                </div>

                {/* Grid responsivo mÃ¡s compacto */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* ðŸ‘¤ Empleado */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg">
                        <FiUser className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h5 className="font-bold text-gradient-success text-sm">Empleado</h5>
                        <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          AsignaciÃ³n personal
                        </p>
                      </div>
                    </div>
                    <div className={`relative group ${formData.empleado_id ? 'ring-2 ring-emerald-500/30 rounded-xl' : ''}`}>
                      <SearchableSelect
                        value={formData.empleado_id || ''}
                        onChange={(value) => handleInputChange('empleado_id', value)}
                        options={employees.map(emp => ({ id: emp.id, label: `${emp.nombre} ${emp.apellido}` }))}
                        placeholder="Sin empleado especÃ­fico"
                        theme={theme}
                        emptyLabel="Sin empleado especÃ­fico"
                      />
                    </div>
                    {formData.empleado_id && (
                      <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
                        <p className="text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center">
                          âœ“ Empleado seleccionado
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ðŸ¢ Sector */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-lg">
                        <FiHome className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h5 className="font-bold text-gradient-primary text-sm">Sector</h5>
                        <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          Departamento
                        </p>
                      </div>
                    </div>
                    <div className={`relative group ${formData.sector_id ? 'ring-2 ring-blue-500/30 rounded-xl' : ''}`}>
                      <SearchableSelect
                        value={formData.sector_id || ''}
                        onChange={(value) => handleInputChange('sector_id', value)}
                        options={sectors.map(sector => ({ id: sector.id, label: sector.nombre }))}
                        placeholder="Sin sector especÃ­fico"
                        theme={theme}
                        emptyLabel="Sin sector especÃ­fico"
                      />
                    </div>
                    {formData.sector_id && (
                      <div className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm">
                        <p className="text-blue-600 dark:text-blue-400 text-xs font-medium flex items-center">
                          âœ“ Sector seleccionado
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ðŸ“ Sucursal */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg">
                        <FiMapPin className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h5 className="font-bold text-gradient-secondary text-sm">Sucursal</h5>
                        <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          UbicaciÃ³n fÃ­sica
                        </p>
                      </div>
                    </div>
                    <div className={`relative group ${formData.sucursal_id ? 'ring-2 ring-purple-500/30 rounded-xl' : ''}`}>
                      <SearchableSelect
                        value={formData.sucursal_id || ''}
                        onChange={(value) => handleInputChange('sucursal_id', value)}
                        options={branches.map(branch => ({ id: branch.id, label: branch.nombre }))}
                        placeholder="Sin sucursal especÃ­fica"
                        theme={theme}
                        emptyLabel="Sin sucursal especÃ­fica"
                      />
                    </div>
                    {formData.sucursal_id && (
                      <div className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm">
                        <p className="text-purple-600 dark:text-purple-400 text-xs font-medium flex items-center">
                          âœ“ Sucursal seleccionada
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Error de asignaciÃ³n mÃ¡s compacto */}
                {errors.assignment && (
                  <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center">
                        <span className="text-red-500 text-xs">âš ï¸</span>
                      </div>
                      <p className="text-red-600 dark:text-red-400 font-medium text-sm">{errors.assignment}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* ðŸ’» Campos especÃ­ficos para NOTEBOOKS - estÃ¡tico */}
              {isNotebook && (
                <div className="glass-card border border-blue-500/20 transition-all duration-300 p-4 animate-glass-appear">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                      <FiLock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gradient-primary">InformaciÃ³n de Notebook</h4>
                      <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        Datos tÃ©cnicos y de seguridad del dispositivo
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <label className={`block text-sm font-semibold ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      ContraseÃ±a de EncriptaciÃ³n *
                    </label>
                    <input
                      type="text"
                      value={formData.password_encriptacion}
                      onChange={(e) => handleInputChange('password_encriptacion', e.target.value)}
                      className={`input-glass ${errors.password_encriptacion ? 'border-red-500/50 bg-red-500/5' : ''}`}
                      placeholder="ContraseÃ±a de encriptaciÃ³n del disco"
                      disabled={loading}
                    />
                    {errors.password_encriptacion && (
                      <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
                        <p className="text-red-600 dark:text-red-400 text-sm font-medium flex items-center">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2" />
                          {errors.password_encriptacion}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ðŸ“± Campos especÃ­ficos para CELULARES - estÃ¡tico */}
              {isCelular && (
                <div className="glass-card border border-green-500/20 transition-all duration-300 p-4 animate-glass-appear">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg">
                      <FiSmartphone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gradient-success">InformaciÃ³n de Celular</h4>
                      <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        Datos tÃ©cnicos, configuraciÃ³n y acceso del dispositivo
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* NÃºmero de telÃ©fono */}
                    <div className="space-y-2">
                      <label className={`block text-sm font-semibold ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        <FiPhone className="w-4 h-4 inline mr-2 text-green-500" />
                        NÃºmero de TelÃ©fono *
                      </label>
                      <input
                        type="tel"
                        value={formData.numero_telefono || ''}
                        onChange={(e) => handleInputChange('numero_telefono', e.target.value)}
                        className={`input-glass ${errors.numero_telefono ? 'border-red-500/50 bg-red-500/5' : ''}`}
                        placeholder="11 1234-5678"
                        disabled={loading}
                      />
                      {errors.numero_telefono && (
                        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
                          <p className="text-red-600 dark:text-red-400 text-sm font-medium flex items-center">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2" />
                            {errors.numero_telefono}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Cuenta Gmail */}
                    <div className="space-y-2">
                      <label className={`block text-sm font-semibold ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        <FiMail className="w-4 h-4 inline mr-2 text-blue-500" />
                        Cuenta Gmail *
                      </label>
                      <input
                        type="email"
                        value={formData.cuenta_gmail || ''}
                        onChange={(e) => handleInputChange('cuenta_gmail', e.target.value)}
                        className={`input-glass ${errors.cuenta_gmail ? 'border-red-500/50 bg-red-500/5' : ''}`}
                        placeholder="usuario@gmail.com"
                        disabled={loading}
                      />
                      {errors.cuenta_gmail && (
                        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
                          <p className="text-red-600 dark:text-red-400 text-sm font-medium flex items-center">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2" />
                            {errors.cuenta_gmail}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* ContraseÃ±a Gmail */}
                    <div className="space-y-2">
                      <label className={`block text-sm font-semibold ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        <FiLock className="w-4 h-4 inline mr-2 text-purple-500" />
                        ContraseÃ±a Gmail *
                      </label>
                      <input
                        type="text"
                        value={formData.password_gmail}
                        onChange={(e) => handleInputChange('password_gmail', e.target.value)}
                        className={`input-glass ${errors.password_gmail ? 'border-red-500/50 bg-red-500/5' : ''}`}
                        placeholder="ContraseÃ±a de la cuenta Gmail"
                        disabled={loading}
                      />
                      {errors.password_gmail && (
                        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
                          <p className="text-red-600 dark:text-red-400 text-sm font-medium flex items-center">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2" />
                            {errors.password_gmail}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* CÃ³digo 2FA WhatsApp */}
                    <div className="space-y-2">
                      <label className={`block text-sm font-semibold ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        <FiShield className="w-4 h-4 inline mr-2 text-orange-500" />
                        CÃ³digo 2FA WhatsApp *
                      </label>
                      <input
                        type="text"
                        value={formData.codigo_2fa_whatsapp || ''}
                        onChange={(e) => handleInputChange('codigo_2fa_whatsapp', e.target.value)}
                        className={`input-glass ${errors.codigo_2fa_whatsapp ? 'border-red-500/50 bg-red-500/5' : ''}`}
                        placeholder="CÃ³digo de autenticaciÃ³n 2FA"
                        disabled={loading}
                      />
                      {errors.codigo_2fa_whatsapp && (
                        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
                          <p className="text-red-600 dark:text-red-400 text-sm font-medium flex items-center">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2" />
                            {errors.codigo_2fa_whatsapp}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* IMEI 1 - OBLIGATORIO */}
                    <div className="space-y-2">
                      <label className={`block text-sm font-semibold ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        <span className="inline-flex items-center">
                          ðŸ“± IMEI 1 *
                          <span className="ml-2 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded-full font-medium">
                            Obligatorio
                          </span>
                        </span>
                      </label>
                      <input
                        type="text"
                        value={formData.imei_1 || ''}
                        onChange={(e) => handleInputChange('imei_1', e.target.value)}
                        className={`input-glass font-mono ${errors.imei_1 ? 'border-red-500/50 bg-red-500/5' : ''}`}
                        placeholder="123456789012345"
                        maxLength={VALIDATION_RULES.IMEI_LENGTH}
                        disabled={loading}
                      />
                      {errors.imei_1 && (
                        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
                          <p className="text-red-600 dark:text-red-400 text-sm font-medium flex items-center">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2" />
                            {errors.imei_1}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* IMEI 2 - OPCIONAL */}
                    <div className="space-y-2">
                      <label className={`block text-sm font-semibold ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        <span className="inline-flex items-center">
                          ðŸ“± IMEI 2
                          <span className="ml-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-full font-medium">
                            Opcional
                          </span>
                        </span>
                      </label>
                      <input
                        type="text"
                        value={formData.imei_2 || ''}
                        onChange={(e) => handleInputChange('imei_2', e.target.value)}
                        className="input-glass font-mono"
                        placeholder="123456789012345 (solo si tiene dual SIM)"
                        maxLength={VALIDATION_RULES.IMEI_LENGTH}
                        disabled={loading}
                      />
                      <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        Solo completar si el celular tiene dual SIM
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ðŸ“ Observaciones estÃ¡tico */}
              <div className="glass-card border border-white/10 transition-all duration-300 p-4">
                <label className={`block text-sm font-semibold mb-3 ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  ðŸ“ Observaciones
                </label>
                <textarea
                  value={formData.observaciones || ''}
                  onChange={(e) => handleInputChange('observaciones', e.target.value)}
                  className="input-glass min-h-[80px] resize-none"
                  rows={3}
                  placeholder="Observaciones adicionales sobre la asignaciÃ³n..."
                  disabled={loading}
                />
              </div>

              {/* ðŸš¨ Error general mÃ¡s compacto */}
              {errors.submit && (
                <div className="glass-card border border-red-500/30 bg-red-500/10 backdrop-blur-sm p-4 animate-glass-appear">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                      <span className="text-red-500 text-sm">âš ï¸</span>
                    </div>
                    <p className="text-red-600 dark:text-red-400 font-medium text-sm">{errors.submit}</p>
                  </div>
                </div>
              )}

              {/* ðŸŽ¯ Botones mÃ¡s compactos */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-glass-secondary flex-1 hover-lift group"
                  disabled={loading}
                >
                  <FiX className="w-4 h-4 mr-2 transition-transform group-hover:rotate-90" />
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-glass-primary flex-1 hover-lift group"
                  disabled={loading || (!inventoryItem && !selectedItem)}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creando asignaciÃ³n...
                    </>
                  ) : (
                    <>
                      <FiUser className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" />
                      Crear AsignaciÃ³n
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );

  // Usar createPortal para renderizar el modal en el body del documento
  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
}; 
