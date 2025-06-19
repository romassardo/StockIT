import { Router } from 'express';
import { reportController } from '../controllers/report.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { authorizeRole } from '../middleware/role.middleware';

const router = Router();

/**
 * @route GET /api/reports/inventory
 * @desc Obtiene reportes de inventario con filtros
 * @access Todos los usuarios autenticados
 */
router.get(
  '/inventory',
  authenticateToken,
  reportController.getInventoryReport
);

/**
 * @route GET /api/reports/assignments
 * @desc Obtiene reportes de asignaciones por destino
 * @access Todos los usuarios autenticados
 */
router.get(
  '/assignments',
  authenticateToken,
  reportController.getAssignmentsByDestinationReport
);

/**
 * @route GET /api/reports/assignments-by-destination
 * @desc Obtiene reportes de asignaciones por destino (endpoint específico)
 * @access Todos los usuarios autenticados
 */
router.get(
  '/assignments-by-destination',
  authenticateToken,
  reportController.getAssignmentsByDestinationReport
);

/**
 * @route GET /api/reports/stock-alerts
 * @desc Obtiene reportes de alertas de stock
 * @access Todos los usuarios autenticados
 */
router.get(
  '/stock-alerts',
  authenticateToken,
  reportController.getStockAlertsReport
);

/**
 * @route GET /api/reports/stats/stock-alerts-count
 * @desc Obtiene el número de alertas de stock
 * @access Todos los usuarios autenticados
 */
router.get(
  '/stats/stock-alerts-count',
  authenticateToken,
  reportController.getStockAlertsCount
);

/**
 * @route GET /api/reports/inventory/full
 * @desc Obtiene un reporte de inventario completo (serializado y general)
 * @access Todos los usuarios autenticados
 */
router.get(
  '/inventory/full',
  authenticateToken,
  reportController.getFullInventoryReport
);

/**
 * @route GET /api/reports/repair-history
 * @desc Obtiene un reporte de historia de reparaciones con filtros
 * @access Todos los usuarios autenticados
 */
router.get(
  '/repair-history',
  authenticateToken,
  reportController.getRepairHistoryReport
);

/**
 * @route GET /api/reports/export
 * @desc Exporta un reporte a Excel
 * @access Todos los usuarios autenticados
 */
router.get(
  '/export',
  authenticateToken,
  reportController.exportReportToExcel
);

// @route   GET /api/reports/inventory-summary
// @desc    Obtiene el reporte de resumen de inventario
// @access  Private (Admin, Usuario)
router.get(
    '/inventory-summary',
    authenticateToken,
    authorizeRole(['admin', 'usuario']),
    reportController.getInventoryReport
);

/**
 * @route GET /api/reports/stock-disponible/export
 * @desc Exporta reporte de Stock Disponible a Excel
 * @access Todos los usuarios autenticados
 */
router.get(
  '/stock-disponible/export',
  authenticateToken,
  reportController.exportStockDisponible
);

/**
 * @route GET /api/reports/assignments-by-destination/export
 * @desc Exporta reporte de Asignaciones por Destino a Excel
 * @access Todos los usuarios autenticados
 */
router.get(
  '/assignments-by-destination/export',
  authenticateToken,
  reportController.exportAssignmentsByDestination
);

/**
 * @route GET /api/reports/repair-history/export
 * @desc Exporta reporte de Historia de Reparaciones a Excel
 * @access Todos los usuarios autenticados
 */
router.get(
  '/repair-history/export',
  authenticateToken,
  reportController.exportRepairHistory
);

/**
 * @route GET /api/reports/stock-movements
 * @desc Obtiene reporte de Auditoría de Movimientos con filtros y paginación
 * @access Todos los usuarios autenticados
 */
router.get(
  '/stock-movements',
  authenticateToken,
  reportController.getStockMovements
);

/**
 * @route GET /api/reports/stock-movements/export
 * @desc Exporta reporte de Auditoría de Movimientos a Excel
 * @access Todos los usuarios autenticados
 */
router.get(
  '/stock-movements/export',
  authenticateToken,
  reportController.exportStockMovements
);

export default router;
