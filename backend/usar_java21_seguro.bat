@echo off
setlocal EnableExtensions DisableDelayedExpansion
rem Busca exclusivamente JDK 21 >= 21.0.13.0.2 para TimeFlow.
rem Java 17 del sistema no se modifica.
set "TF_JAVA_HOME="

if defined TIMEFLOW_JAVA_HOME if exist "%TIMEFLOW_JAVA_HOME%\bin\java.exe" (
  call :check_java "%TIMEFLOW_JAVA_HOME%"
  if defined TF_JAVA_HOME goto :found
)

if exist "%~dp0.timeflow-tools\liberica-jdk21\bin\java.exe" (
  call :check_java "%~dp0.timeflow-tools\liberica-jdk21"
  if defined TF_JAVA_HOME goto :found
)
for /d %%J in ("%~dp0.timeflow-tools\liberica-jdk21\*") do (
  if exist "%%~J\bin\java.exe" call :check_java "%%~J"
  if defined TF_JAVA_HOME goto :found
)
for /d %%J in ("C:\Program Files\BellSoft\LibericaJDK-21*") do (
  if exist "%%~J\bin\java.exe" call :check_java "%%~J"
  if defined TF_JAVA_HOME goto :found
)
for /d %%J in ("C:\Program Files\BellSoft\jdk-21*") do (
  if exist "%%~J\bin\java.exe" call :check_java "%%~J"
  if defined TF_JAVA_HOME goto :found
)
for %%J in (
  "C:\Program Files\Java\latest\jdk-21"
  "C:\Program Files\Java\jdk-21.0.13.0.2"
) do (
  if exist "%%~J\bin\java.exe" call :check_java "%%~J"
  if defined TF_JAVA_HOME goto :found
)
for /d %%J in ("C:\Program Files\Java\jdk-21*") do (
  if exist "%%~J\bin\java.exe" call :check_java "%%~J"
  if defined TF_JAVA_HOME goto :found
)
for /d %%J in ("C:\Program Files\Eclipse Adoptium\jdk-21*") do (
  if exist "%%~J\bin\java.exe" call :check_java "%%~J"
  if defined TF_JAVA_HOME goto :found
)
for /d %%J in ("C:\Program Files\Microsoft\jdk-21*") do (
  if exist "%%~J\bin\java.exe" call :check_java "%%~J"
  if defined TF_JAVA_HOME goto :found
)
echo [ERROR] No se encontro un JDK 21 que cumpla la version minima.
endlocal & exit /b 1

:found
endlocal & set "JAVA_HOME=%TF_JAVA_HOME%" & set "PATH=%TF_JAVA_HOME%\bin;%PATH%" & exit /b 0

:check_java
set "CANDIDATE=%~1"
if not exist "%CANDIDATE%\bin\javac.exe" exit /b 1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0_verificar_java21.ps1" -JavaExe "%CANDIDATE%\bin\java.exe" >nul 2>&1
if not errorlevel 1 set "TF_JAVA_HOME=%CANDIDATE%"
exit /b 0
