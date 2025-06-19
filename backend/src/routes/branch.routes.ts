import { Router } from 'express';
import { BranchController } from '../controllers/branch.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();
const branchController = new BranchController();

// Crear una nueva sucursal
router.post(
  '/', 
  authenticateToken, 
  authorizeRoles(['admin']), // Solo administradores pueden crear sucursales
  branchController.createBranch
);

// Obtener todas las sucursales
router.get(
  '/', 
  authenticateToken, // Todos los usuarios autenticados pueden ver las sucursales
  branchController.getAllBranches
);

// Obtener una sucursal por ID
router.get(
  '/:id', 
  authenticateToken, 
  branchController.getBranchById
);

// Actualizar una sucursal (solo nombre)
router.put(
  '/:id', 
  authenticateToken, 
  authorizeRoles(['admin']), // Solo administradores pueden actualizar sucursales
  branchController.updateBranch
);

// Cambiar estado activo/inactivo de una sucursal
router.patch(
  '/:id/toggle-active', 
  authenticateToken, 
  authorizeRoles(['admin']), // Solo administradores pueden cambiar el estado
  branchController.toggleBranchActive
);

export default router;
