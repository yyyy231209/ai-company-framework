# Validate plugin-manifest/v1 files (root manifest.json and optional plugins/feishu/manifest.json)
[CmdletBinding()]
param(
  [string]$Root = (Get-Location).Path
)

$ErrorActionPreference = 'Stop'
$requiredFields = @('schemaVersion','id','name','version','description','author','license','skills','hooks')
$requiredHookKeys = @('afterCompanyCreate','beforeFirstTask','afterTaskComplete','beforeDelivery')
$issues = 0

function Test-File([string]$path,[string]$label){
  if(-not (Test-Path $path)){ Write-Warning "missing $label ($path)"; $script:issues++; return $null }
  try {
    $raw = Get-Content -Raw -Encoding UTF8 $path
    $m = $raw | ConvertFrom-Json
    Write-Host "checking $label ..."
  } catch {
    Write-Warning "  parse failed: $($_.Exception.Message)"
    $script:issues++; return $null
  }
  foreach ($f in $requiredFields){
    if(-not $m.$f){
      Write-Warning "  missing required field: $f"
      $script:issues++
    }
  }
  if($m.schemaVersion -ne 'plugin-manifest/v1'){ Write-Warning "  bad schemaVersion: $($m.schemaVersion)"; $script:issues++ }
  if([string]::IsNullOrWhiteSpace($m.id)){ Write-Warning "  empty id"; $script:issues++ }
  if([string]::IsNullOrWhiteSpace($m.version)){ Write-Warning "  empty version"; $script:issues++ }
  foreach ($hk in $requiredHookKeys){
    if(-not $m.hooks.$hk){ Write-Warning "  missing hook array: $hk"; $script:issues++ }
  }
  foreach ($s in @($m.skills)){
    if([string]::IsNullOrWhiteSpace($s.file)){ Write-Warning "  skill missing file"; $script:issues++ }
    elseif(-not (Test-Path (Join-Path (Split-Path $path) $s.file))){ Write-Warning "  skill file not found: $($s.file)"; $script:issues++ }
  }
  Write-Host "  ok"
  return $m
}

Test-File (Join-Path $Root 'manifest.json') 'framework manifest'

$pluginDir = Join-Path $Root 'plugins\feishu'
if(Test-Path (Join-Path $pluginDir 'manifest.json')){
  Test-File (Join-Path $pluginDir 'manifest.json') 'feishu plugin manifest'
}

if($issues -gt 0){ Write-Error "manifest validation failed: $issues issue(s)"; exit 1 }
Write-Host 'manifest validation passed.'