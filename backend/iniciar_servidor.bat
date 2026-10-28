@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"
title Backend TimeFlow V0.5.0
set "FAILED=0"

echo ============================================================
echo    TimeFlow V0.5.0 - Comprobacion previa del BACKEND
echo ============================================================

call usar_java21_seguro.bat >nul 2>&1
if errorlevel 1 (
    call :red "JDK 21 seguro: FALTA"
    set "FAILED=1"
) else (
    for /f "delims=" %%V in ('"%JAVA_HOME%\bin\java.exe" -version 2^>^&1 ^| findstr /i "version"') do call :green "JDK: %%V"
)

if exist "mvnw.cmd" (call :green "Maven Wrapper: PRESENTE") else (call :red "Maven Wrapper: FALTA" & set "FAILED=1")

if exist "config_local.bat" (
    call :green "Configuracion local: PRESENTE"
    call config_local.bat
) else (
    call :red "Configuracion local: FALTA config_local.bat"
    set "FAILED=1"
)

call usar_mysql.bat >nul 2>&1
if errorlevel 1 (
    call :red "MySQL cliente: FALTA"
    set "FAILED=1"
) else (
    call :check_mysql_version
)

if "%FAILED%"=="0" call :check_db
if "%FAILED%"=="0" call :check_maven

echo.
if not "%FAILED%"=="0" (
    call :red "Backend NO iniciado: faltan dependencias o configuracion."
    echo Ejecuta primero: instalar_dependencias.bat
    pause
    endlocal & exit /b 1
)
call :green "Todas las dependencias del backend estan disponibles."
echo.
echo Iniciando Spring Boot...
call mvnw.cmd spring-boot:run
set "RC=%ERRORLEVEL%"
if not "%RC%"=="0" (
    echo.
    call :red "Spring Boot termino con error. Revisa el log superior."
    pause
)
endlocal & exit /b %RC%

:check_mysql_version
set "MYSQL_FOUND_VERSION="
for /f "usebackq delims=" %%V in (`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0_verificar_mysql.ps1" -MySqlExe "%MYSQL_EXE%"`) do set "MYSQL_FOUND_VERSION=%%V"
if not defined MYSQL_FOUND_VERSION (
    set "FAILED=1"
    call :red "No se pudo identificar el cliente MySQL."
    exit /b 1
)
call :green "Cliente MySQL %MYSQL_FOUND_VERSION% presente."
exit /b 0

:check_db
if not defined DB_USER (
    set "FAILED=1"
    call :red "DB_USER no esta configurado."
    exit /b 1
)
if not defined DB_PASSWORD (
    set "FAILED=1"
    call :red "DB_PASSWORD no esta configurado."
    exit /b 1
)
set "MYSQL_PWD=%DB_PASSWORD%"
"%MYSQL_EXE%" -u "%DB_USER%" -h 127.0.0.1 -P 3306 -N -e "SELECT 1;" >nul 2>&1
set "MYSQL_TEST_RC=%ERRORLEVEL%"
set "MYSQL_PWD="
if not "%MYSQL_TEST_RC%"=="0" (
    set "FAILED=1"
    call :red "MySQL Server: no responde o las credenciales son incorrectas."
    exit /b 1
)
set "MYSQL_PWD=%DB_PASSWORD%"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0_verificar_mysql.ps1" -MySqlExe "%MYSQL_EXE%" -Servidor -ComprobarSeguridad >nul
set "MYSQL_SECURITY_RC=%ERRORLEVEL%"
set "MYSQL_PWD="
if not "%MYSQL_SECURITY_RC%"=="0" (
    set "FAILED=1"
    call :red "MySQL Server necesita actualizacion de seguridad o no pudo verificarse."
    exit /b 1
)
call :green "MySQL Server: CONEXION Y VERSION CORRECTAS"
exit /b 0

:check_maven
call mvnw.cmd -q -o -DskipTests dependency:go-offline >nul 2>&1
if errorlevel 1 (
    set "FAILED=1"
    call :red "Dependencias Maven: faltan archivos en cache."
    exit /b 1
)
call :green "Dependencias Maven: PRESENTES"
exit /b 0

:green
powershell -NoProfile -Command "Write-Host '[OK] %~1' -ForegroundColor Green"
exit /b 0
:red
powershell -NoProfile -Command "Write-Host '[ERROR] %~1' -ForegroundColor Red"
exit /b 0
