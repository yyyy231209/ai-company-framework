[CmdletBinding()]
param(
  [string]$Target = ''
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repo = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if ([string]::IsNullOrWhiteSpace($Target)) {
  $dshHome = $env:DSH_HOME
  if ([string]::IsNullOrWhiteSpace($dshHome)) { $dshHome = Join-Path $env:APPDATA 'dsh-desktop\harness' }
  $Target = Join-Path $dshHome 'skills'
}

$required = @(
  'company-boss.md',
  'company-pipeline.md',
  'company-role-template.md',
  'role-writer.md',
  'role-customer-service.md',
  'role-qa.md',
  'role-finance.md',
  'role-editor.md',
  'role-researcher.md',
  'role-coder.md',
  'role-ops.md',
  'role-hr.md',
  'role-data.md',
  'role-translator.md'
)

$missing = @()
foreach ($name in $required) {
  if (-not (Test-Path (Join-Path $Target $name))) { $missing += $name }
}
$templates = Join-Path $Target 'company-pipeline\templates'
if (-not (Test-Path $templates)) { $missing += 'company-pipeline/templates/' }

$node = Get-Command node -ErrorAction SilentlyContinue
$result = [ordered]@{
  ok = ($missing.Count -eq 0)
  target = $Target
  requiredCount = $required.Count
  missing = @($missing)
  nodeAvailable = ($null -ne $node)
  note = if ($missing.Count -eq 0) { 'framework skills ready' } else { 'run scripts\install.ps1 first' }
}
$result | ConvertTo-Json -Depth 6
if ($missing.Count -gt 0) { exit 1 }
