#Requires -RunAsAdministrator
<#
.SYNOPSIS
  從 Chrome cookie 資料庫提取 OpenCode Go 的 auth cookie（需在同台電腦執行以解密 DPAPI）。

.DESCRIPTION
  1. 複製 Chrome Cookies SQLite DB 到暫存檔（避免 Chrome 鎖定）
  2. 查詢 opencode.ai 的 auth cookie
  3. 用 DPAPI 解密 value
  4. 輸出可直接貼到 PowerShell 的環境變數設定

.NOTES
  - 必須在已登入 opencode.ai 的同一台 Windows 電腦執行
  - 不會把資料傳到網路，只在本地輸出
  - 若 Chrome 使用多個 profile，請調整 $ProfilePath
#>

param(
    [string]$ProfilePath = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default"
)

$cookieDb = Join-Path $ProfilePath "Network\Cookies"
$tempDb = Join-Path $env:TEMP "opencode_chrome_cookies_tmp.db"

if (-not (Test-Path $cookieDb)) {
    Write-Host "找不到 Chrome cookie DB：$cookieDb" -ForegroundColor Red
    exit 1
}

try {
    Copy-Item -Path $cookieDb -Destination $tempDb -Force

    Add-Type -AssemblyName System.Security

    $conn = New-Object System.Data.SQLite.SQLiteConnection
    if (-not $conn) {
        # 嘗試用 System.Data.SQLite 失敗，改用 sqlite3 CLI（若已安裝）
        $sqlite3 = Get-Command sqlite3 -ErrorAction SilentlyContinue
        if (-not $sqlite3) {
            Write-Host "需要 SQLite 才能讀取 Chrome cookie DB。" -ForegroundColor Red
            Write-Host "請先安裝 sqlite3 CLI 或 System.Data.SQLite。" -ForegroundColor Yellow
            exit 1
        }
        $rows = sqlite3 $tempDb "SELECT name, encrypted_value FROM cookies WHERE host_key LIKE '%opencode.ai%' AND name='auth';"
        Write-Host $rows
        exit
    }

    $conn.ConnectionString = "Data Source=$tempDb"
    $conn.Open()

    $cmd = $conn.CreateCommand()
    $cmd.CommandText = "SELECT name, encrypted_value FROM cookies WHERE host_key LIKE '%opencode.ai%' AND name = 'auth' LIMIT 1"
    $reader = $cmd.ExecuteReader()

    if (-not $reader.Read()) {
        Write-Host "在 opencode.ai 找不到 auth cookie。請確認已登入 opencode.ai。" -ForegroundColor Yellow
        exit 1
    }

    $name = $reader.GetString(0)
    $encryptedBytes = $reader.GetValue(1)
    if ($encryptedBytes -is [byte[]]) {
        $encryptedBytes = [byte[]]$encryptedBytes
    } else {
        Write-Host "無法讀取加密值類型：$($encryptedBytes.GetType())" -ForegroundColor Red
        exit 1
    }

    $reader.Close()
    $conn.Close()

    # Chrome 加密格式：前 3 個 byte 是 v10/v11 版本標記，後面接 12 byte nonce + ciphertext + tag (AES-GCM)
    # 這裡用最常見的 DPAPI 直接解密（舊版或某些情境適用）
    try {
        $decrypted = [System.Security.Cryptography.ProtectedData]::Unprotect($encryptedBytes, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
        $authValue = [System.Text.Encoding]::UTF8.GetString($decrypted)
    } catch {
        Write-Host "DPAPI 直接解密失敗，可能是新版 AES-GCM 格式。" -ForegroundColor Yellow
        Write-Host "錯誤：$($_.Exception.Message)" -ForegroundColor DarkGray
        exit 1
    }

    Write-Host ""
    Write-Host "=== OpenCode Go 憑證 ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "# 請把下面兩行貼到 PowerShell：" -ForegroundColor Green
    Write-Host "`$env:OPENCODE_GO_WORKSPACE_ID = `'wrk_01KSKPTZKA441ARG8TK8V0YR1Y`';" -ForegroundColor White
    Write-Host "`$env:OPENCODE_GO_AUTH_COOKIE  = `'$authValue`';" -ForegroundColor White
    Write-Host ""
    Write-Host "# 然後啟動 dashboard：" -ForegroundColor Green
    Write-Host "node server.js" -ForegroundColor White
}
finally {
    if (Test-Path $tempDb) {
        Remove-Item $tempDb -Force -ErrorAction SilentlyContinue
    }
}
