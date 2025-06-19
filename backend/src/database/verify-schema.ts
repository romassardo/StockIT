import { DatabaseConnection } from '../utils/database';
import { logger } from '../utils/logger';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

/**
 * Script para verificar el esquema de la base de datos
 * Se puede ejecutar desde la línea de comandos con:
 * npx ts-node src/database/verify-schema.ts
 */
async function verifyDatabaseSchema(): Promise<void> {
  console.log('\n=== Verificación de Esquema de Base de Datos ===\n');
  
  const db = DatabaseConnection.getInstance();
  
  try {
    // Verificar tablas base
    const requiredTables = [
      'Usuarios', 'Categorias', 'Productos', 'InventarioIndividual', 
      'StockGeneral', 'Asignaciones', 'Reparaciones', 'MovimientosStock'
    ];
    
    console.log('Verificando tablas existentes...');
    
    const tablesQuery = `
      SELECT t.name as TableName
      FROM sys.tables t
      ORDER BY t.name
    `;
    
    const tablesResult = await db.executeQuery<{ TableName: string }>(tablesQuery);
    const existingTables = tablesResult.recordset.map(r => r.TableName);
    
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
          t.name as TableName, 
          i.name as IndexName,
          i.type_desc as IndexType,
          STRING_AGG(c.name, ', ') WITHIN GROUP (ORDER BY ic.key_ordinal) as Columns
      FROM sys.indexes i
      INNER JOIN sys.tables t ON i.object_id = t.object_id
      INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
      INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
      WHERE i.name IS NOT NULL AND t.name IN (${requiredTables.map(t => `'${t}'`).join(',')})
      GROUP BY t.name, i.name, i.type_desc
      ORDER BY t.name, i.name
    `;
    
    const indexesResult = await db.executeQuery<{ 
      TableName: string; 
      IndexName: string;
      IndexType: string;
      Columns: string;
    }>(indexesQuery);
    
    console.log('\nÍndices encontrados:');
    
    let currentTable = '';
    let indexCount = 0;
    
    indexesResult.recordset.forEach(idx => {
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
    
    console.log(`\n✅ Total de índices encontrados: ${indexesResult.recordset.length}`);
    
    // Verificar foreign keys
    console.log('\nVerificando foreign keys...');
    
    const foreignKeysQuery = `
      SELECT 
          fk.name as FKName,
          OBJECT_NAME(fk.parent_object_id) as TableName,
          COL_NAME(fkc.parent_object_id, fkc.parent_column_id) as ColumnName,
          OBJECT_NAME(fk.referenced_object_id) as ReferencedTable,
          COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) as ReferencedColumn
      FROM sys.foreign_keys fk
      INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
      WHERE OBJECT_NAME(fk.parent_object_id) IN (${requiredTables.map(t => `'${t}'`).join(',')})
      ORDER BY TableName, FKName
    `;
    
    const foreignKeysResult = await db.executeQuery<{ 
      FKName: string; 
      TableName: string;
      ColumnName: string;
      ReferencedTable: string;
      ReferencedColumn: string;
    }>(foreignKeysQuery);
    
    console.log('\nForeign Keys encontradas:');
    
    currentTable = '';
    let fkCount = 0;
    
    foreignKeysResult.recordset.forEach(fk => {
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
    
    console.log(`\n✅ Total de foreign keys encontradas: ${foreignKeysResult.recordset.length}`);
    
    // Resumen final
    console.log('\n=== Resumen de Verificación ===');
    console.log(`Tablas: ${existingTables.length}/${requiredTables.length}`);
    console.log(`Índices: ${indexesResult.recordset.length}`);
    console.log(`Foreign Keys: ${foreignKeysResult.recordset.length}`);
    
    if (missingTables.length === 0) {
      console.log('\n✅ El esquema de base de datos está correctamente configurado');
    } else {
      console.log('\n⚠️ El esquema de base de datos está incompleto');
    }
    
  } catch (error) {
    console.error('\n❌ Error durante la verificación:', (error as Error).message);
    logger.error(`Error en verificación de esquema: ${(error as Error).message}`);
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
