@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"
title TimeFlow V0.5.0 - Configuracion local
if exist "%~dp0config_local.bat" (
    echo [OK] config_local.bat ya existe. No se sobreescriben tus credenciales.
    endlocal & exit /b 0
)
call "%~dp0usar_mysql.bat" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] No se encontro el cliente MySQL. Ejecuta primero el instalador de dependencias.
    if not defined TIMEFLOW_INSTALLER_MODE pause
    endlocal & exit /b 1
)
echo ============================================================
echo  Configuracion local segura de TimeFlow V0.5.0
echo ============================================================
echo Las contrasenas no se imprimiran en pantalla ni en los diagnosticos.
echo La clave de MySQL es la que YA FUNCIONA en tu PC; no inventes una nueva.
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0_configurar_entorno_local.ps1" -MySqlExe "%MYSQL_EXE%" -ConfigPath "%~dp0config_local.bat"
set "RC=%ERRORLEVEL%"
if not "%RC%"=="0" if not defined TIMEFLOW_INSTALLER_MODE pause
endlocal & exit /b %RC%
