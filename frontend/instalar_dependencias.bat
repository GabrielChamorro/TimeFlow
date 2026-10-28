@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
title TimeFlow V0.5.0 - Instalador

echo ============================================================
echo Este instalador ahora prepara TODO TimeFlow, no solo el frontend.
echo Se abrira el instalador completo del backend.
echo ============================================================
echo.
call "..\backend\instalar_dependencias.bat"
set "RC=%ERRORLEVEL%"
endlocal & exit /b %RC%
