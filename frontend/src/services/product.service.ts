import api from './api';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface ProductCreateData {
  categoria_id: number;
  marca: string;
  modelo: string;
  descripcion?: string;
  stock_minimo?: number;
  usa_numero_serie?: boolean;
}

export interface CategoryCreateData {
  nombre: string;
  categoria_padre_id?: number | null;
  requiere_serie?: boolean;
  permite_asignacion?: boolean;
  permite_reparacion?: boolean;
}

class ProductService {
  // Métodos para productos
  async getProducts(params: URLSearchParams): Promise<ApiResponse> {
    try {
      const response = await api.get(`/products?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Error en getProducts:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener productos');
    }
  }

  async createProduct(productData: ProductCreateData): Promise<ApiResponse> {
    try {
      const response = await api.post('/products', productData);
      return response.data;
    } catch (error: any) {
      console.error('Error en createProduct:', error);
      throw new Error(error.response?.data?.message || 'Error al crear producto');
    }
  }

  async updateProduct(id: number, productData: ProductCreateData): Promise<ApiResponse> {
    try {
      const response = await api.put(`/products/${id}`, productData);
      return response.data;
    } catch (error: any) {
      console.error('Error en updateProduct:', error);
      throw new Error(error.response?.data?.message || 'Error al actualizar producto');
    }
  }

  async toggleProductActive(id: number): Promise<ApiResponse> {
    try {
      const response = await api.patch(`/products/${id}/toggle-active`);
      return response.data;
    } catch (error: any) {
      console.error('Error en toggleProductActive:', error);
      throw new Error(error.response?.data?.message || 'Error al cambiar estado del producto');
    }
  }

  // Métodos para categorías
  async getCategories(params: URLSearchParams): Promise<ApiResponse> {
    try {
      const response = await api.get(`/products/categories?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Error en getCategories:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener categorías');
    }
  }

  async getAllCategoriesForSelect(): Promise<ApiResponse> {
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '100',
        incluir_inactivas: 'false'
      });
      const response = await api.get(`/products/categories?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Error en getAllCategoriesForSelect:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener categorías');
    }
  }

  async createCategory(categoryData: CategoryCreateData): Promise<ApiResponse> {
    try {
      const response = await api.post('/products/categories', categoryData);
      return response.data;
    } catch (error: any) {
      console.error('Error en createCategory:', error);
      throw new Error(error.response?.data?.message || 'Error al crear categoría');
    }
  }

  async updateCategory(id: number, categoryData: CategoryCreateData): Promise<ApiResponse> {
    try {
      const response = await api.put(`/products/categories/${id}`, categoryData);
      return response.data;
    } catch (error: any) {
      console.error('Error en updateCategory:', error);
      throw new Error(error.response?.data?.message || 'Error al actualizar categoría');
    }
  }

  async toggleCategoryActive(id: number): Promise<ApiResponse> {
    try {
      const response = await api.patch(`/products/categories/${id}/toggle-active`);
      return response.data;
    } catch (error: any) {
      console.error('Error en toggleCategoryActive:', error);
      throw new Error(error.response?.data?.message || 'Error al cambiar estado de la categoría');
    }
  }

  // Métodos auxiliares
  async getProductById(id: number): Promise<ApiResponse> {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error en getProductById:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener producto');
    }
  }

  async getStockGeneralProducts(): Promise<ApiResponse> {
    try {
      const response = await api.get('/products/stock-general');
      return response.data;
    } catch (error: any) {
      console.error('Error en getStockGeneralProducts:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener productos de stock general');
    }
  }

  async getSerialNumberProducts(): Promise<ApiResponse> {
    try {
      const response = await api.get('/products/serial-number-items');
      return response.data;
    } catch (error: any) {
      console.error('Error en getSerialNumberProducts:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener productos con número de serie');
    }
  }
}

export const productService = new ProductService(); 