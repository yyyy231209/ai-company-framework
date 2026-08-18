[CmdletBinding()]
param(
  [string]$Root = ''
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repo = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if ([string]::IsNullOrWhiteSpace($Root)) { $Root = $repo }

$failures = @()
function Check([string]$Label, [bool]$Ok, [string]$Detail) {
  if ($Ok) { Write-Output ("PASS  " + $Label) }
  else { Write-Output ("FAIL  " + $Label + " :: " + $Detail); $script:failures += $Label }
}

# 1. Required files
$requiredFiles = @(
  'LICENSE',
  'README.md',
  'CHANGELOG.md',
  '.gitignore',
  'core/skills/company-boss.md',
  'core/skills/company-pipeline.md',
  'core/skills/company-role-template.md',
  'core/skills/role-writer.md',
  'core/skills/role-customer-service.md',
  'core/skills/role-qa.md',
  'core/templates/task.md',
  'core/templates/qc.md',
  'core/templates/delivery.md',
  'core/feishu-onboarding-sop.md',
  'docs/QUICKSTART.md',
  'docs/ARCHITECTURE.md',
  'docs/PLUGINS.md',
  'docs/FAQ.md',
  'docs/TROUBLESHOOTING.md',
  'plugins/feishu/manifest.json',
  'plugins/feishu/README.md',
  'examples/ecommerce-coffee/README.md',
  'scripts/install.ps1',
  'scripts/verify.ps1',
  'scripts/security-scan.ps1'
)
foreach ($f in $requiredFiles) {
  Check ("file exists: " + $f) (Test-Path (Join-Path $Root $f)) 'missing'
}

# 2. LICENSE is MIT
$license = Get-Content -Raw (Join-Path $Root 'LICENSE')
Check 'LICENSE is MIT' ($license -match 'MIT License') 'not MIT'

# 3. No RAG remnants
$ragHits = @(Get-ChildItem -LiteralPath $Root -Recurse -File | Where-Object { $_.Name -match 'rag|knowledge' })
Check 'no RAG/knowledge files in repo' ($ragHits.Count -eq 0) ('found: ' + (($ragHits | ForEach-Object Name) -join ','))

# 4. Skill count expectation
$skills = @(Get-ChildItem (Join-Path $Root 'core\skills') -File)
Check ('core skills count >= 14 (got ' + $skills.Count + ')') ($skills.Count -ge 14) 'too few'

# 5. Templates count
$templates = @(Get-ChildItem (Join-Path $Root 'core\templates') -File)
Check ('templates count = 7 (got ' + $templates.Count + ')') ($templates.Count -eq 7) 'unexpected'

# 6. Plugin manifest parses
try {
  $manifest = Get-Content -Raw -Encoding UTF8 (Join-Path $Root 'plugins\feishu\manifest.json') | ConvertFrom-Json
  Check 'feishu manifest schemaVersion' ($manifest.schemaVersion -eq 'plugin-manifest/v1') 'bad schema'
  Check 'feishu manifest id' ($manifest.id -eq 'feishu') 'bad id'
} catch {
  Check 'feishu manifest parses' $false $_.Exception.Message
}

# 7. Security scan
$scanOut = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $Root 'scripts\security-scan.ps1') -Root $Root 2>&1
Check 'security-scan passes' ($LASTEXITCODE -eq 0) ($scanOut -join ' ')

Write-Output ''
if ($failures.Count -eq 0) { Write-Output 'SMOKE PASS: all checks green.'; exit 0 }
Write-Output ('SMOKE FAIL: ' + $failures.Count + ' check(s): ' + ($failures -join ', '))
exit 1
