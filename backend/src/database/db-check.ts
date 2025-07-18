import { DatabaseConnection } from '../utils/database';
import { logger } from '../utils/logger';
import mysql from 'mysql2/promise';

/**
 * Script para verificar la conexión a la base de datos MySQL
 * Se puede ejecutar directamente con: npx ts-node src/database/db-check.ts
 */
async function checkDatabaseConnection(): Promise<void> {
  console.log('\n=== Verificación de Conexión a Base de Datos MySQL ===\n');
  
  const db = DatabaseConnection.getInstance();
  
  try {
    console.log('Intentando conectar a la base de datos MySQL...');
    
    // Verificar conexión ejecutando una consulta simple
    const testResult = await db.executeQuery<mysql.RowDataPacket[]>('SELECT 1 as test');
    const [testData] = testResult;
    
    if (testData && testData.length > 0 && testData[0].test === 1) {
      console.log('\n✅ Conexión exitosa a la base de datos MySQL!\n');
      
      // Intentar obtener la versión del servidor MySQL
      try {
        const versionResult = await db.executeQuery<mysql.RowDataPacket[]>('SELECT VERSION() AS version');
        const [versionData] = versionResult;
        
        console.log('Información del servidor MySQL:');
        console.log(`Versión: ${versionData[0].version}`);
      } catch (error) {
        console.error('No se pudo obtener la versión del servidor:', (error as Error).message);
      }
      
      // Verificar información de la base de datos actual
      try {
        const dbInfoResult = await db.executeQuery<mysql.RowDataPacket[]>('SELECT DATABASE() AS db_name');
        const [dbInfoData] = dbInfoResult;
        
        console.log(`Base de datos actual: ${dbInfoData[0].db_name}`);
      } catch (error) {
        console.error('No se pudo obtener el nombre de la base de datos:', (error as Error).message);
      }
      
      // Verificar tablas principales del sistema
      try {
        const tablesResult = await db.executeQuery<mysql.RowDataPacket[]>(
          `SELECT TABLE_NAME 
           FROM INFORMATION_SCHEMA.TABLES 
           WHERE TABLE_SCHEMA = DATABASE() 
           ORDER BY TABLE_NAME`
        );
        const [tablesData] = tablesResult;
        
        console.log(`\nTablas encontradas: ${tablesData.length}`);
        if (tablesData.length > 0) {
          console.log('Lista de tablas:');
          tablesData.forEach((table: any) => {
            console.log(`  - ${table.TABLE_NAME}`);
          });
        }
      } catch (error) {
        console.error('Error al verificar tablas:', (error as Error).message);
      }
      
      // Verificar stored procedures
      try {
        const spResult = await db.executeQuery<mysql.RowDataPacket[]>(
          `SELECT ROUTINE_NAME 
           FROM INFORMATION_SCHEMA.ROUTINES 
           WHERE ROUTINE_SCHEMA = DATABASE() 
           AND ROUTINE_TYPE = 'PROCEDURE'
           ORDER BY ROUTINE_NAME`
        );
        const [spData] = spResult;
        
        console.log(`\nStored Procedures encontrados: ${spData.length}`);
        if (spData.length > 0) {
          console.log('Lista de SPs (primeros 10):');
          spData.slice(0, 10).forEach((sp: any) => {
            console.log(`  - ${sp.ROUTINE_NAME}`);
          });
          if (spData.length > 10) {
            console.log(`  ... y ${spData.length - 10} más`);
          }
        }
      } catch (error) {
        console.error('Error al verificar stored procedures:', (error as Error).message);
      }
    } else {
      console.error('\n❌ Error al conectar a la base de datos MySQL!');
      console.log('\nPosibles causas:');
      console.log('1. Servidor MySQL no está en ejecución');
      console.log('2. Credenciales incorrectas en .env');
      console.log('3. Base de datos no existe');
      console.log('4. Problemas de red o puerto incorrecto');
      
      console.log('\nSoluciones:');
      console.log('1. Verificar que MySQL esté en ejecución');
      console.log('2. Revisar variables de entorno en .env:');
      console.log('   - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD');
      console.log('3. Crear la base de datos si no existe');
      console.log('4. Verificar puerto 3306 esté abierto');
    }
  } catch (error: any) {
    console.error('\n❌ Error durante la verificación:', error.message);
    
    // Diagnóstico básico
    console.log('\nDiagnóstico de variables de entorno:');
    console.log(`DB_HOST: ${process.env.DB_HOST || 'NO CONFIGURADO'}`);
    console.log(`DB_PORT: ${process.env.DB_PORT || 'NO CONFIGURADO'}`);
    console.log(`DB_NAME: ${process.env.DB_NAME || 'NO CONFIGURADO'}`);
    console.log(`DB_USER: ${process.env.DB_USER ? 'CONFIGURADO' : 'NO CONFIGURADO'}`);
    console.log(`DB_PASSWORD: ${process.env.DB_PASSWORD ? 'CONFIGURADO' : 'NO CONFIGURADO'}`);
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
