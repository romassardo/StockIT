/**
 * Rutas para la autenticación de usuarios
 */
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

// Crear router para las rutas de autenticación
const router = Router();

// Crear instancia del controlador de autenticación
const authController = new AuthController();

// Ruta de estado para verificación rápida del servicio
router.get('/status', (req, res) => {
  res.json({ status: 'ok', message: 'Servicio de autenticación funcionando correctamente' });
});

// Rutas de autenticación
router.post('/login', authController.login);
router.post('/change-password', authenticateToken, authController.changePassword);
router.get('/profile', authenticateToken, authController.getProfile);
router.post('/refresh-token', authController.refreshToken);
router.post('/validate-token', authenticateToken, authController.validateToken);

export default router;
