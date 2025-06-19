import { MigrationManager } from './migration-manager';
import { logger } from '../utils/logger';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

/**
 * Script para ejecutar las migraciones de la base de datos
 * Se puede ejecutar desde la línea de comandos con:
 * npx ts-node src/database/run-migrations.ts
 */
async function runMigrations(): Promise<void> {
  console.log('=== Ejecutando migraciones de base de datos ===');
  
  try {
    const migrationManager = new MigrationManager();
    await migrationManager.runMigrations();
    console.log('✅ Migraciones ejecutadas correctamente');
  } catch (error) {
    console.error('❌ Error al ejecutar migraciones:', (error as Error).message);
    logger.error(`Error en migraciones: ${(error as Error).message}`);
    process.exit(1);
  }
}

// Ejecutar migraciones si este archivo se ejecuta directamente
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Proceso de migración completado');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error inesperado:', error);
      process.exit(1);
    });
}

export { runMigrations };
