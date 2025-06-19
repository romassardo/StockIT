/**
 * Script para verificar la configuración de la base de datos
 * Ejecutar con: npx ts-node scripts/verify-db-connection.ts
 */
import { checkDatabaseConnection } from '../src/database/db-check';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

console.log('Iniciando verificación de conexión a la base de datos...');
checkDatabaseConnection()
  .then(() => {
    console.log('Verificación completa');
  })
  .catch(error => {
    console.error('Error durante la verificación:', error);
    process.exit(1);
  });
