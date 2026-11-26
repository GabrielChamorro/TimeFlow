@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"
title TimeFlow V0.5.23 - Base de datos

if not exist "%~dp0config_local.bat" (
    echo [ERROR] Falta config_local.bat. Ejecuta el instalador completo.
    goto :error_fin
)
call "%~dp0config_local.bat"
call "%~dp0usar_mysql.bat" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Falta mysql.exe.
    goto :error_fin
)
if not defined DB_USER (
    echo [ERROR] DB_USER no esta configurado.
    goto :error_fin
)
if not defined DB_PASSWORD (
    echo [ERROR] DB_PASSWORD no esta configurado.
    goto :error_fin
)
if not exist "%~dp0interno\_comprobar_bd_v0523.ps1" (
    echo [ERROR] Falta _comprobar_bd_v0523.ps1.
    goto :error_fin
)

rem La contrasena ya se obtuvo de config_local.bat. Nunca se pasa como argumento
rem ni se escribe en la salida. Se elimina al finalizar este proceso.
set "MYSQL_PWD=%DB_PASSWORD%"
echo [INFO] Destino MySQL: 127.0.0.1:3306 / teamflow_db
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0interno\_comprobar_bd_v0523.ps1" -MySqlExe "%MYSQL_EXE%" -DbUser "%DB_USER%"
set "TF_SCHEMA_RC=%ERRORLEVEL%"
if "%TF_SCHEMA_RC%"=="0" goto :ya_actualizada
if "%TF_SCHEMA_RC%"=="10" goto :migrar_existente
if "%TF_SCHEMA_RC%"=="40" goto :instalacion_nueva
if "%TF_SCHEMA_RC%"=="20" (
    echo [ERROR] La base existe pero no corresponde a V0.5.19 o posterior.
    echo [INFO] No se modificaron datos. Requiere una revision de migracion anterior.
    goto :error_fin
)
echo [ERROR] No se pudo consultar el estado de teamflow_db.
echo [INFO] Verifica que MySQL este iniciado y que la cuenta tenga permisos.
goto :error_fin

:ya_actualizada
echo [OK] teamflow_db ya tiene las migraciones V0.5.21 y V0.5.22.
echo [INFO] No se repetiran migraciones ni respaldos innecesarios.
goto :verificar_usuarios

:migrar_existente
echo.
echo [INFO] Se detecto una base existente desde V0.5.19.
echo [INFO] Asegurate de que el backend anterior esta APAGADO.
echo [INFO] Se guardara un respaldo completo FUERA de la carpeta del proyecto.
choice /C SN /N /M "Confirmas que esta es tu base y el backend esta apagado? [S/N]: "
if errorlevel 2 (
    echo [INFO] Actualizacion cancelada. No se modifico la base.
    goto :error_fin
)
if not exist "%~dp0sql\migracion_v0_5_21_registros.sql" goto :faltan_sql
if not exist "%~dp0sql\migracion_v0_5_21_historial.sql" goto :faltan_sql
if not exist "%~dp0sql\migracion_v0_5_22_tiempos.sql" goto :faltan_sql
if not exist "%MYSQL_BIN%\mysqldump.exe" (
    echo [ERROR] Falta mysqldump.exe. No se aplica ninguna migracion.
    goto :error_fin
)
set "TF_BACKUP_DIR=%LOCALAPPDATA%\TimeFlow\Respaldos"
if not exist "%TF_BACKUP_DIR%" mkdir "%TF_BACKUP_DIR%" >nul 2>&1
if not exist "%TF_BACKUP_DIR%" (
    echo [ERROR] No se pudo crear la carpeta de respaldo.
    goto :error_fin
)
for /f "delims=" %%T in ('powershell.exe -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss-fff"') do set "TF_BACKUP_TIME=%%T"
if not defined TF_BACKUP_TIME goto :error_respaldo
set "TF_BACKUP_FILE=%TF_BACKUP_DIR%\teamflow_db_antes_v0523_%TF_BACKUP_TIME%.sql"
echo [INFO] Creando respaldo completo, sin modificar los datos...
"%MYSQL_BIN%\mysqldump.exe" --no-defaults --protocol=TCP --host=127.0.0.1 --port=3306 "--user=%DB_USER%" --default-character-set=utf8mb4 --single-transaction --quick --routines --triggers "--result-file=%TF_BACKUP_FILE%" teamflow_db
if errorlevel 1 goto :error_respaldo
if not exist "%TF_BACKUP_FILE%" goto :error_respaldo
for %%B in ("%TF_BACKUP_FILE%") do if %%~zB LSS 100 goto :error_respaldo
powershell.exe -NoProfile -Command "Write-Host ('[OK] Respaldo SHA-256: '+(Get-FileHash -LiteralPath $env:TF_BACKUP_FILE -Algorithm SHA256).Hash)"
if errorlevel 1 goto :error_respaldo
echo [OK] Respaldo guardado en: %TF_BACKUP_FILE%
echo [INFO] Aplicando solo las migraciones pendientes de esquema. Pueden repetirse sin borrar registros.
call :aplicar_sql "migracion_v0_5_21_registros.sql"
if errorlevel 1 goto :error_sql
call :aplicar_sql "migracion_v0_5_21_historial.sql"
if errorlevel 1 goto :error_sql
call :aplicar_sql "migracion_v0_5_22_tiempos.sql"
if errorlevel 1 goto :error_sql
goto :verificar_esquema

:instalacion_nueva
if not exist "%~dp0sql\esquema_timeflow.sql" goto :faltan_sql
echo [INFO] No existe teamflow_db. Se creara la estructura inicial.
"%MYSQL_EXE%" --no-defaults --protocol=TCP --host=127.0.0.1 --port=3306 "--user=%DB_USER%" --default-character-set=utf8mb4 --show-warnings < "%~dp0sql\esquema_timeflow.sql"
if errorlevel 1 goto :error_sql
goto :verificar_esquema

:aplicar_sql
echo [INFO] Ejecutando %~1
"%MYSQL_EXE%" --no-defaults --protocol=TCP --host=127.0.0.1 --port=3306 "--user=%DB_USER%" --default-character-set=utf8mb4 --database=teamflow_db --show-warnings < "%~dp0sql\%~1"
exit /b %ERRORLEVEL%

:verificar_esquema
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0interno\_comprobar_bd_v0523.ps1" -MySqlExe "%MYSQL_EXE%" -DbUser "%DB_USER%"
if errorlevel 1 (
    echo [ERROR] La verificacion posterior a la migracion fallo.
    echo [INFO] No inicies el backend hasta revisar la base y el respaldo.
    goto :error_fin
)

:verificar_usuarios
rem Se conserva la comprobacion historica de contrasenas BCrypt.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0interno\_estado_bd.ps1" -MySqlExe "%MYSQL_EXE%" -Modo UsuariosSinHash -DbUser "%DB_USER%"
set "TF_USERS_RC=%ERRORLEVEL%"
if "%TF_USERS_RC%"=="3" (
    echo [ERROR] Existen usuarios con contrasenas antiguas sin hash BCrypt.
    echo [INFO] No se borraron ni cambiaron sus contrasenas.
    goto :error_fin
)
if not "%TF_USERS_RC%"=="0" (
    echo [ERROR] No fue posible verificar los usuarios de MySQL.
    goto :error_fin
)
echo [OK] Base de datos de TimeFlow V0.5.23 preparada.
set "MYSQL_PWD="
if not defined TIMEFLOW_INSTALLER_MODE pause
endlocal & exit /b 0

:faltan_sql
echo [ERROR] Faltan archivos SQL. Extrae el ZIP completo antes de instalar.
goto :error_fin
:error_respaldo
echo [ERROR] El respaldo fallo. No se ejecutaron migraciones.
echo [INFO] Comprueba el disco, los permisos y mysqldump.exe.
goto :error_fin
:error_sql
echo [ERROR] MySQL fallo al aplicar el esquema o alguna migracion.
echo [INFO] No inicies el backend; revisa el error y conserva el respaldo.
echo [INFO] Los SQL son repetibles, pero no intentes restaurar sin revisar los datos.
goto :error_fin
:error_fin
set "MYSQL_PWD="
if not defined TIMEFLOW_INSTALLER_MODE pause
endlocal & exit /b 1
