[CmdletBinding()]
param(
  [string]$SkillRoot = '',
  [string]$Target = ''
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Utf8NoBom([string]$Path, [string]$Content) {
  $encoding = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $encoding)
}

# Resolve repo root (this script lives in <repo>/scripts)
$repo = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if ([string]::IsNullOrWhiteSpace($SkillRoot)) { $SkillRoot = Join-Path $repo 'core\skills' }
if ([string]::IsNullOrWhiteSpace($Target)) {
  $dshHome = $env:DSH_HOME
  if ([string]::IsNullOrWhiteSpace($dshHome)) { $dshHome = Join-Path $env:APPDATA 'dsh-desktop\harness' }
  $Target = Join-Path $dshHome 'skills'
}

if (-not (Test-Path $SkillRoot)) { throw "Skill source not found: $SkillRoot" }
New-Item -ItemType Directory -Force -Path $Target | Out-Null

$copied = @()
Get-ChildItem -LiteralPath $SkillRoot -File | ForEach-Object {
  Copy-Item $_.FullName (Join-Path $Target $_.Name) -Force
  $copied += $_.Name
}
# Templates: keep in a company-pipeline subfolder inside target skills
$templateSource = Join-Path $repo 'core\templates'
if (Test-Path $templateSource) {
  $templateTarget = Join-Path $Target 'company-pipeline\templates'
  New-Item -ItemType Directory -Force -Path $templateTarget | Out-Null
  Get-ChildItem -LiteralPath $templateSource -File | ForEach-Object {
    Copy-Item $_.FullName (Join-Path $templateTarget $_.Name) -Force
    $copied += ('company-pipeline/templates/' + $_.Name)
  }
}
$sop = Join-Path $repo 'core\feishu-onboarding-sop.md'
if (Test-Path $sop) {
  Copy-Item $sop (Join-Path $Target 'company-pipeline\feishu-onboarding-sop.md') -Force
  $copied += 'company-pipeline/feishu-onboarding-sop.md'
}

[ordered]@{
  ok = $true
  target = $Target
  installed = @($copied)
  note = 'restart Harness or reload skills to pick up changes'
} | ConvertTo-Json -Depth 6
