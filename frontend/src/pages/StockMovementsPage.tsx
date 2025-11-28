import React, { useState, useEffect, useMemo } from 'react';
import { 
  Filter, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, 
  Calendar, User, Building, MapPin, Search, Package, RefreshCw,
  Download, ShieldCheck
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { stockService, MovimientoStock, StockMovementsFilters } from '../services/stock.service';
import ProductSearchSelect from '../components/common/ProductSearchSelect';
import SearchableSelect from '../components/common/SearchableSelect';
import { Product } from '../types';
import { exportToExcel } from '../utils/exportUtils';

// --- Componentes UI Estilizados (Copiados de Inventory.tsx para consistencia) ---
const GlassCard = ({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => {
  const { theme } = useTheme();
  return (
    <div 
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl transition-all duration-300
        ${onClick ? 'cursor-pointer hover:scale-[1.01] hover:shadow-lg' : ''}
        ${theme === 'dark' 
          ? 'bg-slate-900/60 border border-slate-700/50 shadow-lg shadow-slate-900/20 backdrop-blur-xl' 
          : 'bg-white/80 border border-slate-200/60 shadow-xl shadow-slate-200/40 backdrop-blur-xl'
        }
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// Interfaces para los filtros
interface Employee { id: number; nombre: string; apellido: string; activo: boolean; }
interface Sector { id: number; nombre: string; activo: boolean; }
interface Sucursal { id: number; nombre: string; activo: boolean; }

const StockMovementsPage: React.FC = () => {
  const { theme } = useTheme();
  
  // Estados de datos
  const [movements, setMovements] = useState<MovimientoStock[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estados de catalogos para filtros
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);

  // Estado de filtros
  const [showFilters, setShowFilters] = useState(false); // Por defecto ocultos para limpieza
  const [filters, setFilters] = useState<StockMovementsFilters>({
    page: 1,
    limit: 50,
    tipo_movimiento: undefined,
    producto_id: undefined,
    empleado_id: undefined,
    sector_id: undefined,
    sucursal_id: undefined,
    fecha_inicio: undefined,
    fecha_fin: undefined
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ hasMore: false, total: 0 });

  // Cargar catálogos al inicio
  useEffect(() => {
    loadCatalogs();
  }, []);

  // Cargar movimientos cuando cambian los filtros o el término de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      loadMovements();
    }, 500); // Aumenté un poco el debounce para búsqueda de texto
    return () => clearTimeout(timer);
  }, [filters, searchTerm]);

  const loadCatalogs = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

      const [prodRes, empRes, secRes, sucRes] = await Promise.all([
        fetch('/api/stock/general', { headers }),
        fetch('/api/employees?activo_only=true', { headers }),
        fetch('/api/sectors?activo_only=true', { headers }),
        fetch('/api/branches?activo_only=true', { headers })
      ]);

      if (prodRes.ok) { const d = await prodRes.json(); setProducts(d.data || []); }
      if (empRes.ok) { 
        const d = await empRes.json(); 
        const empArray = Array.isArray(d.data) ? d.data : (d.data as any)?.employees || [];
        setEmployees(empArray);
      }
      if (secRes.ok) { const d = await secRes.json(); setSectors(d.data || []); }
      if (sucRes.ok) { const d = await sucRes.json(); setSucursales(d.data || []); }

    } catch (error) {
      console.error("Error cargando catálogos", error);
    }
  };

  const loadMovements = async () => {
    setLoading(true);
    try {
      const filtersToSend = { ...filters, search: searchTerm || undefined };
      const result = await stockService.getStockMovements(filtersToSend);
      setMovements(result.movements);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Error al cargar movimientos:', error);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleFilterChange = (key: keyof StockMovementsFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      page: 1,
      limit: 50,
      tipo_movimiento: undefined,
      producto_id: undefined,
      empleado_id: undefined,
      sector_id: undefined,
      sucursal_id: undefined,
      fecha_inicio: undefined,
      fecha_fin: undefined
    });
  };

  const handleExport = async () => {
    try {
      const filtersToSend = { ...filters, search: searchTerm || undefined, limit: 5000, page: 1 };
      const result = await stockService.getStockMovements(filtersToSend);
      
      const dataToExport = result.movements.map(m => ({
        'ID': m.movimiento_id,
        'Fecha': formatDate(m.fecha_movimiento),
        'Tipo': m.tipo_movimiento,
        'Producto': m.nombre_producto,
        'Marca': m.nombre_marca,
        'Cantidad': m.cantidad,
        'Destinatario': m.empleado_nombre || '-',
        'Sector': m.sector_nombre || '-',
        'Sucursal': m.sucursal_nombre || '-',
        'Motivo': m.motivo,
        'Observaciones': m.observaciones || '',
        'Usuario Registro': m.usuario_nombre
      }));

      exportToExcel(dataToExport, `Auditoria_Movimientos_${new Date().toISOString().split('T')[0]}`);
    } catch (error) {
      console.error('Error exportando:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const employeeOptions = useMemo(() => employees.map(e => ({ id: e.id, label: `${e.apellido}, ${e.nombre}` })), [employees]);
  const sectorOptions = useMemo(() => sectors.map(s => ({ id: s.id, label: s.nombre })), [sectors]);
  const sucursalOptions = useMemo(() => sucursales.map(s => ({ id: s.id, label: s.nombre })), [sucursales]);

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
      
      {/* Header Principal (Estilo Inventory.tsx) */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
               <ShieldCheck size={24} />
             </div>
             <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
               Auditoría de Movimientos
             </h1>
          </div>
          <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Registro histórico y trazabilidad completa de operaciones
          </p>
        </div>

        <div className="flex items-center gap-3">
           <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-mono text-sm ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
             <span className="font-bold text-indigo-500">{pagination.total}</span> registros
           </div>
          <button 
            onClick={handleExport}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30 flex items-center gap-2"
          >
            <Download size={16} /> Exportar
          </button>
        </div>
      </header>

      {/* Barra de Herramientas y Filtros */}
      <GlassCard className="mb-6 !p-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
          
          {/* Buscador */}
          <div className="w-full lg:w-96 relative group">
            <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Buscar por motivo, usuario, observaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`
                w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all border
                ${theme === 'dark' 
                  ? 'bg-slate-800/50 border-slate-700 focus:border-indigo-500 text-white placeholder-slate-500' 
                  : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-800 placeholder-slate-400'
                }
              `}
            />
          </div>

          {/* Controles de Filtros */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`
                px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 border
                ${showFilters 
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500' 
                  : theme === 'dark' 
                    ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-700 text-slate-400' 
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600'
                }
              `}
            >
              <Filter size={16} /> Filtros Avanzados
            </button>
            
            <button 
               onClick={loadMovements}
               className={`p-2 rounded-xl transition-colors border ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-700 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-500'}`}
               title="Recargar tabla"
             >
               <RefreshCw size={18} />
             </button>
          </div>
        </div>

        {/* Panel de Filtros Expandible */}
        {showFilters && (
          <div className={`mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2 ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'}`}>
            
            {/* Fechas */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Desde</label>
              <input
                type="date"
                value={filters.fecha_inicio || ''}
                onChange={(e) => handleFilterChange('fecha_inicio', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-sm border outline-none ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Hasta</label>
              <input
                type="date"
                value={filters.fecha_fin || ''}
                onChange={(e) => handleFilterChange('fecha_fin', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-sm border outline-none ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
              />
            </div>

            {/* Tipo y Producto */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Tipo</label>
              <select
                value={filters.tipo_movimiento || ''}
                onChange={(e) => handleFilterChange('tipo_movimiento', e.target.value || undefined)}
                className={`w-full px-3 py-2 rounded-lg text-sm border outline-none ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
              >
                <option value="">Todos</option>
                <option value="Entrada">Entradas</option>
                <option value="Salida">Salidas</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Producto</label>
              <ProductSearchSelect
                products={products}
                selectedProductId={filters.producto_id ? filters.producto_id.toString() : ''}
                onProductSelect={(id) => handleFilterChange('producto_id', id ? parseInt(id) : undefined)}
                placeholder="Buscar producto..."
              />
            </div>

            {/* Destinatarios */}
            <div className="space-y-1">
               <label className="text-xs font-bold uppercase text-slate-500">Empleado</label>
               <SearchableSelect
                options={employeeOptions}
                selectedId={filters.empleado_id ? filters.empleado_id.toString() : ''}
                onSelect={(id) => handleFilterChange('empleado_id', id ? parseInt(id) : undefined)}
                placeholder="Empleado..."
              />
            </div>
            <div className="space-y-1">
               <label className="text-xs font-bold uppercase text-slate-500">Sector</label>
               <SearchableSelect
                options={sectorOptions}
                selectedId={filters.sector_id ? filters.sector_id.toString() : ''}
                onSelect={(id) => handleFilterChange('sector_id', id ? parseInt(id) : undefined)}
                placeholder="Sector..."
              />
            </div>
            <div className="space-y-1">
               <label className="text-xs font-bold uppercase text-slate-500">Sucursal</label>
               <SearchableSelect
                options={sucursalOptions}
                selectedId={filters.sucursal_id ? filters.sucursal_id.toString() : ''}
                onSelect={(id) => handleFilterChange('sucursal_id', id ? parseInt(id) : undefined)}
                placeholder="Sucursal..."
              />
            </div>

            <div className="flex items-end">
               <button onClick={clearFilters} className="w-full py-2 rounded-lg bg-slate-500/10 text-slate-500 hover:bg-slate-500/20 font-medium text-sm transition-colors">
                 Limpiar Filtros
               </button>
            </div>

          </div>
        )}
      </GlassCard>

      {/* Tabla de Movimientos */}
      <GlassCard className="!p-0 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 text-sm font-medium">Cargando datos...</p>
          </div>
        ) : movements.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                <Package className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className={`text-lg font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>No se encontraron movimientos</h3>
              <p className="text-slate-500 text-sm">Intenta ajustar los filtros de búsqueda.</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`border-b ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500 tracking-wider">Tipo</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500 tracking-wider">Producto</th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase text-slate-500 tracking-wider">Cantidad</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500 tracking-wider">Destinatario</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500 tracking-wider">Ubicación</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500 tracking-wider">Motivo</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500 tracking-wider">Usuario / Fecha</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-700/50' : 'divide-slate-200/50'}`}>
                {movements.map((mov) => {
                  const isEntry = mov.tipo_movimiento === 'Entrada';
                  return (
                    <tr key={mov.movimiento_id} className={`transition-colors ${theme === 'dark' ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}`}>
                      
                      {/* Tipo */}
                      <td className="px-6 py-4 whitespace-nowrap">
                         <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                           isEntry 
                             ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                             : 'bg-red-500/10 text-red-600 border-red-500/20'
                         }`}>
                           {isEntry ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                           {isEntry ? 'ENTRADA' : 'SALIDA'}
                         </span>
                      </td>

                      {/* Producto */}
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-3">
                           <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                             <Package size={16} />
                           </div>
                           <div>
                             <div className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                               {mov.nombre_producto}
                             </div>
                             <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                               {mov.nombre_marca}
                             </div>
                           </div>
                         </div>
                      </td>

                      {/* Cantidad */}
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span className={`text-lg font-bold font-mono ${isEntry ? 'text-emerald-500' : 'text-red-500'}`}>
                          {isEntry ? '+' : '-'}{mov.cantidad}
                        </span>
                      </td>

                      {/* Destinatario (Empleado) */}
                      <td className="px-6 py-4">
                        {mov.empleado_nombre ? (
                          <span className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-md w-fit ${theme === 'dark' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                            <User size={12}/> {mov.empleado_nombre}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>

                      {/* Ubicación (Sector/Sucursal) */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          {mov.sector_nombre && (
                            <span className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-md w-fit ${theme === 'dark' ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                              <Building size={12}/> {mov.sector_nombre}
                            </span>
                          )}
                          {mov.sucursal_nombre && (
                            <span className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-md w-fit ${theme === 'dark' ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-50 text-purple-700'}`}>
                              <MapPin size={12}/> {mov.sucursal_nombre}
                            </span>
                          )}
                          {!mov.sector_nombre && !mov.sucursal_nombre && (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </div>
                      </td>

                      {/* Motivo */}
                      <td className="px-6 py-4">
                         <div className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                            {mov.motivo}
                         </div>
                         {mov.observaciones && (
                           <div className="text-xs text-slate-500 italic mt-1 max-w-[200px] truncate">
                             "{mov.observaciones}"
                           </div>
                         )}
                      </td>

                      {/* Usuario / Fecha */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-500 mb-0.5">
                          <User size={12} /> {mov.usuario_nombre}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                           <Calendar size={12} /> {formatDate(mov.fecha_movimiento)}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Footer con Paginación */}
      {movements.length > 0 && (
        <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4">
           <p className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
             Mostrando página <span className="font-bold text-indigo-500">{filters.page}</span>
           </p>
           
           <div className="flex items-center gap-2">
             <button
               onClick={() => handlePageChange((filters.page || 1) - 1)}
               disabled={!filters.page || filters.page <= 1}
               className={`p-2 rounded-lg transition-all border ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-800 text-slate-400 disabled:opacity-30' : 'border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-30'}`}
             >
               <ChevronLeft size={18} />
             </button>
             <button
               onClick={() => handlePageChange((filters.page || 1) + 1)}
               disabled={!pagination.hasMore}
               className={`p-2 rounded-lg transition-all border ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-800 text-slate-400 disabled:opacity-30' : 'border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-30'}`}
             >
               <ChevronRight size={18} />
             </button>
           </div>
        </div>
      )}

    </div>
  );
};

export default StockMovementsPage;
