@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"
title TimeFlow V0.5.0 - Instalador completo

set "TF_INSTALL_LOG=%~dp0INSTALADOR_DIAGNOSTICO.txt"
> "%TF_INSTALL_LOG%" echo Inicio TimeFlow V0.5.0 - %DATE% %TIME%
>> "%TF_INSTALL_LOG%" echo Registro de etapas del instalador, sin contrasenas.

rem Node.js, Visual C++ y MySQL pueden requerir permisos de administrador.
where powershell >nul 2>&1
if errorlevel 1 (
    echo [ERROR] PowerShell no esta disponible en este Windows.
    >> "%TF_INSTALL_LOG%" echo ERROR: PowerShell no disponible.
    pause
    endlocal & exit /b 1
)
powershell -NoProfile -Command "$p=New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent()); if($p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)){exit 0}else{exit 1}"
if errorlevel 1 goto :elevate
goto :after_elevation

:elevate
>> "%TF_INSTALL_LOG%" echo Solicitando permisos de administrador...
rem Lanza un script auxiliar desde la carpeta real del backend.
rem Evita usar %%~f0: con CALL relativo y un CD previo puede resolver backend\backend.
if not exist "%~dp0_iniciar_instalador_admin.bat" (
    echo [ERROR] Falta el auxiliar _iniciar_instalador_admin.bat.
    >> "%TF_INSTALL_LOG%" echo ERROR: Falta auxiliar de elevacion.
    pause
    endlocal & exit /b 1
)
echo Solicitando permisos de administrador para completar la instalacion...
echo La nueva ventana permanecera abierta incluso si ocurre un error.
rem El script PowerShell resuelve una ruta ABSOLUTA y la pasa a cmd.exe con comillas.
rem No depende de la carpeta inicial de la consola elevada (System32).
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0_elevate_installer.ps1" -InstallerPath "%~dp0_iniciar_instalador_admin.bat"
if errorlevel 1 (
    echo [ERROR] No se pudo abrir la ventana como administrador.
    >> "%TF_INSTALL_LOG%" echo ERROR: No fue posible abrir una ventana elevada.
    echo Puedes hacer clic derecho sobre INSTALAR_DEPENDENCIAS_TIMEFLOW.bat y elegir Ejecutar como administrador.
    pause
    endlocal & exit /b 1
)
rem 20 significa delegado: el resultado real solo se vera en la segunda ventana.
>> "%TF_INSTALL_LOG%" echo Ventana de administrador solicitada correctamente.
endlocal & exit /b 20

:after_elevation
set "LIBERICA_VERSION=21.0.13.0.2+5"
set "LIBERICA_ZIP=bellsoft-jdk21.0.13.0.2+5-windows-amd64.zip"
set "LIBERICA_URL=https://download.bell-sw.com/java/21.0.13.0.2+5/bellsoft-jdk21.0.13.0.2+5-windows-amd64.zip"
set "NODE_VERSION=24.19.0"
set "NODE_ZIP=node-v24.19.0-win-x64.zip"
set "NODE_URL=https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-x64.zip"
set "NODE_ZIP_SHA256=57f71ab3652e797d84acddc79c81cc9ff1c6ddb2a1974cdb83f00fee9bff4c73"
set "MYSQL_VERSION=8.4.13"
set "MYSQL_MSI=mysql-8.4.13-winx64.msi"
set "MYSQL_URL=https://dev.mysql.com/get/Downloads/MySQL-8.4/mysql-8.4.13-winx64.msi"
set "MYSQL_MD5=ff44ed8af9f45aca5ece06bb0db5e5db"
set "VCREDIST_URL=https://aka.ms/vs/17/release/vc_redist.x64.exe"
set "TF_TOOLS=%~dp0.timeflow-tools"
set "TF_DOWNLOAD_DIR=%TF_TOOLS%\downloads"
set "TF_JDK_DIR=%TF_TOOLS%\liberica-jdk21"
set "TF_NODE_DIR=%TF_TOOLS%\nodejs"

set "ST_JAVA=NO COMPROBADO"
set "ST_NODE=NO COMPROBADO"
set "ST_VC=NO COMPROBADO"
set "ST_MYSQL=NO COMPROBADO"
set "ST_MYSQL_SERVER=NO COMPROBADO"
set "ST_PATH=NO COMPROBADO"
set "ST_CONFIG=NO COMPROBADO"
set "ST_DB=NO COMPROBADO"
set "ST_MAVEN=NO COMPROBADO"
set "ST_FRONTEND=NO COMPROBADO"
set "FAILED=0"
>> "%TF_INSTALL_LOG%" echo Inicio de comprobaciones con administrador - %DATE% %TIME%

if not exist "%TF_DOWNLOAD_DIR%" mkdir "%TF_DOWNLOAD_DIR%" >nul 2>&1

echo ============================================================
echo     TimeFlow V0.5.0 - INSTALADOR COMPLETO PARA WINDOWS
echo ============================================================
echo Instala/verifica: Java 21 seguro, Node.js/npm, Visual C++,
echo MySQL, Maven/Spring Boot y paquetes React/Vite.
echo.

call :java
call :node
call :vcredist
call :mysql
call :paths
call :config
call :database
call :maven
call :frontend

goto :summary

:java
call :section "1/9 - JDK 21 seguro"
>> "%TF_INSTALL_LOG%" echo Comprobando Java 21 mediante _verificar_java21.ps1...
call "%~dp0usar_java21_seguro.bat" >> "%TF_INSTALL_LOG%" 2>&1
set "TF_JAVA_RC=%ERRORLEVEL%"
>> "%TF_INSTALL_LOG%" echo Resultado de la comprobacion de Java: %TF_JAVA_RC%
if "%TF_JAVA_RC%"=="0" (
    set "ST_JAVA=YA ESTABA INSTALADO"
    call :green "JDK 21 seguro: ya estaba instalado."
    call :persist_timeflow_java
    exit /b 0
)
call :info "No se encontro un Java 21 con el parche requerido."
call :info "Descargando Liberica JDK %LIBERICA_VERSION% desde BellSoft..."
if exist "%TF_JDK_DIR%" rmdir /s /q "%TF_JDK_DIR%" >nul 2>&1
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; Invoke-WebRequest -Uri '%LIBERICA_URL%' -OutFile '%TF_DOWNLOAD_DIR%\%LIBERICA_ZIP%'"
if errorlevel 1 (
    set "ST_JAVA=ERROR AL DESCARGAR/INSTALAR"
    set "FAILED=1"
    call :red "No se pudo descargar Liberica JDK."
    exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $f=Get-Item '%TF_DOWNLOAD_DIR%\%LIBERICA_ZIP%'; if($f.Length -lt 50000000){throw 'Descarga incompleta'}; Add-Type -AssemblyName System.IO.Compression.FileSystem; $z=[IO.Compression.ZipFile]::OpenRead($f.FullName); try{if($z.Entries.Count -lt 100){throw 'ZIP invalido'}}finally{$z.Dispose()}; Expand-Archive -LiteralPath $f.FullName -DestinationPath '%TF_JDK_DIR%' -Force"
if errorlevel 1 (
    set "ST_JAVA=ERROR AL EXTRAER"
    set "FAILED=1"
    call :red "No se pudo validar o extraer el JDK."
    exit /b 1
)
call usar_java21_seguro.bat >nul 2>&1
if errorlevel 1 (
    set "ST_JAVA=VERSION NO VALIDA"
    set "FAILED=1"
    call :red "El JDK descargado no paso la comprobacion de version."
    exit /b 1
)
set "ST_JAVA=INSTALADO CORRECTAMENTE"
call :persist_timeflow_java
call :green "Liberica JDK %LIBERICA_VERSION% instalado para TimeFlow."
exit /b 0

:persist_timeflow_java
powershell -NoProfile -ExecutionPolicy Bypass -Command "[Environment]::SetEnvironmentVariable('TIMEFLOW_JAVA_HOME',$env:JAVA_HOME,'User')" >nul 2>&1
exit /b 0


:node
call :section "2/9 - Node.js y npm"
call "..\frontend\usar_node.bat" >nul 2>&1
if not errorlevel 1 (
    set "ST_NODE=YA ESTABA INSTALADO"
    call :green "Node.js y npm verificados; no se reinstalaran."
    call :persist_node
    exit /b 0
)
call :info "No se detecto Node.js/npm funcionales. Se preparara Node LTS local sin MSI."
call :info "Tu instalacion global de Node no se desinstalara ni modificara."
>> "%TF_INSTALL_LOG%" echo Instalando Node portatil en %TF_NODE_DIR%
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%TF_DOWNLOAD_DIR%\%NODE_ZIP%'; $f=Get-Item -LiteralPath '%TF_DOWNLOAD_DIR%\%NODE_ZIP%'; if($f.Length -lt 20000000){throw 'ZIP Node incompleto'}; $sha=(Get-FileHash -LiteralPath $f.FullName -Algorithm SHA256).Hash.ToLowerInvariant(); if($sha -ne '%NODE_ZIP_SHA256%'){throw 'SHA256 del ZIP Node distinto al publicado por Node.js'}; Expand-Archive -LiteralPath $f.FullName -DestinationPath '%TF_NODE_DIR%' -Force" >> "%TF_INSTALL_LOG%" 2>&1
if errorlevel 1 (
    set "ST_NODE=ERROR DE DESCARGA O INTEGRIDAD"
    set "FAILED=1"
    call :red "No se pudo descargar/verificar el paquete ZIP oficial de Node.js."
    call :info "Revisa INSTALADOR_DIAGNOSTICO.txt para ver la causa."
    exit /b 1
)
call "..\frontend\usar_node.bat" >nul 2>&1
if errorlevel 1 (
    set "ST_NODE=EXTRAIDO PERO NO FUNCIONA"
    set "FAILED=1"
    call :red "No fue posible verificar Node y npm tras la extraccion."
    call :info "Diagnostico de Node.js (ultimas lineas):"
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Get-Content -LiteralPath $env:TF_INSTALL_LOG | Where-Object { $_ -like 'NODE:*' } | Select-Object -Last 8"
    call :info "Detalle completo en backend\INSTALADOR_DIAGNOSTICO.txt."
    exit /b 1
)
set "ST_NODE=INSTALADO CORRECTAMENTE"
call :persist_node
call :green "Node.js y npm locales: comprobados y listos para Vite."
exit /b 0

:persist_node
rem No alterar el PATH permanente del usuario; los BAT prefijan NODE_HOME en su propia sesion.
powershell -NoProfile -ExecutionPolicy Bypass -Command "[Environment]::SetEnvironmentVariable('TIMEFLOW_NODE_HOME',$env:NODE_HOME,'User')" >nul 2>&1
exit /b 0

:vcredist
call :section "3/9 - Microsoft Visual C++ Runtime"
if exist "%SystemRoot%\System32\vcruntime140.dll" (
    set "ST_VC=YA ESTABA INSTALADO"
    call :green "Visual C++ Runtime: ya estaba instalado."
    exit /b 0
)
call :info "Instalando Microsoft Visual C++ Redistributable x64..."
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; Invoke-WebRequest -Uri '%VCREDIST_URL%' -OutFile '%TF_DOWNLOAD_DIR%\vc_redist.x64.exe'"
if errorlevel 1 (
    set "ST_VC=ERROR AL DESCARGAR"
    set "FAILED=1"
    call :red "No se pudo descargar Visual C++ Redistributable."
    exit /b 1
)
"%TF_DOWNLOAD_DIR%\vc_redist.x64.exe" /install /quiet /norestart
if errorlevel 1 (
    set "ST_VC=ERROR AL INSTALAR"
    set "FAILED=1"
    call :red "No se pudo instalar Visual C++ Redistributable."
    exit /b 1
)
set "ST_VC=INSTALADO CORRECTAMENTE"
call :green "Visual C++ Runtime instalado correctamente."
exit /b 0

:mysql
call :section "4/9 - MySQL Server"
call usar_mysql.bat >nul 2>&1
if not errorlevel 1 goto :mysql_existing
call :info "MySQL no esta instalado. Descargando MySQL %MYSQL_VERSION% LTS oficial..."
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; Invoke-WebRequest -Uri '%MYSQL_URL%' -OutFile '%TF_DOWNLOAD_DIR%\%MYSQL_MSI%'; $h=(Get-FileHash -LiteralPath '%TF_DOWNLOAD_DIR%\%MYSQL_MSI%' -Algorithm MD5).Hash.ToLower(); if($h -ne '%MYSQL_MD5%'){throw ('MD5 inesperado: '+$h)}"
if errorlevel 1 (
    set "ST_MYSQL=ERROR DE DESCARGA/INTEGRIDAD"
    set "FAILED=1"
    call :red "No se pudo descargar MySQL 8.4.13 o fallo su verificacion MD5."
    exit /b 1
)
call :info "Instalando MySQL %MYSQL_VERSION%..."
msiexec /i "%TF_DOWNLOAD_DIR%\%MYSQL_MSI%" /qn /norestart /L*v "%TF_DOWNLOAD_DIR%\mysql-install.log"
if errorlevel 1 (
    set "ST_MYSQL=ERROR AL INSTALAR"
    set "FAILED=1"
    call :red "MySQL no se pudo instalar. Revisa mysql-install.log."
    exit /b 1
)
call usar_mysql.bat >nul 2>&1
if errorlevel 1 (
    set "ST_MYSQL=INSTALADO PERO NO DETECTADO"
    set "FAILED=1"
    call :red "MySQL se instalo, pero mysql.exe no fue detectado."
    exit /b 1
)
call :persist_mysql
call :info "Configuracion inicial de MySQL. La contrasena no se mostrara."
for /f "delims=" %%P in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "$s=Read-Host 'Contrasena nueva para root de MySQL' -AsSecureString; $b=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($s); try{[Runtime.InteropServices.Marshal]::PtrToStringBSTR($b)}finally{[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($b)}"') do set "TIMEFLOW_DB_PASSWORD_SETUP=%%P"
if not defined TIMEFLOW_DB_PASSWORD_SETUP (
    set "ST_MYSQL=INSTALADO SIN CONFIGURAR"
    set "FAILED=1"
    call :red "No se ingreso una contrasena para configurar MySQL."
    exit /b 1
)
if not exist "%MYSQL_BIN%\mysql_configurator.exe" (
    set "ST_MYSQL=INSTALADO SIN CONFIGURADOR"
    set "FAILED=1"
    call :red "No se encontro mysql_configurator.exe."
    exit /b 1
)
set "MYSQL_PWD=%TIMEFLOW_DB_PASSWORD_SETUP%"
"%MYSQL_BIN%\mysql_configurator.exe" --console --action=configure --port=3306 --configure-as-service=true --windows-service-name=MySQL84 --windows-service-auto-start=true
set "MYSQL_CONFIG_RC=%ERRORLEVEL%"
set "MYSQL_PWD="
if not "%MYSQL_CONFIG_RC%"=="0" (
    set "ST_MYSQL=INSTALADO, CONFIGURACION FALLIDA"
    set "FAILED=1"
    call :red "MySQL se instalo, pero su configuracion inicial fallo."
    exit /b 1
)
set "ST_MYSQL=INSTALADO CORRECTAMENTE"
call :green "MySQL %MYSQL_VERSION% instalado. La conexion real se comprobara en 6/9 y 7/9."
exit /b 0


:mysql_existing
set "MYSQL_FOUND_VERSION="
for /f "usebackq delims=" %%V in (`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0_verificar_mysql.ps1" -MySqlExe "%MYSQL_EXE%"`) do set "MYSQL_FOUND_VERSION=%%V"
if not defined MYSQL_FOUND_VERSION (
    set "ST_MYSQL=VERSION DEL CLIENTE NO IDENTIFICADA"
    set "FAILED=1"
    call :red "MySQL encontrado, pero no se pudo identificar la version del cliente."
    exit /b 1
)
set "ST_MYSQL=CLIENTE DETECTADO"
call :persist_mysql
call :green "Cliente MySQL %MYSQL_FOUND_VERSION% encontrado."
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0_verificar_mysql.ps1" -MySqlExe "%MYSQL_EXE%" -ComprobarSeguridad >nul
if errorlevel 1 call :info "El cliente MySQL tambien requiere revision/actualizacion; sin cambios automaticos."
call :info "La version de seguridad del SERVIDOR se verificara con credenciales."
exit /b 0

:persist_mysql
powershell -NoProfile -ExecutionPolicy Bypass -Command "[Environment]::SetEnvironmentVariable('TIMEFLOW_MYSQL_BIN',$env:MYSQL_BIN,'User'); $p=[Environment]::GetEnvironmentVariable('Path','User'); if($null -eq $p){$p=''}; if(-not (($p -split ';') -contains $env:MYSQL_BIN)){[Environment]::SetEnvironmentVariable('Path',(($p.TrimEnd(';')+';'+$env:MYSQL_BIN).Trim(';')),'User')}" >nul 2>&1
exit /b 0

:paths
call :section "5/9 - Variables de entorno y PATH"
set "PATH_FAIL=0"
call usar_java21_seguro.bat >nul 2>&1
if errorlevel 1 (
    set "PATH_FAIL=1"
    call :red "No se pudo localizar JDK 21 para TimeFlow."
)
call "..\frontend\usar_node.bat" >nul 2>&1
if errorlevel 1 (
    set "PATH_FAIL=1"
    call :red "No se pudo localizar Node.js/npm compatibles."
)
call usar_mysql.bat >nul 2>&1
if errorlevel 1 (
    set "PATH_FAIL=1"
    call :red "No se pudo localizar el cliente MySQL."
)
if not "%PATH_FAIL%"=="0" (
    set "ST_PATH=ERROR DE CONFIGURACION"
    set "FAILED=1"
    call :red "No se pudieron preparar todas las rutas requeridas."
    >> "%TF_INSTALL_LOG%" echo ERROR: Faltan rutas requeridas.
    exit /b 1
)
set "ST_PATH=CONFIGURADO CORRECTAMENTE"
call :green "Rutas detectadas para esta sesion."
call :info "Java 17 global no se ha reemplazado por Java 21."
exit /b 0

:config
call :section "6/9 - Configuracion local"
if exist "config_local.bat" (
    set "ST_CONFIG=YA ESTABA CONFIGURADO"
    call :green "config_local.bat ya existe; no se modificaron tus secretos."
    exit /b 0
)
if not "%FAILED%"=="0" (
    set "ST_CONFIG=POSPUESTA POR ERRORES"
    call :info "Se pospone pedir contrasenas mientras falten dependencias."
    exit /b 1
)
set "TIMEFLOW_INSTALLER_MODE=1"
call configurar_entorno_local.bat
set "RC=%ERRORLEVEL%"
set "TIMEFLOW_INSTALLER_MODE="
if not "%RC%"=="0" (
    set "ST_CONFIG=ERROR AL CONFIGURAR"
    set "FAILED=1"
    call :red "No se pudo crear config_local.bat."
    exit /b 1
)
set "ST_CONFIG=CONFIGURADO CORRECTAMENTE"
call :green "Configuracion local segura creada."
exit /b 0


:database
call :section "7/9 - Base de datos TimeFlow"
if not exist "config_local.bat" (
    set "ST_DB=POSPUESTA: FALTA CONFIGURACION"
    set "FAILED=1"
    call :info "Base de datos pospuesta: no existe config_local.bat."
    exit /b 1
)
call usar_mysql.bat >nul 2>&1
if errorlevel 1 (
    set "ST_MYSQL_SERVER=NO VERIFICADO"
    set "ST_DB=NO EJECUTADO: FALTA CLIENTE"
    set "FAILED=1"
    exit /b 1
)
call config_local.bat
set "MYSQL_PWD=%DB_PASSWORD%"
set "MYSQL_SERVER_VERSION="
for /f "usebackq delims=" %%V in (`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0_verificar_mysql.ps1" -MySqlExe "%MYSQL_EXE%" -Servidor`) do set "MYSQL_SERVER_VERSION=%%V"
if not defined MYSQL_SERVER_VERSION (
    set "MYSQL_PWD="
    set "ST_MYSQL_SERVER=NO SE PUDO COMPROBAR"
    set "ST_DB=NO EJECUTADA: SERVIDOR SIN VERIFICAR"
    set "FAILED=1"
    call :red "No se pudo consultar la version de MySQL Server. Comprueba servicio y credenciales."
    exit /b 1
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0_verificar_mysql.ps1" -MySqlExe "%MYSQL_EXE%" -Servidor -ComprobarSeguridad >nul
set "SERVER_SECURITY_RC=%ERRORLEVEL%"
set "MYSQL_PWD="
if "%SERVER_SECURITY_RC%"=="2" (
    set "ST_MYSQL_SERVER=ACTUALIZACION DE SEGURIDAD NECESARIA"
    set "ST_DB=BLOQUEADA POR VERSION DEL SERVIDOR"
    set "FAILED=1"
    call :red "MySQL Server %MYSQL_SERVER_VERSION% necesita parche de seguridad (8.4.13 o posterior en rama 8.4)."
    call :info "Por seguridad no se ejecutara ningun SQL ni se modificaran tus datos."
    call :info "Haz respaldo y actualiza MySQL con el procedimiento oficial de Oracle."
    >> "%TF_INSTALL_LOG%" echo MySQL SERVER %MYSQL_SERVER_VERSION% requiere actualizacion. No se modifico la BD.
    exit /b 1
)
if not "%SERVER_SECURITY_RC%"=="0" (
    set "ST_MYSQL_SERVER=VERSION NO VERIFICABLE"
    set "ST_DB=NO EJECUTADA: ERROR DE VERIFICACION"
    set "FAILED=1"
    call :red "No se pudo confirmar la seguridad de MySQL Server; sin cambios en la BD."
    exit /b 1
)
set "ST_MYSQL_SERVER=VERIFICADO CORRECTAMENTE"
call :green "MySQL Server %MYSQL_SERVER_VERSION%: version comprobada."
set "TIMEFLOW_INSTALLER_MODE=1"
call crear_base_datos.bat
set "RC=%ERRORLEVEL%"
set "TIMEFLOW_INSTALLER_MODE="
if not "%RC%"=="0" (
    set "ST_DB=ERROR DE CONEXION/CREACION"
    set "FAILED=1"
    call :red "No se pudo conectar o preparar teamflow_db."
    exit /b 1
)
set "ST_DB=CONFIGURADA CORRECTAMENTE"
call :green "teamflow_db creada/actualizada correctamente."
exit /b 0

:maven
call :section "8/9 - Maven y dependencias Spring Boot"
call usar_java21_seguro.bat >nul 2>&1
if errorlevel 1 (
    set "ST_MAVEN=NO EJECUTADO: FALTA JAVA"
    set "FAILED=1"
    exit /b 1
)
call mvnw.cmd -q -o -DskipTests dependency:go-offline >nul 2>&1
if not errorlevel 1 (
    set "ST_MAVEN=YA ESTABAN INSTALADAS"
    call :green "Dependencias Maven: ya estaban disponibles en cache."
    exit /b 0
)
call :info "Descargando dependencias Maven..."
call mvnw.cmd -q -DskipTests dependency:go-offline
if errorlevel 1 (
    set "ST_MAVEN=ERROR AL DESCARGAR"
    set "FAILED=1"
    call :red "Maven no pudo resolver las dependencias Spring Boot."
    exit /b 1
)
set "ST_MAVEN=INSTALADAS CORRECTAMENTE"
call :green "Dependencias Maven instaladas correctamente."
exit /b 0

:frontend
call :section "9/9 - Dependencias React/Vite"
call "..\frontend\usar_node.bat" >nul 2>&1
if errorlevel 1 (
    set "ST_FRONTEND=NO EJECUTADO: FALTA NODE"
    set "FAILED=1"
    exit /b 1
)
pushd "..\frontend"
call npm ls --depth=0 >nul 2>&1
if errorlevel 1 (
    call :info "Instalando paquetes del frontend con npm ci..."
    call npm ci
    if errorlevel 1 (
        popd
        set "ST_FRONTEND=ERROR AL INSTALAR"
        set "FAILED=1"
        call :red "npm ci fallo. Comprueba la conexion a npm y package-lock.json."
        exit /b 1
    )
) else (
    call :green "Dependencias React/Vite disponibles."
)
call :info "Comprobando vulnerabilidades altas o criticas con npm audit..."
call npm audit --audit-level=high
if errorlevel 1 (
    popd
    set "ST_FRONTEND=AVISO: AUDITORIA NPM FALLO"
    set "FAILED=1"
    call :red "npm audit encontro riesgos o no pudo consultar el registro."
    call :info "Ejecuta npm audit desde frontend para identificar el motivo."
    exit /b 1
)
call :info "Compilando frontend para verificar las dependencias..."
call npm run build
if errorlevel 1 (
    popd
    set "ST_FRONTEND=ERROR EN COMPILACION"
    set "FAILED=1"
    call :red "El frontend no compilo. Revisa el error de Vite."
    exit /b 1
)
popd
set "ST_FRONTEND=INSTALADAS Y VERIFICADAS"
call :green "React/Vite: npm audit sin alertas altas y compilacion correcta."
exit /b 0

:summary
echo.
echo ============================================================
echo                    RESUMEN FINAL
echo ============================================================
call :status "JDK 21 seguro" "%ST_JAVA%"
call :status "Node.js / npm" "%ST_NODE%"
call :status "Visual C++ Runtime" "%ST_VC%"
call :status "Cliente MySQL" "%ST_MYSQL%"
call :status "MySQL Server" "%ST_MYSQL_SERVER%"
call :status "Variables PATH" "%ST_PATH%"
call :status "Configuracion local" "%ST_CONFIG%"
call :status "Base de datos" "%ST_DB%"
call :status "Dependencias Maven" "%ST_MAVEN%"
call :status "Dependencias React/Vite" "%ST_FRONTEND%"
echo ============================================================
if "%FAILED%"=="0" (
    call :green "TODO LISTO. TimeFlow tiene las dependencias necesarias."
    > "%~dp0.timeflow-deps-ok" echo TimeFlow V0.5.0 dependencies verified %DATE% %TIME%
) else (
    call :red "INSTALACION INCOMPLETA. Revisa los elementos rojos de arriba."
    if exist "%~dp0.timeflow-deps-ok" del /q "%~dp0.timeflow-deps-ok" >nul 2>&1
)
echo.
>> "%TF_INSTALL_LOG%" echo Finalizado - %DATE% %TIME% - FAILED=%FAILED%
> "%~dp0.timeflow-installer-completed" echo finalizado %DATE% %TIME% con FAILED=%FAILED%
echo Registro de diagnostico: "%TF_INSTALL_LOG%"
echo.
pause
if "%FAILED%"=="0" (endlocal & exit /b 0) else (endlocal & exit /b 1)

:section
echo.
>> "%TF_INSTALL_LOG%" echo [%DATE% %TIME%] %~1
powershell -NoProfile -Command "Write-Host '--- %~1 ---' -ForegroundColor Cyan"
exit /b 0
:green
powershell -NoProfile -Command "Write-Host '[OK] %~1' -ForegroundColor Green"
exit /b 0
:red
powershell -NoProfile -Command "Write-Host '[ERROR] %~1' -ForegroundColor Red"
exit /b 0
:info
powershell -NoProfile -Command "Write-Host '[INFO] %~1' -ForegroundColor Gray"
exit /b 0
:status
set "S=%~2"
echo %S% | findstr /i "CORRECT YA ESTABA CONFIGURAD PRESENTE DETECTADO INSTALADAS" >nul
if errorlevel 1 (
  powershell -NoProfile -Command "Write-Host ('{0,-28} {1}' -f '%~1','%~2') -ForegroundColor Red"
) else (
  powershell -NoProfile -Command "Write-Host ('{0,-28} {1}' -f '%~1','%~2') -ForegroundColor Green"
)
exit /b 0
