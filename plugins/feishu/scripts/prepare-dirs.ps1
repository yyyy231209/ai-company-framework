[CmdletBinding()]
param()
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
# Called on afterCompanyCreate hook by the framework boss.
$root = $env:COMPANY_ROOT
if ([string]::IsNullOrWhiteSpace($root)) { throw 'COMPANY_ROOT env missing' }
New-Item -ItemType Directory -Force -Path (Join-Path $root '客户对话') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $root '交付') | Out-Null
Write-Output '{"ok":true,"note":"feishu dirs ready"}'
