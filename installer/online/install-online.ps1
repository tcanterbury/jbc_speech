# Adds the hosted (GitHub Pages) JBC Speech add-in to Word for the current Windows user.
# Only saves the manifest and registers it with Word: no server, no certificate, no admin rights.
# Run through "Install JBC Speech (online).cmd". Safe to re-run to update.
# Keep this file ASCII-only: Windows PowerShell 5.1 misreads UTF-8 without a BOM.
$ErrorActionPreference = 'Stop'
$config = Get-Content (Join-Path $PSScriptRoot 'jbc-speech-online.json') -Raw | ConvertFrom-Json
$name = $config.name
$dest = Join-Path $env:LOCALAPPDATA $name

function Say($text, $color = 'Gray') { Write-Host $text -ForegroundColor $color }
Say "Installing $name $($config.version)" 'White'

# Word version: SharedRuntime 1.1 needs Microsoft 365 version 2205 (build 15202) or Word 2024.
$c2r = Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Office\ClickToRun\Configuration' -ErrorAction SilentlyContinue
if ($c2r -and $c2r.VersionToReport) {
    $build = [int]($c2r.VersionToReport.Split('.')[2])
    if ($build -lt 15202) {
        Say "Word build $build is too old. Update Office (File > Account > Update Options), then run this again." 'Yellow'
        exit 1
    }
    Say "Word $($c2r.VersionToReport): OK" 'Green'
} else {
    Say 'Could not read the Office version. Microsoft 365 or Word 2024 is required; continuing anyway.' 'Yellow'
}
while (Get-Process WINWORD -ErrorAction SilentlyContinue) {
    Read-Host 'Please close Word, then press Enter' | Out-Null
}

# Save the manifest and the uninstaller.
New-Item -ItemType Directory -Force $dest | Out-Null
foreach ($file in 'manifest.xml', 'uninstall-online.ps1', 'jbc-speech-online.json') {
    Copy-Item (Join-Path $PSScriptRoot $file) $dest -Force
}
Get-ChildItem $dest -File | Unblock-File
$manifest = Join-Path $dest 'manifest.xml'

# Register with Word (the same registry value "npm run sideload" uses).
$wef = 'HKCU:\Software\Microsoft\Office\16.0\WEF\Developer'
New-Item -Path $wef -Force | Out-Null
New-ItemProperty -Path $wef -Name $config.addinId -Value $manifest -PropertyType String -Force | Out-Null

# Settings > Apps entry.
$powershell = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$apps = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\$($config.addinId)"
New-Item -Path $apps -Force | Out-Null
$entry = @{
    DisplayName = $name; DisplayVersion = $config.version; Publisher = 'JBC Speech'; InstallLocation = $dest
    UninstallString = "`"$powershell`" -NoProfile -ExecutionPolicy Bypass -File `"$(Join-Path $dest 'uninstall-online.ps1')`""
}
foreach ($key in $entry.Keys) { New-ItemProperty -Path $apps -Name $key -Value $entry[$key] -PropertyType String -Force | Out-Null }
New-ItemProperty -Path $apps -Name NoModify -Value 1 -PropertyType DWord -Force | Out-Null
New-ItemProperty -Path $apps -Name NoRepair -Value 1 -PropertyType DWord -Force | Out-Null

# Check the site answers (Word loads the library from it).
try {
    Invoke-WebRequest $config.pageUrl -UseBasicParsing -TimeoutSec 10 | Out-Null
    Say "Library site reachable: $($config.siteUrl)" 'Green'
} catch {
    Say "Could not reach $($config.siteUrl) right now. Word needs it when the library opens." 'Yellow'
}

Write-Host ''
Say "$name is installed." 'Green'
Say 'Open Word, choose the JBC Speech tab, then IPA Library.' 'White'
Say 'Tip: for the best-looking symbols, use an IPA font such as Doulos SIL or Charis SIL.'
