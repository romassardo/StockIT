import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiUser, FiHome, FiMapPin, FiLock, FiShield, FiSmartphone, FiPackage, FiChevronDown, FiSearch, FiCheckCircle, FiLoader } from 'react-icons/fi';
import { assignmentService, type AssignmentRequest } from '../../services/assignment.service';
import { employeeService } from '../../services/employee.service';
import { sectorService } from '../../services/sector.service';
import { branchService } from '../../services/branch.service';
import type { Employee, Sector, Branch } from '../../types';
import { getAllInventory } from '../../services/inventory.service';
import { useTheme } from '../../contexts/ThemeContext';
import { type InventoryItem } from '../../types';

const Z_INDEX = {
  MODAL_BACKDROP: 9998,
  MODAL_CONTENT: 9999,
  DROPDOWN: 99999,
  DROPDOWN_OVERLAY: 99998
} as const;

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  inventoryItem?: InventoryItem | null;
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
      <div 
        className={`fixed animate-glass-appear ${
          theme === 'dark' ? 'glass-dark' : 'glass-card'
        } border border-white/20 shadow-2xl max-h-60 overflow-hidden rounded-xl`}
        style={{
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          width: dropdownPosition.width,
          zIndex: Z_INDEX.DROPDOWN
        }}
      >
        <div className="p-3 border-b border-white/10">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar..."
              className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none transition-all ${
                theme === 'dark' 
                  ? 'bg-slate-700/50 text-white placeholder-slate-400 focus:bg-slate-700' 
                  : 'bg-slate-100 text-slate-800 placeholder-slate-500 focus:bg-white ring-1 ring-slate-200'
              }`}
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-48 overflow-y-auto scrollbar-hide p-1">
          <button
            type="button"
            onClick={() => handleSelect(undefined)}
            className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
              !value ? 'bg-indigo-500/10 text-indigo-500' : ''
            } ${
              theme === 'dark'
                ? 'hover:bg-slate-700/50 text-slate-300'
                : 'hover:bg-slate-100 text-slate-700'
            }`}
          >
            <span className="font-medium opacity-70">{emptyLabel}</span>
          </button>

          {filteredOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option.id)}
              className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                value === option.id ? 'bg-indigo-500 text-white' : ''
              } ${
                value !== option.id && theme === 'dark' ? 'hover:bg-slate-700/50 text-slate-300' : ''
              } ${
                value !== option.id && theme === 'light' ? 'hover:bg-slate-100 text-slate-700' : ''
              }`}
            >
              <span className="font-medium">{option.label}</span>
            </button>
          ))}

          {filteredOptions.length === 0 && searchTerm && (
            <div className={`px-3 py-4 text-center ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}>
              <p className="text-sm">No se encontraron resultados</p>
            </div>
          )}
        </div>
      </div>

      <div
        className="fixed inset-0 bg-transparent"
        style={{ zIndex: Z_INDEX.DROPDOWN_OVERLAY }}
        onClick={() => setIsOpen(false)}
      />
    </>
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`w-full flex items-center justify-between px-4 py-3 text-left transition-all duration-200 rounded-xl border ${
          theme === 'dark'
            ? 'bg-slate-800/50 border-slate-700 hover:border-indigo-500/50 text-slate-200'
            : 'bg-white border-slate-200 hover:border-indigo-500/50 text-slate-800'
        } ${isOpen ? 'ring-2 ring-indigo-500/20 border-indigo-500' : ''}`}
      >
        <span className={`text-sm truncate ${!selectedOption ? 'opacity-50' : ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <FiChevronDown 
          className={`w-4 h-4 transition-transform duration-200 opacity-50 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>
      {dropdownContent && createPortal(dropdownContent, document.body)}
    </div>
  );
};

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
    password_encriptacion: '',
    numero_telefono: '',
    cuenta_gmail: '',
    password_gmail: '',
    codigo_2fa_whatsapp: '',
    imei_1: '',
    imei_2: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      if (!inventoryItem) {
        loadAvailableItems();
      }
    }
  }, [isOpen, inventoryItem]);

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
        codigo_2fa_whatsapp: '',
        imei_1: '',
        imei_2: ''
      }));
      setErrors({});
    }
  }, [selectedItem?.id, inventoryItem?.id]);

  const loadInitialData = async () => {
    try {
      const employeesRes = await employeeService.getActiveEmployees();
      if (employeesRes.success && employeesRes.data) {
        const empList = Array.isArray(employeesRes.data.employees) ? employeesRes.data.employees : [];
        setEmployees(empList);
      }

      const sectorsRes = await sectorService.getActiveSectors();
      if (sectorsRes.success) setSectors(sectorsRes.data);

      const branchesRes = await branchService.getActiveBranches();
      if (branchesRes.success) setBranches(branchesRes.data);

    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  const loadAvailableItems = useCallback(async () => {
    try {
      const response = await getInventoryItems();
      if (response.success && Array.isArray(response.data)) {
        // Solo mostrar activos disponibles (no asignados, no en reparación, no dados de baja)
        const disponibles = response.data.filter(item => item.estado === 'Disponible');
        setAvailableItems(disponibles);
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

    if (!formData.inventario_individual_id || formData.inventario_individual_id === 0) {
      newErrors.item = 'Debes seleccionar un producto.';
    }

    // Empleado es obligatorio
    if (!formData.empleado_id) {
      newErrors.empleado_id = 'Debe seleccionar un empleado.';
    }

    const selectedItem = availableItems.find(item => item.id === formData.inventario_individual_id) || inventoryItem;
    if (selectedItem) {
      const categoryName = selectedItem.producto?.categoria?.nombre.toLowerCase();
      if (categoryName === 'notebooks') {
        if (!formData.password_encriptacion) {
          newErrors.password_encriptacion = 'La contraseña de encriptación es obligatoria.';
        }
      } else if (categoryName === 'celulares') {
        if (!formData.imei_1) newErrors.imei_1 = 'El IMEI 1 es obligatorio.';
        if (!formData.numero_telefono) newErrors.numero_telefono = 'El número de teléfono es obligatorio.';
        if (!formData.cuenta_gmail) newErrors.cuenta_gmail = 'La cuenta de Gmail es obligatoria.';
        if (!formData.password_gmail) newErrors.password_gmail = 'La contraseña de Gmail es obligatoria.';
        if (!formData.codigo_2fa_whatsapp) newErrors.codigo_2fa_whatsapp = 'El PIN de WhatsApp es obligatorio.';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});
    try {
      const response = await assignmentService.createAssignment(formData);
      
      if (response.success) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      let errorMessage = 'Error al crear la asignación.';
      if (error instanceof Error) {
        if (error.message.includes('network')) errorMessage = 'Error de conexión.';
        else if (error.message.includes('validation')) errorMessage = 'Datos inválidos.';
      }
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof AssignmentRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  if (!isOpen) return null;

  const categoryName = selectedItem?.producto?.categoria?.nombre?.toLowerCase() || '';

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
        onClick={onClose}
        style={{ zIndex: Z_INDEX.MODAL_BACKDROP }}
      />
      
      <div 
        className="fixed inset-0 flex items-center justify-center p-4 z-[9999]"
        style={{ zIndex: Z_INDEX.MODAL_CONTENT }}
      >
        <div 
          className={`glass-card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl ${
            theme === 'dark' ? 'bg-slate-900/90 border-slate-700' : 'bg-white/95 border-white/50'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-500">
                <FiUser size={20} />
              </div>
              <div>
                <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                  Nueva Asignación
                </h2>
                <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Registrar entrega de equipo
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <FiX size={20} className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
            
            {/* Selección de Producto */}
            {!inventoryItem && (
              <div className="space-y-2">
                <label className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  Producto a Asignar
                </label>
                <SearchableSelect
                  value={formData.inventario_individual_id || ''}
                  onChange={handleItemSelection}
                  options={availableItems.map(item => ({
                    id: item.id,
                    label: `${item.producto?.marca} ${item.producto?.modelo} - ${item.numero_serie}`
                  }))}
                  placeholder="Buscar producto..."
                  theme={theme}
                  emptyLabel="Sin selección"
                />
                {errors.item && <p className="text-xs text-red-500 mt-1">{errors.item}</p>}
              </div>
            )}

            {/* Info del Producto */}
            {selectedItem && (
              <div className={`p-4 rounded-xl border ${
                theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <FiPackage size={18} />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                      {selectedItem.producto?.marca} {selectedItem.producto?.modelo}
                    </h3>
                    <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      {selectedItem.producto?.categoria?.nombre}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm font-mono bg-black/20 w-fit px-2 py-1 rounded text-slate-400">
                  SN: {selectedItem.numero_serie}
                </div>
              </div>
            )}

            {/* Destino - Empleado (obligatorio) + Sector/Sucursal (opcionales) */}
            <div className="space-y-4">
              {/* Empleado - Obligatorio */}
              <div className="space-y-2">
                <label className={`text-sm font-medium flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  <FiUser className="text-indigo-500" /> Empleado <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  value={formData.empleado_id || ''}
                  onChange={(v) => handleInputChange('empleado_id', v)}
                  options={employees.map(e => ({ id: e.id, label: `${e.nombre} ${e.apellido}` }))}
                  placeholder="Buscar empleado..."
                  theme={theme}
                  emptyLabel="Seleccione un empleado"
                />
                {errors.empleado_id && <p className="text-xs text-red-500 mt-1">{errors.empleado_id}</p>}
              </div>

              {/* Sector y Sucursal en fila - Opcionales */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={`text-sm font-medium flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    <FiHome className="text-emerald-500" /> Sector <span className="text-slate-500 text-xs">(opcional)</span>
                  </label>
                  <SearchableSelect
                    value={formData.sector_id || ''}
                    onChange={(v) => handleInputChange('sector_id', v)}
                    options={sectors.map(s => ({ id: s.id, label: s.nombre }))}
                    placeholder="Buscar sector..."
                    theme={theme}
                    emptyLabel="Sin sector"
                  />
                </div>

                <div className="space-y-2">
                  <label className={`text-sm font-medium flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    <FiMapPin className="text-amber-500" /> Sucursal <span className="text-slate-500 text-xs">(opcional)</span>
                  </label>
                  <SearchableSelect
                    value={formData.sucursal_id || ''}
                    onChange={(v) => handleInputChange('sucursal_id', v)}
                    options={branches.map(b => ({ id: b.id, label: b.nombre }))}
                    placeholder="Buscar sucursal..."
                    theme={theme}
                    emptyLabel="Sin sucursal"
                  />
                </div>
              </div>
            </div>

            {/* Campos Específicos */}
            {categoryName === 'notebooks' && (
              <div className="space-y-3 pt-2 border-t border-white/10">
                <h4 className={`text-sm font-semibold flex items-center gap-2 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
                  <FiLock className="text-amber-500" /> Seguridad
                </h4>
                <div>
                  <input
                    type="text"
                    value={formData.password_encriptacion}
                    onChange={(e) => handleInputChange('password_encriptacion', e.target.value)}
                    placeholder="Contraseña de encriptación (BitLocker)"
                    className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition-all ${
                      theme === 'dark'
                        ? 'bg-slate-800/50 border-slate-700 text-white focus:border-indigo-500'
                        : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500'
                    }`}
                  />
                  {errors.password_encriptacion && <p className="text-xs text-red-500 mt-1">{errors.password_encriptacion}</p>}
                </div>
              </div>
            )}

            {categoryName === 'celulares' && (
              <div className="space-y-4 pt-2 border-t border-white/10">
                <h4 className={`text-sm font-semibold flex items-center gap-2 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
                  <FiSmartphone className="text-blue-500" /> Configuración Móvil
                </h4>
                
                {/* IMEI */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      value={formData.imei_1}
                      onChange={(e) => handleInputChange('imei_1', e.target.value)}
                      placeholder="IMEI 1 *"
                      maxLength={15}
                      className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition-all ${
                        theme === 'dark'
                          ? 'bg-slate-800/50 border-slate-700 text-white focus:border-indigo-500'
                          : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500'
                      } ${errors.imei_1 ? 'border-red-500' : ''}`}
                    />
                    {errors.imei_1 && <p className="text-xs text-red-500 mt-1">{errors.imei_1}</p>}
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formData.imei_2}
                      onChange={(e) => handleInputChange('imei_2', e.target.value)}
                      placeholder="IMEI 2 (opcional)"
                      maxLength={15}
                      className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition-all ${
                        theme === 'dark'
                          ? 'bg-slate-800/50 border-slate-700 text-white focus:border-indigo-500'
                          : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Línea y WhatsApp */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="tel"
                      value={formData.numero_telefono}
                      onChange={(e) => handleInputChange('numero_telefono', e.target.value)}
                      placeholder="Número de línea *"
                      className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition-all ${
                        theme === 'dark'
                          ? 'bg-slate-800/50 border-slate-700 text-white focus:border-indigo-500'
                          : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500'
                      } ${errors.numero_telefono ? 'border-red-500' : ''}`}
                    />
                    {errors.numero_telefono && <p className="text-xs text-red-500 mt-1">{errors.numero_telefono}</p>}
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formData.codigo_2fa_whatsapp}
                      onChange={(e) => handleInputChange('codigo_2fa_whatsapp', e.target.value)}
                      placeholder="PIN WhatsApp (2FA) *"
                      className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition-all ${
                        theme === 'dark'
                          ? 'bg-slate-800/50 border-slate-700 text-white focus:border-indigo-500'
                          : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500'
                      } ${errors.codigo_2fa_whatsapp ? 'border-red-500' : ''}`}
                    />
                    {errors.codigo_2fa_whatsapp && <p className="text-xs text-red-500 mt-1">{errors.codigo_2fa_whatsapp}</p>}
                  </div>
                </div>

                {/* Cuenta Google */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="email"
                      value={formData.cuenta_gmail}
                      onChange={(e) => handleInputChange('cuenta_gmail', e.target.value)}
                      placeholder="Cuenta Google *"
                      className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition-all ${
                        theme === 'dark'
                          ? 'bg-slate-800/50 border-slate-700 text-white focus:border-indigo-500'
                          : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500'
                      } ${errors.cuenta_gmail ? 'border-red-500' : ''}`}
                    />
                    {errors.cuenta_gmail && <p className="text-xs text-red-500 mt-1">{errors.cuenta_gmail}</p>}
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formData.password_gmail}
                      onChange={(e) => handleInputChange('password_gmail', e.target.value)}
                      placeholder="Contraseña Google *"
                      className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition-all ${
                        theme === 'dark'
                          ? 'bg-slate-800/50 border-slate-700 text-white focus:border-indigo-500'
                          : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500'
                      } ${errors.password_gmail ? 'border-red-500' : ''}`}
                    />
                    {errors.password_gmail && <p className="text-xs text-red-500 mt-1">{errors.password_gmail}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Observaciones */}
            <div className="space-y-2">
              <label className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                Observaciones
              </label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => handleInputChange('observaciones', e.target.value)}
                placeholder="Comentarios adicionales..."
                rows={3}
                className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition-all resize-none ${
                  theme === 'dark'
                    ? 'bg-slate-800/50 border-slate-700 text-white focus:border-indigo-500'
                    : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500'
                }`}
              />
            </div>

            {errors.submit && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
                <FiShield /> {errors.submit}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-white/10 flex justify-end gap-3 shrink-0 bg-white/5">
            <button
              onClick={onClose}
              disabled={loading}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                theme === 'dark'
                  ? 'text-slate-300 hover:bg-white/5'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
            >
              {loading ? <FiLoader className="animate-spin" /> : <FiCheckCircle />}
              Confirmar Asignación
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
