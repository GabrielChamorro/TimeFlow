# Localiza una instalacion que realmente pueda ejecutar node Y npm.
# Compatible con Windows PowerShell 5.1. No modifica el Node global.
$ErrorActionPreference = 'Stop'
function Log([string]$message) {
    if (-not [string]::IsNullOrWhiteSpace($env:TF_INSTALL_LOG)) {
        try { Add-Content -LiteralPath $env:TF_INSTALL_LOG -Value ('NODE: ' + $message) -Encoding UTF8 -ErrorAction Stop } catch { }
    }
}
$paths = New-Object 'System.Collections.Generic.List[string]'
foreach ($path in @(
    $env:TIMEFLOW_NODE_HOME,
    "$env:ProgramFiles\nodejs",
    "${env:ProgramFiles(x86)}\nodejs",
    "$env:LOCALAPPDATA\Programs\nodejs"
)) {
    if (-not [string]::IsNullOrWhiteSpace($path)) { $paths.Add($path) }
}
$localDir = Join-Path $PSScriptRoot '..\backend\.timeflow-tools\nodejs'
if (Test-Path -LiteralPath $localDir -PathType Container) {
    Get-ChildItem -LiteralPath $localDir -Directory -Filter 'node-v*-win-x64' -ErrorAction SilentlyContinue |
        ForEach-Object { $paths.Add($_.FullName) }
}
try {
    Get-Command node.exe -All -ErrorAction SilentlyContinue | ForEach-Object {
        if ($_.Source) { $paths.Add((Split-Path -Parent $_.Source)) }
    }
} catch { Log ('Busqueda PATH fallida: ' + $_.Exception.Message) }
foreach ($nodeDir in ($paths | Select-Object -Unique)) {
    try {
        $node = Join-Path $nodeDir 'node.exe'
        $npm = Join-Path $nodeDir 'npm.cmd'
        if (-not (Test-Path -LiteralPath $node -PathType Leaf)) { Log "Sin node.exe: $nodeDir"; continue }
        if (-not (Test-Path -LiteralPath $npm -PathType Leaf)) { Log "Sin npm.cmd: $nodeDir"; continue }
        $raw = (& $node '--version' 2>&1 | Out-String).Trim()
        if ($LASTEXITCODE -ne 0) { Log "node.exe fallo en $nodeDir (salida: $raw)"; continue }
        if ($raw -notmatch '^v(\d+)\.(\d+)\.(\d+)$') { Log "Version Node desconocida en $nodeDir : $raw"; continue }
        $major = [int]$Matches[1]; $minor = [int]$Matches[2]
        $valid = ($major -eq 20 -and $minor -ge 19) -or
                 ($major -eq 22 -and $minor -ge 12) -or
                 ($major -ge 24 -and ($major % 2) -eq 0)
        if (-not $valid) { Log "Node $raw no cumple version minima Vite: $nodeDir"; continue }
        $oldPath = $env:PATH
        try {
            $env:PATH = "$nodeDir;$oldPath"
            $npmRaw = (& $npm '--version' 2>&1 | Out-String).Trim()
            $npmRc = $LASTEXITCODE
        } finally { $env:PATH = $oldPath }
        if ($npmRc -ne 0 -or $npmRaw -notmatch '^\d+\.\d+\.\d+') {
            Log "npm.cmd no ejecuto correctamente desde $nodeDir (codigo $npmRc, salida: $npmRaw)"
            continue
        }
        Log "OK node=$raw npm=$npmRaw en $nodeDir"
        Write-Output $nodeDir
        exit 0
    } catch { Log ("Error verificando $nodeDir : " + $_.Exception.Message) }
}
Log 'No se encontro una instalacion Node+NPM utilizable. Revisa las lineas NODE anteriores.'
exit 1
