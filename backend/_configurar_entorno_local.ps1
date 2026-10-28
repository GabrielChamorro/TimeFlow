param(
    [Parameter(Mandatory=$true)][string]$MySqlExe,
    [Parameter(Mandatory=$true)][string]$ConfigPath
)
$ErrorActionPreference = 'Stop'
function Get-Secret([string]$Prompt) {
    $sec = Read-Host -Prompt $Prompt -AsSecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
    try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}
function For-Batch([string]$value) {
    # No interpolar en un comando CMD: una comilla altera el alcance de SET "...".
    if ($value -match '["\r\n]') { throw 'La contrasena contiene comillas dobles o saltos de linea no compatibles con los BAT.' }
    return $value.Replace('^','^^').Replace('%','%%')
}
try {
    if (Test-Path -LiteralPath $ConfigPath) {
        Write-Host '[OK] Ya existe config_local.bat. No se modifica.' -ForegroundColor Green
        exit 0
    }
    if (-not (Test-Path -LiteralPath $MySqlExe -PathType Leaf)) { throw 'No se encontro el cliente MySQL.' }
    Write-Host 'La contrasena de MySQL no aparecera al escribirla.'
    $dbPassword = Get-Secret 'Contrasena actual de MySQL para root'
    if ([string]::IsNullOrEmpty($dbPassword)) { throw 'La contrasena MySQL no puede estar vacia en esta configuracion.' }
    $null = For-Batch $dbPassword # Validar antes de conectar; no altera la contrasena original.
    $env:MYSQL_PWD = $dbPassword
    try {
        $connection = @(& $MySqlExe -u root -h 127.0.0.1 -P 3306 -N -B -e 'SELECT 1;' 2>&1)
        if ($LASTEXITCODE -ne 0 -or -not ($connection -contains '1')) {
            throw 'MySQL rechazo la conexion o no esta disponible. Comprueba la contrasena y el servicio.'
        }
        $existingDatabase = @(& $MySqlExe -u root -h 127.0.0.1 -P 3306 -N -B -e "SELECT COUNT(*) FROM information_schema.SCHEMATA WHERE SCHEMA_NAME='teamflow_db';" 2>&1)
        if ($LASTEXITCODE -ne 0) { throw 'No fue posible comprobar la existencia de la base de datos.' }
        $count = 0
        if ([string]$existingDatabase[-1] -eq '1') {
            $existingUsers = @(& $MySqlExe -u root -h 127.0.0.1 -P 3306 -N -B -e "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='teamflow_db' AND TABLE_NAME='usuarios';" 2>&1)
            if ($LASTEXITCODE -ne 0) { throw 'No se pudo verificar la tabla usuarios.' }
            if ([string]$existingUsers[-1] -eq '1') {
                $users = @(& $MySqlExe -u root -h 127.0.0.1 -P 3306 -N -B -e 'SELECT COUNT(*) FROM teamflow_db.usuarios;' 2>&1)
                if ($LASTEXITCODE -ne 0) { throw 'No se pudo consultar la cantidad de usuarios.' }
                $count = [int]([string]$users[-1]).Trim()
            }
        }
    }
    finally { Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue }

    $initialEmail = 'admin@teamflow.com'
    $initialPassword = ''
    if ($count -gt 0) {
        Write-Host ('[OK] Hay ' + $count + ' usuario(s) existentes. No se creara un administrador nuevo.') -ForegroundColor Green
        Write-Host '[INFO] El inicio de sesion utilizara las contrasenas de usuario anteriores (si tienen BCrypt).'
    } else {
        $emailInput = Read-Host 'Correo del administrador inicial [admin@teamflow.com]'
        if (-not [string]::IsNullOrWhiteSpace($emailInput)) { $initialEmail = $emailInput.Trim().ToLowerInvariant() }
        if ($initialEmail -notmatch '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$') {
            throw 'El correo del administrador no es valido.'
        }
        $initialPassword = Get-Secret 'Contrasena NUEVA para el administrador de TimeFlow (8-64 caracteres, letra y numero)'
        if ($initialPassword.Length -lt 8 -or $initialPassword.Length -gt 64 -or $initialPassword -cnotmatch '[A-Za-z]' -or $initialPassword -notmatch '\d') {
            throw 'La contrasena del administrador debe tener 8-64 caracteres, una letra y un numero.'
        }
    }
    $initialPassword = For-Batch $initialPassword
    $dbPassword = For-Batch $dbPassword
    $initialEmail = For-Batch $initialEmail
    $bytes = New-Object byte[] 48
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    $jwt = [Convert]::ToBase64String($bytes)
    $lines = @(
        '@echo off',
        'set "DB_USER=root"',
        ('set "DB_PASSWORD=' + $dbPassword + '"'),
        ('set "JWT_SECRET=' + $jwt + '"'),
        'set "CORS_ALLOWED_ORIGINS=http://localhost:5173"',
        ('set "INITIAL_ADMIN_EMAIL=' + $initialEmail + '"'),
        ('set "INITIAL_ADMIN_PASSWORD=' + $initialPassword + '"')
    )
    # Escribir de forma atomica, sin BOM y sin sobrescribir secretos preexistentes.
    $directory = [System.IO.Path]::GetDirectoryName($ConfigPath)
    $temp = Join-Path $directory ('.timeflow-config-' + [guid]::NewGuid().ToString('N') + '.tmp')
    try {
        [IO.File]::WriteAllLines($temp, $lines, (New-Object System.Text.UTF8Encoding($false)))
        if (Test-Path -LiteralPath $ConfigPath) { throw 'El archivo de configuracion ya existe. No se sobrescribio.' }
        Move-Item -LiteralPath $temp -Destination $ConfigPath -ErrorAction Stop
    } finally { if (Test-Path -LiteralPath $temp) { Remove-Item -LiteralPath $temp -Force } }
    Write-Host '[OK] MySQL acepto las credenciales y se creo config_local.bat.' -ForegroundColor Green
    exit 0
} catch {
    Write-Host ('[ERROR] ' + $_.Exception.Message) -ForegroundColor Red
    exit 1
} finally {
    Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
    $dbPassword = $null; $initialPassword = $null
}
