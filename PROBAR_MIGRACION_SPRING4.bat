@echo off
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0backend"
title TimeFlow 0.5.0 - Prueba Spring Boot 4

echo ============================================================
echo      TIMEFLOW 0.5.0 - PRUEBAS DE MIGRACION

echo ============================================================
echo Requiere Internet solo para las NUEVAS dependencias Maven.
echo NO inicia MySQL ni modifica sus datos.
echo.
call "usar_java21_seguro.bat"
if errorlevel 1 goto :error
call "mvnw.cmd" -ntp clean test
set "RC=%ERRORLEVEL%"
echo.
if "%RC%"=="0" (
 echo [OK] Compilacion y pruebas JUnit completas.
) else (
 echo [ERROR] Fallo en compilacion o pruebas. Conserva este log.
)
echo.
pause
endlocal & exit /b %RC%
:error
echo [ERROR] Java 21 no esta disponible. Usa instalador de dependencias.
pause
endlocal & exit /b 1
