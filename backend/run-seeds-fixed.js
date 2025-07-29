// Script temporal para ejecutar seeds con configuración correcta de .env
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Cargar variables de entorno desde .env
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('🔧 Configuración de variables de entorno:');
console.log(`DB_HOST: ${process.env.DB_HOST}`);
console.log(`DB_USER: ${process.env.DB_USER}`);
console.log(`DB_NAME: ${process.env.DB_NAME}`);
console.log(`DB_PORT: ${process.env.DB_PORT}`);

// Importar el script original después de cargar las variables
const runSeeds = require('./dist/database/run-seeds.js');

// Ejecutar los seeds
if (runSeeds.default) {
    runSeeds.default();
} else {
    console.error('❌ No se pudo encontrar la función de seeds');
}
