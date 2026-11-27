# Removes the hosted JBC Speech add-in registration for the current Windows user.
# Keep this file ASCII-only: Windows PowerShell 5.1 misreads UTF-8 without a BOM.
$ErrorActionPreference = 'Continue'
# Runs from the unzipped download or from the installed folder; both hold the config.
$configFile = Join-Path $PSScriptRoot 'jbc-speech-online.json'
if (-not (Test-Path $configFile)) { $configFile = Join-Path $env:LOCALAPPDATA 'JBC Speech (online)\jbc-speech-online.json' }
$config = Get-Content $configFile -Raw | ConvertFrom-Json
$dest = Join-Path $env:LOCALAPPDATA $config.name
Set-Location $env:TEMP

while (Get-Process WINWORD -ErrorAction SilentlyContinue) {
    Read-Host 'Please close Word, then press Enter' | Out-Null
}
Remove-ItemProperty -Path 'HKCU:\Software\Microsoft\Office\16.0\WEF\Developer' -Name $config.addinId -ErrorAction SilentlyContinue
Remove-Item "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\$($config.addinId)" -Recurse -ErrorAction SilentlyContinue
Remove-Item $dest -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "$($config.name) has been removed." -ForegroundColor Green
Read-Host 'Press Enter to close' | Out-Null
