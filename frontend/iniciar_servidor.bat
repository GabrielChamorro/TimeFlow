@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
title Frontend TimeFlow V0.5.0
set "FAILED=0"

echo ============================================================
echo    TimeFlow V0.5.0 - Comprobacion previa del FRONTEND
echo ============================================================

call usar_node.bat >nul 2>&1
if errorlevel 1 (
    call :red "Node.js compatible: FALTA"
    set "FAILED=1"
) else (
    for /f "delims=" %%V in ('node -v') do call :green "Node.js: %%V"
    for /f "delims=" %%V in ('npm -v') do call :green "npm: v%%V"
)

if exist "package.json" (call :green "package.json: PRESENTE") else (call :red "package.json: FALTA" & set "FAILED=1")
if exist "package-lock.json" (call :green "package-lock.json: PRESENTE") else (call :red "package-lock.json: FALTA" & set "FAILED=1")

if "%FAILED%"=="0" (
    if not exist "node_modules\" (
        call :red "node_modules: FALTA"
        set "FAILED=1"
    ) else (
        call npm ls --depth=0 >nul 2>&1
        if errorlevel 1 (
            call :red "Dependencias React/Vite: INCOMPLETAS O INCONSISTENTES"
            set "FAILED=1"
        ) else (
            call :green "Dependencias React/Vite: PRESENTES"
        )
    )
)

echo.
if not "%FAILED%"=="0" (
    call :red "Frontend NO iniciado: faltan dependencias."
    echo Ejecuta instalar_dependencias.bat o el instalador completo de la raiz.
    pause
    endlocal & exit /b 1
)

call :green "Todas las dependencias del frontend estan disponibles."
echo.
echo Iniciando servidor Vite en http://localhost:5173/
start /b cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:5173/"
call npm run dev
set "RC=%ERRORLEVEL%"
if not "%RC%"=="0" (
    echo.
    call :red "Vite termino con error. Revisa el mensaje superior."
    pause
)
endlocal & exit /b %RC%

:green
powershell -NoProfile -Command "Write-Host '[OK] %~1' -ForegroundColor Green"
exit /b 0
:red
powershell -NoProfile -Command "Write-Host '[ERROR] %~1' -ForegroundColor Red"
exit /b 0
