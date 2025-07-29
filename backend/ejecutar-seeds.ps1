# Script PowerShell para ejecutar todos los archivos de seeds en MySQL
# Configuración de la base de datos
$usuario = "root"
$password = "197575"
$baseDatos = "stockit_mysql"
$rutaSeeds = "e:\Proyectos\StockIT\backend\dist\database\seeds"

Write-Host "🚀 Iniciando carga de datos de prueba en MySQL..." -ForegroundColor Green

# Lista de archivos SQL en orden
$archivosSQL = @(
    "001_categorias_basicas.sql",
    "002_productos_basicos.sql", 
    "003_empleados_basicos.sql",
    "004_sectores_basicos.sql",
    "005_sucursales_basicas.sql",
    "006_stock_basico.sql",
    "007_inventario_individual.sql",
    "008_asignaciones_basicas.sql"
)

# Ejecutar cada archivo SQL
foreach ($archivo in $archivosSQL) {
    $rutaCompleta = Join-Path $rutaSeeds $archivo
    Write-Host "📄 Ejecutando: $archivo" -ForegroundColor Yellow
    
    Write-Host "Intentando ejecutar con método alternativo..." -ForegroundColor Cyan
    
    # Método alternativo: usar mysql con archivo de entrada
    $tempFile = [System.IO.Path]::GetTempFileName() + ".sql"
    try {
        # Copiar contenido a archivo temporal
        Copy-Item $rutaCompleta $tempFile
        
        # Ejecutar MySQL con archivo de entrada
        $mysqlCmd = "mysql -u $usuario -p$password $baseDatos -e `"source $tempFile`""
        $resultado = Invoke-Expression $mysqlCmd 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $archivo ejecutado correctamente" -ForegroundColor Green
        } else {
            Write-Host "❌ Error ejecutando $archivo - Exit Code: $LASTEXITCODE" -ForegroundColor Red
            Write-Host "Resultado: $resultado" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ Error ejecutando $archivo : $($_.Exception.Message)" -ForegroundColor Red
    }
    finally {
        # Limpiar archivo temporal
        if (Test-Path $tempFile) {
            Remove-Item $tempFile -Force
        }
    }
}

Write-Host "🎉 Proceso completado. Verifica los datos en tu base de datos MySQL." -ForegroundColor Green
Write-Host "💡 Ahora puedes revisar si los errores 500 en el frontend se resolvieron." -ForegroundColor Cyan
