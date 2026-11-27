# Installs JBC Speech for the current Windows user. No administrator rights needed.
# Run through "Install JBC Speech.cmd". Safe to re-run to update.
# Keep this file ASCII-only: Windows PowerShell 5.1 misreads UTF-8 without a BOM.
$ErrorActionPreference = 'Stop'
$package = Join-Path $PSScriptRoot 'app'
$config = Get-Content (Join-Path $package 'jbc-speech.json') -Raw | ConvertFrom-Json
$name = $config.name
$dest = Join-Path $env:LOCALAPPDATA $name
$certName = "$name localhost"

function Say($text, $color = 'Gray') { Write-Host $text -ForegroundColor $color }
function Step($text) { Write-Host ''; Write-Host "== $text" -ForegroundColor Cyan }

Say "Installing $name $($config.version)" 'White'
Say "Folder: $dest"

# --- Word version ------------------------------------------------------------
Step 'Checking Word'
$minimumBuild = 15202   # Microsoft 365 version 2205: first build with SharedRuntime 1.1
$c2r = Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Office\ClickToRun\Configuration' -ErrorAction SilentlyContinue
if ($c2r -and $c2r.VersionToReport) {
    $build = [int]($c2r.VersionToReport.Split('.')[2])
    if ($build -lt $minimumBuild) {
        Say "Word build $build is older than $minimumBuild. Update Office (File > Account > Update Options), then run this again." 'Yellow'
        exit 1
    }
    Say "Word $($c2r.VersionToReport): OK" 'Green'
} else {
    Say 'Could not read the Office version. Microsoft 365 or Word 2024 is required; continuing anyway.' 'Yellow'
}
while (Get-Process WINWORD -ErrorAction SilentlyContinue) {
    Read-Host 'Please close Word, then press Enter' | Out-Null
}

# --- Files -----------------------------------------------------------------------
Step 'Copying files'
$nodeExe = Join-Path $dest 'node\node.exe'
Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $nodeExe } | Stop-Process -Force
Start-Sleep -Milliseconds 500
New-Item -ItemType Directory -Force $dest | Out-Null
foreach ($old in 'src', 'scripts', 'node') {
    $path = Join-Path $dest $old
    if (Test-Path $path) { Remove-Item $path -Recurse -Force }
}
Copy-Item (Join-Path $package '*') $dest -Recurse -Force
Get-ChildItem $dest -Recurse -File | Unblock-File
Say 'Done' 'Green'

# --- Certificate -------------------------------------------------------------------
# Word only loads add-in pages over HTTPS, so the local server needs a certificate that
# Windows trusts. It is created on this PC, for "localhost" only, and is never shared.
Step 'Setting up the local certificate'
$certDir = Join-Path $dest 'cert'
$pfxPath = Join-Path $dest $config.pfx
$passPath = Join-Path $dest $config.passphraseFile
New-Item -ItemType Directory -Force $certDir | Out-Null
$cert = Get-ChildItem Cert:\CurrentUser\My |
    Where-Object { $_.FriendlyName -eq $certName -and $_.NotAfter -gt (Get-Date).AddDays(60) } |
    Sort-Object NotAfter -Descending | Select-Object -First 1
if (-not $cert -or -not (Test-Path $pfxPath) -or -not (Test-Path $passPath)) {
    $cert = New-SelfSignedCertificate -Subject 'CN=localhost' -FriendlyName $certName `
        -CertStoreLocation Cert:\CurrentUser\My -NotAfter (Get-Date).AddYears(5) `
        -KeyAlgorithm RSA -KeyLength 2048 -HashAlgorithm SHA256 -KeyExportPolicy Exportable `
        -KeyUsage DigitalSignature, KeyEncipherment `
        -TextExtension @('2.5.29.17={text}DNS=localhost&IPAddress=127.0.0.1&IPAddress=::1', '2.5.29.37={text}1.3.6.1.5.5.7.3.1')
    $passphrase = [guid]::NewGuid().ToString('N')
    Set-Content -Path $passPath -Value $passphrase -Encoding ASCII -NoNewline
    Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password (ConvertTo-SecureString $passphrase -AsPlainText -Force) | Out-Null
    Say 'Created a new certificate' 'Green'
} else {
    Say 'Reusing the existing certificate' 'Green'
}
$trusted = Get-ChildItem Cert:\CurrentUser\Root | Where-Object { $_.Thumbprint -eq $cert.Thumbprint }
if (-not $trusted) {
    Say ''
    Say 'Windows will now ask: "Do you want to install this certificate?"' 'Yellow'
    Say 'It is for "localhost" (this PC only). Please click YES.' 'Yellow'
    $cer = Join-Path $env:TEMP 'jbc-speech-localhost.cer'
    Export-Certificate -Cert $cert -FilePath $cer | Out-Null
    try { Import-Certificate -FilePath $cer -CertStoreLocation Cert:\CurrentUser\Root | Out-Null }
    catch {
        Say 'The certificate was not trusted, so Word would not be able to open the library.' 'Red'
        Say 'Run "Install JBC Speech" again and click Yes when Windows asks.' 'Red'
        exit 1
    }
    finally { Remove-Item $cer -ErrorAction SilentlyContinue }
}
Say 'Certificate trusted' 'Green'

# --- Background server -------------------------------------------------------------
Step 'Starting the library server'
$serverScript = Join-Path $dest 'scripts\server.mjs'
$configPath = Join-Path $dest 'jbc-speech.json'
$serverArgs = "`"$serverScript`" --config `"$configPath`" --background"
$shell = New-Object -ComObject WScript.Shell
function New-Shortcut($path, $target, $arguments, $description, $style = 7) {
    $link = $shell.CreateShortcut($path)
    $link.TargetPath = $target
    $link.Arguments = $arguments
    $link.WorkingDirectory = $dest
    $link.WindowStyle = $style
    $link.Description = $description
    $link.Save()
}
$startup = [Environment]::GetFolderPath('Startup')
$programs = Join-Path ([Environment]::GetFolderPath('Programs')) $name
New-Item -ItemType Directory -Force $programs | Out-Null
New-Shortcut (Join-Path $startup "$name server.lnk") $nodeExe $serverArgs "Starts the $name library for Word"
New-Shortcut (Join-Path $programs "Start $name server.lnk") $nodeExe $serverArgs "Starts the $name library for Word if it is not running"
$powershell = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$uninstall = Join-Path $dest 'uninstall.ps1'
New-Shortcut (Join-Path $programs "Uninstall $name.lnk") $powershell "-NoProfile -ExecutionPolicy Bypass -File `"$uninstall`"" "Removes $name" 1

Start-Process -FilePath $nodeExe -ArgumentList $serverArgs -WorkingDirectory $dest -WindowStyle Hidden
$url = "https://localhost:$($config.port)/taskpane.html"
$ok = $false
foreach ($i in 1..20) {
    Start-Sleep -Milliseconds 500
    try { Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 3 | Out-Null; $ok = $true; break } catch { }
}
if ($ok) { Say "Server running and trusted at https://localhost:$($config.port)" 'Green' }
else { Say "The server did not answer at $url. See $(Join-Path $dest $config.log)" 'Yellow' }

# --- Register with Word, and with Settings > Apps ---------------------------------------------
Step 'Adding the add-in to Word'
$manifest = Join-Path $dest 'manifest.xml'
$wef = 'HKCU:\Software\Microsoft\Office\16.0\WEF\Developer'
New-Item -Path $wef -Force | Out-Null
New-ItemProperty -Path $wef -Name $config.addinId -Value $manifest -PropertyType String -Force | Out-Null
$apps = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\$($config.addinId)"
New-Item -Path $apps -Force | Out-Null
$entry = @{
    DisplayName = $name; DisplayVersion = $config.version; Publisher = $name
    InstallLocation = $dest; DisplayIcon = $nodeExe
    UninstallString = "`"$powershell`" -NoProfile -ExecutionPolicy Bypass -File `"$uninstall`""
}
foreach ($key in $entry.Keys) { New-ItemProperty -Path $apps -Name $key -Value $entry[$key] -PropertyType String -Force | Out-Null }
New-ItemProperty -Path $apps -Name NoModify -Value 1 -PropertyType DWord -Force | Out-Null
New-ItemProperty -Path $apps -Name NoRepair -Value 1 -PropertyType DWord -Force | Out-Null
Say 'Done' 'Green'

# Add it to Word: registering only lists the add-in; opening a document that references it adds the
# JBC Speech tab to the ribbon. The document stays available from the Start menu.
. (Join-Path $PSScriptRoot 'New-WelcomeDocument.ps1')
$welcome = Join-Path $dest 'Welcome to JBC Speech.docx'
$version = ([xml](Get-Content $manifest -Raw)).OfficeApp.Version
New-WelcomeDocument -Path $welcome -AddinId $config.addinId -Version $version
$link = $shell.CreateShortcut((Join-Path $programs "Open $name in Word.lnk"))
$link.TargetPath = $welcome
$link.Description = 'Opens Word with the JBC Speech IPA library'
$link.Save()

Write-Host ''
Say "$name is installed." 'Green'
Say 'Word will now open a short welcome document. The JBC Speech tab appears on the ribbon,' 'White'
Say 'and the IPA library opens on the right. You can close the document without saving.' 'White'
Say 'If Word asks whether to trust or start the add-in, choose Yes / Trust.'
Say 'Tip: for the best-looking symbols, use an IPA font such as Doulos SIL or Charis SIL.'
Start-Process -FilePath $welcome
