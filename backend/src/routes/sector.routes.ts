import { Router } from 'express';
import { SectorController } from '../controllers/sector.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();
const sectorController = new SectorController();

// Crear un nuevo sector
router.post(
  '/', 
  authenticateToken, 
  authorizeRoles(['admin']), // Solo administradores pueden crear sectores
  sectorController.createSector
);

// Obtener todos los sectores
router.get(
  '/', 
  authenticateToken, // Todos los usuarios autenticados pueden ver los sectores
  sectorController.getAllSectors
);

// Obtener un sector por ID
router.get(
  '/:id', 
  authenticateToken, 
  sectorController.getSectorById
);

// Actualizar un sector
router.put(
  '/:id', 
  authenticateToken, 
  authorizeRoles(['admin']), // Solo administradores pueden actualizar sectores
  sectorController.updateSector
);

// Cambiar estado activo/inactivo de un sector
router.patch(
  '/:id/toggle-active', 
  authenticateToken, 
  authorizeRoles(['admin']), // Solo administradores pueden cambiar el estado
  sectorController.toggleSectorActiveStatus
);

export default router;
