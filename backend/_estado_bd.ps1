param(
    [Parameter(Mandatory=$true)][string]$MySqlExe,
    [ValidateSet('Existe','UsuariosSinHash')][string]$Modo='Existe'
)
$ErrorActionPreference = 'Stop'
try {
    if (-not (Test-Path -LiteralPath $MySqlExe -PathType Leaf)) { exit 2 }
    if ($Modo -eq 'Existe') {
        $sql="SELECT COUNT(*) FROM information_schema.SCHEMATA WHERE SCHEMA_NAME='teamflow_db';"
    } else {
        $sql = 'SELECT COUNT(*) FROM teamflow_db.usuarios WHERE password_hash IS NULL OR LEFT(password_hash,2) <> ''$2'';' 
    }
    $result = @(& $MySqlExe -u root -h 127.0.0.1 -P 3306 -N -B -e $sql 2>&1)
    if ($LASTEXITCODE -ne 0) { exit 2 }
    $number = [int]([string]$result[-1]).Trim()
    if ($Modo -eq 'Existe') {
        if ($number -eq 1) { exit 0 } else { exit 1 }
    }
    if ($number -eq 0) { exit 0 } else { exit 3 }
} catch { exit 2 }
