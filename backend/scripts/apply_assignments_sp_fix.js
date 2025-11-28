const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '197575',
  database: 'stockit_mysql',
  multipleStatements: true
};

async function run() {
  try {
    console.log('Conectando a la base de datos...');
    const connection = await mysql.createConnection(dbConfig);

    console.log('Leyendo archivo SQL...');
    const sqlPath = path.join(__dirname, '../src/database/mysql_procedures/reports/sp_Report_AssignmentsByDestination.sql');
    let sql = fs.readFileSync(sqlPath, 'utf8');

    // Eliminar DELIMITER $$ y DELIMITER ; del archivo para ejecutarlo directamente
    // Las librerías de MySQL para Node no soportan el comando DELIMITER porque es del cliente CLI
    // En su lugar, ejecutamos el CREATE PROCEDURE como un solo statement
    
    // Limpiar el SQL
    sql = sql.replace(/DELIMITER \$\$/g, '')
             .replace(/DELIMITER ;/g, '')
             .replace(/\$\$/g, ';')
             .trim();

    console.log('Ejecutando DROP PROCEDURE...');
    await connection.query('DROP PROCEDURE IF EXISTS sp_Report_AssignmentsByDestination');

    console.log('Ejecutando CREATE PROCEDURE...');
    await connection.query(sql);
    
    console.log('✅ Procedimiento almacenado sp_Report_AssignmentsByDestination actualizado correctamente.');
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error);
    if (error.sql) {
      console.error('SQL Error:', error.sql);
    }
  }
}

run();
