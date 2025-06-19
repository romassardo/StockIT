import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();
const productController = new ProductController();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

/**
 * @route GET /api/products
 * @desc Obtener productos con filtros (incluyendo usa_numero_serie)
 * @access Usuarios autenticados
 * @query categoria_id, categoria_nombre, usa_numero_serie, activo, page, limit
 */
router.get('/', productController.getProducts);

/**
 * @route GET /api/products/stock-general
 * @desc Obtener productos SOLO para Stock General (sin número de serie)
 * @access Usuarios autenticados
 */
router.get('/stock-general', productController.getStockGeneralProducts);

/**
 * @route GET /api/products/serial-number-items
 * @desc Obtener productos SOLO para Inventario Individual (con número de serie)
 * @access Usuarios autenticados
 */
router.get('/serial-number-items', productController.getSerialNumberProducts);

/**
 * @route GET /api/products/categories
 * @desc Obtener todas las categorías con estructura jerárquica
 * @access Usuarios autenticados
 */
router.get('/categories', productController.getCategories);

/**
 * @route POST /api/products/categories
 * @desc Crear nueva categoría
 * @access Solo administradores
 */
router.post('/categories', authorizeRoles(['admin']), productController.createCategory);

/**
 * @route PUT /api/products/categories/:id
 * @desc Actualizar categoría existente
 * @access Solo administradores
 */
router.put('/categories/:id', authorizeRoles(['admin']), productController.updateCategory);

/**
 * @route PATCH /api/products/categories/:id/toggle-active
 * @desc Activar/desactivar categoría
 * @access Solo administradores
 */
router.patch('/categories/:id/toggle-active', authorizeRoles(['admin']), productController.toggleCategoryActive);

/**
 * @route POST /api/products
 * @desc Crear nuevo producto
 * @access Solo administradores
 */
router.post('/', authorizeRoles(['admin']), productController.createProduct);

/**
 * @route PUT /api/products/:id
 * @desc Actualizar producto existente
 * @access Solo administradores
 */
router.put('/:id', authorizeRoles(['admin']), productController.updateProduct);

/**
 * @route PATCH /api/products/:id/toggle-active
 * @desc Activar/desactivar producto
 * @access Solo administradores
 */
router.patch('/:id/toggle-active', authorizeRoles(['admin']), productController.toggleProductActive);

/**
 * @route GET /api/products/:id
 * @desc Obtener producto por ID
 * @access Usuarios autenticados
 */
router.get('/:id', productController.getProductById);

export default router; 