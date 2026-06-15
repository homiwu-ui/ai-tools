@echo off
chcp 65001 >nul
echo 啟動 OpenCode Quota Dashboard...
powershell -ExecutionPolicy Bypass -File "%~dp0opencode-quota-dashboard\start-dashboard.ps1"
pause
