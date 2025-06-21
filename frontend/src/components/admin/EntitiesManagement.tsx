import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FiPlus, FiSearch, FiEdit2, FiToggleLeft, FiToggleRight, FiLoader, FiAlertCircle, FiSave, FiX } from 'react-icons/fi';
import { employeeService } from '../../services/employee.service';
import { sectorService } from '../../services/sector.service';
import { branchService } from '../../services/branch.service';
import { Employee, Sector, Branch } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';

type EntityType = Employee | Sector | Branch;
type ActiveTab = 'employees' | 'sectors' | 'branches';

interface EditingState {
  id: number | null;
  type: ActiveTab | null;
  data: Partial<EntityType>;
}

const entityTabs = [
  { id: 'employees', name: 'Empleados', icon: '👥' },
  { id: 'sectors', name: 'Sectores', icon: '🏢' },
  { id: 'branches', name: 'Sucursales', icon: '🏪' },
];

const EntitiesManagement: React.FC = () => {
  const { theme } = useTheme();
  const { addNotification } = useNotification();
  const [activeTab, setActiveTab] = useState<ActiveTab>('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editing, setEditing] = useState<EditingState>({ id: null, type: null, data: {} });
  const [isCreating, setIsCreating] = useState(false);
  const [newItemData, setNewItemData] = useState<Partial<EntityType>>({});

  const services = {
    employees: employeeService,
    sectors: sectorService,
    branches: branchService,
  };
  
  const stateSetters = {
    employees: setEmployees,
    sectors: setSectors,
    branches: setBranches,
  };

  const loadDataForCurrentTab = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const service = services[activeTab];
      const data = await service.getAll();
      stateSetters[activeTab](data as any);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || `Error al cargar ${activeTab}`;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadDataForCurrentTab();
  }, [loadDataForCurrentTab]);

  const dataMap = {
    employees,
    sectors,
    branches,
  };

  const filteredData = useMemo(() => {
    const data = dataMap[activeTab] || [];
    if (!searchTerm) return data;
    return data.filter(item => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchNombre = item.nombre.toLowerCase().includes(searchTermLower);
      if (activeTab === 'employees' && 'apellido' in item && item.apellido) {
        return matchNombre || item.apellido.toLowerCase().includes(searchTermLower);
      }
      return matchNombre;
    });
  }, [activeTab, searchTerm, employees, sectors, branches]);

  const startEditing = (item: EntityType) => {
    setEditing({ id: item.id, type: activeTab, data: { ...item } });
  };

  const cancelEditing = () => {
    setEditing({ id: null, type: null, data: {} });
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof Employee) => {
    const { value } = e.target;
    if (editing.id) {
        setEditing(prev => ({ ...prev, data: { ...prev.data, [field]: value } }));
    } else {
        setNewItemData(prev => ({ ...prev, [field]: value }));
    }
  };

  const saveEdit = async () => {
    if (!editing.id || !editing.type) return;

    setLoading(true);
    try {
        const service = services[editing.type];
        const response = await service.update(editing.id, editing.data);
        
        if (response.success && response.data) {
            addNotification({ message: 'Actualizado con éxito', type: 'success' });
            const stateSetter = stateSetters[editing.type];
            stateSetter((prev: EntityType[]) => prev.map(item => item.id === editing.id ? response.data : item) as any);
            cancelEditing();
        } else {
            addNotification({ message: `Error: ${response.message || 'No se pudo actualizar'}`, type: 'error' });
        }
    } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
        addNotification({ message: `Error al guardar: ${errorMessage}`, type: 'error' });
    } finally {
        setLoading(false);
    }
  };

  const toggleItemStatus = async (item: EntityType) => {
    const action = item.activo ? 'desactivar' : 'reactivar';
    const newStatus = !item.activo;
    
    if (!confirm(`¿Estás seguro de que deseas ${action} este elemento?`)) return;

    setLoading(true);
    try {
        // Crear la URL del endpoint de toggle
        const baseUrl = activeTab === 'employees' ? '/api/employees' : 
                       activeTab === 'sectors' ? '/api/sectors' : '/api/branches';
        
        // Hacer la llamada directa al endpoint de toggle
        const response = await fetch(`${baseUrl}/${item.id}/toggle-active`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ activo: newStatus })
        });

        const result = await response.json();

        if (result.success) {
            addNotification({ message: 'El estado ha sido cambiado exitosamente', type: 'success' });
            const stateSetter = stateSetters[activeTab];
            stateSetter((prev: EntityType[]) => prev.map(i => i.id === item.id ? { ...i, activo: newStatus } : i) as any);
        } else {
            addNotification({ message: `Error: ${result.message || `No se pudo ${action}`}`, type: 'error' });
        }
    } catch (error: any) {
        console.error('Error en toggleItemStatus:', error);
        addNotification({ message: `Error al ${action}: Error de conexión con el servidor`, type: 'error' });
    } finally {
        setLoading(false);
    }
  };

  const createNewItem = async () => {
    if (!newItemData.nombre || (activeTab === 'employees' && !(newItemData as Partial<Employee>).apellido)) {
      addNotification({ message: 'Por favor completa todos los campos requeridos', type: 'warning' });
      return;
    }
    setLoading(true);
    try {
        const service = services[activeTab];
        const response = await service.create(newItemData);

        if (response.success && response.data) {
            addNotification({ message: `${activeTab.slice(0, -1)} creado con éxito`, type: 'success' });
            const stateSetter = stateSetters[activeTab];
            stateSetter((prev: EntityType[]) => [response.data, ...prev] as any);
            setIsCreating(false);
            setNewItemData({});
        } else {
            addNotification({ message: `Error: ${response.message || 'No se pudo crear el elemento'}`, type: 'error' });
        }
    } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
        addNotification({ message: `Error al crear: ${errorMessage}`, type: 'error' });
    } finally {
        setLoading(false);
    }
  };

  const renderTableBody = () => {
    if (loading && filteredData.length === 0) return <tbody><tr><td colSpan={3} className="py-10 text-center"><FiLoader className="mx-auto text-4xl text-primary-500 animate-spin" /></td></tr></tbody>;
    if (error) return <tbody><tr><td colSpan={3} className="py-10 text-center text-red-400"><FiAlertCircle className="mx-auto mb-2 text-4xl" /><p>{error}</p></td></tr></tbody>;
    if (filteredData.length === 0) return <tbody><tr><td colSpan={3} className="py-10 text-center text-slate-400"><FiAlertCircle className="mx-auto mb-2 text-4xl" /><p>No se encontraron resultados.</p></td></tr></tbody>;

    return (
        <tbody className="divide-y divide-white/10">
            {filteredData.map((item: EntityType) => (
                <tr key={item.id} className="text-sm text-slate-200 transition-colors duration-200 hover:bg-black/20">
                    <td className="px-6 py-3 whitespace-nowrap">
                        {editing.id === item.id ? (
                            <div className="flex gap-2">
                                <input 
                                    id={`edit-nombre-${item.id}`}
                                    name={`edit-nombre-${item.id}`}
                                    type="text" 
                                    value={editing.data.nombre || ''} 
                                    onChange={e => handleInputChange(e, 'nombre')} 
                                    className="w-full px-3 py-1 rounded-md bg-white/10" 
                                    placeholder="Nombre" 
                                />
                                {activeTab === 'employees' && 
                                    <input 
                                        id={`edit-apellido-${item.id}`}
                                        name={`edit-apellido-${item.id}`}
                                        type="text" 
                                        value={(editing.data as Partial<Employee>).apellido || ''} 
                                        onChange={e => handleInputChange(e, 'apellido')} 
                                        className="w-full px-3 py-1 rounded-md bg-white/10" 
                                        placeholder="Apellido" 
                                    />
                                }
                            </div>
                        ) : (
                            <span className="font-medium text-white">{item.nombre} {activeTab === 'employees' && (item as Employee).apellido}</span>
                        )}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${item.activo ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-400'}`}>
                            {item.activo ? 'Activo' : 'Inactivo'}
                        </span>
                    </td>
                    <td className="px-6 py-3 text-sm font-medium text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                            {editing.id === item.id ? (
                                <>
                                    <button onClick={saveEdit} className="p-2 text-green-400 rounded-md hover:bg-green-500/20"><FiSave /></button>
                                    <button onClick={cancelEditing} className="p-2 text-red-400 rounded-md hover:bg-red-500/20"><FiX /></button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => startEditing(item)} className="p-2 text-sky-400 rounded-md hover:bg-sky-500/20"><FiEdit2 /></button>
                                    <button onClick={() => toggleItemStatus(item)} className="p-2 text-amber-400 rounded-md hover:bg-amber-500/20">
                                        {item.activo ? <FiToggleLeft /> : <FiToggleRight />}
                                    </button>
                                </>
                            )}
                        </div>
                    </td>
                </tr>
            ))}
        </tbody>
    );
  };
  
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 🌌 ORBES DE FONDO ANIMADOS - IMPLEMENTACIÓN OBLIGATORIA */}
      <div className={`fixed inset-0 pointer-events-none transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95' 
          : 'bg-gradient-to-br from-slate-50/95 via-slate-100/90 to-slate-200/95'
      }`}>
        {/* Orbe 1: Top-left - Primary */}
        <div className={`absolute top-20 left-10 w-32 h-32 rounded-full blur-xl animate-float transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-primary-500/20' 
            : 'bg-primary-500/10'
        }`}></div>
        
        {/* Orbe 2: Top-right - Secondary */}
        <div className={`absolute top-40 right-20 w-24 h-24 rounded-full blur-lg animate-float transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-secondary-500/20' 
            : 'bg-secondary-500/10'
        }`} style={{animationDelay: '2s'}}></div>
        
        {/* Orbe 3: Bottom-left - Success */}
        <div className={`absolute bottom-32 left-1/4 w-20 h-20 rounded-full blur-lg animate-float transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-success-500/20' 
            : 'bg-success-500/10'
        }`} style={{animationDelay: '4s'}}></div>
        
        {/* Orbe 4: Bottom-right - Info */}
        <div className={`absolute bottom-20 right-1/3 w-28 h-28 rounded-full blur-xl animate-float transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-info-500/20' 
            : 'bg-info-500/10'
        }`} style={{animationDelay: '1s'}}></div>
      </div>

      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        <div className="sm:flex sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gradient-primary">Gestión de Entidades</h1>
            <p className="mt-1 text-sm text-slate-400">Administra empleados, sectores y sucursales.</p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button onClick={() => setIsCreating(true)} type="button" className="btn-glass-primary inline-flex items-center gap-2">
              <FiPlus className="h-5 w-5" />
              <span>Añadir {activeTab.slice(0, -1)}</span>
            </button>
          </div>
        </div>

        <div className="mb-4 border-b border-slate-700">
          <nav className="flex -mb-px space-x-6" aria-label="Tabs">
            {entityTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as ActiveTab); setSearchTerm(''); setIsCreating(false); }}
                className={`${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-500'
                } flex items-center gap-2 px-1 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors duration-200`}
              >
                <span>{tab.icon}</span> {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {isCreating && (
            <div className="p-4 mb-4 rounded-lg bg-slate-800/50 flex flex-col gap-3">
                <h3 className="text-lg font-semibold text-white">Crear Nuevo {activeTab.slice(0, -1)}</h3>
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label htmlFor="new-nombre" className="block text-sm font-medium text-slate-300 mb-1">Nombre</label>
                        <input 
                            id="new-nombre"
                            name="new-nombre"
                            type="text" 
                            value={newItemData.nombre || ''} 
                            onChange={(e) => handleInputChange(e, 'nombre')} 
                            placeholder="Nombre" 
                            className="w-full px-3 py-2 rounded-md bg-white/10" 
                        />
                    </div>
                    {activeTab === 'employees' && 
                        <div className="flex-1">
                            <label htmlFor="new-apellido" className="block text-sm font-medium text-slate-300 mb-1">Apellido</label>
                            <input 
                                id="new-apellido"
                                name="new-apellido"
                                type="text" 
                                value={(newItemData as Partial<Employee>).apellido || ''} 
                                onChange={(e) => handleInputChange(e, 'apellido')} 
                                placeholder="Apellido" 
                                className="w-full px-3 py-2 rounded-md bg-white/10" 
                            />
                        </div>
                    }
                </div>
                <div className="flex justify-end gap-3">
                    <button onClick={() => setIsCreating(false)} className="btn-glass-secondary">Cancelar</button>
                    <button onClick={createNewItem} className="btn-glass-primary">Crear</button>
                </div>
            </div>
        )}

        <div className="mb-4">
          <div className="relative">
            <label htmlFor="search-entities" className="sr-only">
              Buscar en {activeTab}
            </label>
            <FiSearch className="absolute h-5 w-5 text-slate-400 pointer-events-none top-3.5 left-4" />
            <input
              id="search-entities"
              name="search-entities"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Buscar en ${activeTab}...`}
              className="w-full py-2 pl-11 pr-4 border rounded-lg bg-white/5 border-white/20"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto border rounded-lg border-slate-800">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-900/60">
              <tr>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-slate-300 uppercase">Detalle</th>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-slate-300 uppercase">Estado</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            {renderTableBody()}
          </table>
        </div>
      </div>
    </div>
  );
};

export default EntitiesManagement;
