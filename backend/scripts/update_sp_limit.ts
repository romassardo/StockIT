import { DatabaseConnection } from '../src/utils/database';
import fs from 'fs';
import path from 'path';

const updateSP = async () => {
  try {
    const db = DatabaseConnection.getInstance();
    const sqlPath = path.join(__dirname, '../src/database/mysql_procedures/stock_general/sp_StockGeneral_GetMovements.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Separar por DELIMITER si es necesario o ejecutar directamente
    // El archivo tiene DELIMITER // ... END // DELIMITER ;
    // MySQL driver no soporta DELIMITER, así que debemos limpiar el script
    
    // Extraer el cuerpo del CREATE PROCEDURE
    const createStatement = sql
      .replace(/DELIMITER \/\//g, '')
      .replace(/DELIMITER ;/g, '')
      .replace(/END \/\//g, 'END');

    // Ejecutar DROP y CREATE por separado
    const statements = createStatement.split('CREATE PROCEDURE');
    const dropStmt = statements[0].trim(); // Debería contener el DROP
    const createStmt = 'CREATE PROCEDURE ' + statements[1].trim();

    console.log('Ejecutando DROP...');
    await db.getPool().query(dropStmt);
    
    console.log('Ejecutando CREATE...');
    await db.getPool().query(createStmt);

    console.log('SP Actualizado correctamente');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

updateSP();
