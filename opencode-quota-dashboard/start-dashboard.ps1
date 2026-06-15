# OpenCode Quota Dashboard 一鍵啟動腳本
# 第一次執行會詢問 auth cookie，之後自動從加密檔讀取

$workspaceId = "wrk_01KSKPTZKA441ARG8TK8V0YR1Y"
$dashboardDir = $PSScriptRoot
$secureDir = Join-Path $env:USERPROFILE ".opencode-quota-dashboard"
$cookieFile = Join-Path $secureDir "auth.cookie"

# 建立儲存目錄
if (-not (Test-Path $secureDir)) {
    New-Item -ItemType Directory -Path $secureDir -Force | Out-Null
}

# 讀取或詢問 cookie
if (Test-Path $cookieFile) {
    Write-Host "讀取已儲存的加密 cookie..." -ForegroundColor Cyan
    $secureString = ConvertTo-SecureString (Get-Content $cookieFile -Raw)
    $authCookie = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureString)
    )
} else {
    Write-Host "第一次使用，請貼上你的 OpenCode Go auth cookie：" -ForegroundColor Yellow
    $secureString = Read-Host -AsSecureString
    $authCookie = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureString)
    )
    $secureString | ConvertFrom-SecureString | Set-Content $cookieFile -NoNewline
    Write-Host "cookie 已加密儲存到：$cookieFile" -ForegroundColor Green
}

# 設定 opencode-quota 設定檔，顯示所有窗口（5h / weekly / monthly）
$configDir = Join-Path $env:USERPROFILE ".opencode-quota-config"
$quotaConfigDir = Join-Path $configDir "opencode-quota"
$quotaConfigFile = Join-Path $quotaConfigDir "quota-toast.json"
if (-not (Test-Path $quotaConfigDir)) {
    New-Item -ItemType Directory -Path $quotaConfigDir -Force | Out-Null
}
if (-not (Test-Path $quotaConfigFile)) {
    @{ formatStyle = "allWindows" } | ConvertTo-Json | Set-Content $quotaConfigFile -Encoding UTF8
}
$env:OPENCODE_CONFIG_DIR = $configDir

# 設定環境變數並啟動 server
$env:OPENCODE_GO_WORKSPACE_ID = $workspaceId
$env:OPENCODE_GO_AUTH_COOKIE = $authCookie

Write-Host "啟動 OpenCode Quota Dashboard..." -ForegroundColor Cyan
$proc = Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $dashboardDir -WindowStyle Hidden -PassThru

# 等待 server 就緒
$ready = $false
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Milliseconds 500
    try {
        $resp = Invoke-WebRequest -Uri "http://localhost:3334/api/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($resp.Content -match '"ok":\s*true') {
            $ready = $true
            break
        }
    } catch {}
}

if ($ready) {
    Write-Host "Dashboard 已啟動：http://localhost:3334" -ForegroundColor Green
    Start-Process "http://localhost:3334"
} else {
    Write-Host "Dashboard 啟動失敗，請檢查 port 3334 是否被佔用" -ForegroundColor Red
}

Write-Host ""
Write-Host "關閉方式：開啟工作管理員結束 node.exe，或執行 Stop-Process -Name node" -ForegroundColor DarkGray
