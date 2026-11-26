@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0..\.."
echo ============================================
echo TimeFlow - Auditoria de seguridad V0.5.6
echo ============================================
echo Se creara un respaldo antes de actualizar MySQL.
echo La columna asignado_usuario_id conservara los registros antiguos.
if not exist "backend\config_local.bat" (
  echo [ERROR] Falta backend\config_local.bat
  pause
  exit /b 1
)
call "backend\crear_base_datos.bat"
if errorlevel 1 (
  echo [ERROR] No se completo la actualizacion. NO inicies el backend nuevo.
  pause
  exit /b 1
)
echo [OK] Base de datos preparada.
pause
