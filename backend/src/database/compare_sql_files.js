/**
 * 🔍 SCRIPT COMPARADOR DE ARCHIVOS SQL
 * Objetivo: Analizar archivos SQL del repositorio vs expectativas del código
 * Identifica duplicados, obsoletos y faltantes
 */

const fs = require('fs');
const path = require('path');

// Directorios a analizar
const DIRS = {
    storedProcedures: 'backend/src/database/stored_procedures',
    migrations: 'backend/src/database/migrations'
};

// SPs que debería tener según el código backend
const EXPECTED_SPS = [
    'sp_User_GetByEmail',
    'sp_User_ChangePassword', 
    'sp_User_Create',
    'sp_User_GetAll',
    'sp_User_Update',
    'sp_User_ToggleActive',
    'sp_Log_Create',
    'sp_Assignment_Create',
    'sp_Assignment_Cancel',
    'sp_Assignment_Return',
    'sp_InventarioIndividual_Create',
    'sp_InventarioIndividual_GetAll',
    'sp_InventarioIndividual_Get',
    'sp_InventarioIndividual_Update',
    'sp_StockGeneral_GetAll',
    'sp_StockGeneral_Entry',
    'sp_StockGeneral_Exit',
    'sp_Report_Inventory',
    'sp_Report_AssignmentsByDestination',
    'sp_Report_StockAlerts',
    'sp_Repair_Create',
    'sp_Repair_Complete',
    'sp_Repair_Cancel',
    'sp_Branch_Create',
    'sp_Branch_GetAll',
    'sp_Sector_Create',
    'sp_Sector_GetAll',
    'sp_Employee_Create',
    'sp_Employee_GetAll'
];

/**
 * Leer archivos de un directorio
 */
function readDirectory(dirPath) {
    try {
        if (!fs.existsSync(dirPath)) {
            console.log(`❌ Directorio no existe: ${dirPath}`);
            return [];
        }
        
        const files = fs.readdirSync(dirPath)
            .filter(file => file.endsWith('.sql'))
            .map(file => {
                const fullPath = path.join(dirPath, file);
                const stats = fs.statSync(fullPath);
                return {
                    name: file,
                    path: fullPath,
                    size: stats.size,
                    modified: stats.mtime
                };
            });
            
        return files;
    } catch (error) {
        console.error(`❌ Error leyendo directorio ${dirPath}:`, error.message);
        return [];
    }
}

/**
 * Analizar stored procedures
 */
function analyzeStoredProcedures() {
    console.log('\n🔍 ANÁLISIS DE STORED PROCEDURES');
    console.log('==========================================');
    
    const spFiles = readDirectory(DIRS.storedProcedures);
    console.log(`📁 Archivos encontrados: ${spFiles.length}`);
    
    // Extraer nombres de SP de archivos
    const foundSPs = spFiles.map(file => {
        const spName = file.name.replace('.sql', '');
        return spName;
    });
    
    console.log('\n✅ SPs ENCONTRADOS EN ARCHIVOS:');
    foundSPs.forEach(sp => console.log(`   - ${sp}`));
    
    console.log('\n❌ SPs ESPERADOS PERO FALTANTES:');
    const missingSPs = EXPECTED_SPS.filter(expected => 
        !foundSPs.some(found => found.includes(expected))
    );
    missingSPs.forEach(sp => console.log(`   - ${sp}`));
    
    console.log('\n❓ SPs ENCONTRADOS PERO NO ESPERADOS:');
    const unexpectedSPs = foundSPs.filter(found => 
        !EXPECTED_SPS.some(expected => found.includes(expected))
    );
    unexpectedSPs.forEach(sp => console.log(`   - ${sp}`));
    
    return { foundSPs, missingSPs, unexpectedSPs };
}

/**
 * Analizar migraciones
 */
function analyzeMigrations() {
    console.log('\n🔍 ANÁLISIS DE MIGRACIONES');
    console.log('==========================================');
    
    const migrationFiles = readDirectory(DIRS.migrations);
    console.log(`📁 Archivos encontrados: ${migrationFiles.length}`);
    
    // Buscar duplicados por fecha/hora similar
    const duplicates = [];
    migrationFiles.forEach((file, index) => {
        const timestamp = file.name.match(/(\d{14})/);
        if (timestamp) {
            const similarFiles = migrationFiles.filter((other, otherIndex) => 
                otherIndex !== index && 
                other.name.includes(timestamp[1].substring(0, 10)) // Misma fecha
            );
            
            if (similarFiles.length > 0) {
                duplicates.push({
                    main: file.name,
                    similar: similarFiles.map(f => f.name)
                });
            }
        }
    });
    
    console.log('\n⚠️ POSIBLES DUPLICADOS POR FECHA:');
    duplicates.forEach(dup => {
        console.log(`   📄 ${dup.main}`);
        dup.similar.forEach(sim => console.log(`   📄 ${sim} (similar)`));
        console.log('');
    });
    
    // Listar por tamaño para detectar archivos muy grandes o muy pequeños
    console.log('\n📊 ARCHIVOS POR TAMAÑO:');
    migrationFiles
        .sort((a, b) => b.size - a.size)
        .forEach(file => {
            const sizeKB = (file.size / 1024).toFixed(1);
            console.log(`   ${sizeKB}KB - ${file.name}`);
        });
        
    return migrationFiles;
}

/**
 * Generar reporte de limpieza
 */
function generateCleanupReport() {
    console.log('\n🧹 REPORTE DE LIMPIEZA RECOMENDADA');
    console.log('==========================================');
    
    // Archivos obviamente duplicados que ya eliminamos
    console.log('\n✅ YA ELIMINADOS:');
    console.log('   - 20250530222600_Add_Report_SPs_New.sql');
    console.log('   - 20250530222500_Add_Repair_SPs_New.sql');
    console.log('   - 20250530223000_Add_Report_AssignmentsByDestination_SP_Simplified.sql');
    
    // Candidatos adicionales para eliminar
    console.log('\n🎯 CANDIDATOS PARA REVISAR:');
    const candidates = [
        'add_imei_fields_to_asignaciones.sql - Posible migración manual',
        'V2_13__update_sp_Sector_GetAll.sql - Formato diferente',
        '017_sps_dashboard_metrics_final_fix.sql - Nombre no estándar'
    ];
    candidates.forEach(candidate => console.log(`   - ${candidate}`));
    
    console.log('\n📋 SIGUIENTE PASO RECOMENDADO:');
    console.log('   1. Ejecutar extract_real_database.sql contra BD real');
    console.log('   2. Comparar resultados con archivos del repositorio');
    console.log('   3. Eliminar archivos que no coincidan con BD real');
    console.log('   4. Regenerar archivos faltantes desde BD real');
}

/**
 * Función principal
 */
function main() {
    console.log('🚀 ANÁLISIS COMPLETO DE ARCHIVOS SQL STOCKIT');
    console.log('==============================================');
    
    try {
        const spAnalysis = analyzeStoredProcedures();
        const migrationAnalysis = analyzeMigrations();
        generateCleanupReport();
        
        console.log('\n📊 RESUMEN FINAL:');
        console.log(`   📁 SPs encontrados: ${spAnalysis.foundSPs.length}`);
        console.log(`   ❌ SPs faltantes: ${spAnalysis.missingSPs.length}`);
        console.log(`   ❓ SPs inesperados: ${spAnalysis.unexpectedSPs.length}`);
        console.log(`   📄 Migraciones: ${migrationAnalysis.length}`);
        
    } catch (error) {
        console.error('❌ Error durante el análisis:', error);
    }
}

// Ejecutar análisis
main();
