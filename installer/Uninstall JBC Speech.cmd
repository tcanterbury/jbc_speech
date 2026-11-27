@echo off
rem Double-click to remove JBC Speech. (It can also be removed from Settings > Apps.)
set "UNINSTALL=%LOCALAPPDATA%\JBC Speech\uninstall.ps1"
if not exist "%UNINSTALL%" (
  echo JBC Speech does not appear to be installed.
  pause
  exit /b 1
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%UNINSTALL%"
