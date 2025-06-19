import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';

const router = Router();
const userController = new UserController();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Solo admins pueden gestionar usuarios
router.get('/', requireRole(['admin']), userController.getUsers);
router.get('/stats', requireRole(['admin']), userController.getStats);
router.get('/validate-email', requireRole(['admin']), userController.validateEmail);
router.get('/:id', requireRole(['admin']), userController.getUserById);
router.post('/', requireRole(['admin']), userController.createUser);
router.put('/:id', requireRole(['admin']), userController.updateUser);
router.patch('/:id/toggle-active', requireRole(['admin']), userController.toggleUserStatus);
router.post('/:id/change-password', requireRole(['admin']), userController.changePassword);

export default router;
