import dotenv from 'dotenv';
import path from 'path';

// Determinar la ruta del archivo .env basada en NODE_ENV
// __dirname en src/index.ts es e:\Proyectos\StockIT\backend\src
// El archivo .env de desarrollo está en e:\Proyectos\StockIT\backend\.env
const envPath = process.env.NODE_ENV === 'production'
  ? path.resolve(__dirname, '../.env.production') // Asumiendo .env.production estaría en la carpeta 'backend'
  : path.resolve(__dirname, '../.env');          // Para desarrollo, .env está en la carpeta 'backend'

dotenv.config({ path: envPath });

import { logger } from './utils/logger'; // Cambiado de require a import

// Añadir al inicio del archivo
// Manejadores globales de errores no capturados
process.on('uncaughtException', (error) => {
  logger.error('UNCAUGHT EXCEPTION: ', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('UNHANDLED REJECTION: ', reason);
  process.exit(1);
});

import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { DatabaseConnection } from './utils/database'; // Importar DatabaseConnection

// Importación de rutas
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import inventoryRoutes from './routes/inventory.routes';
import stockRoutes from './routes/stock.routes';
import productRoutes from './routes/product.routes'; // Rutas para Productos
import employeeRoutes from './routes/employee.routes'; // Rutas para Empleados
import sectorRoutes from './routes/sector.routes'; // Rutas para Sectores
import branchRoutes from './routes/branch.routes'; // Rutas para Sucursales
import assignmentRoutes from './routes/assignment.routes'; // Rutas para Asignaciones
import repairRoutes from './routes/repair.routes'; // Rutas para Reparaciones
import reportRoutes from './routes/report.routes'; // Rutas para Reportes
import changelogRoutes from './routes/changelog.routes'; // Rutas para Changelog
import searchRoutes from './routes/search.routes'; // Rutas para Búsqueda Global
import dashboardRoutes from './routes/dashboard.routes'; // Rutas para Dashboard

// Crea la aplicación Express
const app: Express = express();
const port = process.env.API_PORT || 3000;

// Middleware básicos
app.use(helmet()); // Seguridad con cabeceras HTTP
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));
app.use(express.json()); // Parseo de JSON
app.use(express.urlencoded({ extended: true })); // Parseo de datos de formulario

// Ruta de prueba para la raíz
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'API del Sistema de Inventario IT funcionando correctamente',
    version: '1.0.0',
    timestamp: new Date()
  });
});

// Configuración de rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/products', productRoutes); // Rutas para Productos (usando SP reales)
app.use('/api/employees', employeeRoutes); // Rutas para Empleados
app.use('/api/sectors', sectorRoutes); // Rutas para Sectores
app.use('/api/branches', branchRoutes); // Rutas para Sucursales
app.use('/api/assignments', assignmentRoutes); // Rutas para Asignaciones
app.use('/api/repairs', repairRoutes); // Rutas para Reparaciones
app.use('/api/reports', reportRoutes); // Rutas para Reportes
app.use('/api/changelog', changelogRoutes); // Rutas para Changelog
app.use('/api/search', searchRoutes); // Rutas para Búsqueda Global

app.use('/api/dashboard', dashboardRoutes); // Rutas para Dashboard

// Ruta 404 para endpoints que no existen
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'No encontrado',
    message: 'El recurso solicitado no existe'
  });
});

// Manejador de errores global
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Error: ${err.message}`);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Ocurrió un error inesperado'
  });
});

// Función para iniciar el servidor
async function startServer() {
  logger.info('[SERVER_INIT] Iniciando proceso de arranque del servidor...');
  try {
    // 1. Probar conexión a la base de datos
    logger.info('[SERVER_INIT] Paso 1: Probando conexión a la base de datos...');
    const db = DatabaseConnection.getInstance();
    await db.testConnection(); // Esto lanzará un error si falla, capturado por el catch externo
    logger.info('[SERVER_INIT] Conexión a la base de datos verificada exitosamente.');

    // 2. Iniciar el servidor Express
    logger.info(`[SERVER_INIT] Paso 2: Intentando iniciar el servidor Express en el puerto ${port}...`);
    const server = app.listen(port, () => {
      logger.info(`[SERVER_INIT] Servidor Express escuchando en http://localhost:${port}`);
      // El log periódico se mantiene comentado para reducir verbosidad
    });

    server.on('error', (error: any) => {
      logger.error(`[SERVER_INIT_FAIL] Error al iniciar el listener del servidor Express: ${error.message}`);
      if (error.code === 'EADDRINUSE') {
        logger.error(`[SERVER_INIT_FAIL] El puerto ${port} ya está en uso.`);
      }
      process.exit(1); // Salir si el listener del servidor falla
    });

  } catch (error) {
    const err = error as Error;
    logger.error(`[SERVER_INIT_FAIL] Falló el proceso de inicio del servidor: ${err.message}`);
    if (err.message.includes('Falló la prueba de conexión')) {
      logger.error('[SERVER_INIT_FAIL] Causa raíz probable: Error de conexión con la base de datos. Verifica la configuración en .env y la disponibilidad del servidor de BD.');
    }
    process.exit(1); // Salir si la conexión a la BD u otra parte del inicio falla
  }
}

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  logger.info('SIGTERM recibido. Cerrando servidor limpiamente...');
  process.exit(0); // Salida limpia
});

process.on('SIGINT', () => {
  logger.info('SIGINT recibido. Cerrando servidor limpiamente...');
  process.exit(0); // Salida limpia
});

// Iniciar el servidor
logger.info('[SERVER_INIT] Configuración de src/index.ts completa. Procediendo a llamar a startServer().');
startServer();

export default app;
