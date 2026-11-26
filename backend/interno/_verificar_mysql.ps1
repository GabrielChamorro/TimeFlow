param(
    [Parameter(Mandatory=$true)][string] $MySqlExe,
    [switch] $ComprobarSeguridad,
    [switch] $Servidor,
    [string] $DbUser = "root"
)
# La version del cliente no demuestra la version del servidor.
$ErrorActionPreference = 'Stop'
try {
    if (-not (Test-Path -LiteralPath $MySqlExe -PathType Leaf)) { exit 1 }
    if ($Servidor) {
        if ([string]::IsNullOrWhiteSpace($DbUser)) { exit 1 }
        $mysqlArgs=@('--no-defaults','--protocol=TCP','--host=127.0.0.1','--port=3306',"--user=$DbUser",'--batch','--skip-column-names')
        # MYSQL_PWD llega solo como variable de entorno desde la configuracion local.
        $previousPreference = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        try { $out = (& $MySqlExe @mysqlArgs -e 'SELECT VERSION();' 2>&1 | Out-String).Trim(); $rc = $LASTEXITCODE }
        finally { $ErrorActionPreference = $previousPreference }
        if ($rc -ne 0) { exit 1 }
        $m = [regex]::Match($out, '(?m)^\s*(\d+\.\d+\.\d+)')
    } else {
        $out = (& $MySqlExe --version 2>&1 | Out-String).Trim()
        if ($LASTEXITCODE -ne 0 -or $out -match '(?i)MariaDB') { exit 1 }
        $m = [regex]::Match($out, '(?i)\b(?:Ver|Distrib)\s+(\d+\.\d+\.\d+)\b')
    }
    if (-not $m.Success) { exit 1 }
    $str = $m.Groups[1].Value
    $v = [version]::Parse($str)
    if ($ComprobarSeguridad) {
        # Versiones afectadas por el aviso de seguridad Oracle 2026-10-20.
        $bad = ($v.Major -eq 8 -and $v.Minor -eq 4 -and $v.Build -lt 13) -or
               ($v.Major -eq 9 -and $v.Minor -eq 7 -and $v.Build -le 3) -or
               ($v.Major -eq 26 -and $v.Minor -eq 7 -and $v.Build -le 1)
        if ($bad) { exit 2 }
    } else {
        Write-Output $str
    }
    exit 0
} catch { exit 1 }
