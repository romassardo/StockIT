import dotenv from 'dotenv';
import path from 'path';
import { MigrationManager } from '../src/database/migration-manager';
import { DatabaseConnection } from '../src/utils/database';
import * as fs from 'fs';
import { logger } from '../src/utils/logger';

// Configuración mejorada para cargar variables de entorno
// __dirname en scripts/run-migrations-now.ts es e:\Proyectos\StockIT\backend\scripts
// El archivo .env de desarrollo está en e:\Proyectos\StockIT\backend\.env
const envPath = process.env.NODE_ENV === 'production'
  ? path.resolve(__dirname, '../.env.production') // Asumiendo .env.production estaría en la carpeta 'backend'
  : path.resolve(__dirname, '../.env');          // Para desarrollo, .env está en la carpeta 'backend'

const dotenvResult = dotenv.config({ path: envPath });

if (dotenvResult.error) {
  console.error(`Error al cargar el archivo .env: ${dotenvResult.error.message}`);
  console.error(`Ruta intentada: ${envPath}`);
  process.exit(1);
}

console.log(`[RUN_MIGRATIONS] .env cargado correctamente desde: ${envPath}`);

// --- DEBUG INICIO: Verificar variables de entorno después de dotenv.config() en run-migrations-now.ts ---
// logger.info(`Variables de entorno cargadas: ${JSON.stringify(process.env)}`);

// Listar migraciones pendientes para depuración
async function listPendingMigrations() {
  try {
    // Obtener migraciones ya aplicadas de la base de datos
    const db = DatabaseConnection.getInstance();
    logger.info('Obteniendo migraciones aplicadas...');
    
    const query = 'SELECT nombre FROM MigracionesDB ORDER BY id';
    const result = await db.executeQuery<{ nombre: string }>(query);
    const appliedMigrations = result.recordset.map(record => record.nombre);
    
    logger.info('Migraciones ya aplicadas:');
    appliedMigrations.forEach(m => logger.info(` - ${m}`));
    
    // Obtener archivos de migración disponibles
    const migrationsDir = path.join(__dirname, '../src/database/migrations');
    logger.info(`\nBuscando archivos de migración en: ${migrationsDir}`);
    
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
      
    logger.info('Archivos de migración disponibles:');
    migrationFiles.forEach(file => logger.info(` - ${file}`));
    
    // Identificar migraciones pendientes
    const pendingMigrations = migrationFiles.filter(file => 
      !appliedMigrations.includes(path.basename(file, '.sql'))
    );
    
    logger.info('\nMigraciones pendientes:');
    pendingMigrations.forEach(file => logger.info(` - ${file}`));
    
    // Revisar la primera migración pendiente para buscar referencias a 'nombre'
    if (pendingMigrations.length > 0) {
      const firstPendingFile = path.join(migrationsDir, pendingMigrations[0]);
      logger.info(`\nRevisando la primera migración pendiente: ${pendingMigrations[0]}`);
      
      const content = fs.readFileSync(firstPendingFile, 'utf8');
      const hasNombre = content.includes('nombre');
      logger.info(`¿Contiene 'nombre'? ${hasNombre}`);
      
      if (hasNombre) {
        // Extraer 10 líneas antes y después de cada ocurrencia de 'nombre'
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('nombre')) {
            const start = Math.max(0, i - 5);
            const end = Math.min(lines.length - 1, i + 5);
            logger.info(`\nOcurrencia de 'nombre' en línea ${i+1}:`);
            for (let j = start; j <= end; j++) {
              logger.info(`${j === i ? '> ' : '  '}${lines[j]}`);
            }
          }
        }
      }
    }
  } catch (error) {
    logger.error('Error al listar migraciones:', error);
  }
}

// Ejecutar las migraciones con información de depuración
async function executeMigrations() {
  logger.info('Iniciando proceso de ejecución de migraciones...');
  const migrationManager = new MigrationManager();
  let success = false;

  try {
    // Mostrar información de depuración primero
    await listPendingMigrations();
    
    // Ejecutar las migraciones
    await migrationManager.runMigrations();
    logger.info('Proceso de migración completado correctamente');
    success = true;
  } catch (error) {
    logger.error('Error durante el proceso de migraciones:', error);
    if (error instanceof Error) {
        logger.error(`Detalles del error: ${error.message}`);
        if (error.stack) {
            logger.error(`Stack trace: ${error.stack}`);
        }
    }
    success = false;
  } finally {
    const dbInstance = DatabaseConnection.getInstance();
    // Verificar si la instancia y el método close existen antes de llamar
    if (dbInstance && typeof dbInstance.close === 'function') {
      try {
        await dbInstance.close();
        logger.info('Conexión a la base de datos cerrada.');
      } catch (closeError) {
        logger.error('Error al cerrar la conexión de la base de datos:', closeError);
      }
    } else {
      logger.warn('No se pudo obtener la instancia de la base de datos o el método close no está disponible para cerrar la conexión.');
    }
    
    if (!success) {
        process.exit(1); // Salir con código de error si las migraciones fallaron
    }
  }
}

executeMigrations();
