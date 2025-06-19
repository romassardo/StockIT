import { DatabaseConnection } from '../utils/database';
import { logger } from '../utils/logger';

/**
 * Script para verificar la conexión a la base de datos
 * Se puede ejecutar directamente con: npx ts-node src/database/db-check.ts
 */
async function checkDatabaseConnection(): Promise<void> {
  console.log('\n=== Verificación de Conexión a Base de Datos ===\n');
  
  const db = DatabaseConnection.getInstance();
  
  try {
    console.log('Intentando conectar a la base de datos...');
    const status = await db.checkConnectionStatus();
    
    if (status.connected) {
      console.log('\n✅ Conexión exitosa a la base de datos!\n');
      console.log('Estadísticas del pool de conexiones:');
      console.log(`- Tamaño del pool: ${status.poolSize}`);
      console.log(`- Conexiones disponibles: ${status.availableCount}`);
      console.log(`- Conexiones en espera: ${status.pending}`);
      
      // Intentar obtener la versión del servidor
      try {
        const result = await db.executeQuery<{ version: string }>('SELECT @@VERSION AS version');
        console.log('\nInformación del servidor:');
        console.log(result.recordset[0].version);
      } catch (error) {
        console.error('No se pudo obtener la versión del servidor:', (error as Error).message);
      }
      
      // Verificar que existe la tabla MigracionesDB
      try {
        const result = await db.executeQuery<{ exists: number }>(
          "SELECT COUNT(*) AS exists FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'MigracionesDB'"
        );
        
        const tableExists = result.recordset[0].exists > 0;
        console.log(`\nTabla de migraciones: ${tableExists ? '✅ Existe' : '❌ No existe'}`);
        
        if (!tableExists) {
          console.log('👉 La tabla de migraciones se creará automáticamente al ejecutar las migraciones.');
        }
      } catch (error) {
        console.error('Error al verificar tabla de migraciones:', (error as Error).message);
      }
    } else {
      console.error('\n❌ Error al conectar a la base de datos!');
      console.log('\nPosibles causas:');
      console.log('1. Servidor de base de datos no está en ejecución');
      console.log('2. Credenciales incorrectas');
      console.log('3. Nombre de base de datos incorrecto');
      console.log('4. Problemas de red o firewall');
      
      console.log('\nSoluciones:');
      console.log('1. Verificar que el servidor SQL Server esté en ejecución');
      console.log('2. Revisar variables de entorno en el archivo .env');
      console.log('3. Verificar que la base de datos existe');
      console.log('4. Comprobar conexión de red y reglas de firewall');
      
      // Intentar obtener más diagnósticos
      try {
        const diagnostics = await db.getDiagnostics();
        console.log('\nDiagnóstico:');
        console.log('- Variables de entorno:');
        console.log(`  DB_HOST: ${diagnostics.envVars.dbHost}`);
        console.log(`  DB_PORT: ${diagnostics.envVars.dbPort}`);
        console.log(`  DB_NAME: ${diagnostics.envVars.dbName}`);
        console.log(`  DB_USER configurado: ${diagnostics.envVars.hasUser ? 'Sí' : 'No'}`);
        console.log(`  DB_PASSWORD configurado: ${diagnostics.envVars.hasPassword ? 'Sí' : 'No'}`);
        
        if (diagnostics.lastError) {
          console.log(`\nÚltimo error: ${diagnostics.lastError}`);
        }
      } catch (error) {
        // No hacer nada si falla el diagnóstico
      }
    }
  } catch (error) {
    console.error('\n❌ Error durante la verificación:', (error as Error).message);
  } finally {
    // Cerrar la conexión
    try {
      await db.close();
      console.log('\nConexión cerrada correctamente.');
    } catch (error) {
      console.error('Error al cerrar la conexión:', (error as Error).message);
    }
  }
  
  console.log('\n=== Fin de la verificación ===\n');
}

// Ejecutar la verificación si este archivo se ejecuta directamente
if (require.main === module) {
  // Asegurarnos de que se carguen las variables de entorno
  require('dotenv').config();
  
  checkDatabaseConnection()
    .catch(error => {
      console.error('Error no manejado:', error);
      process.exit(1);
    })
    .finally(() => {
      // Salir del proceso después de la verificación
      setTimeout(() => process.exit(0), 500);
    });
}

export { checkDatabaseConnection };
