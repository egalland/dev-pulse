$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$secretFile = Join-Path $root 'data\quota-sync-token.dpapi'
$gatewayFile = Join-Path $root 'data\site-gateway-token.dpapi'
if (-not (Test-Path -LiteralPath $secretFile) -or -not (Test-Path -LiteralPath $gatewayFile)) { throw 'Clé de synchronisation Dev Pulse absente.' }

$inputData = [Console]::In.ReadToEnd() | ConvertFrom-Json
$secure = Get-Content -LiteralPath $secretFile -Raw | ConvertTo-SecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try { $token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
$gatewaySecure = Get-Content -LiteralPath $gatewayFile -Raw | ConvertTo-SecureString
$gatewayPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($gatewaySecure)
try { $gatewayToken = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($gatewayPointer) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($gatewayPointer) }

$payload = @{
  primaryUsedPercent = [double]$inputData.primaryUsedPercent
  weeklyUsedPercent = [double]$inputData.weeklyUsedPercent
  primaryResetsAt = [int64]$inputData.primaryResetsAt
  weeklyResetsAt = [int64]$inputData.weeklyResetsAt
} | ConvertTo-Json -Compress

$result = Invoke-RestMethod -Method Post -Uri 'https://dev-pulse-fox.emmanuel-galland117.chatgpt.site/api/quota-sync' -Headers @{Authorization="Bearer $token";'OAI-Sites-Authorization'="Bearer $gatewayToken"} -ContentType 'application/json' -Body $payload
if (-not $result.connected) { throw 'Le site n’a pas confirmé la synchronisation.' }
Write-Output 'Quota Dev Pulse synchronisé.'
