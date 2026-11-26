# TimeFlow Sprint 5 - Inicio seguro y sencillo. Windows PowerShell 5.1.
# Este script solo se ejecuta desde el .bat que acompana a la herramienta.
param([string]$BaseUrl = 'http://127.0.0.1:8080')
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
try {
    $base = [Uri]$BaseUrl
    if ($base.Scheme -notin @('http', 'https') -or
        $base.Host -notin @('localhost', '127.0.0.1', '::1') -or
        $base.UserInfo -or $base.AbsolutePath -ne '/' -or $base.Query -or $base.Fragment) {
        throw 'Solo se permite conectar al backend local (localhost).'
    }
    $node = Get-Command node.exe -ErrorAction Stop
    Write-Host ''
    Write-Host 'Se necesita una cuenta ACTIVA de TimeFlow para leer las rutas protegidas.'
    Write-Host 'La contrasena no se mostrara ni se guardara en el informe.'
    $email = (Read-Host 'Correo de TimeFlow').Trim()
    if ($email -notmatch '^[^\s@]+@[^\s@]+\.[^\s@]+$') {
        throw 'El correo ingresado no parece valido.'
    }
    $secure = Read-Host 'Contrasena de TimeFlow (oculta)' -AsSecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try {
        $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
        $ptr = [IntPtr]::Zero
    }
    try {
        $body = @{ email = $email; password = $password } | ConvertTo-Json -Compress
        $login = Invoke-RestMethod -Method Post -Uri ($BaseUrl.TrimEnd('/') + '/api/auth/login') `
            -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($body)) `
            -TimeoutSec 15 -MaximumRedirection 0 -ErrorAction Stop
    } catch {
        throw 'No se pudo iniciar sesion. Comprueba que el backend este iniciado, que el puerto sea 8080 y que la cuenta sea valida.'
    } finally {
        Remove-Variable -Name password,body -ErrorAction SilentlyContinue
        $secure.Dispose()
    }
    if (-not $login.token -or -not ($login.token -is [string])) {
        throw 'La respuesta de login no incluye un JWT valido.'
    }
    Write-Host '[OK] Sesion iniciada. Midiendo 4 rutas con tres niveles de carga.'
    Write-Host 'Las mediciones pueden tardar un poco segun la cantidad de datos.'
    Write-Host ''
    $env:TIMEFLOW_S5_JWT = $login.token
    try {
        & $node.Path "$PSScriptRoot\medir_sprint5.mjs" --base-url $BaseUrl
        $exitCode = $LASTEXITCODE
    } finally {
        Remove-Item Env:TIMEFLOW_S5_JWT -ErrorAction SilentlyContinue
    }
    exit $exitCode
} catch {
    # El texto de errores de autenticacion no revela credenciales ni la respuesta del servidor.
    Write-Host ('[ERROR] ' + $_.Exception.Message) -ForegroundColor Red
    exit 1
}
