@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
title TimeFlow V0.5.0 - Instalar todo
if not exist "%~dp0backend\instalar_dependencias.bat" (
    echo [ERROR] No se encontro backend\instalar_dependencias.bat.
    echo Comprueba que extrajiste el ZIP completo.
    pause
    endlocal & exit /b 1
)
call "%~dp0backend\instalar_dependencias.bat"
set "RC=%ERRORLEVEL%"
echo.
if "%RC%"=="20" (
    echo [INFO] La instalacion se inicio en otra ventana con permisos de administrador.
    echo [INFO] Revisa el resultado final en esa ventana.
) else if not "%RC%"=="0" (
    echo [ERROR] La instalacion no se completo correctamente.
    echo Revisa backend\INSTALADOR_DIAGNOSTICO.txt y el error en pantalla.
) else (
    echo [OK] El instalador termino. Comprueba el resumen superior.
)
echo.
echo Presiona una tecla para cerrar esta ventana.
pause
endlocal & exit /b %RC%
