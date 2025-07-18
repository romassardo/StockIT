import sql from 'mssql';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Cargar variables de entorno desde el archivo .env en la raíz del backend
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config: sql.config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME,
    options: {
        encrypt: true, // Requerido para conexiones a Azure, buena práctica para otros
        trustServerCertificate: true // Cambiar a false en producción con un certificado válido
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

const outputDir = path.resolve(__dirname, '../src/database/extracted_sps');

async function extractStoredProcedures() {
    console.log('Iniciando la extracción de Stored Procedures...');
    
    if (!fs.existsSync(outputDir)) {
        console.log(`Creando directorio de salida: ${outputDir}`);
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const pool = new sql.ConnectionPool(config);
    const poolConnect = pool.connect();

    try {
        await poolConnect; // Asegurarse de que la conexión esté establecida
        console.log('Conexión a la base de datos establecida.');

        const result = await pool.request().query(`
            SELECT o.name AS procedure_name, m.definition AS procedure_definition
            FROM sys.sql_modules m
            INNER JOIN sys.objects o ON m.object_id = o.object_id
            WHERE o.type = 'P' AND o.is_ms_shipped = 0
            ORDER BY o.name;
        `);

        console.log(`Se encontraron ${result.recordset.length} Stored Procedures.`);

        for (const sp of result.recordset) {
            const fileName = `${sp.procedure_name}.sql`;
            const filePath = path.join(outputDir, fileName);
            console.log(`Escribiendo SP: ${fileName}`);
            fs.writeFileSync(filePath, sp.procedure_definition);
        }

        console.log('¡Extracción completada exitosamente!');

    } catch (err) {
        console.error('Error durante la extracción:', err);
    } finally {
        await pool.close();
        console.log('Conexión a la base de datos cerrada.');
    }
}

extractStoredProcedures(); 