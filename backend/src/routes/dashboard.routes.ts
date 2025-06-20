import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { logger } from '../utils/logger';
import { authenticateToken } from '../middleware/auth.middleware';
import { authorizeRole } from '../middleware/role.middleware';

const router = Router();
const dashboardController = new DashboardController();

/**
 * @route   GET /api/dashboard/stats
 * @desc    Obtener estadísticas generales del sistema para el dashboard
 * @access  Private (Todos los usuarios autenticados)
 */
router.get('/stats', authenticateToken, dashboardController.getSystemStats);

/**
 * @route   GET /api/dashboard/alerts
 * @desc    Obtener alertas de stock bajo
 * @access  Private (Todos los usuarios autenticados)
 */
router.get('/alerts', authenticateToken, dashboardController.getStockAlerts);

/**
 * @route   GET /api/dashboard/activity
 * @desc    Obtener actividad reciente del sistema
 * @access  Private (Todos los usuarios autenticados)
 */
router.get('/activity', authenticateToken, dashboardController.getRecentActivity);

/**
 * @route   GET /api/dashboard/kpis
 * @desc    Obtener KPIs principales del inventario
 * @access  Private (Todos los usuarios autenticados)
 */
router.get('/kpis', authenticateToken, dashboardController.getInventoryKPIs);

export default router;
