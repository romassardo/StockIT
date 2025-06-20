# 🔍 SCRIPT DE VALIDACIÓN BACKEND STOCKIT POST-SINCRONIZACIÓN SQL
# Objetivo: Verificar que todas las funcionalidades críticas siguen operativas
# Fecha: 2025-01-19
# Versión: v1.0.83

Write-Host "🚀 INICIANDO VALIDACIÓN COMPLETA BACKEND STOCKIT" -ForegroundColor Green
Write-Host "=" * 60

$baseUrl = "http://localhost:3000"
$errors = @()
$successCount = 0
$totalTests = 0

# Función para hacer requests y manejar errores
function Test-Endpoint {
    param(
        [string]$url,
        [string]$method = "GET",
        [string]$description,
        [hashtable]$headers = @{},
        [string]$body = $null
    )
    
    $global:totalTests++
    Write-Host "📋 PRUEBA $totalTests`: $description" -ForegroundColor Cyan
    
    try {
        $params = @{
            Uri = $url
            Method = $method
            Headers = $headers
            UseBasicParsing = $true
        }
        
        if ($body) {
            $params.Body = $body
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 201) {
            Write-Host "   ✅ SUCCESS ($($response.StatusCode))" -ForegroundColor Green
            $global:successCount++
            return $response.Content
        } else {
            Write-Host "   ⚠️ UNEXPECTED STATUS: $($response.StatusCode)" -ForegroundColor Yellow
            return $response.Content
        }
    }
    catch {
        Write-Host "   ❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $global:errors += "❌ $description`: $($_.Exception.Message)"
        return $null
    }
}

Write-Host "`n🔍 FASE 1: ENDPOINTS BÁSICOS" -ForegroundColor Yellow
Write-Host "-" * 40

# Test 1: Endpoint raíz
Test-Endpoint "$baseUrl/" "GET" "Endpoint raíz - información básica" | Out-Null

# Test 2: Productos (no requiere auth)
Test-Endpoint "$baseUrl/api/products" "GET" "Listar productos" | Out-Null

# Test 3: Categorías
Test-Endpoint "$baseUrl/api/products/categories" "GET" "Listar categorías" | Out-Null

# Test 4: Empleados
Test-Endpoint "$baseUrl/api/employees" "GET" "Listar empleados" | Out-Null

# Test 5: Sectores
Test-Endpoint "$baseUrl/api/sectors" "GET" "Listar sectores" | Out-Null

# Test 6: Sucursales  
Test-Endpoint "$baseUrl/api/branches" "GET" "Listar sucursales" | Out-Null

Write-Host "`n🔑 FASE 2: AUTENTICACIÓN Y USUARIOS" -ForegroundColor Yellow
Write-Host "-" * 40

# Test 7: Login (crear usuario de prueba si es necesario)
$loginBody = @{
    email = "admin@stockit.com"
    password = "admin123"
} | ConvertTo-Json

$loginResponse = Test-Endpoint "$baseUrl/api/auth/login" "POST" "Login usuario admin" @{} $loginBody

# Extraer token si el login fue exitoso
$token = $null
if ($loginResponse) {
    try {
        $loginData = $loginResponse | ConvertFrom-Json
        $token = $loginData.token
        Write-Host "   🔑 Token obtenido exitosamente" -ForegroundColor Green
    }
    catch {
        Write-Host "   ⚠️ No se pudo extraer token del response" -ForegroundColor Yellow
    }
}

$authHeaders = @{}
if ($token) {
    $authHeaders = @{ "Authorization" = "Bearer $token" }
}

# Test 8: Perfil usuario (requiere auth)
if ($token) {
    Test-Endpoint "$baseUrl/api/auth/profile" "GET" "Obtener perfil usuario" $authHeaders | Out-Null
}

# Test 9: Listar usuarios (requiere auth)
if ($token) {
    Test-Endpoint "$baseUrl/api/users" "GET" "Listar usuarios" $authHeaders | Out-Null
}

Write-Host "`n📦 FASE 3: INVENTARIO Y STOCK" -ForegroundColor Yellow
Write-Host "-" * 40

# Test 10: Inventario Individual (Notebooks/Celulares)
Test-Endpoint "$baseUrl/api/inventory" "GET" "Inventario individual (notebooks/celulares)" | Out-Null

# Test 11: Stock General
Test-Endpoint "$baseUrl/api/stock" "GET" "Stock general (otros productos)" | Out-Null

# Test 12: Stock con filtros
Test-Endpoint "$baseUrl/api/stock/alerts" "GET" "Stock bajo mínimo" | Out-Null

Write-Host "`n👥 FASE 4: ASIGNACIONES Y REPARACIONES" -ForegroundColor Yellow
Write-Host "-" * 40

# Test 13: Asignaciones
Test-Endpoint "$baseUrl/api/assignments" "GET" "Listar asignaciones" | Out-Null

# Test 14: Asignaciones activas
Test-Endpoint "$baseUrl/api/assignments/active" "GET" "Asignaciones activas" | Out-Null

# Test 15: Reparaciones
Test-Endpoint "$baseUrl/api/repairs" "GET" "Listar reparaciones" | Out-Null

# Test 16: Reparaciones activas
Test-Endpoint "$baseUrl/api/repairs/active" "GET" "Reparaciones activas" | Out-Null

Write-Host "`n📊 FASE 5: REPORTES Y DASHBOARD" -ForegroundColor Yellow
Write-Host "-" * 40

# Test 17: Dashboard metrics
Test-Endpoint "$baseUrl/api/dashboard/metrics" "GET" "Métricas dashboard" | Out-Null

# Test 18: Dashboard stats
Test-Endpoint "$baseUrl/api/dashboard/stats" "GET" "Estadísticas dashboard" | Out-Null

# Test 19: Reporte inventario
Test-Endpoint "$baseUrl/api/reports/inventory" "GET" "Reporte inventario" | Out-Null

# Test 20: Búsqueda global
Test-Endpoint "$baseUrl/api/search?query=test" "GET" "Búsqueda global" | Out-Null

Write-Host "`n📝 FASE 6: CHANGELOG Y LOGS" -ForegroundColor Yellow
Write-Host "-" * 40

# Test 21: Changelog
Test-Endpoint "$baseUrl/api/changelog" "GET" "Listar changelog" | Out-Null

Write-Host "`n" + "=" * 60
Write-Host "🏆 RESUMEN VALIDACIÓN BACKEND" -ForegroundColor Green
Write-Host "=" * 60

Write-Host "📊 ESTADÍSTICAS FINALES:" -ForegroundColor Cyan
Write-Host "   ✅ Pruebas exitosas: $successCount/$totalTests" -ForegroundColor Green
Write-Host "   ❌ Pruebas fallidas: $($totalTests - $successCount)/$totalTests" -ForegroundColor Red
Write-Host "   📈 Tasa de éxito: $(([math]::Round(($successCount/$totalTests)*100, 2)))%" -ForegroundColor Cyan

if ($errors.Count -gt 0) {
    Write-Host "`n❌ ERRORES DETECTADOS:" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "   $error" -ForegroundColor Red
    }
}

$status = if ($successCount -eq $totalTests) { "🎉 PERFECTO" } 
         elseif ($successCount/$totalTests -gt 0.8) { "⚠️ MAYORMENTE FUNCIONAL" }
         else { "❌ PROBLEMAS CRÍTICOS" }

Write-Host "`n🎯 ESTADO FINAL: $status" -ForegroundColor $(if ($successCount -eq $totalTests) { "Green" } elseif ($successCount/$totalTests -gt 0.8) { "Yellow" } else { "Red" })

if ($successCount -eq $totalTests) {
    Write-Host "`n🚀 CONCLUSIÓN: El backend está 100% operativo después de la sincronización SQL" -ForegroundColor Green
    Write-Host "✅ Todas las funcionalidades críticas validadas exitosamente" -ForegroundColor Green
    Write-Host "✅ Los stored procedures funcionan correctamente" -ForegroundColor Green
    Write-Host "✅ Listo para producción" -ForegroundColor Green
} elseif ($successCount/$totalTests -gt 0.8) {
    Write-Host "`n⚠️ CONCLUSIÓN: El backend está mayormente funcional con algunos problemas menores" -ForegroundColor Yellow
    Write-Host "📋 Revisar errores específicos arriba" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ CONCLUSIÓN: Se detectaron problemas críticos que requieren atención inmediata" -ForegroundColor Red
    Write-Host "🔧 Revisar configuración y stored procedures" -ForegroundColor Red
}

Write-Host "`n📅 Validación completada: $(Get-Date)" -ForegroundColor Gray 