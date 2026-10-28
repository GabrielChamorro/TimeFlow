@echo off
setlocal EnableExtensions
set "TF_MYSQL_EXE="
set "TF_MYSQL_BIN="

if defined TIMEFLOW_MYSQL_BIN if exist "%TIMEFLOW_MYSQL_BIN%\mysql.exe" (
  set "TF_MYSQL_BIN=%TIMEFLOW_MYSQL_BIN%"
  set "TF_MYSQL_EXE=%TIMEFLOW_MYSQL_BIN%\mysql.exe"
  goto :found
)
for /f "delims=" %%M in ('where mysql 2^>nul') do (
  if not defined TF_MYSQL_EXE (
    set "TF_MYSQL_EXE=%%~fM"
    for %%D in ("%%~dpM.") do set "TF_MYSQL_BIN=%%~fD"
  )
)
if defined TF_MYSQL_EXE goto :found
for /d %%D in ("C:\Program Files\MySQL\MySQL Server *") do (
  if exist "%%~D\bin\mysql.exe" (
    set "TF_MYSQL_BIN=%%~D\bin"
    set "TF_MYSQL_EXE=%%~D\bin\mysql.exe"
  )
)
if defined TF_MYSQL_EXE goto :found

echo [ERROR] No se encontro mysql.exe.
endlocal & exit /b 1

:found
endlocal & set "MYSQL_BIN=%TF_MYSQL_BIN%" & set "MYSQL_EXE=%TF_MYSQL_EXE%" & set "PATH=%TF_MYSQL_BIN%;%PATH%" & exit /b 0
