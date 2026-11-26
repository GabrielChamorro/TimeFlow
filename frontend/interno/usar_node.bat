@echo off
setlocal EnableExtensions DisableDelayedExpansion
set "TF_NODE_HOME="
for /f "usebackq delims=" %%D in (`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0_verificar_node.ps1"`) do (
    if not defined TF_NODE_HOME set "TF_NODE_HOME=%%D"
)
if not defined TF_NODE_HOME (
    echo [ERROR] No se encontro Node.js/npm compatibles con Vite.
    endlocal & exit /b 1
)
if not exist "%TF_NODE_HOME%\node.exe" (
    echo [ERROR] node.exe no existe en la ruta seleccionada.
    endlocal & exit /b 1
)
if not exist "%TF_NODE_HOME%\npm.cmd" (
    echo [ERROR] npm.cmd no existe en la ruta seleccionada.
    endlocal & exit /b 1
)
endlocal & set "NODE_HOME=%TF_NODE_HOME%" & set "PATH=%TF_NODE_HOME%;%AppData%\npm;%PATH%" & exit /b 0
