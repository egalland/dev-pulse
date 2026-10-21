$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $root
Write-Host "Dev Pulse démarre sur http://localhost:8787" -ForegroundColor Green
Write-Host "Laisse cette fenêtre ouverte. Ctrl+C pour arrêter." -ForegroundColor DarkGray
node "$root\scripts\build-worker.mjs"
node "$root\server.js"
