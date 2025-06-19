import { Router } from 'express';
import { ChangelogController } from '../controllers/changelog.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { authorizeRole } from '../middleware/role.middleware';

const router = Router();
const changelogController = new ChangelogController();

/**
 * Rutas para gestión de Changelog
 * 
 * Rutas CRUD protegidas para administradores:
 * - GET /api/changelog - Listar todos (con filtros opcionales)
 * - GET /api/changelog/:id - Obtener uno específico
 * - POST /api/changelog - Crear nuevo
 * - PUT /api/changelog/:id - Actualizar existente
 * - DELETE /api/changelog/:id - Eliminar
 * 
 * Ruta pública:
 * - GET /api/changelog/public - Versión pública del changelog (sin autenticación)
 */

// Ruta pública - debe ir antes de la ruta protegida para que no haga match con /:id
router.get('/public', changelogController.getPublicChangelog);

// Rutas protegidas para administradores
router.get('/', authenticateToken, authorizeRole(['admin']), changelogController.getAllChangelogs);
router.get('/:id', authenticateToken, authorizeRole(['admin']), changelogController.getChangelogById);
router.post('/', authenticateToken, authorizeRole(['admin']), changelogController.createChangelog);
router.put('/:id', authenticateToken, authorizeRole(['admin']), changelogController.updateChangelog);
router.delete('/:id', authenticateToken, authorizeRole(['admin']), changelogController.deleteChangelog);

export default router;