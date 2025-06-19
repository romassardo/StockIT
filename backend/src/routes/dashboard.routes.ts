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
 * @access  Private (Admin, Supervisor)
 */
router.get('/stats', authenticateToken, authorizeRole(['admin', 'supervisor']), dashboardController.getSystemStats);

/**
 * @route   GET /api/dashboard/alerts
 * @desc    Obtener alertas de stock bajo
 * @access  Private (Admin, Técnico, Supervisor)
 */
router.get('/alerts', authenticateToken, authorizeRole(['admin', 'tecnico', 'supervisor']), dashboardController.getStockAlerts);

/**
 * @route   GET /api/dashboard/activity
 * @desc    Obtener actividad reciente del sistema
 * @access  Private (Admin, Técnico, Supervisor)
 */
router.get('/activity', authenticateToken, authorizeRole(['admin', 'tecnico', 'supervisor']), dashboardController.getRecentActivity);

/**
 * @route   GET /api/dashboard/kpis
 * @desc    Obtener KPIs principales del inventario
 * @access  Private (Admin, Técnico, Supervisor)
 */
router.get('/kpis', authenticateToken, authorizeRole(['admin', 'tecnico', 'supervisor']), dashboardController.getInventoryKPIs);

export default router;
