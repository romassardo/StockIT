import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { DatabaseConnection } from '../utils/database';
import { logger } from '../utils/logger';
import { cacheService } from '../services/cache.service';
import * as sql from 'mssql';

// Definir el tipo de datos del SP sp_StockGeneral_GetAll
interface StockGeneralRow {
  producto_id: number;
  nombre_producto: string;
  descripcion_producto: string;
  categoria_id: number;
  nombre_categoria: string;
  marca_id: number | null;
  nombre_marca: string | null;
  min_stock: number;
  cantidad_actual: number;
  ultima_modificacion: Date;
  alerta_stock_bajo: number;
}

// Definir el tipo de datos para productos
interface ProductRow {
  id: number;
  categoria_id: number;
  categoria_nombre: string;
  marca: string;
  modelo: string;
  descripcion: string | null;
  stock_minimo: number;
  usa_numero_serie: boolean;
  activo: boolean;
  fecha_creacion: Date;
  fecha_modificacion: Date | null;
}

// Definir el tipo de datos para categorías
interface CategoryRow {
  id: number;
  nombre: string;
  categoria_padre_id: number | null;
  requiere_serie: boolean;
  permite_asignacion: boolean;
  permite_reparacion: boolean;
  activo: boolean;
  fecha_creacion: Date;
  fecha_modificacion: Date | null;
}

export class ProductController {
  private db = DatabaseConnection.getInstance();

  /**
   * Obtener productos con filtros (especialmente usa_numero_serie)
   * GET /api/products?usa_numero_serie=false
   */
  public getProducts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        categoria_id,
        categoria_nombre,
        usa_numero_serie,
        activo = 'true',
        page = '1',
        limit = '50'
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1 || limitNum > 100) {
        res.status(400).json({ error: 'Parámetros de paginación inválidos' });
        return;
      }

      // Usar stored procedure para obtener productos
      const result = await this.db.executeStoredProcedure<any>(
        'sp_Producto_GetAll',
        {
          categoria_id: categoria_id ? parseInt(categoria_id as string) : null,
          categoria_nombre: categoria_nombre ? (categoria_nombre as string).trim() : null,
          usa_numero_serie: usa_numero_serie !== undefined ? usa_numero_serie === 'true' : null,
          activo: activo === 'true',
          PageNumber: pageNum,
          PageSize: limitNum
        }
      );

      const data = result.recordset || [];
      
      // Si el SP no incluye paginación, calculamos básica
      const totalItems = data.length;
      const totalPages = Math.ceil(totalItems / limitNum);

      res.json({
        success: true,
        data: data,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalItems: totalItems,
          totalPages: totalPages
        }
      });

    } catch (error: any) {
      logger.error('Error obteniendo productos:', error);
      res.status(500).json({ error: 'Error interno del servidor al obtener productos' });
    }
  };

  /**
   * Obtener productos de Stock General (sin número de serie)
   * GET /api/products/stock-general
   * Usa el SP real: sp_StockGeneral_GetAll
   */
  public getStockGeneralProducts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        categoria_id,
        solo_bajo_stock = 'false',
        producto_id
      } = req.query;

      // Convertir parámetros
      const categoriaIdParam = categoria_id ? parseInt(categoria_id as string) : null;
      const soloBajoStockParam = solo_bajo_stock === 'true' ? 1 : 0;
      const productoIdParam = producto_id ? parseInt(producto_id as string) : null;

      logger.info('Obteniendo productos de Stock General', {
        categoria_id: categoriaIdParam,
        solo_bajo_stock: soloBajoStockParam,
        producto_id: productoIdParam,
        usuario: req.user?.id
      });

      // Ejecutar el stored procedure real
      const result = await this.db.executeStoredProcedure('sp_StockGeneral_GetAll', {
        categoria_id: categoriaIdParam,
        solo_bajo_stock: soloBajoStockParam,
        producto_id: productoIdParam
      });

      // Mapear los resultados al formato esperado por el frontend
      const productos = (result.recordset as StockGeneralRow[]).map((row) => ({
        id: row.producto_id,
        nombre: row.nombre_producto,
        descripcion: row.descripcion_producto,
        categoria_id: row.categoria_id,
        nombre_categoria: row.nombre_categoria,
        marca_id: row.marca_id,
        nombre_marca: row.nombre_marca,
        stock_minimo: row.min_stock,
        cantidad_actual: row.cantidad_actual,
        ultima_modificacion: row.ultima_modificacion,
        alerta_stock_bajo: row.alerta_stock_bajo === 1,
        usa_numero_serie: false // Todos los productos de Stock General NO usan número de serie
      }));

      logger.info(`Se obtuvieron ${productos.length} productos de Stock General`);

      res.status(200).json({
        success: true,
        data: productos,
        total: productos.length
      });

    } catch (error) {
      logger.error('Error al obtener productos de Stock General:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener productos',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Obtener producto específico por ID
   * GET /api/products/:id
   */
  public getProductById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const productoId = parseInt(id);

      if (isNaN(productoId)) {
        res.status(400).json({
          success: false,
          message: 'ID de producto inválido'
        });
        return;
      }

      // 🚀 OPTIMIZACIÓN: Verificar caché primero
      const cacheKey = `product_${productoId}`;
      let cachedProduct = cacheService.get<any>(cacheKey);

      if (cachedProduct) {
        logger.info('Producto obtenido desde caché', { producto_id: productoId });
        res.status(200).json({ success: true, data: cachedProduct });
        return;
      }

      logger.info('Obteniendo producto por ID desde BD', {
        producto_id: productoId,
        usuario: req.user?.id
      });

      // Usar el SP existente con filtro por producto_id
      const result = await this.db.executeStoredProcedure('sp_StockGeneral_GetAll', {
        categoria_id: null,
        solo_bajo_stock: 0,
        producto_id: productoId
      });

      if (result.recordset.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
        return;
      }

      const row = (result.recordset as StockGeneralRow[])[0];
      const producto = {
        id: row.producto_id,
        nombre: row.nombre_producto,
        descripcion: row.descripcion_producto,
        categoria_id: row.categoria_id,
        nombre_categoria: row.nombre_categoria,
        marca_id: row.marca_id,
        nombre_marca: row.nombre_marca,
        stock_minimo: row.min_stock,
        cantidad_actual: row.cantidad_actual,
        ultima_modificacion: row.ultima_modificacion,
        alerta_stock_bajo: row.alerta_stock_bajo === 1,
        usa_numero_serie: false
      };

      res.status(200).json({
        success: true,
        data: producto
      });

    } catch (error) {
      logger.error('Error al obtener producto por ID:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener producto',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  public getSerialNumberProducts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const result = await this.db.executeStoredProcedure<any>(
        'sp_Productos_GetByUsaNumeroSerie',
        { usa_numero_serie: 1 }
      );

      res.status(200).json({
        success: true,
        data: result.recordset || []
      });

    } catch (error: any) {
      logger.error('Error obteniendo productos con número de serie:', { errorMessage: error.message });
      res.status(500).json({ success: false, error: 'Error interno del servidor.' });
    }
  };

  /**
   * Crear nuevo producto
   * POST /api/products
   */
  public createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        categoria_id,
        marca,
        modelo,
        descripcion,
        stock_minimo = 0,
        usa_numero_serie = false
      } = req.body;

      // Validaciones básicas
      if (!categoria_id || !marca || !modelo) {
        res.status(400).json({
          success: false,
          message: 'Los campos categoría, marca y modelo son obligatorios'
        });
        return;
      }

      logger.info('Creando nuevo producto', {
        categoria_id,
        marca,
        modelo,
        usuario: req.user?.id
      });

      const result = await this.db.executeStoredProcedure('sp_Producto_Create', {
        categoria_id: parseInt(categoria_id),
        marca: marca.trim(),
        modelo: modelo.trim(),
        descripcion: descripcion ? descripcion.trim() : null,
        stock_minimo: parseInt(stock_minimo) || 0,
        usa_numero_serie: usa_numero_serie ? 1 : 0,
        usuario_id: req.user?.id
      });

      res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        data: result.recordset[0]
      });

    } catch (error: any) {
      logger.error('Error creando producto:', error);
      
      if (error.message?.includes('Ya existe un producto')) {
        res.status(409).json({
          success: false,
          message: error.message
        });
      } else if (error.message?.includes('categoría especificada no existe')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor al crear producto'
        });
      }
    }
  };

  /**
   * Actualizar producto existente
   * PUT /api/products/:id
   */
  public updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        categoria_id,
        marca,
        modelo,
        descripcion,
        stock_minimo = 0,
        usa_numero_serie = false
      } = req.body;

      const productoId = parseInt(id);

      if (isNaN(productoId)) {
        res.status(400).json({
          success: false,
          message: 'ID de producto inválido'
        });
        return;
      }

      // Validaciones básicas
      if (!categoria_id || !marca || !modelo) {
        res.status(400).json({
          success: false,
          message: 'Los campos categoría, marca y modelo son obligatorios'
        });
        return;
      }

      logger.info('Actualizando producto', {
        id: productoId,
        categoria_id,
        marca,
        modelo,
        usuario: req.user?.id
      });

      const result = await this.db.executeStoredProcedure('sp_Producto_Update', {
        id: productoId,
        categoria_id: parseInt(categoria_id),
        marca: marca.trim(),
        modelo: modelo.trim(),
        descripcion: descripcion ? descripcion.trim() : null,
        stock_minimo: parseInt(stock_minimo) || 0,
        usa_numero_serie: usa_numero_serie ? 1 : 0,
        usuario_id: req.user?.id
      });

      if (!result.recordset || result.recordset.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Producto actualizado exitosamente',
        data: result.recordset[0]
      });

    } catch (error: any) {
      logger.error('Error actualizando producto:', error);
      
      if (error.message?.includes('Ya existe otro producto')) {
        res.status(409).json({
          success: false,
          message: error.message
        });
      } else if (error.message?.includes('No se puede cambiar')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor al actualizar producto'
        });
      }
    }
  };

  /**
   * Activar/desactivar producto
   * PATCH /api/products/:id/toggle-active
   */
  public toggleProductActive = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const productoId = parseInt(id);

      if (isNaN(productoId)) {
        res.status(400).json({
          success: false,
          message: 'ID de producto inválido'
        });
        return;
      }

      logger.info('Cambiando estado activo de producto', {
        id: productoId,
        usuario: req.user?.id
      });

      const result = await this.db.executeStoredProcedure('sp_Producto_ToggleActive', {
        id: productoId,
        usuario_id: req.user?.id
      });

      if (!result.recordset || result.recordset.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
        return;
      }

      const producto = result.recordset[0] as ProductRow;

      res.status(200).json({
        success: true,
        message: `Producto ${producto.activo ? 'activado' : 'desactivado'} exitosamente`,
        data: producto
      });

    } catch (error: any) {
      logger.error('Error cambiando estado de producto:', error);
      
      if (error.message?.includes('No se puede desactivar')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor al cambiar estado del producto'
        });
      }
    }
  };

  /**
   * Obtener todas las categorías
   * GET /api/products/categories
   */
  public getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        incluir_inactivas = 'false',
        page = '1',
        limit = '50'
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1 || limitNum > 100) {
        res.status(400).json({ 
          success: false,
          message: 'Parámetros de paginación inválidos' 
        });
        return;
      }

      logger.info('Obteniendo categorías', {
        incluir_inactivas: incluir_inactivas === 'true',
        page: pageNum,
        limit: limitNum,
        usuario: req.user?.id
      });

      const result = await this.db.executeStoredProcedure('sp_Categoria_GetAll', {
        activo_filter: incluir_inactivas === 'true' ? 2 : 1,
        PageNumber: pageNum,
        PageSize: limitNum,
        SortBy: 'ruta_completa',
        SortOrder: 'ASC'
      });

      const rawData = result.recordset || [];
      
      // 🔧 MAPEAR CORRECTAMENTE los datos del SP a la interface Category del frontend
      const mappedCategories = rawData.map((row: any) => ({
        id: row.id,
        nombre: row.nombre,
        categoria_padre_id: row.categoria_padre_id,
        requiere_serie: row.requiere_serie === 1 || row.requiere_serie === true,
        permite_asignacion: row.permite_asignacion === 1 || row.permite_asignacion === true,
        permite_reparacion: row.permite_reparacion === 1 || row.permite_reparacion === true,
        activo: row.activo === 1 || row.activo === true,
        nivel: row.nivel || 0,
        ruta_completa: row.ruta_completa || row.nombre,
        fecha_creacion: row.fecha_creacion,
        fecha_modificacion: row.fecha_modificacion
      }));

      const totalItems = rawData.length > 0 ? (rawData[0] as any).TotalRows : 0;
      const totalPages = Math.ceil(totalItems / limitNum);

      logger.info(`✅ Categorías mapeadas correctamente: ${mappedCategories.length} items`);

      res.status(200).json({
        success: true,
        data: mappedCategories,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalItems: totalItems,
          totalPages: totalPages
        }
      });

    } catch (error: any) {
      logger.error('Error obteniendo categorías:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener categorías'
      });
    }
  };

  /**
   * Crear nueva categoría
   * POST /api/products/categories
   */
  public createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        nombre,
        categoria_padre_id,
        requiere_serie = false,
        permite_asignacion = false,
        permite_reparacion = false
      } = req.body;

      if (!nombre) {
        res.status(400).json({
          success: false,
          message: 'El nombre de la categoría es obligatorio'
        });
        return;
      }

      logger.info('Creando nueva categoría', {
        nombre,
        categoria_padre_id,
        usuario: req.user?.id
      });

      const result = await this.db.executeStoredProcedure('sp_Categoria_Create', {
        nombre: nombre.trim(),
        categoria_padre_id: categoria_padre_id ? parseInt(categoria_padre_id) : null,
        requiere_serie: requiere_serie ? 1 : 0,
        permite_asignacion: permite_asignacion ? 1 : 0,
        permite_reparacion: permite_reparacion ? 1 : 0,
        usuario_id: req.user?.id
      });

      res.status(201).json({
        success: true,
        message: 'Categoría creada exitosamente',
        data: result.recordset[0]
      });

    } catch (error: any) {
      logger.error('Error creando categoría:', error);
      
      if (error.message?.includes('Ya existe una categoría')) {
        res.status(409).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor al crear categoría'
        });
      }
    }
  };

  /**
   * Actualizar categoría existente
   * PUT /api/products/categories/:id
   */
  public updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        nombre,
        categoria_padre_id,
        requiere_serie = false,
        permite_asignacion = false,
        permite_reparacion = false
      } = req.body;

      const categoriaId = parseInt(id);

      if (isNaN(categoriaId)) {
        res.status(400).json({
          success: false,
          message: 'ID de categoría inválido'
        });
        return;
      }

      if (!nombre) {
        res.status(400).json({
          success: false,
          message: 'El nombre de la categoría es obligatorio'
        });
        return;
      }

      logger.info('Actualizando categoría', {
        id: categoriaId,
        nombre,
        usuario: req.user?.id
      });

      const result = await this.db.executeStoredProcedure('sp_Categoria_Update', {
        id: categoriaId,
        nombre: nombre.trim(),
        categoria_padre_id: categoria_padre_id ? parseInt(categoria_padre_id) : null,
        requiere_serie: requiere_serie ? 1 : 0,
        permite_asignacion: permite_asignacion ? 1 : 0,
        permite_reparacion: permite_reparacion ? 1 : 0,
        usuario_id: req.user?.id
      });

      if (!result.recordset || result.recordset.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Categoría actualizada exitosamente',
        data: result.recordset[0]
      });

    } catch (error: any) {
      logger.error('Error actualizando categoría:', error);
      
      if (error.message?.includes('Ya existe otra categoría')) {
        res.status(409).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor al actualizar categoría'
        });
      }
    }
  };

  /**
   * Activar/desactivar categoría
   * PATCH /api/products/categories/:id/toggle-active
   */
  public toggleCategoryActive = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const categoriaId = parseInt(id);

      if (isNaN(categoriaId)) {
        res.status(400).json({
          success: false,
          message: 'ID de categoría inválido'
        });
        return;
      }

      logger.info('Cambiando estado activo de categoría', {
        id: categoriaId,
        usuario: req.user?.id
      });

      const result = await this.db.executeStoredProcedure('sp_Categoria_ToggleActive', {
        id: categoriaId,
        usuario_id: req.user?.id
      });

      if (!result.recordset || result.recordset.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
        return;
      }

      const categoria = result.recordset[0] as CategoryRow;

      res.status(200).json({
        success: true,
        message: `Categoría ${categoria.activo ? 'activada' : 'desactivada'} exitosamente`,
        data: categoria
      });

    } catch (error: any) {
      logger.error('Error cambiando estado de categoría:', error);
      
      if (error.message?.includes('No se puede desactivar')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor al cambiar estado de la categoría'
        });
      }
    }
  };
} 