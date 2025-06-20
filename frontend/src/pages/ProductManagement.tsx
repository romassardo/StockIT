import React, { useState, useEffect } from 'react';
import { FiPackage, FiPlus, FiEdit, FiToggleLeft, FiToggleRight, FiGrid, FiSearch, FiFilter } from 'react-icons/fi';
import DataTable from '../components/common/DataTable';
import Loading from '../components/common/Loading';
import { ProductForm } from '../components/ProductForm';
import { CategoryForm } from '../components/CategoryForm';
import { productService } from '../services/product.service';
import { useNotification } from '../contexts/NotificationContext';

interface Product {
  id: number;
  categoria_id: number;
  categoria_nombre: string;
  categoria_requiere_serie: boolean;
  categoria_permite_asignacion: boolean;
  categoria_permite_reparacion: boolean;
  marca: string;
  modelo: string;
  descripcion: string | null;
  stock_minimo: number;
  usa_numero_serie: boolean;
  activo: boolean;
  inventario_count: number;
  stock_actual: number;
  stock_bajo: boolean;
}

interface Category {
  id: number;
  nombre: string;
  categoria_padre_id: number | null;
  padre_nombre: string | null;
  requiere_serie: boolean;
  permite_asignacion: boolean;
  permite_reparacion: boolean;
  activo: boolean;
  nivel: number;
  ruta_completa: string;
  productos_count: number;
}

const ProductManagement: React.FC = () => {
  const { addNotification } = useNotification();
  
  // Estados principales
  const [currentTab, setCurrentTab] = useState<'products' | 'categories'>('products');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allCategoriesForSelect, setAllCategoriesForSelect] = useState<Category[]>([]);
  
  // Estados de paginación y filtros
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterActive, setFilterActive] = useState('all');
  
  // Estados de formularios
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Cargar datos al montar y cuando cambian filtros
  useEffect(() => {
    if (currentTab === 'products') {
      loadProducts();
    } else {
      loadCategories();
    }
  }, [currentTab, currentPage, searchTerm, filterCategory, filterActive]);

  useEffect(() => {
    // Cargar todas las categorías para los selectores de los formularios
    // Se carga una sola vez, independientemente de la pestaña
    loadAllCategoriesForSelect();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filterCategory && { categoria_id: filterCategory }),
        ...(filterActive !== 'all' && { activo: filterActive })
      });

      const response = await productService.getProducts(params);
      
      if (response.success && response.data) {
        setProducts(response.data || []);
        setTotalItems(response.pagination?.totalItems || 0);
      } else {
        addNotification({ message: 'Error al cargar productos', type: 'error' });
      }
    } catch (error: any) {
      console.error('Error cargando productos:', error);
      addNotification({ message: error.message || 'Error al cargar productos', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filterActive !== 'all' && { activo: filterActive })
      });

      const response = await productService.getCategories(params);
      
      if (response.success && response.data) {
        setCategories(response.data || []);
        setTotalItems(response.pagination?.totalItems || 0);
      } else {
        addNotification({ message: 'Error al cargar categorías', type: 'error' });
      }
    } catch (error: any) {
      console.error('Error cargando categorías:', error);
      addNotification({ message: error.message || 'Error al cargar categorías', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadAllCategoriesForSelect = async () => {
    try {
      const response = await productService.getAllCategoriesForSelect();
      
      if (response.success && response.data) {
        setAllCategoriesForSelect(response.data);
      } else {
        // Notificación silenciosa o de bajo perfil, para no molestar si solo falla el select
        console.error('No se pudieron cargar las categorías para el selector');
      }
    } catch (error) {
      console.error('Error cargando categorías para selector:', error);
    }
  };

  // Funciones para productos
  const handleCreateProduct = async (data: any) => {
    try {
      const response = await productService.createProduct(data);
      
      if (response.success) {
        addNotification({ message: 'Producto creado exitosamente', type: 'success' });
        setShowProductForm(false);
        loadProducts();
      } else {
        addNotification({ message: response.message || 'Error al crear producto', type: 'error' });
      }
    } catch (error: any) {
      console.error('Error creando producto:', error);
      addNotification({ message: error.message || 'Error al crear producto', type: 'error' });
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleUpdateProduct = async (data: any) => {
    if (!editingProduct) return;
    
    try {
      const response = await productService.updateProduct(editingProduct.id, data);
      
      if (response.success) {
        addNotification({ message: 'Producto actualizado exitosamente', type: 'success' });
        setShowProductForm(false);
        setEditingProduct(null);
        loadProducts();
      } else {
        addNotification({ message: response.message || 'Error al actualizar producto', type: 'error' });
      }
    } catch (error: any) {
      console.error('Error actualizando producto:', error);
      addNotification({ message: error.message || 'Error al actualizar producto', type: 'error' });
    }
  };

  const handleToggleProductActive = async (product: Product) => {
    try {
      const response = await productService.toggleProductActive(product.id);
      
      if (response.success) {
        const action = product.activo ? 'desactivado' : 'activado';
        addNotification({ message: `Producto ${action} exitosamente`, type: 'success' });
        loadProducts();
      } else {
        addNotification({ message: response.message || 'Error al cambiar estado del producto', type: 'error' });
      }
    } catch (error: any) {
      console.error('Error cambiando estado del producto:', error);
      addNotification({ message: error.message || 'Error al cambiar estado del producto', type: 'error' });
    }
  };

  // Funciones para categorías
  const handleCreateCategory = async (data: any) => {
    try {
      const response = await productService.createCategory(data);
      
      if (response.success) {
        addNotification({ message: 'Categoría creada exitosamente', type: 'success' });
        setShowCategoryForm(false);
        loadCategories();
      } else {
        addNotification({ message: response.message || 'Error al crear categoría', type: 'error' });
      }
    } catch (error: any) {
      console.error('Error creando categoría:', error);
      addNotification({ message: error.message || 'Error al crear categoría', type: 'error' });
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowCategoryForm(true);
  };

  const handleUpdateCategory = async (data: any) => {
    if (!editingCategory) return;
    
    try {
      const response = await productService.updateCategory(editingCategory.id, data);
      
      if (response.success) {
        addNotification({ message: 'Categoría actualizada exitosamente', type: 'success' });
        setShowCategoryForm(false);
        setEditingCategory(null);
        loadCategories();
      } else {
        addNotification({ message: response.message || 'Error al actualizar categoría', type: 'error' });
      }
    } catch (error: any) {
      console.error('Error actualizando categoría:', error);
      addNotification({ message: error.message || 'Error al actualizar categoría', type: 'error' });
    }
  };

  const handleToggleCategoryActive = async (category: Category) => {
    try {
      const response = await productService.toggleCategoryActive(category.id);
      
      if (response.success) {
        const action = category.activo ? 'desactivada' : 'activada';
        addNotification({ message: `Categoría ${action} exitosamente`, type: 'success' });
        loadCategories();
      } else {
        addNotification({ message: response.message || 'Error al cambiar estado de la categoría', type: 'error' });
      }
    } catch (error: any) {
      console.error('Error cambiando estado de la categoría:', error);
      addNotification({ message: error.message || 'Error al cambiar estado de la categoría', type: 'error' });
    }
  };

  // Configuración de columnas para productos
  const productColumns = [
    {
      id: 'categoria_nombre',
      accessor: (row: Product) => <span className="text-blue-300">{row.categoria_nombre}</span>,
      header: 'Categoría',
      sortable: true
    },
    {
      id: 'marca',
      accessor: (row: Product) => <span className="font-medium text-white">{row.marca}</span>,
      header: 'Marca',
      sortable: true
    },
    {
      id: 'modelo',
      accessor: (row: Product) => <span className="text-gray-300">{row.modelo}</span>,
      header: 'Modelo',
      sortable: true
    },
    {
      id: 'activo',
      accessor: (row: Product) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.activo 
            ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
            : 'bg-red-500/20 text-red-300 border border-red-500/30'
        }`}>
          {row.activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
      header: 'Estado'
    },
    {
      id: 'actions',
      accessor: (row: Product) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEditProduct(row)}
            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-colors"
            title="Editar producto"
          >
            <FiEdit size={16} />
          </button>
          <button
            onClick={() => handleToggleProductActive(row)}
            className={`p-2 rounded-lg transition-colors ${
              row.activo 
                ? 'text-red-400 hover:text-red-300 hover:bg-red-400/10' 
                : 'text-green-400 hover:text-green-300 hover:bg-green-400/10'
            }`}
            title={row.activo ? 'Desactivar producto' : 'Activar producto'}
          >
            {row.activo ? <FiToggleRight size={16} /> : <FiToggleLeft size={16} />}
          </button>
        </div>
      ),
      header: 'Acciones'
    }
  ];

  // Configuración de columnas para categorías
  const categoryColumns = [
    {
      id: 'nombre_categoria',
      accessor: (row: Category) => (
        <div style={{ paddingLeft: `${(row.nivel - 1) * 1.5}rem` }}>
          <div className="flex items-center">
            <span className="text-white font-medium">{row.nombre}</span>
            {row.padre_nombre && (
              <span className="ml-2 text-xs text-gray-500 bg-gray-700/50 px-2 py-0.5 rounded">
                en {row.padre_nombre}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-1" style={{ paddingLeft: `${(row.nivel - 1) * 1.5}rem` }}>
            {row.ruta_completa}
          </div>
        </div>
      ),
      header: 'Categoría',
      sortable: true
    },
    {
      id: 'requiere_serie',
      accessor: (row: Category) => (
        <span className={`px-2 py-1 rounded text-xs ${
          row.requiere_serie ? 'bg-purple-500/20 text-purple-300' : 'bg-gray-500/20 text-gray-400'
        }`}>
          {row.requiere_serie ? '✓' : '✗'}
        </span>
      ),
      header: 'Serie'
    },
    {
      id: 'permite_asignacion',
      accessor: (row: Category) => (
        <span className={`px-2 py-1 rounded text-xs ${
          row.permite_asignacion ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-400'
        }`}>
          {row.permite_asignacion ? '✓' : '✗'}
        </span>
      ),
      header: 'Asignación'
    },
    {
      id: 'permite_reparacion',
      accessor: (row: Category) => (
        <span className={`px-2 py-1 rounded text-xs ${
          row.permite_reparacion ? 'bg-orange-500/20 text-orange-300' : 'bg-gray-500/20 text-gray-400'
        }`}>
          {row.permite_reparacion ? '✓' : '✗'}
        </span>
      ),
      header: 'Reparación'
    },
    {
      id: 'productos_count',
      accessor: (row: Category) => (
        <span className="text-blue-300 font-medium">{row.productos_count}</span>
      ),
      header: 'Productos'
    },
    {
      id: 'activo',
      accessor: (row: Category) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.activo 
            ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
            : 'bg-red-500/20 text-red-300 border border-red-500/30'
        }`}>
          {row.activo ? 'Activa' : 'Inactiva'}
        </span>
      ),
      header: 'Estado'
    },
    {
      id: 'actions',
      accessor: (row: Category) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEditCategory(row)}
            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-colors"
            title="Editar categoría"
          >
            <FiEdit size={16} />
          </button>
          <button
            onClick={() => handleToggleCategoryActive(row)}
            className={`p-2 rounded-lg transition-colors ${
              row.activo 
                ? 'text-red-400 hover:text-red-300 hover:bg-red-400/10' 
                : 'text-green-400 hover:text-green-300 hover:bg-green-400/10'
            }`}
            title={row.activo ? 'Desactivar categoría' : 'Activar categoría'}
          >
            {row.activo ? <FiToggleRight size={16} /> : <FiToggleLeft size={16} />}
          </button>
        </div>
      ),
      header: 'Acciones'
    }
  ];

  const handleCloseForms = () => {
    setShowProductForm(false);
    setShowCategoryForm(false);
    setEditingProduct(null);
    setEditingCategory(null);
  };

  return (
    <div className="min-h-screen relative">
      {/* Orbes de fondo animados */}
      <div className="fixed inset-0 pointer-events-none transition-all duration-300 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full blur-xl animate-float transition-all duration-300 bg-primary-500/20"></div>
        <div className="absolute top-40 right-20 w-24 h-24 rounded-full blur-lg animate-float transition-all duration-300 bg-secondary-500/20" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-32 left-1/4 w-20 h-20 rounded-full blur-lg animate-float transition-all duration-300 bg-success-500/20" style={{animationDelay: '4s'}}></div>
        <div className="absolute bottom-20 right-1/3 w-28 h-28 rounded-full blur-xl animate-float transition-all duration-300 bg-info-500/20" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl">
                <FiPackage className="text-2xl text-blue-300" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Gestión de Productos</h1>
                <p className="text-gray-400 mt-1">Administra el catálogo de productos y categorías del sistema</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-800/50 backdrop-blur-sm rounded-lg p-1">
            <button
              onClick={() => setCurrentTab('products')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
                currentTab === 'products'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
              }`}
            >
              <FiPackage size={18} />
              <span>Productos</span>
            </button>
            <button
              onClick={() => setCurrentTab('categories')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
                currentTab === 'categories'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
              }`}
            >
              <FiGrid size={18} />
              <span>Categorías</span>
            </button>
          </div>
        </div>

        {/* Controles */}
        <div className="mb-6 space-y-4">
          {/* Botón crear + Filtros */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <button
              onClick={() => currentTab === 'products' ? setShowProductForm(true) : setShowCategoryForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition-all duration-200 shadow-lg"
            >
              <FiPlus size={18} />
              <span>Crear {currentTab === 'products' ? 'Producto' : 'Categoría'}</span>
            </button>

            {/* Filtros */}
            <div className="flex flex-wrap items-center space-x-3">
              {/* Búsqueda */}
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder={`Buscar ${currentTab === 'products' ? 'productos' : 'categorías'}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[250px]"
                />
              </div>

              {/* Filtro de estado */}
              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value)}
                className="px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="true">Solo activos</option>
                <option value="false">Solo inactivos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla de datos */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loading />
            </div>
          ) : (
            <DataTable
              data={currentTab === 'products' ? products : categories}
              columns={currentTab === 'products' ? productColumns : categoryColumns}
              pagination={{
                currentPage: currentPage,
                pageSize: itemsPerPage,
                total: totalItems
              }}
              onPageChange={setCurrentPage}
              keyExtractor={(row: any) => row.id}
              emptyMessage={`No se encontraron ${currentTab === 'products' ? 'productos' : 'categorías'}`}
            />
          )}
        </div>
      </div>

      {/* Formularios */}
      {showProductForm && (
        <ProductForm
          product={editingProduct}
          onClose={handleCloseForms}
          onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
        />
      )}

      {showCategoryForm && (
        <CategoryForm
          category={editingCategory}
          categories={allCategoriesForSelect}
          onClose={handleCloseForms}
          onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
        />
      )}
    </div>
  );
};

export default ProductManagement; 