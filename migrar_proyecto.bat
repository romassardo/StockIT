@echo off
REM Script para preparar StockIT para migración
echo ===========================================
echo     PREPARANDO STOCKIT PARA MIGRACION
echo ===========================================

REM Crear carpeta temporal para la migración
mkdir C:\Temp\StockIT_Migracion

REM Copiar todo el proyecto (excluyendo node_modules y archivos innecesarios)
echo Copiando archivos del proyecto...
xcopy /E /I /Y "%~dp0" "C:\Temp\StockIT_Migracion\StockIT" /EXCLUDE:archivos_excluir.txt

REM Crear archivo con instrucciones
echo Creando archivo de instrucciones...
echo INSTRUCCIONES DE INSTALACION > "C:\Temp\StockIT_Migracion\INSTRUCCIONES.txt"
echo ================================= >> "C:\Temp\StockIT_Migracion\INSTRUCCIONES.txt"
echo. >> "C:\Temp\StockIT_Migracion\INSTRUCCIONES.txt"
echo 1. Instalar Node.js desde https://nodejs.org >> "C:\Temp\StockIT_Migracion\INSTRUCCIONES.txt"
echo 2. Instalar SQL Server Express >> "C:\Temp\StockIT_Migracion\INSTRUCCIONES.txt"
echo 3. Restaurar base de datos con StockIT_Backup.bak >> "C:\Temp\StockIT_Migracion\INSTRUCCIONES.txt"
echo 4. Configurar variables de entorno >> "C:\Temp\StockIT_Migracion\INSTRUCCIONES.txt"
echo 5. Ejecutar npm install en ambas carpetas >> "C:\Temp\StockIT_Migracion\INSTRUCCIONES.txt"

echo.
echo ===========================================
echo   PROYECTO PREPARADO EN C:\Temp\StockIT_Migracion
echo ===========================================
echo.
echo Archivos listos para copiar a USB/correo:
echo - C:\Temp\StockIT_Migracion\StockIT (carpeta completa)
echo - C:\Temp\StockIT_Backup.bak (archivo de base de datos)
echo.
pause 