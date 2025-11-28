import fs from 'fs';
import path from 'path';
import { DatabaseConnection } from '../src/utils/database';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../.env') });

async function updateSP() {
  console.log('🚀 Iniciando creación/actualización del Stored Procedure sp_Report_StockDisponible...');
  
  const db = DatabaseConnection.getInstance();
  
  try {
    // Leer el archivo SQL
    // Nota: está en carpeta 'reportes' no 'reports'
    const sqlPath = path.join(__dirname, '../src/database/mysql_procedures/reportes/sp_Report_StockDisponible.sql');
    
    if (!fs.existsSync(sqlPath)) {
        throw new Error(`El archivo SQL no existe en: ${sqlPath}`);
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Limpiar el SQL para ejecutarlo directamente
    let cleanSql = sqlContent
      .replace(/DELIMITER \/\//g, '')
      .replace(/DELIMITER ;/g, '')
      .replace(/\/\//g, '')
      .trim();

    const pool = db.getPool();

    // 1. Eliminar el SP existente
    console.log('🗑️  Eliminando versión anterior (si existe)...');
    await pool.query('DROP PROCEDURE IF EXISTS sp_Report_StockDisponible');
    
    // 2. Crear el nuevo SP
    console.log('✨ Creando nueva versión...');
    await pool.query(cleanSql);
    
    console.log('✅ Stored Procedure actualizado exitosamente!');
    
  } catch (error) {
    console.error('❌ Error actualizando el SP:', error);
  } finally {
    process.exit(0);
  }
}

updateSP();
