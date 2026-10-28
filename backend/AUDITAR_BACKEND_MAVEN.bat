@echo off
setlocal EnableExtensions DisableDelayedExpansion
title TimeFlow V0.5.0 - Auditoria Maven NVD
cd /d "%~dp0"
if errorlevel 1 goto :dir_error

echo ============================================================
echo       TIMEFLOW V0.5.0 - AUDITORIA MAVEN / NVD
echo ============================================================
echo.
if not exist "pom.xml" goto :missing_pom
if not exist "mvnw.cmd" goto :missing_mvnw
if not exist "usar_java21_seguro.bat" goto :missing_java
if not exist "%~dp0_EJECUTAR_OWASP_NVD.ps1" goto :missing_ps

echo [1/3] Activando Java 21 local...
call "%~dp0usar_java21_seguro.bat"
if errorlevel 1 goto :java_error
java -version
if errorlevel 1 goto :java_error

set "REPORTDIR=%CD%\target\auditoria_backend_sprint4"
if not exist "%REPORTDIR%" mkdir "%REPORTDIR%"
if not exist "%REPORTDIR%" goto :directory_error

echo.
echo [2/3] Generando arbol de dependencias Maven...
call "%~dp0mvnw.cmd" -ntp org.apache.maven.plugins:maven-dependency-plugin:3.11.0:tree "-DoutputType=text" "-DoutputFile=%REPORTDIR%\arbol_dependencias.txt"
if errorlevel 1 (
    echo [ADVERTENCIA] No se pudo generar el arbol de dependencias.
) else (
    echo [OK] Arbol de dependencias actualizado.
)

echo.
echo [3/3] Ejecutando OWASP Dependency-Check 13.0.0...
echo [INFO] No se pediran rutas. El script las detecta automaticamente.
if /I "%~1"=="/cache" (
  echo [INFO] Se utilizaran datos NVD ya descargados, sin solicitar clave.
) else (
  echo [INFO] Se pedira la API key NVD sin mostrarla.
)
echo [INFO] La auditoria no modifica MySQL ni pom.xml.
echo.
if /I "%~1"=="/cache" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0_EJECUTAR_OWASP_NVD.ps1" -ReuseLocalNvd
) else (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0_EJECUTAR_OWASP_NVD.ps1"
)
set "SCAN_RC=%errorlevel%"

echo.
echo ============================================================
echo                       RESULTADOS
echo ============================================================
if exist "%REPORTDIR%\dependency-check-report.html" (
    echo [OK] Informe HTML:
    echo "%REPORTDIR%\dependency-check-report.html"
) else (
    echo [ADVERTENCIA] No se genero un informe HTML nuevo.
)
if exist "%REPORTDIR%\dependency-check-report.json" (
    echo [OK] Informe JSON:
    echo "%REPORTDIR%\dependency-check-report.json"
) else (
    echo [ADVERTENCIA] No se genero un informe JSON nuevo.
)
if "%SCAN_RC%"=="0" (
    if exist "%REPORTDIR%\dependency-check-report.html" (
        if exist "%REPORTDIR%\dependency-check-report.json" (
            echo [OK] Analisis completo: no se detectaron alertas CVSS 7 o mayores.
            echo [INFO] Revisa los informes para vulnerabilidades inferiores o falsos positivos.
        ) else (
            echo [ERROR] Falta el JSON. Auditoria incompleta.
            set "SCAN_RC=1"
        )
    ) else (
        echo [ERROR] Falta el HTML. Auditoria incompleta.
        set "SCAN_RC=1"
    )
) else (
    echo [ATENCION] OWASP devolvio codigo %SCAN_RC%.
    if exist "%REPORTDIR%\dependency-check-report.json" (
        echo [INFO] Se genero JSON: revisalo por hallazgos CVSS 7 o mayores.
        echo [INFO] Un fallo de build tambien puede significar vulnerabilidades, no error del auditor.
    ) else (
        echo [ERROR] No se genero JSON. Revisa los mensajes anteriores.
    )
)
echo.
echo Nunca compartas tu clave NVD ni contrasenas.
pause
exit /b %SCAN_RC%

:dir_error
echo [ERROR] No se pudo acceder al directorio de backend.
goto :failed
:missing_pom
echo [ERROR] Ejecuta el BAT desde la carpeta backend que contiene pom.xml.
goto :failed
:missing_mvnw
echo [ERROR] Falta mvnw.cmd en backend.
goto :failed
:missing_java
echo [ERROR] Falta usar_java21_seguro.bat.
goto :failed
:missing_ps
echo [ERROR] Falta _EJECUTAR_OWASP_NVD.ps1 junto al BAT.
goto :failed
:java_error
echo [ERROR] No se pudo preparar Java 21.
goto :failed
:directory_error
echo [ERROR] No se pudo crear la carpeta de informes.
goto :failed
:failed
pause
exit /b 1
