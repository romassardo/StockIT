const fs = require('fs');
const path = require('path');
const { DatabaseConnection } = require('../dist/utils/database');

async function updateStoredProcedure() {
  try {
    console.log('🔧 Actualizando Stored Procedure sp_StockGeneral_GetMovements...');
    
    const db = DatabaseConnection.getInstance();
    
    // Leer el archivo del SP
    const spPath = path.join(__dirname, '../src/database/stored_procedures/sp_StockGeneral_GetMovements.sql');
    const spContent = fs.readFileSync(spPath, 'utf8');
    
    // Ejecutar el SP (esto recreará el procedimiento)
    await db.executeQuery(spContent);
    
    console.log('✅ Stored Procedure actualizado exitosamente');
    
    // Probar el SP con algunos datos
    console.log('🧪 Probando el SP actualizado...');
    const testResult = await db.executeStoredProcedure('sp_StockGeneral_GetMovements', {
      PageNumber: 1,
      PageSize: 5
    });
    
    console.log('📊 Resultado de prueba:');
    console.log('Columnas:', testResult.columns);
    console.log('Filas:', testResult.recordset.length);
    
    if (testResult.recordset.length > 0) {
      console.log('Primera fila:', testResult.recordset[0]);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Cerrar conexión
    try {
      const db = DatabaseConnection.getInstance();
      await db.close();
    } catch (closeError) {
      console.error('Error al cerrar conexión:', closeError);
    }
  }
}

updateStoredProcedure(); 