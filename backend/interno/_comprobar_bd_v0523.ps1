param(
    [Parameter(Mandatory=$true)][string]$MySqlExe,
    [Parameter(Mandatory=$true)][string]$DbUser
)
$ErrorActionPreference='Stop'
# Codigos: 0 ya actualizado, 10 requiere migrar V19->V23,
# 20 base existente no reconocida, 30 error de conexion, 40 base ausente.
try {
    if (-not (Test-Path -LiteralPath $MySqlExe -PathType Leaf)) { exit 30 }
    if ([string]::IsNullOrWhiteSpace($env:MYSQL_PWD)) { exit 30 }
    $mysqlArgs=@('--no-defaults','--protocol=TCP','--host=127.0.0.1','--port=3306',"--user=$DbUser",'--default-character-set=utf8mb4','--batch','--skip-column-names')
    function Count([string]$sql) {
        $out=@(& $MySqlExe @mysqlArgs -e $sql)
        if ($LASTEXITCODE -ne 0 -or $out.Count -ne 1) { throw 'Consulta MySQL fallida' }
        $v=0
        if (-not [int]::TryParse(([string]$out[0]).Trim(),[ref]$v)) { throw 'Respuesta MySQL no numerica' }
        return $v
    }
    $db=Count "SELECT COUNT(*) FROM information_schema.SCHEMATA WHERE SCHEMA_NAME='teamflow_db';"
    if ($db -eq 0) { exit 40 }
    $baseTables=Count "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='teamflow_db' AND TABLE_NAME IN ('usuarios','tareas','tipos_tarea','sesiones_jwt','renovaciones_jwt','tarea_dependencias');"
    $baseVersions=Count "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='teamflow_db' AND (TABLE_NAME='tareas' AND COLUMN_NAME='version' OR TABLE_NAME='usuarios' AND COLUMN_NAME='version' OR TABLE_NAME='tipos_tarea' AND COLUMN_NAME='version');"
    # Solo migrar automaticamente instalaciones compatibles con V0.5.19 o posterior.
    if ($baseTables -ne 6 -or $baseVersions -ne 3) { exit 20 }
    $registros=Count "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='teamflow_db' AND TABLE_NAME='tarea_registros';"
    $cols=Count "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='teamflow_db' AND TABLE_NAME='tareas' AND COLUMN_NAME IN ('finalizada_en_ms','tiempo_acumulado_ms','tiempo_inicio_ms');"
    $indexes=Count "SELECT COUNT(DISTINCT CONCAT(TABLE_NAME, ':', INDEX_NAME)) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA='teamflow_db' AND ((TABLE_NAME='tareas' AND INDEX_NAME IN ('idx_tareas_historial','idx_tareas_historial_responsable')) OR (TABLE_NAME='tarea_registros' AND INDEX_NAME='idx_registros_tarea_id'));"
    if ($registros -eq 1 -and $cols -eq 3 -and $indexes -eq 3) { exit 0 }
    exit 10
} catch {
    Write-Host '[ERROR] No se pudo comprobar con seguridad el esquema MySQL.' -ForegroundColor Red
    exit 30
}
