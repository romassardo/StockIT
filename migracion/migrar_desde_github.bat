@echo off
setlocal enabledelayedexpansion
color 0C

REM Script para migrar StockIT descargando desde GitHub
echo ================================================
echo    🌐 STOCKIT - MIGRACIÓN DESDE GITHUB
echo ================================================
echo.

REM Verificar Git instalado
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Git no está instalado
    echo    Instala Git desde: https://git-scm.com/downloads
    echo    O descarga el ZIP manualmente desde GitHub
    pause
    exit /b 1
)
echo ✅ Git encontrado
echo.

REM Crear carpeta de migración con timestamp
set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%
set TIMESTAMP=%TIMESTAMP: =0%
set MIGRATION_DIR=C:\Temp\StockIT_GitHub_%TIMESTAMP%

echo 📁 Creando carpeta de migración: %MIGRATION_DIR%
mkdir "%MIGRATION_DIR%"
if errorlevel 1 (
    echo ❌ ERROR: No se pudo crear la carpeta de migración
    pause
    exit /b 1
)

REM Crear subcarpetas
mkdir "%MIGRATION_DIR%\Database"
mkdir "%MIGRATION_DIR%\Scripts"
mkdir "%MIGRATION_DIR%\Config"

echo ✅ Estructura de carpetas creada
echo.

REM Clonar repositorio desde GitHub
echo 🌐 Descargando proyecto desde GitHub...
echo    Repositorio: https://github.com/romassardo/StockIT.git
echo.

cd "%MIGRATION_DIR%"
git clone https://github.com/romassardo/StockIT.git

if errorlevel 1 (
    echo ❌ ERROR: No se pudo descargar desde GitHub
    echo    Verifica la conexión a internet
    echo    O descarga manualmente el ZIP desde GitHub
    pause
    exit /b 1
)

echo ✅ Proyecto descargado desde GitHub
echo.

REM Crear backup de BD local (si existe)
echo 🗄️  Intentando crear backup de BD local...
if exist "%~dp0" (
    echo    Detectando si hay BD local para respaldar...
    
    set DB_BACKUP_FILE=%MIGRATION_DIR%\Database\StockIT_Local_Backup_%TIMESTAMP%.bak
    set DB_BACKUP_SCRIPT=%MIGRATION_DIR%\Scripts\crear_backup_local.sql
    
    REM Crear script SQL para backup
    echo BACKUP DATABASE [StockIT] > "%DB_BACKUP_SCRIPT%"
    echo TO DISK = N'%DB_BACKUP_FILE%' >> "%DB_BACKUP_SCRIPT%"
    echo WITH FORMAT, INIT, >> "%DB_BACKUP_SCRIPT%"
    echo NAME = N'StockIT-Local Backup para GitHub Migration', >> "%DB_BACKUP_SCRIPT%"
    echo SKIP, NOREWIND, NOUNLOAD, STATS = 10 >> "%DB_BACKUP_SCRIPT%"
    
    echo ✅ Script de backup local creado
    echo.
    
    REM Intentar ejecutar el backup
    echo 🔄 Ejecutando backup de BD local...
    sqlcmd -S localhost\SQLEXPRESS -E -i "%DB_BACKUP_SCRIPT%"
    
    if errorlevel 1 (
        echo ⚠️  El backup automático falló o no hay BD local
        echo    Esto es normal si no tienes StockIT instalado localmente
    ) else (
        echo ✅ Backup de BD local creado: %DB_BACKUP_FILE%
    )
) else (
    echo ⚠️  No se detectó instalación local de StockIT
    echo    Solo se descargará el código desde GitHub
)
echo.

REM Crear base de datos inicial con estructura
echo 🗄️  Creando script de BD inicial...
set DB_INIT_SCRIPT=%MIGRATION_DIR%\Scripts\crear_bd_inicial.sql

echo -- Script para crear base de datos StockIT desde cero > "%DB_INIT_SCRIPT%"
echo -- Ejecutar en SQL Server Management Studio >> "%DB_INIT_SCRIPT%"
echo. >> "%DB_INIT_SCRIPT%"
echo -- 1. Crear base de datos >> "%DB_INIT_SCRIPT%"
echo CREATE DATABASE StockIT; >> "%DB_INIT_SCRIPT%"
echo GO >> "%DB_INIT_SCRIPT%"
echo. >> "%DB_INIT_SCRIPT%"
echo USE StockIT; >> "%DB_INIT_SCRIPT%"
echo GO >> "%DB_INIT_SCRIPT%"
echo. >> "%DB_INIT_SCRIPT%"
echo -- 2. Ejecutar migraciones desde: backend\src\database\migrations\ >> "%DB_INIT_SCRIPT%"
echo -- 3. Ejecutar stored procedures desde: backend\src\database\stored_procedures\ >> "%DB_INIT_SCRIPT%"
echo -- 4. Insertar datos de prueba (opcional) >> "%DB_INIT_SCRIPT%"
echo. >> "%DB_INIT_SCRIPT%"
echo -- NOTA: Este script debe ejecutarse manualmente >> "%DB_INIT_SCRIPT%"
echo -- Ver documentación en: docs\README.md >> "%DB_INIT_SCRIPT%"

echo ✅ Script de BD inicial creado
echo.

REM Copiar archivos de configuración existentes
echo 📝 Copiando archivos de configuración...

REM Si existe configuración local, copiarla
if exist "%~dp0configuracion_trabajo.md" (
    copy "%~dp0configuracion_trabajo.md" "%MIGRATION_DIR%\Config\"
    echo ✅ Configuración local copiada
) else (
    REM Crear configuración básica
    echo # CONFIGURACIÓN STOCKIT - MIGRACIÓN DESDE GITHUB > "%MIGRATION_DIR%\Config\configuracion_desde_github.md"
    echo. >> "%MIGRATION_DIR%\Config\configuracion_desde_github.md"
    echo ## 🌐 MIGRACIÓN DESDE GITHUB >> "%MIGRATION_DIR%\Config\configuracion_desde_github.md"
    echo. >> "%MIGRATION_DIR%\Config\configuracion_desde_github.md"
    echo Esta migración descargó el código desde GitHub. >> "%MIGRATION_DIR%\Config\configuracion_desde_github.md"
    echo Necesitarás configurar la base de datos manualmente. >> "%MIGRATION_DIR%\Config\configuracion_desde_github.md"
    echo. >> "%MIGRATION_DIR%\Config\configuracion_desde_github.md"
    echo Ver: StockIT\docs\README.md para instrucciones completas >> "%MIGRATION_DIR%\Config\configuracion_desde_github.md"
    echo ✅ Configuración básica creada
)

echo ✅ Archivos de configuración preparados
echo.

REM Crear script de instalación específico para GitHub
echo 🔧 Creando script de instalación desde GitHub...
set INSTALL_SCRIPT=%MIGRATION_DIR%\Scripts\instalar_desde_github.bat

echo @echo off > "%INSTALL_SCRIPT%"
echo setlocal enabledelayedexpansion >> "%INSTALL_SCRIPT%"
echo color 0C >> "%INSTALL_SCRIPT%"
echo. >> "%INSTALL_SCRIPT%"
echo echo ============================================ >> "%INSTALL_SCRIPT%"
echo echo    STOCKIT - INSTALACIÓN DESDE GITHUB >> "%INSTALL_SCRIPT%"
echo echo ============================================ >> "%INSTALL_SCRIPT%"
echo. >> "%INSTALL_SCRIPT%"
echo REM Verificar Node.js >> "%INSTALL_SCRIPT%"
echo node --version ^>nul 2^>^&1 >> "%INSTALL_SCRIPT%"
echo if errorlevel 1 ^( >> "%INSTALL_SCRIPT%"
echo     echo ❌ Node.js no está instalado >> "%INSTALL_SCRIPT%"
echo     echo    Instala Node.js desde https://nodejs.org >> "%INSTALL_SCRIPT%"
echo     pause >> "%INSTALL_SCRIPT%"
echo     exit /b 1 >> "%INSTALL_SCRIPT%"
echo ^) >> "%INSTALL_SCRIPT%"
echo echo ✅ Node.js encontrado >> "%INSTALL_SCRIPT%"
echo. >> "%INSTALL_SCRIPT%"
echo REM Crear directorio de proyecto >> "%INSTALL_SCRIPT%"
echo if not exist "C:\Proyectos" mkdir "C:\Proyectos" >> "%INSTALL_SCRIPT%"
echo echo ✅ Directorio de proyectos creado >> "%INSTALL_SCRIPT%"
echo. >> "%INSTALL_SCRIPT%"
echo REM Copiar proyecto >> "%INSTALL_SCRIPT%"
echo echo 📋 Copiando proyecto desde GitHub... >> "%INSTALL_SCRIPT%"
echo xcopy /E /I /Y "StockIT" "C:\Proyectos\StockIT" >> "%INSTALL_SCRIPT%"
echo echo ✅ Proyecto copiado >> "%INSTALL_SCRIPT%"
echo. >> "%INSTALL_SCRIPT%"
echo REM Limpiar archivos de git >> "%INSTALL_SCRIPT%"
echo if exist "C:\Proyectos\StockIT\.git" rmdir /s /q "C:\Proyectos\StockIT\.git" >> "%INSTALL_SCRIPT%"
echo echo ✅ Archivos de Git removidos >> "%INSTALL_SCRIPT%"
echo. >> "%INSTALL_SCRIPT%"
echo REM Instalar dependencias backend >> "%INSTALL_SCRIPT%"
echo echo 📦 Instalando dependencias del backend... >> "%INSTALL_SCRIPT%"
echo cd /d "C:\Proyectos\StockIT\backend" >> "%INSTALL_SCRIPT%"
echo npm install >> "%INSTALL_SCRIPT%"
echo echo ✅ Backend configurado >> "%INSTALL_SCRIPT%"
echo. >> "%INSTALL_SCRIPT%"
echo REM Instalar dependencias frontend >> "%INSTALL_SCRIPT%"
echo echo 📦 Instalando dependencias del frontend... >> "%INSTALL_SCRIPT%"
echo cd /d "C:\Proyectos\StockIT\frontend" >> "%INSTALL_SCRIPT%"
echo npm install >> "%INSTALL_SCRIPT%"
echo echo ✅ Frontend configurado >> "%INSTALL_SCRIPT%"
echo. >> "%INSTALL_SCRIPT%"
echo echo ============================================ >> "%INSTALL_SCRIPT%"
echo echo   🌐 INSTALACIÓN DESDE GITHUB COMPLETADA >> "%INSTALL_SCRIPT%"
echo echo ============================================ >> "%INSTALL_SCRIPT%"
echo echo. >> "%INSTALL_SCRIPT%"
echo echo ⚠️  IMPORTANTE - PRÓXIMOS PASOS: >> "%INSTALL_SCRIPT%"
echo echo 1. Instalar SQL Server Express >> "%INSTALL_SCRIPT%"
echo echo 2. Crear base de datos con Scripts\crear_bd_inicial.sql >> "%INSTALL_SCRIPT%"
echo echo 3. Crear archivos .env según documentación >> "%INSTALL_SCRIPT%"
echo echo 4. Ejecutar migraciones de BD >> "%INSTALL_SCRIPT%"
echo echo 5. Ejecutar: npm run dev en backend y frontend >> "%INSTALL_SCRIPT%"
echo echo. >> "%INSTALL_SCRIPT%"
echo echo 📚 Ver documentación en: C:\Proyectos\StockIT\docs\ >> "%INSTALL_SCRIPT%"
echo echo. >> "%INSTALL_SCRIPT%"
echo pause >> "%INSTALL_SCRIPT%"

echo ✅ Script de instalación desde GitHub creado
echo.

REM Crear instrucciones específicas para GitHub
echo 📋 Creando instrucciones para migración desde GitHub...
set INSTRUCCIONES=%MIGRATION_DIR%\🌐_INSTRUCCIONES_GITHUB.txt

echo ================================================ > "%INSTRUCCIONES%"
echo   STOCKIT - INSTALACIÓN DESDE GITHUB >> "%INSTRUCCIONES%"
echo ================================================ >> "%INSTRUCCIONES%"
echo. >> "%INSTRUCCIONES%"
echo 🌐 MIGRACIÓN DESDE GITHUB - VENTAJAS: >> "%INSTRUCCIONES%"
echo ✅ Código más reciente y limpio >> "%INSTRUCCIONES%"
echo ✅ Sin archivos temporales >> "%INSTRUCCIONES%"
echo ✅ Fácil de transportar >> "%INSTRUCCIONES%"
echo ⚠️  Requiere configuración manual de BD >> "%INSTRUCCIONES%"
echo. >> "%INSTRUCCIONES%"
echo 🔧 PASOS DE INSTALACIÓN: >> "%INSTRUCCIONES%"
echo ----------------------- >> "%INSTRUCCIONES%"
echo. >> "%INSTRUCCIONES%"
echo PASO 1: Requisitos >> "%INSTRUCCIONES%"
echo - Node.js 18+ desde https://nodejs.org >> "%INSTRUCCIONES%"
echo - SQL Server Express desde Microsoft >> "%INSTRUCCIONES%"
echo - SQL Server Management Studio (recomendado) >> "%INSTRUCCIONES%"
echo. >> "%INSTRUCCIONES%"
echo PASO 2: Ejecutar instalador >> "%INSTRUCCIONES%"
echo - Ejecuta: Scripts\instalar_desde_github.bat >> "%INSTRUCCIONES%"
echo - Instala automáticamente dependencias >> "%INSTRUCCIONES%"
echo. >> "%INSTRUCCIONES%"
echo PASO 3: Configurar Base de Datos >> "%INSTRUCCIONES%"
echo OPCIÓN A - BD Nueva (recomendado): >> "%INSTRUCCIONES%"
echo - Ejecuta Scripts\crear_bd_inicial.sql en SSMS >> "%INSTRUCCIONES%"
echo - Ejecuta migraciones desde backend\src\database\migrations\ >> "%INSTRUCCIONES%"
echo - Ejecuta SPs desde backend\src\database\stored_procedures\ >> "%INSTRUCCIONES%"
echo. >> "%INSTRUCCIONES%"
echo OPCIÓN B - Restaurar backup (si tienes): >> "%INSTRUCCIONES%"
echo - Restaura Database\StockIT_Local_Backup_*.bak en SSMS >> "%INSTRUCCIONES%"
echo. >> "%INSTRUCCIONES%"
echo PASO 4: Crear archivos .env >> "%INSTRUCCIONES%"
echo - backend\.env con configuración de BD >> "%INSTRUCCIONES%"
echo - frontend\.env con URL del backend >> "%INSTRUCCIONES%"
echo - Ver ejemplos en Config\ >> "%INSTRUCCIONES%"
echo. >> "%INSTRUCCIONES%"
echo PASO 5: Ejecutar aplicación >> "%INSTRUCCIONES%"
echo - Backend: cd C:\Proyectos\StockIT\backend && npm run dev >> "%INSTRUCCIONES%"
echo - Frontend: cd C:\Proyectos\StockIT\frontend && npm run dev >> "%INSTRUCCIONES%"
echo - Acceder: http://localhost:3000 >> "%INSTRUCCIONES%"
echo. >> "%INSTRUCCIONES%"
echo 📚 DOCUMENTACIÓN COMPLETA: >> "%INSTRUCCIONES%"
echo - C:\Proyectos\StockIT\docs\README.md >> "%INSTRUCCIONES%"
echo - C:\Proyectos\StockIT\docs\MANUAL_USUARIO.md >> "%INSTRUCCIONES%"
echo. >> "%INSTRUCCIONES%"
echo 🆘 SOPORTE: >> "%INSTRUCCIONES%"
echo - Ver logs en backend\logs\ >> "%INSTRUCCIONES%"
echo - Consultar documentación en docs\ >> "%INSTRUCCIONES%"

echo ✅ Instrucciones para GitHub creadas
echo.

REM Crear listado de archivos
echo 📋 Creando listado de archivos...
dir /s /b "%MIGRATION_DIR%\StockIT" > "%MIGRATION_DIR%\listado_archivos_github.txt"

echo ✅ Listado de archivos creado
echo.

REM Resumen final
echo ================================================
echo   🌐 MIGRACIÓN DESDE GITHUB PREPARADA
echo ================================================
echo.
echo 📁 Archivos listos en: %MIGRATION_DIR%
echo.
echo 📋 CONTENIDO DE LA MIGRACIÓN GITHUB:
echo ├── StockIT\                    (Código desde GitHub)
echo ├── Database\                   (Backup local si existe)
echo ├── Scripts\                    (Scripts específicos)
echo │   ├── instalar_desde_github.bat
echo │   ├── crear_bd_inicial.sql
echo │   └── crear_backup_local.sql
echo ├── Config\                     (Configuraciones)
echo └── 🌐_INSTRUCCIONES_GITHUB.txt
echo.
echo 🔧 DIFERENCIAS CON MIGRACIÓN LOCAL:
echo ✅ Código más reciente desde GitHub
echo ✅ Sin archivos temporales
echo ⚠️  BD requiere configuración manual
echo.
echo 🚀 PRÓXIMOS PASOS:
echo 1. Copia carpeta %MIGRATION_DIR% a USB/correo
echo 2. En PC destino: Scripts\instalar_desde_github.bat
echo 3. Configura BD según instrucciones
echo 4. Crea archivos .env
echo 5. Ejecuta aplicación
echo.
echo ¿Deseas abrir la carpeta de migración? (S/N)
set /p ABRIR=
if /i "%ABRIR%"=="S" (
    explorer "%MIGRATION_DIR%"
)

echo.
echo ✅ Migración desde GitHub preparada!
pause 