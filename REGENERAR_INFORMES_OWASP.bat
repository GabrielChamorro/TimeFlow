@echo off
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0"
title TimeFlow V0.5.0 - Regenerar informes OWASP sin descargar NVD
if not exist "%~dp0backend\AUDITAR_BACKEND_MAVEN.bat" (
  echo [ERROR] Falta backend\AUDITAR_BACKEND_MAVEN.bat. Extrae el ZIP completo.
  pause
  exit /b 1
)
echo ============================================================
echo  TIMEFLOW V0.5.0 - INFORMES OWASP CON CACHE NVD
echo ============================================================
echo [INFO] Usa los datos NVD descargados previamente en este equipo.
echo [INFO] No descarga de nuevo las 413 mil entradas ni pide clave.
echo [INFO] Si la cache no existe, el informe no podra generarse.
echo.
call "%~dp0backend\AUDITAR_BACKEND_MAVEN.bat" /cache
set "RC=%ERRORLEVEL%"
endlocal & exit /b %RC%
