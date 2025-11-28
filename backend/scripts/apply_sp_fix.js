const mysql = require('mysql2/promise');

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

    console.log('Ejecutando DROP PROCEDURE...');
    await connection.query('DROP PROCEDURE IF EXISTS sp_StockGeneral_GetLowStock');

    console.log('Ejecutando CREATE PROCEDURE...');
    const createSpSql = `
    CREATE PROCEDURE sp_StockGeneral_GetLowStock(
        IN p_categoria_id INT
    )
    BEGIN
        SELECT 
            p.id AS producto_id,
            p.modelo AS nombre_producto,
            p.marca AS nombre_marca,
            c.nombre AS nombre_categoria,
            sg.id AS stock_id,
            sg.cantidad_actual,
            p.stock_minimo AS min_stock,
            (p.stock_minimo - sg.cantidad_actual) AS diferencia,
            IF(p.stock_minimo > 0, (sg.cantidad_actual / p.stock_minimo) * 100, 0) AS porcentaje_disponible,
            sg.ubicacion,
            sg.ultima_actualizacion
        FROM 
            StockGeneral sg
        INNER JOIN Productos p ON sg.producto_id = p.id
        INNER JOIN Categorias c ON p.categoria_id = c.id
        WHERE 
            sg.cantidad_actual < p.stock_minimo
            AND p.activo = 1
            AND (p_categoria_id IS NULL OR p.categoria_id = p_categoria_id)
        ORDER BY 
            diferencia DESC,
            c.nombre,
            p.marca,
            p.modelo;
    END
    `;
    
    await connection.query(createSpSql);
    
    console.log('✅ Procedimiento almacenado actualizado correctamente.');
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

run();
