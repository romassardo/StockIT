@echo off
setlocal enabledelayedexpansion
color 0A

REM Script mejorado para migrar StockIT entre PCs
echo ================================================
echo    🚀 STOCKIT - MIGRACIÓN COMPLETA V2.0
echo ================================================
echo.

REM Verificar que estamos en el directorio correcto
if not exist "frontend" (
    echo ❌ ERROR: No se encuentra la carpeta 'frontend'
    echo    Ejecuta este script desde la carpeta raíz de StockIT
    pause
    exit /b 1
)

if not exist "backend" (
    echo ❌ ERROR: No se encuentra la carpeta 'backend'
    echo    Ejecuta este script desde la carpeta raíz de StockIT
    pause
    exit /b 1
)

echo ✅ Directorio de proyecto verificado
echo.

REM Crear carpeta de migración con timestamp
set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%
set TIMESTAMP=%TIMESTAMP: =0%
set MIGRATION_DIR=C:\Temp\StockIT_Migracion_%TIMESTAMP%

echo 📁 Creando carpeta de migración: %MIGRATION_DIR%
mkdir "%MIGRATION_DIR%"
if errorlevel 1 (
    echo ❌ ERROR: No se pudo crear la carpeta de migración
    pause
    exit /b 1
)

REM Crear subcarpetas
mkdir "%MIGRATION_DIR%\StockIT"
mkdir "%MIGRATION_DIR%\Database"
mkdir "%MIGRATION_DIR%\Scripts"
mkdir "%MIGRATION_DIR%\Config"

echo ✅ Estructura de carpetas creada
echo.

REM Copiar archivos del proyecto
echo 📋 Copiando archivos del proyecto...
echo    (Excluyendo node_modules, logs, y archivos temporales)
xcopy /E /I /Y "%~dp0" "%MIGRATION_DIR%\StockIT" /EXCLUDE:archivos_excluir.txt

if errorlevel 1 (
    echo ⚠️  Algunos archivos no se pudieron copiar (normal)
) else (
    echo ✅ Archivos del proyecto copiados
)
echo.

REM Crear backup de la base de datos
echo 🗄️  Creando backup de la base de datos...
echo    IMPORTANTE: Asegúrate de que SQL Server esté ejecutándose
echo.

set DB_BACKUP_FILE=%MIGRATION_DIR%\Database\StockIT_Backup_%TIMESTAMP%.bak
set DB_BACKUP_SCRIPT=%MIGRATION_DIR%\Scripts\crear_backup.sql

REM Crear script SQL para backup
echo BACKUP DATABASE [StockIT] > "%DB_BACKUP_SCRIPT%"
echo TO DISK = N'%DB_BACKUP_FILE%' >> "%DB_BACKUP_SCRIPT%"
echo WITH FORMAT, INIT, >> "%DB_BACKUP_SCRIPT%"
echo NAME = N'StockIT-Full Database Backup', >> "%DB_BACKUP_SCRIPT%"
echo SKIP, NOREWIND, NOUNLOAD, STATS = 10 >> "%DB_BACKUP_SCRIPT%"

echo ✅ Script de backup creado
echo.

REM Intentar ejecutar el backup
echo 🔄 Ejecutando backup de la base de datos...
sqlcmd -S localhost\SQLEXPRESS -E -i "%DB_BACKUP_SCRIPT%"

if errorlevel 1 (
    echo ⚠️  El backup automático falló. Deberás crearlo manualmente.
    echo    Ejecuta el script: %DB_BACKUP_SCRIPT%
) else (
    echo ✅ Backup de base de datos creado: %DB_BACKUP_FILE%
)
echo.

REM Copiar archivos de configuración
echo 📝 Copiando archivos de configuración...
copy "configuracion_trabajo.md" "%MIGRATION_DIR%\Config\"
copy "design-UX-UI-guide.md" "%MIGRATION_DIR%\Config\"
copy "proyecto-inventario-it.md" "%MIGRATION_DIR%\Config\"

if exist "docs" (
    xcopy /E /I /Y "docs" "%MIGRATION_DIR%\Config\docs"
)

echo ✅ Archivos de configuración copiados
echo.

REM Crear archivo de instrucciones detalladas
echo 📋 Creando instrucciones detalladas...
set INSTRUCCIONES=%MIGRATION_DIR%\🚀_INSTRUCCIONES_INSTALACION.txt

echo ================================================ > "%INSTRUCCIONES%"
echo   STOCKIT - GUÍA DE INSTALACIÓN EN PC DESTINO >> "%INSTRUCCIONES%"
echo ================================================ >> "%INSTRUCCIONES%"
echo. >> "%INSTRUCCIONES%"
echo 📋 REQUISITOS PREVIOS: >> "%INSTRUCCIONES%"
echo -------------------- >> "%INSTRUCCIONES%"
echo 1. Windows 10/11 >> "%INSTRUCCIONES%"
echo 2. Node.js 18+ (descargar de https://nodejs.org) >> "%INSTRUCCIONES%"
echo 3. SQL Server Express (descargar de Microsoft) >> "%INSTRUCCIONES%"
echo 4. SQL Server Management Studio (opcional pero recomendado) >> "%INSTRUCCIONES%"
echo. >> "%INSTRUCCIONES%"
echo 🔧 PASOS DE INSTALACIÓN: >> "%INSTRUCCIONES%"
echo ----------------------- >> "%INSTRUCCIONES%"
echo. >> "%INSTRUCCIONES%"
echo PASO 1: Instalar Node.js >> "%INSTRUCCIONES%"
echo - Descargar e instalar Node.js desde https://nodejs.org >> "%INSTRUCCIONES%"
echo - Verificar: abrir cmd y ejecutar: node --version >> "%INSTRUCCIONES%"
echo. >> "%INSTRUCCIONES%"
echo PASO 2: Instalar SQL Server Express >> "%INSTRUCCIONES%"
echo - Instalar con configuración por defecto >> "%INSTRUCCIONES%"
echo - Instancia: .\SQLEXPRESS o COMPUTADORA\SQLEXPRESS >> "%INSTRUCCIONES%"
echo. >> "%INSTRUCCIONES%"
echo PASO 3: Restaurar Base de Datos >> "%INSTRUCCIONES%"
echo - Abrir SQL Server Management Studio >> "%INSTRUCCIONES%"
echo - Conectar a .\SQLEXPRESS >> "%INSTRUCCIONES%"
echo - Clic derecho en Bases de datos ^> Restaurar base de datos >> "%INSTRUCCIONES%"
echo - Seleccionar archivo: Database\StockIT_Backup_%TIMESTAMP%.bak >> "%INSTRUCCIONES%"
echo - Nombre de BD: StockIT >> "%INSTRUCCIONES%"
echo. >> "%INSTRUCCIONES%"
echo PASO 4: Configurar Proyecto >> "%INSTRUCCIONES%"
echo - Copiar carpeta StockIT a C:\Proyectos\ >> "%INSTRUCCIONES%"
echo - Crear archivos .env según Config\configuracion_trabajo.md >> "%INSTRUCCIONES%"
echo. >> "%INSTRUCCIONES%"
echo PASO 5: Instalar dependencias >> "%INSTRUCCIONES%"
echo - Abrir cmd en C:\Proyectos\StockIT\backend >> "%INSTRUCCIONES%"
echo - Ejecutar: npm install >> "%INSTRUCCIONES%"
echo - Abrir cmd en C:\Proyectos\StockIT\frontend >> "%INSTRUCCIONES%"
echo - Ejecutar: npm install >> "%INSTRUCCIONES%"
echo. >> "%INSTRUCCIONES%"
echo PASO 6: Ejecutar aplicación >> "%INSTRUCCIONES%"
echo - Backend: npm run dev (en carpeta backend) >> "%INSTRUCCIONES%"
echo - Frontend: npm run dev (en carpeta frontend) >> "%INSTRUCCIONES%"
echo - Abrir navegador: http://localhost:3000 >> "%INSTRUCCIONES%"
echo. >> "%INSTRUCCIONES%"
echo 🆘 SOLUCIÓN DE PROBLEMAS: >> "%INSTRUCCIONES%"
echo ------------------------ >> "%INSTRUCCIONES%"
echo - Ver archivo Config\configuracion_trabajo.md >> "%INSTRUCCIONES%"
echo - Error de conexión BD: verificar nombre de PC en .env >> "%INSTRUCCIONES%"
echo - Error de puerto: cambiar PORT en backend\.env >> "%INSTRUCCIONES%"
echo. >> "%INSTRUCCIONES%"
echo ✅ VERIFICACIÓN: >> "%INSTRUCCIONES%"
echo --------------- >> "%INSTRUCCIONES%"
echo - Backend responde: http://localhost:8000/api/dashboard/stats >> "%INSTRUCCIONES%"
echo - Frontend carga: http://localhost:3000 >> "%INSTRUCCIONES%"
echo - Login funciona con usuario de prueba >> "%INSTRUCCIONES%"

echo ✅ Instrucciones detalladas creadas
echo.

REM Crear script de instalación automática
echo 🔧 Creando script de instalación automática...
set INSTALL_SCRIPT=%MIGRATION_DIR%\Scripts\instalar_en_oficina.bat

echo @echo off > "%INSTALL_SCRIPT%"
echo setlocal enabledelayedexpansion >> "%INSTALL_SCRIPT%"
echo color 0B >> "%INSTALL_SCRIPT%"
echo. >> "%INSTALL_SCRIPT%"
echo echo ============================================ >> "%INSTALL_SCRIPT%"
echo echo    STOCKIT - INSTALACIÓN AUTOMÁTICA >> "%INSTALL_SCRIPT%"
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
echo echo 📋 Copiando archivos del proyecto... >> "%INSTALL_SCRIPT%"
echo xcopy /E /I /Y "StockIT" "C:\Proyectos\StockIT" >> "%INSTALL_SCRIPT%"
echo echo ✅ Proyecto copiado >> "%INSTALL_SCRIPT%"
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
echo echo   🎉 INSTALACIÓN COMPLETADA >> "%INSTALL_SCRIPT%"
echo echo ============================================ >> "%INSTALL_SCRIPT%"
echo echo. >> "%INSTALL_SCRIPT%"
echo echo PRÓXIMOS PASOS: >> "%INSTALL_SCRIPT%"
echo echo 1. Restaurar base de datos StockIT >> "%INSTALL_SCRIPT%"
echo echo 2. Crear archivos .env según instrucciones >> "%INSTALL_SCRIPT%"
echo echo 3. Ejecutar: npm run dev en backend y frontend >> "%INSTALL_SCRIPT%"
echo echo. >> "%INSTALL_SCRIPT%"
echo pause >> "%INSTALL_SCRIPT%"

echo ✅ Script de instalación automática creado
echo.

REM Crear listado de archivos para verificación
echo 📋 Creando listado de archivos...
dir /s /b "%MIGRATION_DIR%\StockIT" > "%MIGRATION_DIR%\listado_archivos.txt"

echo ✅ Listado de archivos creado
echo.

REM Resumen final
echo ================================================
echo   🎉 MIGRACIÓN PREPARADA EXITOSAMENTE
echo ================================================
echo.
echo 📁 Archivos listos en: %MIGRATION_DIR%
echo.
echo 📋 CONTENIDO DE LA MIGRACIÓN:
echo ├── StockIT\                (Código fuente)
echo ├── Database\               (Backup de BD)
echo ├── Scripts\                (Scripts de instalación)
echo ├── Config\                 (Configuraciones y docs)
echo └── 🚀_INSTRUCCIONES_INSTALACION.txt
echo.
echo 🔧 PRÓXIMOS PASOS:
echo 1. Copia toda la carpeta %MIGRATION_DIR% a USB/correo
echo 2. En la PC destino, ejecuta Scripts\instalar_en_oficina.bat
echo 3. Sigue las instrucciones del archivo de instalación
echo.
echo ⚠️  IMPORTANTE: No olvides restaurar la base de datos
echo.
echo ¿Deseas abrir la carpeta de migración? (S/N)
set /p ABRIR=
if /i "%ABRIR%"=="S" (
    explorer "%MIGRATION_DIR%"
)

echo.
echo ✅ Proceso completado. ¡Listo para migrar!
pause 