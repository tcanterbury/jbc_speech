# Removes JBC Speech for the current Windows user. Installed next to the app; also reachable from
# Settings > Apps, the Start menu, or "Uninstall JBC Speech.cmd" in the download.
# Keep this file ASCII-only: Windows PowerShell 5.1 misreads UTF-8 without a BOM.
$ErrorActionPreference = 'Continue'
$dest = $PSScriptRoot
$config = Get-Content (Join-Path $dest 'jbc-speech.json') -Raw | ConvertFrom-Json
$name = $config.name
Set-Location $env:TEMP   # so the install folder can be deleted

Write-Host "Removing $name from $dest" -ForegroundColor White
while (Get-Process WINWORD -ErrorAction SilentlyContinue) {
    Read-Host 'Please close Word, then press Enter' | Out-Null
}

$nodeExe = Join-Path $dest 'node\node.exe'
Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $nodeExe } | Stop-Process -Force
Start-Sleep -Milliseconds 500

Remove-ItemProperty -Path 'HKCU:\Software\Microsoft\Office\16.0\WEF\Developer' -Name $config.addinId -ErrorAction SilentlyContinue
Remove-Item "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\$($config.addinId)" -Recurse -ErrorAction SilentlyContinue
Remove-Item (Join-Path ([Environment]::GetFolderPath('Startup')) "$name server.lnk") -ErrorAction SilentlyContinue
Remove-Item (Join-Path ([Environment]::GetFolderPath('Programs')) $name) -Recurse -ErrorAction SilentlyContinue

$certName = "$name localhost"
# Remove only the certificate this installer created (matched by thumbprint), from both stores.
$mine = @(Get-ChildItem Cert:\CurrentUser\My | Where-Object { $_.FriendlyName -eq $certName })
$thumbs = $mine | ForEach-Object { $_.Thumbprint }
$roots = @(Get-ChildItem Cert:\CurrentUser\Root | Where-Object { $thumbs -contains $_.Thumbprint })
if ($roots.Count) { Write-Host 'Windows may ask to confirm removing the localhost certificate. Click Yes.' -ForegroundColor Yellow }
foreach ($cert in $roots + $mine) { Remove-Item $cert.PSPath -ErrorAction SilentlyContinue }

Remove-Item $dest -Recurse -Force -ErrorAction SilentlyContinue
if (Test-Path $dest) { Write-Host "Some files could not be removed. You can delete $dest by hand." -ForegroundColor Yellow }
Write-Host "$name has been removed." -ForegroundColor Green
Read-Host 'Press Enter to close' | Out-Null
