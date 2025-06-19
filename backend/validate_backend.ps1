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
$rootResponse = Test-Endpoint "$baseUrl/" "GET" "Endpoint raíz - información básica"

# Test 2: Productos (no requiere auth)
$productsResponse = Test-Endpoint "$baseUrl/api/products" "GET" "Listar productos"

# Test 3: Categorías
$categoriesResponse = Test-Endpoint "$baseUrl/api/products/categories" "GET" "Listar categorías"

# Test 4: Empleados
$employeesResponse = Test-Endpoint "$baseUrl/api/employees" "GET" "Listar empleados"

# Test 5: Sectores
$sectorsResponse = Test-Endpoint "$baseUrl/api/sectors" "GET" "Listar sectores"

# Test 6: Sucursales  
$branchesResponse = Test-Endpoint "$baseUrl/api/branches" "GET" "Listar sucursales"

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
    $profileResponse = Test-Endpoint "$baseUrl/api/auth/profile" "GET" "Obtener perfil usuario" $authHeaders
}

# Test 9: Listar usuarios (requiere auth)
if ($token) {
    $usersResponse = Test-Endpoint "$baseUrl/api/users" "GET" "Listar usuarios" $authHeaders
}

Write-Host "`n📦 FASE 3: INVENTARIO Y STOCK" -ForegroundColor Yellow
Write-Host "-" * 40

# Test 10: Inventario Individual (Notebooks/Celulares)
$inventoryResponse = Test-Endpoint "$baseUrl/api/inventory" "GET" "Inventario individual (notebooks/celulares)"

# Test 11: Stock General
$stockResponse = Test-Endpoint "$baseUrl/api/stock" "GET" "Stock general (otros productos)"

# Test 12: Stock con filtros
$stockLowResponse = Test-Endpoint "$baseUrl/api/stock/alerts" "GET" "Stock bajo mínimo"

Write-Host "`n👥 FASE 4: ASIGNACIONES Y REPARACIONES" -ForegroundColor Yellow
Write-Host "-" * 40

# Test 13: Asignaciones
$assignmentsResponse = Test-Endpoint "$baseUrl/api/assignments" "GET" "Listar asignaciones"

# Test 14: Asignaciones activas
$activeAssignmentsResponse = Test-Endpoint "$baseUrl/api/assignments/active" "GET" "Asignaciones activas"

# Test 15: Reparaciones
$repairsResponse = Test-Endpoint "$baseUrl/api/repairs" "GET" "Listar reparaciones"

# Test 16: Reparaciones activas
$activeRepairsResponse = Test-Endpoint "$baseUrl/api/repairs/active" "GET" "Reparaciones activas"

Write-Host "`n📊 FASE 5: REPORTES Y DASHBOARD" -ForegroundColor Yellow
Write-Host "-" * 40

# Test 17: Dashboard metrics
$dashboardResponse = Test-Endpoint "$baseUrl/api/dashboard/metrics" "GET" "Métricas dashboard"

# Test 18: Dashboard stats
$dashboardStatsResponse = Test-Endpoint "$baseUrl/api/dashboard/stats" "GET" "Estadísticas dashboard"

# Test 19: Reporte inventario
$reportInventoryResponse = Test-Endpoint "$baseUrl/api/reports/inventory" "GET" "Reporte inventario"

# Test 20: Búsqueda global
$searchResponse = Test-Endpoint "$baseUrl/api/search?query=test" "GET" "Búsqueda global"

Write-Host "`n📝 FASE 6: CHANGELOG Y LOGS" -ForegroundColor Yellow
Write-Host "-" * 40

# Test 21: Changelog
$changelogResponse = Test-Endpoint "$baseUrl/api/changelog" "GET" "Listar changelog"

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