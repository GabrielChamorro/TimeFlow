# Verificador independiente de Java 21 para evitar problemas de comillas
# entre CMD, FOR /F y expresiones regulares.
param(
    [Parameter(Mandatory=$true)]
    [string] $JavaExe
)
try {
    if (-not (Test-Path -LiteralPath $JavaExe -PathType Leaf)) { exit 1 }
    $output = & $JavaExe -version 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) { exit 1 }
    $match = [regex]::Match($output, '(?:openjdk|java)\s+version\s+"(21(?:\.\d+){2,4})(?:\+\d+)?"')
    if (-not $match.Success) { exit 1 }
    $parts = @($match.Groups[1].Value.Split('.') | ForEach-Object { [int]$_ })
    $minimum = @(21, 0, 13, 0, 2)
    for ($i=0; $i -lt $minimum.Count; $i++) {
        $found = if ($i -lt $parts.Count) { $parts[$i] } else { 0 }
        if ($found -gt $minimum[$i]) { exit 0 }
        if ($found -lt $minimum[$i]) { exit 1 }
    }
    exit 0
} catch {
    exit 1
}
