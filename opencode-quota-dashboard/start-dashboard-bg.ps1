# OpenCode Quota Dashboard - 背景啟動腳本（無互動，供 OpenCode 自動呼叫）
param([switch]$Force)

$dashboardDir = Split-Path $PSCommandPath -Parent
$secureDir = Join-Path $env:USERPROFILE ".opencode-quota-dashboard"
$cookieFile = Join-Path $secureDir "auth.cookie"
$pidFile = Join-Path $secureDir "dashboard.pid"

# 檢查是否已在執行（port 3334）
$alreadyRunning = $false
try {
    $check = Invoke-WebRequest -Uri "http://localhost:3334/api/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    if ($check.Content -match '"ok":\s*true') { $alreadyRunning = $true }
} catch { Write-Host "" | Out-Null }
if (-not $alreadyRunning -and -not $Force -and (Test-Path $pidFile)) {
    $oldPid = Get-Content $pidFile -Raw
    $oldProc = Get-Process -Id $oldPid -ErrorAction SilentlyContinue
    if ($oldProc -and $oldProc.ProcessName -eq "node") {
        $alreadyRunning = $true
    } else {
        Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
    }
}
if ($alreadyRunning) { exit 0 }

# 讀取 cookie
if (-not (Test-Path $cookieFile)) {
    Write-Warning "找不到 auth cookie，請先執行 start-dashboard.ps1 設定 cookie"
    exit 1
}

$secureString = ConvertTo-SecureString (Get-Content $cookieFile -Raw)
$authCookie = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureString)
)

# 設定環境變數
$env:OPENCODE_GO_WORKSPACE_ID = "wrk_01KSKPTZKA441ARG8TK8V0YR1Y"
$env:OPENCODE_GO_AUTH_COOKIE  = $authCookie
$env:OPENCODE_CONFIG_DIR = Join-Path $env:USERPROFILE ".opencode-quota-config"

# 啟動 server
$proc = Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $dashboardDir -WindowStyle Hidden -PassThru
$proc.Id | Set-Content $pidFile -NoNewline

Write-Host "OpenCode Quota Dashboard 已啟動 (PID $($proc.Id))" -ForegroundColor Cyan
Write-Host "  http://localhost:3334" -ForegroundColor Green
