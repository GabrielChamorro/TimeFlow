@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"
title TimeFlow V0.5.0 - Base de datos
if not exist "%~dp0config_local.bat" (
    echo [ERROR] Falta config_local.bat. Ejecuta configurar_entorno_local.bat.
    if not defined TIMEFLOW_INSTALLER_MODE pause
    endlocal & exit /b 1
)
call "%~dp0config_local.bat"
call "%~dp0usar_mysql.bat" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] No se encontro el cliente MySQL.
    if not defined TIMEFLOW_INSTALLER_MODE pause
    endlocal & exit /b 1
)
if not exist "%~dp0sql\esquema_timeflow.sql" (
    echo [ERROR] Falta sql\esquema_timeflow.sql.
    if not defined TIMEFLOW_INSTALLER_MODE pause
    endlocal & exit /b 1
)
set "MYSQL_PWD=%DB_PASSWORD%"
"%MYSQL_EXE%" -u "%DB_USER%" -h 127.0.0.1 -P 3306 -N -B -e "SELECT 1;" >nul 2>&1
if errorlevel 1 goto :error_conexion
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0_estado_bd.ps1" -MySqlExe "%MYSQL_EXE%" -Modo Existe
if "%ERRORLEVEL%"=="2" goto :error_conexion
if "%ERRORLEVEL%"=="0" (
    if not exist "%~dp0.timeflow-backups" mkdir "%~dp0.timeflow-backups"
    call :hacer_respaldo
    if errorlevel 1 goto :error_backup
)
echo [INFO] Actualizando esquema sin agregar datos de ejemplo ni eliminar registros...
"%MYSQL_EXE%" --default-character-set=utf8mb4 -u "%DB_USER%" -h 127.0.0.1 -P 3306 --show-warnings < "%~dp0sql\esquema_timeflow.sql"
if errorlevel 1 goto :error_sql
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0_estado_bd.ps1" -MySqlExe "%MYSQL_EXE%" -Modo UsuariosSinHash
if "%ERRORLEVEL%"=="3" goto :error_legado
if errorlevel 1 goto :error_verificacion
set "MYSQL_PWD="
echo [OK] Estructura de teamflow_db preparada.
if not defined TIMEFLOW_INSTALLER_MODE pause
endlocal & exit /b 0

:hacer_respaldo
if not exist "%MYSQL_BIN%\mysqldump.exe" exit /b 1
for /f "delims=" %%T in ('powershell.exe -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set "TF_BACKUP_TIME=%%T"
if not defined TF_BACKUP_TIME exit /b 1
set "TF_BACKUP_FILE=%~dp0.timeflow-backups\teamflow_db_%TF_BACKUP_TIME%.sql"
echo [INFO] Guardando respaldo de teamflow_db antes de modificar su estructura...
"%MYSQL_BIN%\mysqldump.exe" -u "%DB_USER%" -h 127.0.0.1 -P 3306 --single-transaction --quick --routines --triggers teamflow_db > "%TF_BACKUP_FILE%"
if errorlevel 1 exit /b 1
for %%B in ("%TF_BACKUP_FILE%") do if %%~zB LSS 100 exit /b 1
echo [OK] Copia de seguridad creada en backend\.timeflow-backups.
exit /b 0

:error_conexion
set "MYSQL_PWD="
echo [ERROR] MySQL no responde o rechazo las credenciales; no se modifico la BD.
goto :error_fin
:error_backup
set "MYSQL_PWD="
echo [ERROR] No fue posible respaldar la base existente. No se aplico ningun cambio.
echo Verifica que mysqldump.exe exista y que haya espacio en disco.
goto :error_fin
:error_verificacion
set "MYSQL_PWD="
echo [ERROR] No se pudo verificar el estado de las contrasenas antiguas.
echo [INFO] No se puede confirmar la instalacion; revisa MySQL y el respaldo.
goto :error_fin
:error_legado
set "MYSQL_PWD="
echo [ERROR] Hay usuarios antiguos sin password_hash BCrypt.
echo [INFO] Se conservaron los datos; necesitan migracion antes de iniciar TimeFlow.
echo [INFO] Revisa los respaldos de backend\.timeflow-backups y la guia V0.5.0.
goto :error_fin
:error_sql
set "MYSQL_PWD="
echo [ERROR] MySQL devolvio un error al actualizar el esquema. Revisa la salida superior.
:error_fin
if not defined TIMEFLOW_INSTALLER_MODE pause
endlocal & exit /b 1
