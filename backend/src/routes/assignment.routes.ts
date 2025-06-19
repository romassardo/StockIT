import { Router } from 'express';
import { AssignmentController } from '../controllers/assignment.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();
const assignmentController = new AssignmentController();

/**
 * @route POST /api/assignments
 * @desc Crear una nueva asignación (diferencia productos con/sin N/S)
 * @access Admin
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles(['admin']),
  assignmentController.createAssignment
);

/**
 * @route GET /api/assignments/active
 * @desc Obtener todas las asignaciones activas con filtros opcionales
 * @access Todos los usuarios autenticados
 */
router.get(
  '/active',
  authenticateToken,
  assignmentController.getActiveAssignments
);

/**
 * @route GET /api/assignments/:assignment_id
 * @desc Obtener detalles de una asignación específica por ID
 * @access Todos los usuarios autenticados
 */
router.get(
  '/:assignment_id',
  authenticateToken,
  assignmentController.getAssignmentById
);

/**
 * @route GET /api/assignments/inventory/:inventario_id
 * @desc Obtener historial de asignaciones para un ítem de inventario
 * @access Todos los usuarios autenticados
 */
router.get(
  '/inventory/:inventario_id',
  authenticateToken,
  assignmentController.getAssignmentHistoryByInventoryItem
);

/**
 * @route GET /api/assignments/by-employee/:employeeId
 * @desc Obtener asignaciones activas de un empleado específico (incluye datos sensibles)
 * @access Todos los usuarios autenticados
 */
router.get(
  '/by-employee/:employeeId',
  authenticateToken,
  assignmentController.getAssignmentsByEmployee
);

/**
 * @route PUT /api/assignments/:assignment_id/return
 * @desc Registrar la devolución de un ítem asignado
 * @access Admin
 */
router.put(
  '/:assignment_id/return',
  authenticateToken,
  authorizeRoles(['admin']),
  assignmentController.returnAssignment
);

/**
 * @route PUT /api/assignments/:assignment_id/cancel
 * @desc Cancelar una asignación activa
 * @access Admin
 */
router.put(
  '/:assignment_id/cancel',
  authenticateToken,
  authorizeRoles(['admin']),
  assignmentController.cancelAssignment
);


/**
 * @route GET /api/assignments/:assignment_id/details
 * @desc Obtener detalles completos de una asignación específica, incluyendo datos sensibles
 * @access Todos los usuarios autenticados (idealmente, restringir a roles de soporte/admin si es necesario)
 */
router.get(
  '/:assignment_id/details',
  authenticateToken, // Podríamos añadir authorizeRoles(['admin', 'soporte']) si existiera el rol 'soporte'
  assignmentController.getAssignmentDetailsById
);

export default router;
