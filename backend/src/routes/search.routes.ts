/**
 * Rutas para la búsqueda global
 */
import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';
import { authenticateToken } from '../middleware/auth.middleware';

// Crear router para las rutas de búsqueda
const router = Router();

// Crear instancia del controlador de búsqueda
const searchController = new SearchController();

// Todas las rutas de búsqueda requieren autenticación
router.use(authenticateToken);

// Ruta principal para búsqueda global con parámetros por query
router.get('/global', searchController.globalSearch);

// Rutas específicas para tipos de búsqueda
router.get('/serial/:serialNumber', searchController.searchBySerialNumber);
router.get('/password/:password', searchController.searchByEncryptionPassword);

export default router;