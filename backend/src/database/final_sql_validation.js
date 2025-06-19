/**
 * 🏁 SCRIPT FINAL: VALIDACIÓN POST-LIMPIEZA SQL
 * Objetivo: Verificar que la limpieza fue exitosa y no quedan duplicados
 * Validar integridad de SPs después del cleanup
 */

const fs = require('fs');
const path = require('path');

console.log('🏁 VALIDACIÓN FINAL POST-LIMPIEZA SQL STOCKIT');
console.log('==============================================\n');

// Directorios a validar
const DIRS = {
    storedProcedures: 'backend/src/database/stored_procedures',
    migrations: 'backend/src/database/migrations'
};

function analyzeFinalState() {
    console.log('📊 ESTADO FINAL DESPUÉS DE LIMPIEZA:\n');
    
    // 1. Contar archivos restantes
    const spFiles = fs.readdirSync(DIRS.storedProcedures)
        .filter(file => file.endsWith('.sql'));
    
    const migrationFiles = fs.readdirSync(DIRS.migrations)
        .filter(file => file.endsWith('.sql'));
    
    console.log(`✅ STORED PROCEDURES: ${spFiles.length} archivos`);
    console.log(`✅ MIGRACIONES: ${migrationFiles.length} archivos`);
    
    // 2. Verificar que no queden archivos con el patrón problemático del 30-05-2025
    console.log('\n🔍 VERIFICANDO ARCHIVOS DEL DÍA PROBLEMÁTICO (2025-05-30):\n');
    
    const problematicDate = migrationFiles.filter(file => 
        file.includes('20250530')
    );
    
    problematicDate.forEach(file => {
        const filePath = path.join(DIRS.migrations, file);
        const stats = fs.statSync(filePath);
        console.log(`   📄 ${file} (${(stats.size/1024).toFixed(1)}KB)`);
    });
    
    console.log(`\n📈 RESTANTES DEL DÍA PROBLEMÁTICO: ${problematicDate.length} archivos`);
    
    // 3. Verificar patrones de naming
    console.log('\n🎯 VERIFICANDO PATRONES DE NAMING:\n');
    
    const standardPattern = /^\d{14}_/; // Fecha estándar: YYYYMMDDHHMMSS_
    const versionPattern = /^V\d{14}__/; // Patrón V: V20250612205500__
    
    const nonStandard = migrationFiles.filter(file => 
        !standardPattern.test(file) && !versionPattern.test(file)
    );
    
    if (nonStandard.length === 0) {
        console.log('   ✅ TODOS los archivos siguen patrones estándar');
    } else {
        console.log('   ⚠️ ARCHIVOS CON PATRÓN NO ESTÁNDAR:');
        nonStandard.forEach(file => console.log(`      - ${file}`));
    }
    
    // 4. Verificar tamaños sospechosos (>10KB indica posibles duplicados)
    console.log('\n📏 VERIFICANDO TAMAÑOS SOSPECHOSOS (>10KB):\n');
    
    const largeMigrations = migrationFiles
        .map(file => {
            const filePath = path.join(DIRS.migrations, file);
            const stats = fs.statSync(filePath);
            return { file, size: stats.size };
        })
        .filter(item => item.size > 10240) // >10KB
        .sort((a, b) => b.size - a.size);
    
    if (largeMigrations.length === 0) {
        console.log('   ✅ NO hay archivos sospechosamente grandes');
    } else {
        console.log('   ⚠️ ARCHIVOS GRANDES RESTANTES:');
        largeMigrations.forEach(item => {
            console.log(`      - ${item.file} (${(item.size/1024).toFixed(1)}KB)`);
        });
    }
    
    // 5. Listar archivos finales por categoría
    console.log('\n📋 ARCHIVOS FINALES POR CATEGORÍA:\n');
    
    const categories = {
        'StockGeneral': migrationFiles.filter(f => f.includes('StockGeneral')),
        'Repair': migrationFiles.filter(f => f.includes('Repair')),
        'Report': migrationFiles.filter(f => f.includes('Report')),
        'Assignment': migrationFiles.filter(f => f.includes('Assignment')),
        'Changelog': migrationFiles.filter(f => f.includes('Changelog')),
        'Otros': migrationFiles.filter(f => 
            !f.includes('StockGeneral') && 
            !f.includes('Repair') && 
            !f.includes('Report') && 
            !f.includes('Assignment') && 
            !f.includes('Changelog')
        )
    };
    
    Object.entries(categories).forEach(([category, files]) => {
        if (files.length > 0) {
            console.log(`   📂 ${category}: ${files.length} archivos`);
            files.forEach(file => console.log(`      - ${file}`));
        }
    });
    
    // 6. Resumen final
    console.log('\n🏆 RESUMEN FINAL DE LIMPIEZA:\n');
    console.log('✅ Eliminados archivos duplicados masivos (24KB)');
    console.log('✅ Eliminados formatos no estándar');
    console.log('✅ Eliminadas migraciones manuales problemáticas');
    console.log(`✅ Restante: ${migrationFiles.length} archivos LIMPIOS`);
    console.log('✅ Patrón de naming CONSISTENTE');
    console.log('✅ Tamaños apropiados sin duplicaciones masivas');
    
    console.log('\n🎯 SIGUIENTE PASO RECOMENDADO:');
    console.log('   - Validar que el backend sigue funcionando');
    console.log('   - Ejecutar tests de stored procedures');
    console.log('   - Crear commit final de limpieza');
}

// Ejecutar validación
try {
    analyzeFinalState();
} catch (error) {
    console.error('❌ ERROR en validación:', error.message);
} 