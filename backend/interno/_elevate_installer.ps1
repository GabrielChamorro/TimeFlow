# Lanzamiento elevado para TimeFlow. Compatible con Windows PowerShell 5.1.
# El cmd elevado puede iniciarse en C:\Windows\System32; nunca usamos rutas relativas.
param(
    [Parameter(Mandatory = $true)]
    [string] $InstallerPath
)

$ErrorActionPreference = 'Stop'
try {
    $fullPath = [System.IO.Path]::GetFullPath($InstallerPath)
    if (-not [System.IO.File]::Exists($fullPath)) {
        throw "No se encontro el instalador auxiliar: $fullPath"
    }

    $cmdPath = Join-Path $env:SystemRoot 'System32\cmd.exe'
    if (-not [System.IO.File]::Exists($cmdPath)) {
        throw "No se encontro cmd.exe: $cmdPath"
    }

    $startup = New-Object System.Diagnostics.ProcessStartInfo
    $startup.FileName = $cmdPath
    # cmd.exe /k debe recibir doble comilla exterior para una ruta con espacios.
    # Resultado: /d /k ""C:\ruta con espacios\_iniciar_instalador_admin.bat""
    $startup.Arguments = '/d /k ""' + $fullPath + '""'
    $startup.WorkingDirectory = [System.IO.Path]::GetDirectoryName($fullPath)
    $startup.UseShellExecute = $true
    $startup.Verb = 'runas'

    $started = [System.Diagnostics.Process]::Start($startup)
    if ($null -eq $started) {
        throw 'Windows no confirmo la apertura de la consola como administrador.'
    }
    Write-Host '[INFO] Se abrio una consola con permisos de administrador.' -ForegroundColor Green
    exit 0
}
catch {
    Write-Host ('[ERROR] No se pudo abrir el instalador: ' + $_.Exception.Message) -ForegroundColor Red
    exit 1
}
