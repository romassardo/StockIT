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

    const sps = [
        { path: '../src/database/mysql_procedures/reports/sp_Report_StockAlerts.sql', name: 'sp_Report_StockAlerts' },
        { path: '../src/database/mysql_procedures/reportes/sp_Report_StockDisponible.sql', name: 'sp_Report_StockDisponible' }
    ];

    for (const sp of sps) {
        console.log(`Procesando ${sp.name}...`);
        const sqlPath = path.join(__dirname, sp.path);
        let sql = fs.readFileSync(sqlPath, 'utf8');

        // Limpiar el SQL
        sql = sql.replace(/DELIMITER \/\/|DELIMITER \$\$|DELIMITER ;/g, '')
                 .replace(/\/\//g, ';')
                 .replace(/\$\$/g, ';')
                 .trim();

        console.log(`Ejecutando DROP PROCEDURE ${sp.name}...`);
        await connection.query(`DROP PROCEDURE IF EXISTS ${sp.name}`);

        console.log(`Ejecutando CREATE PROCEDURE ${sp.name}...`);
        await connection.query(sql);
        console.log(`✅ ${sp.name} actualizado correctamente.\n`);
    }
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error);
    if (error.sql) {
        console.error('SQL Error:', error.sql);
    }
  }
}

run();
