@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0..\.."
echo ==============================================
echo  TimeFlow 0.5.5 - Desactivacion de registros
echo ==============================================
echo Se crea un respaldo de MySQL antes de modificar columnas.
echo No elimina tareas, usuarios, jornadas ni archivos.
echo.
if not exist "backend\config_local.bat" (
  echo [ERROR] Falta backend\config_local.bat con la configuracion local.
  pause
  exit /b 1
)
call "backend\crear_base_datos.bat"
if errorlevel 1 (
  echo [ERROR] Fallo la actualizacion. Revisa el mensaje anterior.
  pause
  exit /b 1
)
echo [OK] Estructura V0.5.5 preparada.
pause
