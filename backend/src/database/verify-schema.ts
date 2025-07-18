import { DatabaseConnection } from '../utils/database';
import { logger } from '../utils/logger';
import { config } from 'dotenv';
import mysql from 'mysql2/promise';

// Cargar variables de entorno
config();

/**
 * Script para verificar el esquema de la base de datos MySQL
 * Se puede ejecutar desde la línea de comandos con:
 * npx ts-node src/database/verify-schema.ts
 */
async function verifyDatabaseSchema(): Promise<void> {
  console.log('\n=== Verificación de Esquema de Base de Datos MySQL ===\n');
  
  const db = DatabaseConnection.getInstance();
  
  try {
    // Verificar tablas base
    const requiredTables = [
      'Usuarios', 'Categorias', 'Productos', 'InventarioIndividual', 
      'StockGeneral', 'Asignaciones', 'Reparaciones', 'MovimientosStock'
    ];
    
    console.log('Verificando tablas existentes...');
    
    const tablesQuery = `
      SELECT TABLE_NAME as TableName
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME
    `;
    
    const tablesResult = await db.executeQuery<mysql.RowDataPacket[]>(tablesQuery);
    const [tablesData] = tablesResult;
    const existingTables = tablesData.map((r: any) => r.TableName);
    
    console.log('\nTablas encontradas:');
    existingTables.forEach(table => {
      const exists = requiredTables.includes(table);
      console.log(`- ${table}: ${exists ? '✅' : '⚠️'}`);
    });
    
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));
    if (missingTables.length > 0) {
      console.log('\n⚠️ Tablas requeridas que no existen:');
      missingTables.forEach(table => console.log(`- ${table}`));
    } else {
      console.log('\n✅ Todas las tablas requeridas existen');
    }
    
    // Verificar índices
    console.log('\nVerificando índices...');
    
    const indexesQuery = `
      SELECT 
          TABLE_NAME as TableName, 
          INDEX_NAME as IndexName,
          INDEX_TYPE as IndexType,
          GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ', ') as Columns
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME IN (${requiredTables.map(t => `'${t}'`).join(',')})
      GROUP BY TABLE_NAME, INDEX_NAME, INDEX_TYPE
      ORDER BY TABLE_NAME, INDEX_NAME
    `;
    
    const indexesResult = await db.executeQuery<mysql.RowDataPacket[]>(indexesQuery);
    const [indexesData] = indexesResult;
    
    console.log('\nÍndices encontrados:');
    
    let currentTable = '';
    let indexCount = 0;
    
    indexesData.forEach((idx: any) => {
      if (currentTable !== idx.TableName) {
        if (currentTable !== '') {
          console.log(`  Total índices: ${indexCount}`);
        }
        currentTable = idx.TableName;
        indexCount = 0;
        console.log(`\n- Tabla ${idx.TableName}:`);
      }
      
      indexCount++;
      console.log(`  • ${idx.IndexName} (${idx.IndexType}): ${idx.Columns}`);
    });
    
    if (currentTable !== '') {
      console.log(`  Total índices: ${indexCount}`);
    }
    
    console.log(`\n✅ Total de índices encontrados: ${indexesData.length}`);
    
    // Verificar foreign keys
    console.log('\nVerificando foreign keys...');
    
    const foreignKeysQuery = `
      SELECT 
          CONSTRAINT_NAME as FKName,
          TABLE_NAME as TableName,
          COLUMN_NAME as ColumnName,
          REFERENCED_TABLE_NAME as ReferencedTable,
          REFERENCED_COLUMN_NAME as ReferencedColumn
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND REFERENCED_TABLE_NAME IS NOT NULL
        AND TABLE_NAME IN (${requiredTables.map(t => `'${t}'`).join(',')})
      ORDER BY TABLE_NAME, CONSTRAINT_NAME
    `;
    
    const foreignKeysResult = await db.executeQuery<mysql.RowDataPacket[]>(foreignKeysQuery);
    const [foreignKeysData] = foreignKeysResult;
    
    console.log('\nForeign Keys encontradas:');
    
    currentTable = '';
    let fkCount = 0;
    
    foreignKeysData.forEach((fk: any) => {
      if (currentTable !== fk.TableName) {
        if (currentTable !== '') {
          console.log(`  Total foreign keys: ${fkCount}`);
        }
        currentTable = fk.TableName;
        fkCount = 0;
        console.log(`\n- Tabla ${fk.TableName}:`);
      }
      
      fkCount++;
      console.log(`  • ${fk.FKName}: ${fk.ColumnName} -> ${fk.ReferencedTable}.${fk.ReferencedColumn}`);
    });
    
    if (currentTable !== '') {
      console.log(`  Total foreign keys: ${fkCount}`);
    }
    
    console.log(`\n✅ Total de foreign keys encontradas: ${foreignKeysData.length}`);
    
    // Verificar stored procedures
    console.log('\nVerificando stored procedures...');
    
    const spQuery = `
      SELECT ROUTINE_NAME as ProcedureName
      FROM INFORMATION_SCHEMA.ROUTINES
      WHERE ROUTINE_SCHEMA = DATABASE()
        AND ROUTINE_TYPE = 'PROCEDURE'
      ORDER BY ROUTINE_NAME
    `;
    
    const spResult = await db.executeQuery<mysql.RowDataPacket[]>(spQuery);
    const [spData] = spResult;
    
    console.log(`\nStored Procedures encontrados: ${spData.length}`);
    if (spData.length > 0) {
      console.log('Lista de procedimientos (primeros 15):');
      spData.slice(0, 15).forEach((sp: any) => {
        console.log(`  • ${sp.ProcedureName}`);
      });
      if (spData.length > 15) {
        console.log(`  ... y ${spData.length - 15} más`);
      }
    }
    
    // Resumen final
    console.log('\n=== Resumen de Verificación ===');
    console.log(`Tablas: ${existingTables.length}/${requiredTables.length}`);
    console.log(`Índices: ${indexesData.length}`);
    console.log(`Foreign Keys: ${foreignKeysData.length}`);
    console.log(`Stored Procedures: ${spData.length}`);
    
    if (missingTables.length === 0) {
      console.log('\n✅ El esquema de base de datos MySQL está correctamente configurado');
    } else {
      console.log('\n⚠️ El esquema de base de datos MySQL está incompleto');
    }
    
  } catch (error) {
    console.error('\n❌ Error durante la verificación:', (error as Error).message);
    logger.error(`Error en verificación de esquema: ${(error as Error).message}`);
  }
  
  console.log('\n=== Fin de la verificación ===\n');
}

// Ejecutar verificación si este archivo se ejecuta directamente
if (require.main === module) {
  verifyDatabaseSchema()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('Error inesperado:', error);
      process.exit(1);
    });
}

export { verifyDatabaseSchema };
