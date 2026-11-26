@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title TimeFlow Sprint 5 - Pruebas de rendimiento

echo =====================================================
echo    TIMEFLOW V0.5.3 - RENDIMIENTO Y CONCURRENCIA
echo =====================================================
echo.
echo Inicia primero el BACKEND de TimeFlow en localhost:8080.
echo El frontend no es necesario.
echo Se usan solo consultas GET durante las mediciones.
echo No se crean ni eliminan tareas, jornadas o mensajes.
echo.
where node.exe >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js no esta disponible en PATH.
  echo Instala Node.js o utiliza el que ya usas con el frontend.
  echo.
  pause
  exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\iniciar_sprint5.ps1"
set "EXIT_CODE=%ERRORLEVEL%"
echo.
if "%EXIT_CODE%"=="0" (
  echo [OK] Las comprobaciones terminaron sin errores HTTP.
) else (
  echo [AVISO] La prueba detecto un error o no se pudo completar.
)
echo.
echo Revisa la carpeta Resultados_Sprint5.
echo Enviame el archivo .txt mas reciente, incluso si hubo errores.
echo.
pause
exit /b %EXIT_CODE%
