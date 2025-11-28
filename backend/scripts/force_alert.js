const mysql = require('mysql2/promise');
// Hardcode credentials to avoid dotenv issues in script execution context if .env is not found
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '197575',
  database: 'stockit_mysql'
};

async function run() {
  try {
    console.log('Conectando a la base de datos...');
    const connection = await mysql.createConnection(dbConfig);

    console.log('Forzando alerta de stock bajo en producto ID 10 (Cable HDMI)...');
    // Stock actual es 45. Ponemos mínimo en 100 para forzar alerta.
    await connection.execute('UPDATE Productos SET stock_minimo = 100 WHERE id = 10');
    
    // También forzamos una alerta CRÍTICA (stock 0) en otro producto para probar ambos casos
    // Asumimos que existe producto ID 7 (Mouse Genius) que vimos en los logs
    console.log('Forzando stock 0 en producto ID 7 (Mouse Genius) para alerta crítica...');
    await connection.execute('UPDATE StockGeneral SET cantidad_actual = 0 WHERE producto_id = 7');

    console.log('✅ Alertas generadas exitosamente:');
    console.log('   - Producto 10: Stock Bajo (Min 100, Actual 45)');
    console.log('   - Producto 7: Stock Crítico (Actual 0)');
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

run();
