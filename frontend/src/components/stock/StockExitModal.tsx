import React, { useState, useEffect, useMemo } from 'react';
import { Hash, Package, FileText, User, MapPin, Building2, Loader, CheckCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import ProductSearchSelect from '../common/ProductSearchSelect';
import SearchableSelect from '../common/SearchableSelect';
import Modal from '../common/Modal';
import { Product } from '../../types';

interface Employee {
  id: number;
  nombre: string;
  apellido: string;
  activo: boolean;
}

interface Sector {
  id: number;
  nombre: string;
  activo: boolean;
}

interface Sucursal {
  id: number;
  nombre: string;
  activo: boolean;
}

interface StockExitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedProductId?: number;
  maxQuantity?: number;
}

const StockExitModal: React.FC<StockExitModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  selectedProductId,
  maxQuantity
}) => {
  // Estados del formulario
  const [formData, setFormData] = useState({
    producto_id: selectedProductId?.toString() || '',
    cantidad: '',
    motivo: '',
    motivo_personalizado: '',
    destino_tipo: '',
    empleado_id: '',
    sector_id: '',
    sucursal_id: '',
    observaciones: ''
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState<number>(0);

  // Cargar datos necesarios
  useEffect(() => {
    if (isOpen) {
      loadProducts();
      loadEmployees();
      loadSectors();
      loadSucursales();
      
      if (selectedProductId) {
        setFormData(prev => ({ ...prev, producto_id: selectedProductId.toString() }));
      }
    }
  }, [isOpen, selectedProductId]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/stock/current', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/employees?activo_only=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const empArray = Array.isArray(data.data) ? data.data : (data.data as any)?.employees || [];
        setEmployees(empArray);
      }
    } catch (error) {
      console.error('Error cargando empleados:', error);
    }
  };

  const loadSectors = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/sectors?activo_only=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSectors(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando sectores:', error);
    }
  };

  const loadSucursales = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/branches?activo_only=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSucursales(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando sucursales:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const now = Date.now();
    if (now - lastSubmitTime < 3000 || submitting) return;
    
    setLastSubmitTime(now);
    setSubmitting(true);

    try {
      // Validaciones básicas
      if (!formData.producto_id) throw new Error('Debe seleccionar un producto');
      
      const cantidad = parseInt(formData.cantidad);
      if (isNaN(cantidad) || cantidad <= 0) throw new Error('La cantidad debe ser un número positivo');

      const selectedProduct = products.find(p => p.producto_id === parseInt(formData.producto_id));
      if (selectedProduct && cantidad > selectedProduct.cantidad_actual) {
        throw new Error(`Stock insuficiente. Disponible: ${selectedProduct.cantidad_actual}`);
      }

      const motivoFinal = formData.motivo === 'Otro motivo' ? formData.motivo_personalizado.trim() : formData.motivo.trim();
      if (motivoFinal.length < 5) throw new Error('El motivo debe tener al menos 5 caracteres');

      if (!formData.destino_tipo) throw new Error('Debe seleccionar un destino');

      // Validar destino seleccionado
      const destinos = formData.destino_tipo.split(',').filter(d => d.trim());
      const validaciones = [];
      
      if (destinos.includes('empleado') && !formData.empleado_id) validaciones.push('Seleccione un empleado');
      if (destinos.includes('sector') && !formData.sector_id) validaciones.push('Seleccione un sector');
      if (destinos.includes('sucursal') && !formData.sucursal_id) validaciones.push('Seleccione una sucursal');

      if (validaciones.length > 0) throw new Error(validaciones.join(', '));

      // Preparar payload
      let destinoPrincipal = {
        empleado_id: null as number | null,
        sector_id: null as number | null, 
        sucursal_id: null as number | null
      };

      // Corregido: Usar IF independientes para permitir múltiples destinos simultáneos
      if (formData.empleado_id) destinoPrincipal.empleado_id = parseInt(formData.empleado_id);
      if (formData.sector_id) destinoPrincipal.sector_id = parseInt(formData.sector_id);
      if (formData.sucursal_id) destinoPrincipal.sucursal_id = parseInt(formData.sucursal_id);

      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token no encontrado');

      const response = await fetch('/api/stock/exit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operationId: uuidv4(),
          producto_id: parseInt(formData.producto_id),
          cantidad,
          motivo: motivoFinal,
          ...destinoPrincipal,
          observaciones: formData.observaciones.trim() || null
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error en el servidor');

      onSuccess();
      setTimeout(() => {
        handleClose();
        setSubmitting(false);
      }, 500);

    } catch (error: any) {
      console.error(error);
      alert(error.message);
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setFormData({
        producto_id: '',
        cantidad: '',
        motivo: '',
        motivo_personalizado: '',
        destino_tipo: '',
        empleado_id: '',
        sector_id: '',
        sucursal_id: '',
        observaciones: ''
      });
      onClose();
    }
  };

  const handleDestinoTipoToggle = (tipo: string) => {
    setFormData(prev => {
      const current = prev.destino_tipo.split(',').filter(d => d.trim());
      if (current.includes(tipo)) {
        const filtered = current.filter(d => d !== tipo);
        return {
          ...prev,
          destino_tipo: filtered.join(','),
          [tipo === 'empleado' ? 'empleado_id' : tipo === 'sector' ? 'sector_id' : 'sucursal_id']: ''
        };
      } else {
        return {
          ...prev,
          destino_tipo: [...current, tipo].join(',')
        };
      }
    });
  };

  const selectedProduct = products.find(p => p.producto_id === parseInt(formData.producto_id));
  const availableQuantity = selectedProduct?.cantidad_actual || maxQuantity || 0;

  // Opciones memorizadas
  const employeeOptions = useMemo(() => 
    employees.map(e => ({ id: e.id, label: `${e.apellido}, ${e.nombre}`, sublabel: e.activo ? 'Activo' : 'Inactivo' }))
    .sort((a, b) => a.label.localeCompare(b.label)), [employees]
  );

  const sectorOptions = useMemo(() => 
    sectors.map(s => ({ id: s.id, label: s.nombre }))
    .sort((a, b) => a.label.localeCompare(b.label)), [sectors]
  );

  const sucursalOptions = useMemo(() => 
    sucursales.map(s => ({ id: s.id, label: s.nombre }))
    .sort((a, b) => a.label.localeCompare(b.label)), [sucursales]
  );

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Registrar Salida de Stock" size="xl">
      <div className="p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-red-500 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium animate-pulse">Cargando inventario...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* COLUMNA IZQUIERDA */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Package className="w-4 h-4 text-red-500" /> Producto a retirar
                </label>
                <ProductSearchSelect
                  products={products.filter(p => (p.cantidad_actual || 0) > 0)}
                  selectedProductId={formData.producto_id}
                  onProductSelect={(id) => setFormData(prev => ({ ...prev, producto_id: id }))}
                  disabled={loading || submitting}
                  placeholder={loading ? 'Cargando...' : 'Buscar producto...'}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-slate-400" /> Cantidad
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max={availableQuantity}
                      value={formData.cantidad}
                      onChange={(e) => setFormData(prev => ({ ...prev, cantidad: e.target.value }))}
                      disabled={submitting}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                      placeholder="0"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <span className="text-xs font-bold text-slate-400 bg-slate-200/50 dark:bg-slate-700/50 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600">
                        Max: {availableQuantity}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Motivo</label>
                  <div className="relative">
                    <select
                      value={formData.motivo}
                      onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
                      disabled={submitting}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all appearance-none font-medium text-slate-700 dark:text-slate-200"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Consumo">Consumo Interno</option>
                      <option value="Prestamo temporal">Préstamo</option>
                      <option value="Mantenimiento/Reparacion">Reparación</option>
                      <option value="Proyecto especifico">Proyecto</option>
                      <option value="Otro motivo">Otro</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>
              </div>

              {formData.motivo === 'Otro motivo' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <input
                    type="text"
                    value={formData.motivo_personalizado}
                    onChange={(e) => setFormData(prev => ({ ...prev, motivo_personalizado: e.target.value }))}
                    disabled={submitting}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-red-500 outline-none transition-all text-slate-700 dark:text-slate-200"
                    placeholder="Especifique el motivo..."
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" /> Observaciones
                </label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                  disabled={submitting}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all resize-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                  placeholder="Notas adicionales..."
                  rows={3}
                />
              </div>
            </div>

            {/* COLUMNA DERECHA */}
            <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-700/50 flex flex-col h-full">
              <label className="text-sm font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-500" /> Destino
              </label>
              
              <div className="space-y-6 flex-1 flex flex-col">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'empleado', icon: User, label: 'Empleado' },
                    { id: 'sector', icon: MapPin, label: 'Sector' },
                    { id: 'sucursal', icon: Building2, label: 'Sucursal' }
                  ].map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => handleDestinoTipoToggle(type.id)}
                      className={`
                        relative flex flex-col items-center justify-center p-3 py-4 rounded-xl border-2 transition-all duration-200 group
                        ${formData.destino_tipo.includes(type.id)
                          ? 'border-red-500 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 shadow-sm scale-[1.02]'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:border-red-200 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                        }
                      `}
                    >
                      <type.icon className={`w-6 h-6 mb-2 ${formData.destino_tipo.includes(type.id) ? 'text-red-500' : 'text-slate-400 dark:text-slate-500 group-hover:text-red-400'}`} />
                      <span className="text-xs font-bold tracking-wide">{type.label}</span>
                      {formData.destino_tipo.includes(type.id) && (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full shadow-lg shadow-red-500/50 animate-pulse" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex-1 flex flex-col justify-start mt-2 min-h-[140px]">
                  {formData.destino_tipo.includes('empleado') && (
                    <div className="animate-in fade-in zoom-in-95 duration-200 mb-3">
                      <SearchableSelect
                        options={employeeOptions}
                        selectedId={formData.empleado_id}
                        onSelect={(id) => setFormData(prev => ({ ...prev, empleado_id: id }))}
                        disabled={submitting}
                        placeholder="Seleccionar empleado..."
                        searchPlaceholder="Buscar apellido..."
                        icon={<User className="w-4 h-4 text-slate-400" />}
                      />
                    </div>
                  )}

                  {formData.destino_tipo.includes('sector') && (
                    <div className="animate-in fade-in zoom-in-95 duration-200 mb-3">
                      <SearchableSelect
                        options={sectorOptions}
                        selectedId={formData.sector_id}
                        onSelect={(id) => setFormData(prev => ({ ...prev, sector_id: id }))}
                        disabled={submitting}
                        placeholder="Seleccionar sector..."
                        searchPlaceholder="Buscar sector..."
                        icon={<MapPin className="w-4 h-4 text-slate-400" />}
                      />
                    </div>
                  )}

                  {formData.destino_tipo.includes('sucursal') && (
                    <div className="animate-in fade-in zoom-in-95 duration-200 mb-3">
                      <SearchableSelect
                        options={sucursalOptions}
                        selectedId={formData.sucursal_id}
                        onSelect={(id) => setFormData(prev => ({ ...prev, sucursal_id: id }))}
                        disabled={submitting}
                        placeholder="Seleccionar sucursal..."
                        searchPlaceholder="Buscar sucursal..."
                        icon={<Building2 className="w-4 h-4 text-slate-400" />}
                      />
                    </div>
                  )}

                  {!formData.destino_tipo && (
                    <div className="h-full min-h-[120px] flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-700/50 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 transition-colors group hover:border-slate-300 dark:hover:border-slate-600">
                      <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 mb-2 group-hover:scale-110 transition-transform">
                        <div className="animate-bounce">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-center px-4">Seleccione un tipo de destino arriba para continuar</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-8 py-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 rounded-b-2xl">
        <button
          type="button"
          onClick={handleClose}
          disabled={submitting}
          className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || loading || !formData.producto_id || !formData.cantidad || !formData.motivo || !formData.destino_tipo}
          className="px-8 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2 transform active:scale-95"
        >
          {submitting ? (
            <>
              <Loader className="w-4 h-4 animate-spin" /> Procesando...
            </>
          ) : (
            <>
              Registrar Salida <CheckCircle className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </Modal>
  );
};

export default StockExitModal;