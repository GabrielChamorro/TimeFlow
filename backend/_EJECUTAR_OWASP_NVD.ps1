# Reutiliza los datos NVD descargados en una auditoria anterior si se usa -ReuseLocalNvd.
# En ejecucion normal solicita clave NVD. No modifica codigo ni bases de datos.
param([switch]$ReuseLocalNvd)
# Este archivo detecta automaticamente backend y la carpeta de informes.
# Solo acepta el modificador opcional -ReuseLocalNvd; no recibe rutas externas.
$ErrorActionPreference = 'Stop'
$scanExitCode = 2
$apiKeySecure = $null
$apiKeyPlain = $null
$backendDir = $PSScriptRoot
$reportDir = Join-Path (Join-Path $backendDir 'target') 'auditoria_backend_sprint4'
$mavenWrapper = Join-Path $backendDir 'mvnw.cmd'

try {
    if (-not (Test-Path -LiteralPath $mavenWrapper -PathType Leaf)) {
        throw 'No existe mvnw.cmd en backend'
    }
    if (-not (Test-Path -LiteralPath (Join-Path $backendDir 'pom.xml') -PathType Leaf)) {
        throw 'No existe pom.xml en backend'
    }
    if (-not (Test-Path -LiteralPath $reportDir -PathType Container)) {
        New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
    }
    Write-Host '[INFO] Carpeta de informes detectada automaticamente.'
    Write-Host '[INFO] Los datos de la clave NVD no se mostraran ni se guardaran en archivos.'
    if (-not $ReuseLocalNvd) {
        $apiKeySecure = Read-Host 'Introduce tu clave NVD' -AsSecureString
        $apiKeyPlain = ([System.Net.NetworkCredential]::new('nvd', $apiKeySecure)).Password
        if ([string]::IsNullOrWhiteSpace($apiKeyPlain)) {
            throw 'La clave NVD esta vacia'
        }
    } else {
        Write-Host '[INFO] Usando datos NVD de la cache local; no solicita clave.'
        Write-Host '[INFO] No se descargaran actualizaciones en esta ejecucion.'
    }

    # Evita reutilizar informes de ejecuciones anteriores por error.
    foreach ($fmt in @('html', 'json')) {
        $oldReport = Join-Path $reportDir ("dependency-check-report.$fmt")
        if (Test-Path -LiteralPath $oldReport -PathType Leaf) {
            Remove-Item -LiteralPath $oldReport -Force
        }
    }

    # Se pasa la clave por variable de entorno al subproceso, nunca como argumento.
    if (-not $ReuseLocalNvd) {
        $env:TF_NVD_API_KEY = $apiKeyPlain
        $apiKeyPlain = $null
        Write-Host '[INFO] Ejecutando analisis Maven con actualizaciones NVD habilitadas.'
    } else {
        Write-Host '[INFO] Regenerando informes desde los datos ya descargados.'
    }
    $arguments = @(
        '-ntp',
        'org.owasp:dependency-check-maven:13.0.0:check',
        '-Dformat=ALL',
        "-Dodc.outputDirectory=$reportDir",
        '-DfailBuildOnCVSS=7',
        '-DfailOnError=true'
    )
    if ($ReuseLocalNvd) {
        $arguments += '-DautoUpdate=false'
    } else {
        $arguments += '-DnvdApiKeyEnvironmentVariable=TF_NVD_API_KEY'
    }
    Push-Location -LiteralPath $backendDir
    try {
        & $mavenWrapper @arguments
        $scanExitCode = $LASTEXITCODE
        if ($null -eq $scanExitCode) { $scanExitCode = 2 }
        if ($scanExitCode -eq 0) {
            $html = Join-Path $reportDir 'dependency-check-report.html'
            $json = Join-Path $reportDir 'dependency-check-report.json'
            if (-not (Test-Path -LiteralPath $html -PathType Leaf) -or
                -not (Test-Path -LiteralPath $json -PathType Leaf)) {
                Write-Host '[ERROR] La herramienta no genero ambos informes (HTML y JSON).'
                $scanExitCode = 2
            }
        }
    }
    finally {
        Pop-Location
    }
}
catch {
    # Evitar emitir posibles secretos en mensajes y trazas.
    Write-Host ('[ERROR] No se pudo completar la auditoria (' + $_.Exception.GetType().Name + ').')
    $scanExitCode = 2
}
finally {
    Remove-Item Env:\TF_NVD_API_KEY -ErrorAction SilentlyContinue
    if ($null -ne $apiKeySecure) { $apiKeySecure.Dispose() }
    $apiKeyPlain = $null
}
exit $scanExitCode
