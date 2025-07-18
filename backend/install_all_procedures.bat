@echo off
REM ===================================================================
REM INSTALADOR AUTOMÁTICO DE STORED PROCEDURES STOCKIT MYSQL
REM ===================================================================

echo.
echo ===============================================================
echo INSTALANDO STORED PROCEDURES DE STOCKIT EN MYSQL
echo ===============================================================
echo.

set DB_USER=root
set DB_PASS=197575
set DB_NAME=stockit_mysql
set SP_PATH=src\database\mysql_procedures

REM Paso 1: Limpiar procedimientos existentes
echo [1/6] Limpiando procedimientos existentes...
mysql -u %DB_USER% -p%DB_PASS% %DB_NAME% < install_mysql_procedures.sql
if errorlevel 1 (
    echo ERROR: No se pudieron limpiar los procedimientos existentes
    pause
    exit /b 1
)

REM Paso 2: Instalar SPs de Asignaciones
echo [2/6] Instalando Stored Procedures de Asignaciones...
for %%f in ("%SP_PATH%\asignaciones\*.sql") do (
    echo    - Instalando %%~nxf
    mysql -u %DB_USER% -p%DB_PASS% %DB_NAME% < "%%f"
    if errorlevel 1 (
        echo ERROR en %%~nxf
        pause
        exit /b 1
    )
)

REM Paso 3: Instalar SPs de Inventario Individual
echo [3/6] Instalando Stored Procedures de Inventario Individual...
for %%f in ("%SP_PATH%\inventario_individual\*.sql") do (
    echo    - Instalando %%~nxf
    mysql -u %DB_USER% -p%DB_PASS% %DB_NAME% < "%%f"
    if errorlevel 1 (
        echo ERROR en %%~nxf
        pause
        exit /b 1
    )
)

REM Paso 4: Instalar SPs de Reparaciones
echo [4/6] Instalando Stored Procedures de Reparaciones...
for %%f in ("%SP_PATH%\reparaciones\*.sql") do (
    echo    - Instalando %%~nxf
    mysql -u %DB_USER% -p%DB_PASS% %DB_NAME% < "%%f"
    if errorlevel 1 (
        echo ERROR en %%~nxf
        pause
        exit /b 1
    )
)

REM Paso 5: Instalar SPs de Stock General
echo [5/6] Instalando Stored Procedures de Stock General...
for %%f in ("%SP_PATH%\stock_general\*.sql") do (
    echo    - Instalando %%~nxf
    mysql -u %DB_USER% -p%DB_PASS% %DB_NAME% < "%%f"
    if errorlevel 1 (
        echo ERROR en %%~nxf
        pause
        exit /b 1
    )
)

REM Paso 6: Instalar SPs de Reportes
echo [6/6] Instalando Stored Procedures de Reportes...
for %%f in ("%SP_PATH%\reports\*.sql") do (
    echo    - Instalando %%~nxf
    mysql -u %DB_USER% -p%DB_PASS% %DB_NAME% < "%%f"
    if errorlevel 1 (
        echo ERROR en %%~nxf
        pause
        exit /b 1
    )
)

echo.
echo ===============================================================
echo ✅ INSTALACIÓN COMPLETADA EXITOSAMENTE
echo ===============================================================
echo.
echo Todos los Stored Procedures han sido instalados en MySQL.
echo Podes probar la conexión con: npm run dev
echo.
pause 