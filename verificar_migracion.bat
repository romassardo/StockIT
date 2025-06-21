@echo off
setlocal enabledelayedexpansion
color 0E

REM Script para verificar que StockIT se migró correctamente
echo ================================================
echo    🔍 STOCKIT - VERIFICACIÓN DE MIGRACIÓN
echo ================================================
echo.

REM Verificar estructura de directorios
echo 📁 Verificando estructura de directorios...
if not exist "C:\Proyectos\StockIT" (
    echo ❌ ERROR: No se encuentra C:\Proyectos\StockIT
    goto :error
)

if not exist "C:\Proyectos\StockIT\frontend" (
    echo ❌ ERROR: No se encuentra carpeta frontend
    goto :error
)

if not exist "C:\Proyectos\StockIT\backend" (
    echo ❌ ERROR: No se encuentra carpeta backend
    goto :error
)

echo ✅ Estructura de directorios correcta
echo.

REM Verificar Node.js
echo 🔧 Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Node.js no está instalado
    echo    Instala Node.js desde https://nodejs.org
    goto :error
) else (
    echo ✅ Node.js instalado:
    node --version
)
echo.

REM Verificar dependencias backend
echo 📦 Verificando dependencias del backend...
if not exist "C:\Proyectos\StockIT\backend\node_modules" (
    echo ⚠️  Las dependencias del backend no están instaladas
    echo    Ejecuta: cd C:\Proyectos\StockIT\backend && npm install
    goto :warning
)
echo ✅ Dependencias del backend instaladas
echo.

REM Verificar dependencias frontend  
echo 📦 Verificando dependencias del frontend...
if not exist "C:\Proyectos\StockIT\frontend\node_modules" (
    echo ⚠️  Las dependencias del frontend no están instaladas
    echo    Ejecuta: cd C:\Proyectos\StockIT\frontend && npm install
    goto :warning
)
echo ✅ Dependencias del frontend instaladas
echo.

REM Verificar archivos .env
echo ⚙️  Verificando configuración...
if not exist "C:\Proyectos\StockIT\backend\.env" (
    echo ⚠️  Archivo backend\.env no existe
    echo    Crea el archivo según configuracion_trabajo.md
    goto :warning
)

if not exist "C:\Proyectos\StockIT\frontend\.env" (
    echo ⚠️  Archivo frontend\.env no existe  
    echo    Crea el archivo según configuracion_trabajo.md
    goto :warning
)
echo ✅ Archivos .env encontrados
echo.

REM Verificar SQL Server
echo 🗄️  Verificando SQL Server...
sqlcmd -S .\SQLEXPRESS -E -Q "SELECT @@VERSION" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  No se puede conectar a SQL Server Express
    echo    Verifica que SQL Server Express esté instalado y ejecutándose
    goto :warning
)
echo ✅ SQL Server Express conectado
echo.

REM Verificar base de datos StockIT
echo 🗄️  Verificando base de datos StockIT...
sqlcmd -S .\SQLEXPRESS -E -Q "USE StockIT; SELECT COUNT(*) FROM Usuarios" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Base de datos StockIT no encontrada o sin datos
    echo    Restaura el backup de la base de datos
    goto :warning
)
echo ✅ Base de datos StockIT disponible
echo.

REM Intentar verificar backend
echo 🌐 Verificando si el backend responde...
timeout /t 2 /nobreak >nul
curl -s "http://localhost:8000/api/dashboard/stats" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Backend no responde en http://localhost:8000
    echo    Ejecuta: cd C:\Proyectos\StockIT\backend && npm run dev
    goto :warning
)
echo ✅ Backend respondiendo en puerto 8000
echo.

REM Intentar verificar frontend
echo 🌐 Verificando si el frontend responde...
curl -s "http://localhost:3000" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Frontend no responde en http://localhost:3000
    echo    Ejecuta: cd C:\Proyectos\StockIT\frontend && npm run dev
    goto :warning
)
echo ✅ Frontend respondiendo en puerto 3000
echo.

goto :success

:warning
echo.
echo ⚠️ ================================================
echo    MIGRACIÓN PARCIAL - REQUIERE CONFIGURACIÓN
echo ================================================
echo.
echo 🔧 PASOS PENDIENTES:
echo 1. Instalar dependencias si no están instaladas
echo 2. Crear archivos .env según configuracion_trabajo.md
echo 3. Restaurar base de datos si es necesario
echo 4. Ejecutar backend y frontend
echo.
goto :end

:error
echo.
echo ❌ ================================================
echo    ERROR EN LA MIGRACIÓN
echo ================================================
echo.
echo 🆘 SOLUCIÓN:
echo 1. Verifica que hayas copiado todos los archivos
echo 2. Ejecuta el script instalar_en_oficina.bat
echo 3. Sigue las instrucciones paso a paso
echo.
goto :end

:success
echo ================================================
echo   🎉 MIGRACIÓN VERIFICADA EXITOSAMENTE
echo ================================================
echo.
echo ✅ TODO ESTÁ FUNCIONANDO CORRECTAMENTE
echo.
echo 🌐 URLs de acceso:
echo   - Frontend: http://localhost:3000
echo   - Backend:  http://localhost:8000/api
echo.
echo 🎯 StockIT está listo para usar en esta PC
echo.

:end
echo.
echo ¿Deseas abrir StockIT en el navegador? (S/N)
set /p ABRIR=
if /i "%ABRIR%"=="S" (
    start http://localhost:3000
)

pause 