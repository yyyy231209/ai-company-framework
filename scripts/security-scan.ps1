[CmdletBinding()]
param(
  [string]$Root = ''
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($Root)) { $Root = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..')) }
$Root = [System.IO.Path]::GetFullPath($Root)

$patterns = @(
  @{ name = 'app-secret'; regex = '(app|client)[ _-]?secret\s*[:=]' },
  @{ name = 'bearer-token'; regex = 'Bearer\s+[A-Za-z0-9._~+/=-]{12,}' },
  @{ name = 'feishu-webhook'; regex = 'open\.feishu\.cn/open-apis/bot/v2/hook/[A-Za-z0-9_-]{8,}' },
  @{ name = 'app-scoped-id'; regex = '\b(oc|ou)_[A-Za-z0-9-]{8,}\b' },
  @{ name = 'mainland-phone'; regex = '(?<!\d)1[3-9]\d{9}(?!\d)' },
  @{ name = 'cookie-header'; regex = '(?m)^\s*(cookie|set-cookie)\s*:' },
  @{ name = 'private-key'; regex = 'BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY' }
)

$files = Get-ChildItem -LiteralPath $Root -Recurse -File | Where-Object {
  $_.FullName -notmatch '\\.git\\' -and $_.Extension -in @('.md', '.ps1', '.mjs', '.js', '.json', '.txt', '.psm1', '.yml', '.yaml', '.html')
}
$findings = @()
foreach ($file in $files) {
  $rel = $file.FullName.Substring($Root.Length).TrimStart('\')
  $text = Get-Content -Raw -Encoding UTF8 $file.FullName
  foreach ($p in $patterns) {
    if ($text -match $p.regex) {
      $findings += [pscustomobject]@{ file = $rel; type = $p.name }
    }
  }
}

if ($findings.Count -gt 0) {
  Write-Output ('SECURITY FAIL: ' + $findings.Count + ' finding(s)')
  $findings | ForEach-Object { Write-Output ('  - ' + $_.file + ' [' + $_.type + ']') }
  exit 1
}
Write-Output 'SECURITY PASS: no secrets, credentials, or scoped identifiers found in repo.'
exit 0
