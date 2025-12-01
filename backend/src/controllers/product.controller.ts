import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { DatabaseConnection } from '../utils/database';
import { logger } from '../utils/logger';
import { cacheService } from '../services/cache.service';
import mysql from 'mysql2/promise';

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
        activo = 'all',
        search,
        page = '1',
        limit = '50'
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1 || limitNum > 100) {
        res.status(400).json({ error: 'Parámetros de paginación inválidos' });
        return;
      }

      // Consulta base
      let query = `
        SELECT p.id, p.categoria_id, c.nombre as categoria_nombre, p.marca, p.modelo, 
               p.descripcion, p.stock_minimo, p.usa_numero_serie, p.activo
        FROM Productos p
        LEFT JOIN Categorias c ON p.categoria_id = c.id
        WHERE 1=1
      `;
      const params: any[] = [];
      
      // Filtro de búsqueda por texto (marca, modelo o descripción)
      if (search && typeof search === 'string' && search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        query += ' AND (p.marca LIKE ? OR p.modelo LIKE ? OR p.descripcion LIKE ? OR c.nombre LIKE ?)';
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }
      
      if (categoria_id) { query += ' AND p.categoria_id = ?'; params.push(parseInt(categoria_id as string)); }
      if (usa_numero_serie !== undefined) { query += ' AND p.usa_numero_serie = ?'; params.push(usa_numero_serie === 'true' ? 1 : 0); }
      if (activo === 'true') { query += ' AND p.activo = 1'; } 
      else if (activo === 'false') { query += ' AND p.activo = 0'; }
      // Si activo === 'all', no filtramos
      
      // Primero obtener el total sin paginación
      const countQuery = query.replace(
        /SELECT .* FROM/,
        'SELECT COUNT(*) as total FROM'
      );
      const [countResult] = await this.db.executeQuery<mysql.RowDataPacket[]>(countQuery, params);
      const totalItems = countResult[0]?.total || 0;
      
      query += ' ORDER BY p.marca, p.modelo LIMIT ? OFFSET ?';
      params.push(limitNum, (pageNum - 1) * limitNum);

      const [rows] = await this.db.executeQuery<mysql.RowDataPacket[]>(query, params);
      const data = rows;

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
      const result = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_StockGeneral_GetAll',
        [
          categoriaIdParam,
          soloBajoStockParam,
          productoIdParam
        ]
      );

      // Mapear los resultados al formato esperado por el frontend
      const [productos_raw] = result;
      const productos = (productos_raw as StockGeneralRow[]).map((row) => ({
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
      const result = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_StockGeneral_GetAll',
        [
          null,
          0,
          productoId
        ]
      );

      const [rows] = result;
      if (rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
        return;
      }

      const row = (rows as StockGeneralRow[])[0];
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
      const query = `
        SELECT 
          p.id, 
          p.categoria_id, 
          c.nombre as categoria_nombre, 
          p.marca as nombre_marca, 
          p.modelo as nombre_producto, 
          p.descripcion, 
          p.stock_minimo, 
          p.usa_numero_serie, 
          p.activo
        FROM Productos p
        LEFT JOIN Categorias c ON p.categoria_id = c.id
        WHERE p.usa_numero_serie = 1 AND p.activo = 1
        ORDER BY p.marca, p.modelo
      `;

      const [rows] = await this.db.executeQuery<mysql.RowDataPacket[]>(query);
      
      res.status(200).json({
        success: true,
        data: rows || []
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

      const result = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_Producto_Create',
        [
          parseInt(categoria_id),
          marca.trim(),
          modelo.trim(),
          descripcion ? descripcion.trim() : null,
          parseInt(stock_minimo) || 0,
          usa_numero_serie ? 1 : 0,
          req.user?.id
        ]
      );

      const [data] = result;
      res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        data: data[0]
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

      const result = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_Producto_Update',
        [
          productoId,
          parseInt(categoria_id),
          marca.trim(),
          modelo.trim(),
          descripcion ? descripcion.trim() : null,
          parseInt(stock_minimo) || 0,
          usa_numero_serie ? 1 : 0,
          req.user?.id
        ]
      );

      const [data] = result;
      if (!data || data.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Producto actualizado exitosamente',
        data: data[0]
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

      const result = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_Producto_ToggleActive',
        [
          productoId,
          req.user?.id
        ]
      );

      const [data] = result;
      if (!data || data.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
        return;
      }

      const producto = data[0] as ProductRow;

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
   * Obtener todas las categorías - GET /api/products/categories
   */
  public getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { incluir_inactivas = 'false', activo = 'all', search, page = '1', limit = '50' } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      // Consulta base
      let query = `
        SELECT c.id, c.nombre, c.categoria_padre_id, c.requiere_serie, 
               c.permite_asignacion, c.permite_reparacion, c.activo,
               cp.nombre as categoria_padre_nombre,
               (SELECT COUNT(*) FROM Productos p WHERE p.categoria_id = c.id) as productos_count
        FROM Categorias c
        LEFT JOIN Categorias cp ON c.categoria_padre_id = cp.id
        WHERE 1=1
      `;
      const params: any[] = [];
      
      // Filtro de búsqueda por texto
      if (search && typeof search === 'string' && search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        query += ' AND (c.nombre LIKE ? OR cp.nombre LIKE ?)';
        params.push(searchTerm, searchTerm);
      }
      
      // Filtro por estado activo
      if (activo === 'true') { query += ' AND c.activo = 1'; }
      else if (activo === 'false') { query += ' AND c.activo = 0'; }
      else if (incluir_inactivas !== 'true') { query += ' AND c.activo = 1'; }
      
      // Obtener total antes de paginación
      const countQuery = query.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as total FROM');
      const [countResult] = await this.db.executeQuery<mysql.RowDataPacket[]>(countQuery, params);
      const totalItems = countResult[0]?.total || 0;
      
      query += ' ORDER BY c.nombre LIMIT ? OFFSET ?';
      params.push(limitNum, (pageNum - 1) * limitNum);
      
      const [rows] = await this.db.executeQuery<mysql.RowDataPacket[]>(query, params);
      const categories = rows.map((row: any) => ({
        id: row.id, nombre: row.nombre, categoria_padre_id: row.categoria_padre_id,
        padre_nombre: row.categoria_padre_nombre,
        requiere_serie: row.requiere_serie === 1, permite_asignacion: row.permite_asignacion === 1,
        permite_reparacion: row.permite_reparacion === 1, activo: row.activo === 1,
        productos_count: row.productos_count || 0, nivel: 1, ruta_completa: row.nombre
      }));
      res.status(200).json({ success: true, data: categories, pagination: { page: pageNum, limit: limitNum, totalItems, totalPages: Math.ceil(totalItems / limitNum) } });
    } catch (error: any) {
      logger.error('Error obteniendo categorías:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor al obtener categorías' });
    }
  };

  /**
   * Crear nueva categoría - POST /api/products/categories
   */
  public createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { nombre, categoria_padre_id, requiere_serie = false, permite_asignacion = false, permite_reparacion = false } = req.body;
      if (!nombre) { res.status(400).json({ success: false, message: 'El nombre de la categoría es obligatorio' }); return; }
      const result = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_Categoria_Create', [nombre.trim(), categoria_padre_id ? parseInt(categoria_padre_id) : null, requiere_serie ? 1 : 0, permite_asignacion ? 1 : 0, permite_reparacion ? 1 : 0, req.user?.id]
      );
      const [data] = result;
      res.status(201).json({ success: true, message: 'Categoría creada exitosamente', data: data[0] });
    } catch (error: any) {
      logger.error('Error creando categoría:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor al crear categoría' });
    }
  };

  /**
   * Actualizar categoría existente - PUT /api/products/categories/:id
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

      const result = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_Categoria_Update',
        [
          categoriaId,
          nombre.trim(),
          categoria_padre_id ? parseInt(categoria_padre_id) : null,
          requiere_serie ? 1 : 0,
          permite_asignacion ? 1 : 0,
          permite_reparacion ? 1 : 0,
          req.user?.id
        ]
      );

      const [data] = result;
      if (!data || data.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Categoría actualizada exitosamente',
        data: data[0]
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

      const result = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_Categoria_ToggleActive',
        [
          categoriaId,
          req.user?.id
        ]
      );

      const [data] = result;
      if (!data || data.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
        return;
      }

      const categoria = data[0] as CategoryRow;

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
