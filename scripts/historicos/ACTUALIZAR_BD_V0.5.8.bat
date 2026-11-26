@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0..\.."
echo =========================================
echo TimeFlow V0.5.8 - Dependencias multiples
echo =========================================
echo IMPORTANTE: cierra el backend antes de ejecutar la migracion.
echo Se creara un respaldo antes de migrar los datos antiguos.
if not exist "backend\config_local.bat" (
  echo [ERROR] Falta backend\config_local.bat.
  pause
  exit /b 1
)
call "backend\crear_base_datos.bat"
if errorlevel 1 (
  echo [ERROR] La migracion no se completo. No inicies el backend nuevo.
  pause
  exit /b 1
)
echo [OK] Dependencias migradas. Ya puedes iniciar V0.5.8.
pause
