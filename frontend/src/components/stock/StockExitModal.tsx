import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiMinus, FiPackage, FiCheck, FiAlertCircle, FiUser, FiMapPin, FiBriefcase } from 'react-icons/fi';
import { v4 as uuidv4 } from 'uuid';
import ProductSearchSelect from '../common/ProductSearchSelect';

interface Product {
  producto_id: number;
  nombre_marca: string;
  nombre_producto: string;
  nombre_categoria: string;
  descripcion_producto?: string;
  cantidad_actual: number;
  min_stock: number;
  alerta_stock_bajo: boolean;
}

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
    motivo_personalizado: '', // Para cuando selecciona "Otro motivo"
    destino_tipo: '', // 'empleado', 'sector', 'sucursal'
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
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  
  // NUEVO: Estado para prevenir múltiples envíos
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
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token de acceso no encontrado');
        return;
      }

      // Cargar productos de stock general con stock actual
      const response = await fetch('/api/stock/current', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setProducts(data.data || []);

    } catch (error: any) {
      console.error('Error cargando productos:', error);
      setError(error.message || 'Error al cargar productos');
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
        // Asegurar que la lista de empleados sea un array válido
        const empArray = Array.isArray(data.data)
          ? data.data
          : (data.data as any)?.employees || (data.data as any)?.data || [];
        setEmployees(empArray);
      }
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
      console.error('Error cargando sucursales:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // PREVENIR DOBLE SUBMIT - Verificación múltiple mejorada
    const now = Date.now();
    if (now - lastSubmitTime < 3000) {
      return;
    }
    
    // Verificación adicional del estado submitting
    if (submitting) {
      return;
    }
    
    setLastSubmitTime(now);
    
    // Deshabilitar inmediatamente
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Validaciones
      if (!formData.producto_id) {
        throw new Error('Debe seleccionar un producto');
      }

      const cantidad = parseInt(formData.cantidad);
      if (isNaN(cantidad) || cantidad <= 0) {
        throw new Error('La cantidad debe ser un número positivo');
      }

      const selectedProduct = products.find(p => p.producto_id === parseInt(formData.producto_id));
      if (selectedProduct && cantidad > selectedProduct.cantidad_actual) {
        throw new Error(`No hay suficiente stock. Disponible: ${selectedProduct.cantidad_actual} unidades`);
      }

      // Validar motivo - usar personalizado si está seleccionado "Otro motivo"
      const motivoFinal = formData.motivo === 'Otro motivo' 
        ? formData.motivo_personalizado.trim() 
        : formData.motivo.trim();
      
      if (motivoFinal.length < 5) {
        throw new Error('El motivo debe tener al menos 5 caracteres');
      }

      if (!formData.destino_tipo) {
        throw new Error('Debe seleccionar al menos un tipo de destino');
      }

      // Validar que se hayan completado los destinos seleccionados
      const destinosSeleccionados = formData.destino_tipo.split(',').filter(d => d.trim() !== '');
      const validaciones = [];

      for (const destino of destinosSeleccionados) {
        switch (destino) {
          case 'empleado':
            if (!formData.empleado_id) {
              validaciones.push('Debe seleccionar un empleado');
            }
            break;
          case 'sector':
            if (!formData.sector_id) {
              validaciones.push('Debe seleccionar un sector');
            }
            break;
          case 'sucursal':
            if (!formData.sucursal_id) {
              validaciones.push('Debe seleccionar una sucursal');
            }
            break;
        }
      }

      if (validaciones.length > 0) {
        throw new Error(validaciones.join(', '));
      }

      // Para el backend actual (que acepta solo un destino), enviamos el destino principal
      // Prioridad: Empleado > Sector > Sucursal
      let destinoPrincipal = {
        empleado_id: null as number | null,
        sector_id: null as number | null, 
        sucursal_id: null as number | null
      };

      if (formData.empleado_id) {
        destinoPrincipal.empleado_id = parseInt(formData.empleado_id);
      } else if (formData.sector_id) {
        destinoPrincipal.sector_id = parseInt(formData.sector_id);
      } else if (formData.sucursal_id) {
        destinoPrincipal.sucursal_id = parseInt(formData.sucursal_id);
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token de acceso no encontrado');
      }

      // IDEMPOTENCIA: Generar un ID único para esta operación específica
      const operationId = uuidv4();
      
      const response = await fetch('/api/stock/exit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operationId, // Clave de idempotencia
          producto_id: parseInt(formData.producto_id),
          cantidad: cantidad,
          motivo: motivoFinal,
          empleado_id: destinoPrincipal.empleado_id,
          sector_id: destinoPrincipal.sector_id,
          sucursal_id: destinoPrincipal.sucursal_id,
          observaciones: formData.observaciones.trim() || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}: ${response.statusText}`);
      }

      let mensaje = `Salida registrada exitosamente. Stock actual: ${data.stockActual} unidades`;
      if (data.alertaBajoStock) {
        mensaje += '. ⚠️ ALERTA: Stock bajo mínimo';
      }
      
      setSuccess(mensaje);
      
      // Ejecutar callback inmediatamente y mantener submitting=true
      onSuccess();
      
      // Limpiar formulario después de 2 segundos y cerrar
      setTimeout(() => {
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
        setSuccess('');
        onClose();
        setSubmitting(false); // Reactivar solo al cerrar
      }, 2000);

    } catch (error: any) {
      console.error('Error en salida de stock:', error);
      setError(error.message || 'Error al registrar la salida');
      setSubmitting(false); // Reactivar en caso de error
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
      setError('');
      setSuccess('');
      setLastSubmitTime(0);
      onClose();
    }
  };

  const handleDestinoTipoToggle = (tipo: string) => {
    setFormData(prev => {
      const currentDestinos = prev.destino_tipo.split(',').filter(d => d.trim() !== '');
      
      if (currentDestinos.includes(tipo)) {
        // Si ya está seleccionado, lo removemos
        const filtered = currentDestinos.filter(d => d !== tipo);
        return {
          ...prev,
          destino_tipo: filtered.join(','),
          // Solo limpiar el campo específico que se deselecciona
          [tipo === 'empleado' ? 'empleado_id' : tipo === 'sector' ? 'sector_id' : 'sucursal_id']: ''
        };
      } else {
        // Agregar el nuevo destino
        const newDestinos = [...currentDestinos, tipo];
        return {
          ...prev,
          destino_tipo: newDestinos.join(',')
        };
      }
    });
  };

  const selectedProduct = products.find(p => p.producto_id === parseInt(formData.producto_id));
  const availableQuantity = selectedProduct?.cantidad_actual || maxQuantity || 0;

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay-protection flex items-center justify-center p-6 overflow-y-auto">
      {/* Backdrop clickeable */}
      <div 
        className="absolute inset-0"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative z-[10000] w-full max-w-2xl max-h-[75vh] flex flex-col my-auto">
        <div className="modal-glass h-full flex flex-col">
          {/* 🎯 Header - Modern Design System 2025 */}
          <div style={{
            background: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)',
            borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0',
            boxShadow: 'var(--shadow-danger)'
          }} className="text-white p-8 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm" style={{borderRadius: 'var(--radius-lg)'}}>
                <FiMinus className="w-7 h-7" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Salida de Stock</h2>
                <p className="text-white/80 text-base mt-1">Consumo o asignación de productos</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={submitting}
              className="p-3 hover:bg-white/20 transition-all"
              style={{
                borderRadius: 'var(--radius-lg)',
                transitionDuration: 'var(--duration-normal)',
                transitionTimingFunction: 'var(--ease-out-expo)'
              }}
            >
              <FiX className="w-6 h-6" strokeWidth={2.5} />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            {/* 🎯 Selector de producto - Modern Design */}
            <div>
              <label className="block text-base font-semibold mb-3 text-slate-900 dark:text-slate-50">
                Producto *
              </label>
              <ProductSearchSelect
                products={products.filter(p => (p.cantidad_actual || 0) > 0)}
                selectedProductId={formData.producto_id}
                onProductSelect={(productId) => setFormData(prev => ({ ...prev, producto_id: productId }))}
                disabled={loading || submitting || !!selectedProductId}
                placeholder={loading ? 'Cargando productos...' : 'Buscar producto con stock disponible...'}
              />
            </div>

            {/* Cantidad */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Cantidad *
              </label>
              <input
                type="number"
                min="1"
                max={availableQuantity}
                value={formData.cantidad}
                onChange={(e) => setFormData(prev => ({ ...prev, cantidad: e.target.value }))}
                disabled={submitting}
                className="input-glass w-full"
                placeholder={`Cantidad a retirar (máx: ${availableQuantity})`}
                required
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Stock disponible: {availableQuantity} unidades
              </p>
            </div>

            {/* Motivo */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Motivo *
              </label>
              <select
                value={formData.motivo}
                onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
                disabled={submitting}
                className="input-glass w-full mb-2"
                required
              >
                <option value="">Seleccionar motivo</option>
                <option value="Consumo">Consumo</option>
                <option value="Prestamo temporal">Prestamo temporal</option>
                <option value="Mantenimiento/Reparacion">Mantenimiento/Reparacion</option>
                <option value="Proyecto especifico">Proyecto especifico</option>
                <option value="Otro motivo">Otro motivo</option>
              </select>
              
              {/* Campo de texto libre si selecciona "Otro motivo" */}
              {formData.motivo === 'Otro motivo' && (
                <input
                  type="text"
                  value={formData.motivo_personalizado}
                  onChange={(e) => setFormData(prev => ({ ...prev, motivo_personalizado: e.target.value }))}
                  disabled={submitting}
                  className="input-glass w-full"
                  placeholder="Especifique el motivo (mínimo 5 caracteres)"
                  minLength={5}
                  required
                />
              )}
            </div>

            {/* Tipo de destino */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Destino * <span className="text-xs text-slate-500">(puede seleccionar múltiples destinos)</span>
              </label>
              {formData.destino_tipo && (
                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                  <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">
                    <span className="font-medium">Destinos seleccionados:</span> {formData.destino_tipo.split(',').filter(d => d.trim()).join(', ')}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    💡 El registro se hará con el destino principal: {
                      formData.empleado_id ? 'Empleado' : 
                      formData.sector_id ? 'Sector' : 
                      formData.sucursal_id ? 'Sucursal' : 'Ninguno'
                    }
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => handleDestinoTipoToggle('empleado')}
                  disabled={submitting}
                  className={`destination-card ${
                    formData.destino_tipo.includes('empleado') ? 'selected' : ''
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <FiUser className="w-6 h-6" style={{color: '#6366F1'}} />
                    <span className="font-medium text-slate-700 dark:text-slate-300">Empleado</span>
                    {formData.destino_tipo.includes('empleado') && (
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    )}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDestinoTipoToggle('sector')}
                  disabled={submitting}
                  className={`destination-card ${
                    formData.destino_tipo.includes('sector') ? 'selected' : ''
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <FiMapPin className="w-6 h-6" style={{color: '#6366F1'}} />
                    <span className="font-medium text-slate-700 dark:text-slate-300">Sector</span>
                    {formData.destino_tipo.includes('sector') && (
                      <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#6366F1'}}></div>
                    )}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDestinoTipoToggle('sucursal')}
                  disabled={submitting}
                  className={`destination-card ${
                    formData.destino_tipo.includes('sucursal') ? 'selected' : ''
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <FiBriefcase className="w-6 h-6" style={{color: '#6366F1'}} />
                    <span className="font-medium text-slate-700 dark:text-slate-300">Sucursal</span>
                    {formData.destino_tipo.includes('sucursal') && (
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    )}
                  </div>
                </button>
              </div>

              {/* Selectores específicos según destinos seleccionados */}
              <div className="space-y-4">
                {formData.destino_tipo.includes('empleado') && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Seleccionar Empleado *
                    </label>
                    <select
                      value={formData.empleado_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, empleado_id: e.target.value }))}
                      disabled={submitting}
                      className="input-glass w-full"
                      required
                    >
                      <option value="">Seleccionar empleado</option>
                      {employees.map(employee => (
                        <option key={employee.id} value={employee.id}>
                          {employee.nombre} {employee.apellido}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.destino_tipo.includes('sector') && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Seleccionar Sector *
                    </label>
                    <select
                      value={formData.sector_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, sector_id: e.target.value }))}
                      disabled={submitting}
                      className="input-glass w-full"
                      required
                    >
                      <option value="">Seleccionar sector</option>
                      {sectors.map(sector => (
                        <option key={sector.id} value={sector.id}>
                          {sector.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.destino_tipo.includes('sucursal') && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Seleccionar Sucursal *
                    </label>
                    <select
                      value={formData.sucursal_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, sucursal_id: e.target.value }))}
                      disabled={submitting}
                      className="input-glass w-full"
                      required
                    >
                      <option value="">Seleccionar sucursal</option>
                      {sucursales.map(sucursal => (
                        <option key={sucursal.id} value={sucursal.id}>
                          {sucursal.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Observaciones
              </label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                disabled={submitting}
                className="input-glass w-full h-20 resize-none"
                placeholder="Información adicional opcional..."
              />
            </div>

            {/* Mensajes de estado */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                <FiCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p>
              </div>
            )}

              </div>
              
              {/* 🔘 Footer con botones fijos - Modern Design System 2025 */}
              <div className="border-t border-slate-200 dark:border-slate-700 p-6 flex gap-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm flex-shrink-0">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={submitting}
                  className="btn-glass-secondary-modern flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formData.producto_id || !formData.cantidad || !formData.motivo || !formData.destino_tipo}
                  className="btn-glass-primary-modern flex-1 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <FiMinus className="w-5 h-5" strokeWidth={2.5} />
                      Registrar Salida
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default StockExitModal; 