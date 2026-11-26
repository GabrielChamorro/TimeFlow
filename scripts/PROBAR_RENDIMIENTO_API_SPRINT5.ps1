# PowerShell 5.1+ | Solo peticiones GET | Usar en entorno local de pruebas.
# Si no existe TIMEFLOW_TEST_JWT, el script solicita el token oculto en consola.
# Ejemplo: .\scripts\PROBAR_RENDIMIENTO_API_SPRINT5.ps1 -Endpoint tareas -Requests 100 -Concurrency 5
param(
    [ValidateSet('tareas','mensajes','usuarios','tipos-tarea')][string]$Endpoint = 'tareas',
    [ValidateRange(1,10000)][int]$Requests = 100,
    [ValidateRange(1,50)][int]$Concurrency = 5,
    [string]$BaseUrl = 'http://localhost:8080',
    [string]$Output = ''
)
$ErrorActionPreference = 'Stop'
$uri = [uri]$BaseUrl
if ($uri.Scheme -notin @('http', 'https') -or $uri.Host -notin @('localhost', '127.0.0.1', '::1')) {
    throw 'La herramienta solo permite localhost para no enviar el JWT a otros servidores.'
}
$jwt = $env:TIMEFLOW_TEST_JWT
if (-not $jwt) {
    $secure = Read-Host 'JWT temporal de pruebas (oculto)' -AsSecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try { $jwt = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}
if (-not $jwt) { throw 'No se proporcionó un token JWT de pruebas.' }
Add-Type -AssemblyName System.Net.Http
$client = New-Object System.Net.Http.HttpClient
$client.Timeout = [timespan]::FromSeconds(30)
$client.DefaultRequestHeaders.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new('Bearer', $jwt)
$url = $BaseUrl.TrimEnd('/') + '/api/' + $Endpoint
$results = New-Object System.Collections.Generic.List[object]
try {
    for ($i = 0; $i -lt $Requests; $i += $Concurrency) {
        $batch = @()
        $batchSize = [Math]::Min($Concurrency, $Requests - $i)
        for ($j = 0; $j -lt $batchSize; $j++) {
            $watch = [System.Diagnostics.Stopwatch]::StartNew()
            $task = $client.GetAsync($url)
            $batch += [pscustomobject]@{ Index = $i + $j + 1; Stopwatch = $watch; Task = $task }
        }
        foreach ($item in $batch) {
            $httpStatus = 'ERROR'
            try {
                $resp = $item.Task.GetAwaiter().GetResult()
                $httpStatus = [int]$resp.StatusCode
                $resp.Dispose()
            } catch {
                $httpStatus = 'ERROR'
            } finally {
                $item.Stopwatch.Stop()
            }
            $results.Add([pscustomobject]@{
                Request = $item.Index
                Status = $httpStatus
                Milliseconds = [Math]::Round($item.Stopwatch.Elapsed.TotalMilliseconds, 2)
            })
        }
    }
} finally {
    $client.Dispose()
}
$latencies = @($results | ForEach-Object { $_.Milliseconds } | Sort-Object)
function Get-Pct([double[]]$values, [double]$pct) {
    $index = [Math]::Min($values.Count - 1, [int][Math]::Floor(($values.Count - 1) * $pct))
    return [Math]::Round($values[$index], 2)
}
$statuses = $results | Group-Object Status | ForEach-Object { "$($_.Name): $($_.Count)" }
Write-Host "Endpoint: $Endpoint | solicitudes: $Requests | concurrencia por lote: $Concurrency"
Write-Host "Mediana: $(Get-Pct $latencies 0.50) ms | p95: $(Get-Pct $latencies 0.95) ms"
Write-Host "HTTP: $($statuses -join ', ')"
if ($Output) {
    $results | Export-Csv -Path $Output -NoTypeInformation -Encoding UTF8
    Write-Host "Resultados individuales en $Output"
}
if (@($results | Where-Object { $_.Status -ne 200 }).Count -gt 0) {
    Write-Warning 'Algunas solicitudes fallaron. Verifica los codigos antes de comparar tiempos.'
}
