import express from 'express';
import { StockController } from '../controllers/stock.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { Request, Response, NextFunction } from 'express';

const router = express.Router();
const stockController = new StockController();

// Middleware específico para logging de requests de salida
const logStockExitRequests = (req: Request, res: Response, next: NextFunction) => {
  const requestId = Date.now() + Math.random().toString(36).substr(2, 9);
  console.log(`🌍 [${requestId}] NUEVA REQUEST a /api/stock/exit recibida`);
  console.log(`🌍 [${requestId}] Method: ${req.method}, Body:`, req.body);
  console.log(`🌍 [${requestId}] Headers User-Agent:`, req.headers['user-agent']);
  console.log(`🌍 [${requestId}] IP:`, req.ip);
  
  // Agregar el requestId al request para rastrearlo
  (req as any).requestId = requestId;
  
  next();
};

// Rutas de stock general
router.get('/general', authenticateToken, stockController.getAllStockItems);
router.get('/current', authenticateToken, stockController.getCurrentStock);

// Rutas de movimientos de stock
router.post('/entry', authenticateToken, stockController.addStockEntry);
router.post('/exit', authenticateToken, logStockExitRequests, stockController.processStockExit);
router.get('/movements', authenticateToken, stockController.getStockMovements);

// Rutas de alertas
router.get('/alerts', authenticateToken, stockController.getLowStockAlerts);

export default router;
