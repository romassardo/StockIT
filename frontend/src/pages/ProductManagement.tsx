import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit, Grid, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import Loading from '../components/common/Loading';
import { ProductForm } from '../components/ProductForm';
import { CategoryForm } from '../components/CategoryForm';
import { productService } from '../services/product.service';
import { useNotification } from '../contexts/NotificationContext';
import { useTheme } from '../contexts/ThemeContext';

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
  const { theme } = useTheme();
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
      addNotification({ message: error.message || 'Error al cambiar estado de la categoría', type: 'error' });
    }
  };

  const handleCloseForms = () => {
    setShowProductForm(false);
    setShowCategoryForm(false);
    setEditingProduct(null);
    setEditingCategory(null);
  };

  // Cálculo de total de páginas
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className={`min-h-screen transition-all duration-300 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
      
      {/* Header Compacto */}
      <div className={`glass-card p-4 mb-6 ${theme === 'dark' ? 'glass-dark' : ''}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Package size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                Catálogo
              </h1>
              <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Gestión de productos y categorías
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setCurrentTab('products')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  currentTab === 'products'
                    ? 'bg-white dark:bg-slate-700 text-indigo-500 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Package className="w-3.5 h-3.5" strokeWidth={2.5} />
                Productos
              </button>
              <button
                onClick={() => setCurrentTab('categories')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  currentTab === 'categories'
                    ? 'bg-white dark:bg-slate-700 text-indigo-500 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Grid className="w-3.5 h-3.5" strokeWidth={2.5} />
                Categorías
              </button>
            </div>

            <button
              onClick={() => currentTab === 'products' ? setShowProductForm(true) : setShowCategoryForm(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              {currentTab === 'products' ? 'Nuevo Producto' : 'Nueva Categoría'}
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-700 pt-4">
          <div className="relative flex-1 w-full sm:max-w-md group">
            <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder={`Buscar ${currentTab === 'products' ? 'productos' : 'categorías'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`
                w-full pl-10 pr-4 py-2 rounded-xl text-sm outline-none transition-all border
                ${theme === 'dark' 
                  ? 'bg-slate-800/50 border-slate-700 focus:border-indigo-500 text-white placeholder-slate-500' 
                  : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-800 placeholder-slate-400'
                }
              `}
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
             {currentTab === 'products' && (
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className={`
                  px-3 py-2 rounded-xl text-sm outline-none transition-all border flex-1
                  ${theme === 'dark' 
                    ? 'bg-slate-800/50 border-slate-700 focus:border-indigo-500 text-white' 
                    : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-800'
                  }
                `}
              >
                <option value="">Todas las categorías</option>
                {allCategoriesForSelect.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
             )}

            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className={`
                px-3 py-2 rounded-xl text-sm outline-none transition-all border
                ${theme === 'dark' 
                  ? 'bg-slate-800/50 border-slate-700 focus:border-indigo-500 text-white' 
                  : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-800'
                }
              `}
            >
              <option value="all">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className={`glass-card-static overflow-hidden rounded-2xl border ${theme === 'dark' ? 'bg-slate-900/60 border-slate-700/50' : 'bg-white/80 border-slate-200/60'} shadow-xl backdrop-blur-xl`}>
          {loading ? (
             <div className="flex items-center justify-center py-12">
               <Loading />
             </div>
          ) : (
            <>
              {currentTab === 'products' ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className={theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50/50'}>
                      <tr>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>Modelo</th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>Marca</th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>Categoría</th>
                        <th className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>Estado</th>
                        <th className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-700' : 'divide-slate-200'}`}>
                      {products.map((product) => (
                        <tr key={product.id} className={`transition-colors duration-200 ${theme === 'dark' ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}>
                          <td className={`px-6 py-4 whitespace-nowrap ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                            <div className="font-medium">{product.modelo}</div>
                            {product.usa_numero_serie && <span className="text-xs text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded ml-2">Serie</span>}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{product.marca}</td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{product.categoria_nombre}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              product.activo 
                                ? 'bg-green-500/20 text-green-500 border border-green-500/30' 
                                : 'bg-red-500/20 text-red-500 border border-red-500/30'
                            }`}>
                              {product.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex justify-center gap-2">
                              <button onClick={() => handleEditProduct(product)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors">
                                <Edit size={16} />
                              </button>
                              <button 
                                onClick={() => handleToggleProductActive(product)}
                                className={`p-2 rounded-lg transition-colors ${product.activo ? 'text-red-400 hover:bg-red-400/10' : 'text-green-400 hover:bg-green-400/10'}`}
                              >
                                {product.activo ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className={theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50/50'}>
                      <tr>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>Categoría</th>
                        <th className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>Configuración</th>
                        <th className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>Productos</th>
                        <th className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>Estado</th>
                        <th className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-700' : 'divide-slate-200'}`}>
                      {categories.map((category) => (
                        <tr key={category.id} className={`transition-colors duration-200 ${theme === 'dark' ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}>
                          <td className={`px-6 py-4 whitespace-nowrap ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                            <div style={{ paddingLeft: `${(category.nivel - 1) * 1.5}rem` }}>
                              <div className="flex items-center">
                                <span className="font-medium">{category.nombre}</span>
                                {category.padre_nombre && (
                                  <span className="ml-2 text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded">en {category.padre_nombre}</span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 mt-1">{category.ruta_completa}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex justify-center gap-2">
                              {category.requiere_serie && <span className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30" title="Requiere Serie">S</span>}
                              {category.permite_asignacion && <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30" title="Permite Asignación">A</span>}
                              {category.permite_reparacion && <span className="px-2 py-1 rounded text-xs bg-orange-500/20 text-orange-300 border border-orange-500/30" title="Permite Reparación">R</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-indigo-400 font-medium">{category.productos_count}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              category.activo 
                                ? 'bg-green-500/20 text-green-500 border border-green-500/30' 
                                : 'bg-red-500/20 text-red-500 border border-red-500/30'
                            }`}>
                              {category.activo ? 'Activa' : 'Inactiva'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex justify-center gap-2">
                              <button onClick={() => handleEditCategory(category)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors">
                                <Edit size={16} />
                              </button>
                              <button 
                                onClick={() => handleToggleCategoryActive(category)}
                                className={`p-2 rounded-lg transition-colors ${category.activo ? 'text-red-400 hover:bg-red-400/10' : 'text-green-400 hover:bg-green-400/10'}`}
                              >
                                {category.activo ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Paginación */}
              {totalPages > 1 && (
                <div className={`px-6 py-3 border-t ${theme === 'dark' ? 'border-slate-700 bg-slate-800/20' : 'border-slate-200 bg-slate-50/50'}`}>
                  <div className="flex items-center justify-between">
                    <div className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      Mostrando {itemsPerPage} de {totalItems} resultados
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className={`${currentPage === 1 ? 'btn-glass-disabled' : 'btn-glass-secondary-modern'} px-3 py-1 text-sm`}
                      >
                        Anterior
                      </button>
                      <span className={`px-3 py-1 text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                        {currentPage} de {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className={`${currentPage === totalPages ? 'btn-glass-disabled' : 'btn-glass-secondary-modern'} px-3 py-1 text-sm`}
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
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