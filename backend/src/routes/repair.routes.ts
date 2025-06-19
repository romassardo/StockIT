import { Router } from 'express';
import { RepairController } from '../controllers/repair.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();
const repairController = new RepairController();

// A continuación, definiremos las rutas:
// GET /api/repairs/active - Para obtener la lista de reparaciones activas
// POST /api/repairs - Para crear un nuevo envío a reparación
// PUT /api/repairs/:id/return - Para gestionar el retorno de una reparación

// Aquí definiremos las rutas para el módulo de reparaciones

// Obtener todas las reparaciones activas
router.get(
    '/active', 
    authenticateToken, 
    repairController.getActiveRepairs
);

// Crear un nuevo envío a reparación
router.post(
    '/', 
    authenticateToken, 
    authorizeRoles(['admin', 'usuario']), // O los roles que correspondan
    repairController.createRepair
);

// Gestionar el retorno de una reparación
router.put(
    '/:id/return', 
    authenticateToken, 
    authorizeRoles(['admin', 'usuario']), // O los roles que correspondan
    repairController.returnRepair
);

export default router; 