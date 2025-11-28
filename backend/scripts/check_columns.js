/**
 * Script para verificar columnas de la tabla Empleados
 * Ejecutar con: node backend/scripts/check_columns.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');

async function checkColumns() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    const [rows] = await connection.query(`SHOW COLUMNS FROM Empleados`);
    console.log('Columnas en tabla Empleados:', rows.map(r => r.Field).join(', '));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkColumns();
