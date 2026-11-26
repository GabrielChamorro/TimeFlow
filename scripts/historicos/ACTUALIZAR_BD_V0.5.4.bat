@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0..\.."
echo ===========================================
echo  TimeFlow 0.5.4 - Actualizar base de datos
echo ===========================================
echo Este procedimiento crea un respaldo y agrega las columnas y tablas nuevas.
echo No borra tareas existentes.
echo.
if not exist "backend\config_local.bat" (
    echo [ERROR] Falta backend\config_local.bat.
    echo Copia el archivo privado de tu instalacion actual de TimeFlow a la carpeta backend.
    echo No lo subas a GitHub.
    pause
    exit /b 1
)
call "backend\crear_base_datos.bat"
if errorlevel 1 (
    echo [ERROR] No se pudo completar la actualizacion. Revisa la salida anterior.
    pause
    exit /b 1
)
echo [OK] Base de datos actualizada a V0.5.4.
pause
