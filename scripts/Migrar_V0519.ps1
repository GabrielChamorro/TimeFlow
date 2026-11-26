param(
    [Parameter(Mandatory=$true)][string]$MySqlExe,
    [Parameter(Mandatory=$true)][string]$MySqlDumpExe,
    [string]$Database='teamflow_db',
    [string]$DbHost='127.0.0.1',
    [int]$Port=3306,
    [string]$DbUser='root',
    [string]$BackupDirectory=(Join-Path $PSScriptRoot '..\respaldos-privados')
)
$ErrorActionPreference='Stop'
if ($Database -notmatch '^[A-Za-z0-9_]+$') { throw 'Nombre de base no valido' }
if (!(Test-Path -LiteralPath $MySqlExe) -or !(Test-Path -LiteralPath $MySqlDumpExe)) { throw 'No se encontraron los clientes MySQL indicados' }
Write-Host 'Deten el backend antes de continuar. Se respaldara la base completa antes del primer ALTER.'
$securePassword=Read-Host 'Contrasena MySQL (no se guarda en archivos)' -AsSecureString
$oldPassword=$env:MYSQL_PWD
$pointer=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try {
    $env:MYSQL_PWD=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    $mysqlArgs=@('--no-defaults','--protocol=TCP',"--host=$DbHost","--port=$Port","--user=$DbUser",'--default-character-set=utf8mb4')
    & $MySqlExe @mysqlArgs "--database=$Database" -e 'SELECT 1;' | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo conectar. No se aplicaron migraciones.' }
    New-Item -ItemType Directory -Path $BackupDirectory -Force | Out-Null
    $backupPath=Join-Path ([IO.Path]::GetFullPath($BackupDirectory)) ($Database+'-antes-v0519-'+(Get-Date -Format 'yyyyMMdd-HHmmss-fff')+'.sql')
    & $MySqlDumpExe @mysqlArgs --single-transaction --quick --routines --triggers "--result-file=$backupPath" $Database
    if ($LASTEXITCODE -ne 0 -or !(Test-Path -LiteralPath $backupPath) -or (Get-Item -LiteralPath $backupPath).Length -lt 100) { throw 'Fallo el respaldo. No se aplicaron migraciones.' }
    $scripts=@('sesiones','tareas','renovacion','usuarios','tipos')
    foreach ($migration in $scripts) {
        $sqlPath=Join-Path $PSScriptRoot "..\backend\sql\migracion_v0_5_19_$migration.sql"
        Get-Content -LiteralPath $sqlPath -Raw -Encoding utf8 | & $MySqlExe @mysqlArgs "--database=$Database"
        if ($LASTEXITCODE -ne 0) { throw "Fallo $migration. Mantener el backend detenido; revisar y repetir. Respaldo: $backupPath" }
    }
    Write-Host "Migracion completada. Respaldo privado: $backupPath"
    Write-Host ((Get-FileHash -LiteralPath $backupPath -Algorithm SHA256).Hash)
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    $env:MYSQL_PWD=$oldPassword
    $securePassword=$null
}
