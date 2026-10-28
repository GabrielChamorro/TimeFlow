@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
title TimeFlow V0.5.0 - Pruebas

echo ============================================
echo   TimeFlow V0.5.0 - Pruebas JUnit / MockMvc
echo ============================================
echo.

call usar_java21_seguro.bat >nul 2>&1
if errorlevel 1 (
    call :red "JDK 21 seguro: FALTA"
    echo Ejecuta primero instalar_dependencias.bat.
    pause
    endlocal & exit /b 1
)
for /f "delims=" %%V in ('"%JAVA_HOME%\bin\java.exe" -version 2^>^&1 ^| findstr /i "version"') do call :green "JDK: %%V"

if not exist "mvnw.cmd" (
    call :red "Maven Wrapper: FALTA"
    pause
    endlocal & exit /b 1
)
call :green "Maven Wrapper: PRESENTE"

call mvnw.cmd -q -o -DskipTests dependency:go-offline >nul 2>&1
if errorlevel 1 (
    call :red "Dependencias Maven: INCOMPLETAS"
    echo Ejecuta instalar_dependencias.bat antes de las pruebas.
    pause
    endlocal & exit /b 1
)
call :green "Dependencias Maven: PRESENTES"
echo.

call mvnw.cmd test
set "RC=%ERRORLEVEL%"
echo.
if "%RC%"=="0" (
    call :green "PRUEBAS TERMINADAS SIN ERRORES"
) else (
    call :red "HAY PRUEBAS FALLIDAS O ERROR DE COMPILACION"
)
echo.
pause
endlocal & exit /b %RC%

:green
powershell -NoProfile -Command "Write-Host '[OK] %~1' -ForegroundColor Green"
exit /b 0
:red
powershell -NoProfile -Command "Write-Host '[ERROR] %~1' -ForegroundColor Red"
exit /b 0
