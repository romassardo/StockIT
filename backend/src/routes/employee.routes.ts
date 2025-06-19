import { Router } from 'express';
import { EmployeeController } from '../controllers/employee.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();
const controller = new EmployeeController();

// --- Definición de Rutas para Empleados ---
// El middleware de autenticación se aplica a cada ruta individualmente para mayor claridad.

// Obtener todos los empleados (admin y usuario)
router.get(
  '/',
  authenticateToken,
  authorizeRoles(['admin', 'usuario']),
  controller.getAllEmployees
);

// Obtener un empleado por ID (admin y usuario)
router.get(
  '/:id',
  authenticateToken,
  authorizeRoles(['admin', 'usuario']),
  controller.getEmployeeById
);

// Crear un nuevo empleado (solo admin)
router.post(
  '/',
  authenticateToken,
  authorizeRoles(['admin']),
  controller.createEmployee
);

// Actualizar un empleado (solo admin)
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles(['admin']),
  controller.updateEmployee
);

// Activar/Desactivar un empleado (solo admin)
router.patch(
  '/:id/toggle-active',
  authenticateToken,
  authorizeRoles(['admin']),
  controller.toggleEmployeeActiveStatus
);

export default router;

