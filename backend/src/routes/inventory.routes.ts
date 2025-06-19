import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const controller = new InventoryController();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// --- Rutas de Inventario Principal ---
router.get('/', (req, res) => controller.getAvailableInventory(req, res));
router.post('/', (req, res) => controller.createInventoryItem(req, res));
router.post('/batch', (req, res) => controller.createInventoryBatch(req, res));

// Obtener un item por número de serie
router.get('/serial/:serial', (req, res) => controller.getInventoryBySerial(req, res));


// --- Rutas Específicas de un Item (por ID) ---

// Obtener historial completo de un item
router.get('/:id/history', (req, res) => controller.getHistory(req, res));

// Actualizar el estado de un item
router.patch('/:id/state', (req, res) => controller.updateInventoryState(req, res));

// Actualizar información general de un item
router.patch('/:id', (req, res) => controller.updateInventoryItem(req, res));

// Obtener un item de inventario por ID
router.get('/:id', (req, res) => controller.getInventoryItemById(req, res));


// --- Rutas de Reparaciones (dentro del contexto de inventario) ---
router.get('/repairs/active', (req, res) => controller.getActiveRepairs(req, res));
router.post('/repairs', (req, res) => controller.createRepair(req, res));
router.put('/repairs/:id/return', (req, res) => controller.returnRepair(req, res));


export default router;
