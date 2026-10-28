@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
title TimeFlow V0.5.0 - Instalacion en modo administrador
echo ============================================================
echo  TimeFlow V0.5.0 - INSTALADOR (ADMINISTRADOR)
echo ============================================================
if not exist "%~dp0instalar_dependencias.bat" (
    echo [ERROR] No se encontro instalar_dependencias.bat en:
    echo "%~dp0"
    echo Revisa que el ZIP se extrajo por completo.
    goto :finish_error
)
rem El marcador se crea solo al terminar el resumen; detecta salidas inesperadas.
if exist "%~dp0.timeflow-installer-completed" del /q "%~dp0.timeflow-installer-completed" >nul 2>&1
call "%~dp0instalar_dependencias.bat"
if not exist "%~dp0.timeflow-installer-completed" (
    echo.
    echo [ERROR] El instalador se interrumpio sin llegar al resumen final.
    echo [INFO] El registro esta en: "%~dp0INSTALADOR_DIAGNOSTICO.txt"
    echo [INFO] No se confirmo la instalacion; no intentes iniciar TimeFlow aun.
    echo.
    set "TF_EXIT=1"
    goto :premature_exit
)

set "TF_EXIT=%ERRORLEVEL%"
:premature_exit
echo.
if not "%TF_EXIT%"=="0" (
    echo [ERROR] El instalador termino con codigo %TF_EXIT%.
    echo Si necesitas ayuda, comparte la captura del error; no compartas contrasenas.
) else (
    echo [INFO] El instalador ha terminado; revisa el resumen mostrado.
)
echo.
echo Esta consola permanecera abierta para revisar los mensajes.
echo Puedes cerrarla escribiendo EXIT.
endlocal & exit /b %TF_EXIT%

:finish_error
echo.
echo La consola permanecera abierta. Escribe EXIT para cerrarla.
endlocal & exit /b 1
