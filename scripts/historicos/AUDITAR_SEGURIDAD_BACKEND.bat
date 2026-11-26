@echo off
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0..\.."
title TimeFlow V0.5.0 - Auditoria Maven de seguridad
if not exist "%~dp0..\..\backend\herramientas\AUDITAR_BACKEND_MAVEN.bat" (
  echo [ERROR] Falta backend\herramientas\AUDITAR_BACKEND_MAVEN.bat. Extrae el ZIP completo.
  pause
  exit /b 1
)
call "%~dp0..\..\backend\herramientas\AUDITAR_BACKEND_MAVEN.bat"
set "RC=%ERRORLEVEL%"
endlocal & exit /b %RC%
