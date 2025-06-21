# =============================================
# Script para ejecutar verificación y creación de categorías
# Ejecutar desde: PowerShell como Administrador
# =============================================

Write-Host "🔍 DIAGNÓSTICO Y SOLUCIÓN: Categorías no visibles en modal Nuevo Producto" -ForegroundColor Yellow
Write-Host "========================================================================" -ForegroundColor Yellow

# Verificar conexión a SQL Server
Write-Host "`n1️⃣ Verificando conexión a SQL Server..." -ForegroundColor Cyan

try {
    $testConnection = sqlcmd -S "." -d "StockIT" -E -Q "SELECT 1 as Test" -h -1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Conexión a SQL Server exitosa" -ForegroundColor Green
    } else {
        Write-Host "❌ Error conectando a SQL Server" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}

# Ejecutar script de verificación y creación
Write-Host "`n2️⃣ Ejecutando verificación y creación de categorías..." -ForegroundColor Cyan

try {
    sqlcmd -S "." -d "StockIT" -E -i "verificar_y_crear_categorias.sql"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Script ejecutado exitosamente" -ForegroundColor Green
        Write-Host "`n📋 PRÓXIMOS PASOS:" -ForegroundColor Yellow
        Write-Host "   1. Actualiza la página web (F5)" -ForegroundColor White
        Write-Host "   2. Abre el modal 'Nuevo Producto' en Administración" -ForegroundColor White
        Write-Host "   3. Verifica que ahora aparezcan las categorías" -ForegroundColor White
        Write-Host "   4. Revisa la consola del navegador (F12) para logs detallados" -ForegroundColor White
    } else {
        Write-Host "❌ Error ejecutando el script SQL" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

Write-Host "`n🔚 Script completado. Presiona cualquier tecla para cerrar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 