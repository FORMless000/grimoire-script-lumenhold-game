# Host Lumenhold Academy on all network interfaces (0.0.0.0), for this machine and the local network.
# Windows (PowerShell).   .\scripts\host.ps1 [-Port 4173]     (or $env:ADMIN_TOKEN / $env:DATA_DIR)
# The admin token is kept in data\.host-token so the links stay the same between runs.
param([int]$Port = $(if ($env:PORT) { [int]$env:PORT } else { 4173 }))
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Error 'Node.js 20 or newer is required: https://nodejs.org/'; exit 1 }
$major = [int](node -p "process.versions.node.split('.')[0]")
if ($major -lt 20) { Write-Error "Node.js 20 or newer is required (found $(node -v))."; exit 1 }

$env:HOST = '0.0.0.0'
$env:PORT = "$Port"
if (-not $env:ADMIN_TOKEN) { $env:ADMIN_TOKEN = (node scripts/host-info.js token) }

Write-Host "Lumenhold Academy, hosted on port $Port"
node scripts/host-info.js urls $Port $env:ADMIN_TOKEN
Write-Host "  Windows may ask whether to allow node through the firewall: allow it on Private networks."
Write-Host "  If other machines still can't connect (as administrator):"
Write-Host "    New-NetFirewallRule -DisplayName 'Lumenhold' -Direction Inbound -Protocol TCP -LocalPort $Port -Action Allow -Profile Private"
Write-Host "  Stop with Ctrl+C."
Write-Host ""
node server/index.js
