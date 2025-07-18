import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiUser, FiHome, FiMapPin, FiLock, FiPhone, FiMail, FiShield, FiSmartphone, FiPackage, FiChevronDown, FiSearch } from 'react-icons/fi';
import { assignmentService, type AssignmentRequest } from '../../services/assignment.service';
import { employeeService } from '../../services/employee.service';
import { sectorService } from '../../services/sector.service';
import { branchService } from '../../services/branch.service';
import type { Employee, Sector, Branch } from '../../types';
import { getAllInventory } from '../../services/inventory.service';
import { useTheme } from '../../contexts/ThemeContext';
import { type InventoryItem } from '../../types';
import Modal from '../common/Modal';

// 🧠 Constantes de configuración
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
  inventoryItem?: InventoryItem | null; // Para asignación desde tarjeta
  // Si no hay inventoryItem, será un formulario general de asignación
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

  // Actualizar posición cuando se abra o se redimensione la ventana
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
      {/* 🔍 Dropdown con Portal */}
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
        {/* 🔍 Search input compacto */}
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

        {/* 🔍 Options list compacto */}
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
              <p className="text-xs opacity-75 mt-1">Intenta con otros términos</p>
            </div>
          )}
        </div>
      </div>

      {/* 🔍 Overlay para cerrar dropdown */}
      <div
        className="fixed inset-0 bg-transparent"
        style={{ zIndex: Z_INDEX.DROPDOWN_OVERLAY }}
        onClick={() => setIsOpen(false)}
      />
    </>
  );

  return (
    <div className="relative">
      {/* 🔍 Trigger button compacto */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`w-full flex items-center justify-between px-4 py-3 text-left transition-all duration-200 input-glass ${
          theme === 'dark'
            ? 'hover:bg-slate-700/50 focus:bg-slate-700/50'
            : 'hover:bg-slate-100/50 focus:bg-slate-100/50'
        } ${
          isOpen ? 'ring-2 ring-primary-500/30' : ''
        }`}
      >
        <span className={`text-sm ${
          selectedOption 
            ? (theme === 'dark' ? 'text-slate-200' : 'text-slate-800')
            : (theme === 'dark' ? 'text-slate-400' : 'text-slate-500')
        }`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <FiChevronDown 
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          } ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} 
        />
      </button>

      {/* Portal para el dropdown */}
      {dropdownContent && createPortal(dropdownContent, document.body)}
    </div>
  );
};

// Función para obtener items disponibles
const getInventoryItems = async () => {
  try {
    const response = await getAllInventory();
    return {
      success: true,
      data: response.data || []
    };
  } catch (error) {
    console.error('Error al obtener items de inventario:', error);
    return {
      success: false,
      data: []
    };
  }
};

export const AssignmentModal: React.FC<AssignmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  inventoryItem
}) => {
  const { theme } = useTheme();
  
  // Estados para los datos del formulario
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [availableItems, setAvailableItems] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<AssignmentRequest>({
    inventario_individual_id: 0,
    empleado_id: undefined,
    sector_id: undefined,
    sucursal_id: undefined,
    observaciones: '',
    // Campos específicos para notebooks
    password_encriptacion: '',
    // Campos específicos para celulares
    numero_telefono: '',
    cuenta_gmail: '',
    password_gmail: '',
    codigo_2fa_whatsapp: ''
  });

  // Cargar datos iniciales cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      if (!inventoryItem) {
        loadAvailableItems();
      }
    }
  }, [isOpen, inventoryItem]);

  // Pre-seleccionar item si viene como prop
  useEffect(() => {
    if (inventoryItem && inventoryItem.id) {
      setSelectedItem(inventoryItem);
      setFormData(prev => ({
        ...prev,
        inventario_individual_id: inventoryItem.id
      }));
    } else if (!inventoryItem) {
      setSelectedItem(null);
      setFormData(prev => ({
        ...prev,
        inventario_individual_id: 0,
        empleado_id: undefined,
        sector_id: undefined,
        sucursal_id: undefined,
        observaciones: '',
        password_encriptacion: '',
        numero_telefono: '',
        cuenta_gmail: '',
        password_gmail: '',
        codigo_2fa_whatsapp: ''
      }));
      setErrors({});
    }
  }, [selectedItem?.id, inventoryItem?.id]);

  const loadInitialData = async () => {
    try {
      console.log('🔍 Cargando datos iniciales...');
      
      // Cargar empleados
      try {
        const employeesRes = await employeeService.getActiveEmployees();
        console.log('🎉 Empleados response:', employeesRes);
        if (employeesRes.success) {
          // Asegurarse de que sea un array; manejar posibles envoltorios tipo { employees: [...] } o { data: [...] }
          const empList = Array.isArray(employeesRes.data)
            ? employeesRes.data
            : (employeesRes.data as any)?.employees || (employeesRes.data as any)?.data || [];
          setEmployees(empList);
          console.log('✅ Empleados cargados:', empList.length);
        } else {
          console.error('❌ Error empleados:', employeesRes.message);
        }
      } catch (empError) {
        console.error('❌ Error cargando empleados:', empError);
      }

      // Cargar sectores
      try {
        const sectorsRes = await sectorService.getActiveSectors();
        console.log('🏢 Sectores response:', sectorsRes);
        if (sectorsRes.success) {
          setSectors(sectorsRes.data);
          console.log('✅ Sectores cargados:', sectorsRes.data.length);
        } else {
          console.error('❌ Error sectores:', sectorsRes.message);
        }
      } catch (secError) {
        console.error('❌ Error cargando sectores:', secError);
      }

      // Cargar sucursales
      try {
        const branchesRes = await branchService.getActiveBranches();
        console.log('🏪 Branches response:', branchesRes);
        if (branchesRes.success) {
          setBranches(branchesRes.data);
          console.log('✅ Sucursales cargadas:', branchesRes.data.length);
        } else {
          console.error('❌ Error sucursales:', branchesRes.message);
        }
      } catch (branchError) {
        console.error('❌ Error cargando sucursales:', branchError);
      }

    } catch (error) {
      console.error('❌ Error general cargando datos:', error);
      setErrors(prev => ({
        ...prev,
        loading: 'Error cargando datos iniciales. Por favor, recarga la página.'
      }));
    }
  };

  const loadAvailableItems = useCallback(async () => {
    try {
      const response = await getInventoryItems();
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

    // 3. Validaciones condicionales basadas en la categoría del producto
    const selectedItem = availableItems.find(item => item.id === formData.inventario_individual_id);
    if (selectedItem) {
      const categoryName = selectedItem.producto?.categoria?.nombre.toLowerCase();
      if (categoryName === 'notebooks') {
        if (!formData.password_encriptacion) {
          newErrors.password_encriptacion = 'La contraseña de encriptación es obligatoria para notebooks.';
        }
      } else if (categoryName === 'celulares') {
        if (!formData.numero_telefono) newErrors.numero_telefono = 'El número de teléfono es obligatorio para celulares.';
        if (!formData.cuenta_gmail) newErrors.cuenta_gmail = 'La cuenta de Gmail es obligatoria para celulares.';
        if (!formData.password_gmail) newErrors.password_gmail = 'La contraseña de Gmail es obligatoria para celulares.';
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
          codigo_2fa_whatsapp: ''
        });
        setSelectedItem(null);
      }
    } catch (error) {
      let errorMessage = 'Error al crear la asignación. Por favor intente nuevamente.';
      
      // Manejo específico de errores
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
        } else if (error.message.includes('validation')) {
          errorMessage = 'Datos inválidos. Revisa los campos e intenta nuevamente.';
        } else if (error.message.includes('permission')) {
          errorMessage = 'No tienes permisos para realizar esta acción.';
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
      {/* 🔒 Modal Backdrop con z-index máximo */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
        onClick={onClose}
        style={{ zIndex: Z_INDEX.MODAL_BACKDROP }}
      />
      
      {/* 🔒 Modal Container con z-index máximo */}
      <div 
        className="fixed inset-0 flex items-center justify-center p-3 z-[9999]"
        style={{ zIndex: Z_INDEX.MODAL_CONTENT }}
      >
        <div 
          className="glass-card animate-glass-appear relative w-full max-w-5xl max-h-[92vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ✅ Header compacto */}
          <div className="relative p-4 border-b border-white/10">
            {/* Gradiente de fondo del header */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-purple-500/5 to-transparent pointer-events-none" />
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-500 rounded-xl flex items-center justify-center shadow-primary animate-pulse-glow">
                  <FiUser className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-primary-600 via-primary-500 to-purple-500 bg-clip-text text-transparent">
                    Nueva Asignación
                  </h2>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    Asignar dispositivo a empleado, sector o sucursal
                  </p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-105 ${
                  theme === 'dark'
                    ? 'bg-slate-800/50 hover:bg-slate-700/70 text-slate-300 hover:text-white'
                    : 'bg-slate-100/50 hover:bg-slate-200/70 text-slate-600 hover:text-slate-800'
                }`}
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ✅ Content scrolleable */}
          <div className="flex-1 overflow-y-auto max-h-[calc(92vh-140px)] scrollbar-hide">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* ✅ Selección de Producto */}
              {!inventoryItem && (
                <div className="space-y-3">
                  <label className={`block text-sm font-semibold ${
                    theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                  }`}>
                    <FiPackage className="inline w-4 h-4 mr-2" />
                    Producto a Asignar
                  </label>
                  
                  <SearchableSelect
                    value={formData.inventario_individual_id || ''}
                    onChange={handleItemSelection}
                    options={availableItems.map(item => ({
                      id: item.id,
                      label: `${item.producto?.marca} ${item.producto?.modelo} - ${item.numero_serie}`
                    }))}
                    placeholder="Buscar producto disponible..."
                    theme={theme}
                    emptyLabel="Ningún producto seleccionado"
                  />
                  
                  {errors.item && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      {errors.item}
                    </p>
                  )}
                </div>
              )}

              {/* ✅ Información del producto seleccionado */}
              {selectedItem && (
                <div className={`p-4 rounded-xl border ${
                  theme === 'dark' 
                    ? 'bg-slate-800/30 border-slate-700/50' 
                    : 'bg-slate-100/30 border-slate-300/50'
                }`}>
                  <h4 className={`font-semibold mb-2 ${
                    theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                  }`}>
                    Producto Seleccionado
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className={`font-medium ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        Marca/Modelo:
                      </span>
                      <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
                        {selectedItem.producto?.marca} {selectedItem.producto?.modelo}
                      </p>
                    </div>
                    <div>
                      <span className={`font-medium ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        Número de Serie:
                      </span>
                      <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
                        {selectedItem.numero_serie}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ✅ Destino de la Asignación */}
              <div className="space-y-4">
                <h3 className={`text-lg font-semibold ${
                  theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                }`}>
                  Destino de la Asignación
                </h3>
                
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Empleado */}
                  <div className="space-y-2">
                    <label className={`block text-sm font-medium ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      <FiUser className="inline w-4 h-4 mr-2" />
                      Empleado
                    </label>
                    <SearchableSelect
                      value={formData.empleado_id || ''}
                      onChange={(value) => handleInputChange('empleado_id', value)}
                      options={employees.map(emp => ({
                        id: emp.id,
                        label: `${emp.nombre} ${emp.apellido}`
                      }))}
                      placeholder="Seleccionar empleado..."
                      theme={theme}
                      emptyLabel="Sin empleado"
                    />
                  </div>

                  {/* Sector */}
                  <div className="space-y-2">
                    <label className={`block text-sm font-medium ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      <FiHome className="inline w-4 h-4 mr-2" />
                      Sector
                    </label>
                    <SearchableSelect
                      value={formData.sector_id || ''}
                      onChange={(value) => handleInputChange('sector_id', value)}
                      options={sectors.map(sector => ({
                        id: sector.id,
                        label: sector.nombre
                      }))}
                      placeholder="Seleccionar sector..."
                      theme={theme}
                      emptyLabel="Sin sector"
                    />
                  </div>

                  {/* Sucursal */}
                  <div className="space-y-2">
                    <label className={`block text-sm font-medium ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      <FiMapPin className="inline w-4 h-4 mr-2" />
                      Sucursal
                    </label>
                    <SearchableSelect
                      value={formData.sucursal_id || ''}
                      onChange={(value) => handleInputChange('sucursal_id', value)}
                      options={branches.map(branch => ({
                        id: branch.id,
                        label: branch.nombre
                      }))}
                      placeholder="Seleccionar sucursal..."
                      theme={theme}
                      emptyLabel="Sin sucursal"
                    />
                  </div>
                </div>

                {errors.destination && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.destination}
                  </p>
                )}
              </div>

              {/* ✅ Campos específicos para Notebooks */}
              {selectedItem?.producto?.categoria?.nombre.toLowerCase() === 'notebooks' && (
                <div className="space-y-3">
                  <h4 className={`font-semibold flex items-center gap-2 ${
                    theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                  }`}>
                    <FiLock className="w-4 h-4" />
                    Información de Notebook
                  </h4>
                  
                  <div className="space-y-2">
                    <label className={`block text-sm font-medium ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Contraseña de Encriptación *
                    </label>
                    <input
                      type="password"
                      value={formData.password_encriptacion}
                      onChange={(e) => handleInputChange('password_encriptacion', e.target.value)}
                      className="input-glass w-full"
                      placeholder="Contraseña de encriptación del disco..."
                    />
                    {errors.password_encriptacion && (
                      <p className="text-red-500 text-sm">{errors.password_encriptacion}</p>
                    )}
                  </div>
                </div>
              )}

              {/* ✅ Campos específicos para Celulares */}
              {selectedItem?.producto?.categoria?.nombre.toLowerCase() === 'celulares' && (
                <div className="space-y-4">
                  <h4 className={`font-semibold flex items-center gap-2 ${
                    theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                  }`}>
                    <FiSmartphone className="w-4 h-4" />
                    Información de Celular
                  </h4>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className={`block text-sm font-medium ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        <FiPhone className="inline w-4 h-4 mr-2" />
                        Número de Teléfono *
                      </label>
                      <input
                        type="tel"
                        value={formData.numero_telefono}
                        onChange={(e) => handleInputChange('numero_telefono', e.target.value)}
                        className="input-glass w-full"
                        placeholder="+54 9 XXX XXX XXXX"
                      />
                      {errors.numero_telefono && (
                        <p className="text-red-500 text-sm">{errors.numero_telefono}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className={`block text-sm font-medium ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        <FiShield className="inline w-4 h-4 mr-2" />
                        Código 2FA WhatsApp
                      </label>
                      <input
                        type="text"
                        value={formData.codigo_2fa_whatsapp}
                        onChange={(e) => handleInputChange('codigo_2fa_whatsapp', e.target.value)}
                        className="input-glass w-full"
                        placeholder="Código de verificación en 2 pasos"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className={`block text-sm font-medium ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        <FiMail className="inline w-4 h-4 mr-2" />
                        Cuenta Gmail *
                      </label>
                      <input
                        type="email"
                        value={formData.cuenta_gmail}
                        onChange={(e) => handleInputChange('cuenta_gmail', e.target.value)}
                        className="input-glass w-full"
                        placeholder="usuario@gmail.com"
                      />
                      {errors.cuenta_gmail && (
                        <p className="text-red-500 text-sm">{errors.cuenta_gmail}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className={`block text-sm font-medium ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        <FiLock className="inline w-4 h-4 mr-2" />
                        Contraseña Gmail *
                      </label>
                      <input
                        type="password"
                        value={formData.password_gmail}
                        onChange={(e) => handleInputChange('password_gmail', e.target.value)}
                        className="input-glass w-full"
                        placeholder="Contraseña de la cuenta Gmail"
                      />
                      {errors.password_gmail && (
                        <p className="text-red-500 text-sm">{errors.password_gmail}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ✅ Observaciones */}
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Observaciones
                </label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => handleInputChange('observaciones', e.target.value)}
                  className="input-glass w-full min-h-[80px] resize-none"
                  placeholder="Observaciones adicionales sobre la asignación..."
                  rows={3}
                />
              </div>

              {/* ✅ Error general */}
              {errors.submit && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <p className="text-red-500 text-sm font-medium">{errors.submit}</p>
                </div>
              )}
            </form>
          </div>

          {/* ✅ Footer con botones */}
          <div className="flex-shrink-0 p-4 border-t border-white/10">
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="btn-glass-secondary-modern"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-glass-primary-modern"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creando...
                  </div>
                ) : (
                  'Crear Asignación'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}; 
