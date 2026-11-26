@echo off
setlocal
cd /d "%~dp0..\..\frontend"
echo ============================================
echo TimeFlow - Actualizacion de Vite
 echo ============================================
echo Requiere Internet. Corrige avisos de seguridad de Vite 8.2.4.
where npm.cmd >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node y npm no se encuentran en PATH.
  pause
  exit /b 1
)
call npm.cmd install --save-dev --save-exact vite@8.2.6
if errorlevel 1 goto :fallo
call npm.cmd ci
if errorlevel 1 goto :fallo
call npm.cmd run test:sprint5
if errorlevel 1 goto :fallo
call npm.cmd run build
if errorlevel 1 goto :fallo
call npm.cmd audit --audit-level=high
if errorlevel 1 goto :fallo
echo [OK] Vite actualizado, dependencias instaladas, pruebas y compilacion terminadas.
echo Revisa el estado del repositorio antes de subir.
pause
exit /b 0
:fallo
echo [ERROR] No se pudo completar la actualizacion de frontend.
echo Revisa el error y no publiques una compilacion sin verificar.
pause
exit /b 1
