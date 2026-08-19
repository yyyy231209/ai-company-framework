[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'

$gh = 'C:\Program Files\GitHub CLI\gh.exe'

Write-Output '--- 1. load catalog snapshot ---'
$raw = & $gh api repos/dsh-market/dsh-market/contents/data/registry-snapshot.json | ConvertFrom-Json
$bytes = [System.Convert]::FromBase64String($raw.content)
$json = [System.Text.Encoding]::UTF8.GetString($bytes)
$obj = $json | ConvertFrom-Json

Write-Output '--- 2. check existing entry ---'
$existing = @($obj.plugins | Where-Object { $_.name -eq 'ai-company-framework' })
if ($existing.Count -gt 0) {
  Write-Output 'plugin already listed in dsh-market, nothing to do'
  exit 0
}

Write-Output '--- 3. build plugin entry ---'
$today = (Get-Date).ToString('yyyy-MM-dd')

# Build the entry via ConvertFrom-Json so we avoid PowerShell's hash-literal parser
$entryJson = @'
{
  "name": "ai-company-framework",
  "owner": "yyyy231209",
  "url": "https://github.com/yyyy231209/ai-company-framework",
  "page": "https://awesome-dsh-plugin.com/p/yyyy231209/ai-company-framework/",
  "category": "market",
  "description": {
    "en": "Multi-agent company and workflow starter kit for DeepSeek Harness: role Skills, model routing rules, task graph conventions, QA loop, delivery packaging, and an optional Feishu plugin.",
    "zh": "DeepSeek Harness 多 Agent 公司与工作流入门套件：包含 14 个 Skills、模型路由规则、任务图、质检返工、交付打包、可选飞书插件。"
  },
  "npm": null,
  "stars": 0,
  "install": "dsh plugin --profile web add github:yyyy231209/ai-company-framework",
  "added": "DATE_PLACEHOLDER"
}
'@ -replace 'DATE_PLACEHOLDER', $today

$entry = $entryJson | ConvertFrom-Json

$updated = @($obj.plugins) + @($entry)

Write-Output '--- 4. serialize updated snapshot ---'
$newObj = [ordered]@{
  name       = $obj.name
  url        = $obj.url
  source     = $obj.source
  updated    = $today
  count      = $updated.Count
  categories = $obj.categories
  plugins    = $updated
}
$newJson = $newObj | ConvertTo-Json -Depth 10
$tmpJson = Join-Path $env:TEMP 'registry-snapshot.json'
Set-Content -LiteralPath $tmpJson -Value $newJson -Encoding UTF8

Write-Output '--- 5. fork dsh-market (idempotent) ---'
$ErrorActionPreference = 'Continue'
$ghFork = & $gh repo fork dsh-market/dsh-market --clone=false 2>&1
$ErrorActionPreference = 'Stop'
$ghForkText = @($ghFork) -join "`n"
Write-Output $ghForkText
if ($LASTEXITCODE -ne 0 -and ($ghForkText -notmatch 'already exists')) {
  throw 'fork failed'
}

Write-Output '--- 6. clone fork and push branch ---'
$tmpRepo = Join-Path $env:TEMP ('dsh-market-fork-' + [guid]::NewGuid().ToString('N'))
$ErrorActionPreference = 'Continue'
git clone --depth 1 https://github.com/yyyy231209/dsh-market.git $tmpRepo 2>&1 | Out-String
if ($LASTEXITCODE -ne 0) { throw 'git clone failed' }
$ErrorActionPreference = 'Stop'
Push-Location $tmpRepo
git checkout -q -b add-ai-company-framework
Copy-Item -Force $tmpJson .\data\registry-snapshot.json
git add .\data\registry-snapshot.json
git -c user.email='framework@local' -c user.name='AI Company Framework' commit -q -m 'feat(catalog): add ai-company-framework plugin'
git push -q -u origin add-ai-company-framework

Write-Output '--- 7. open pull request ---'
$prTitle = 'Add ai-company-framework to dsh-market catalog'
$prBody = 'This PR adds the `ai-company-framework` plugin to the dsh-market catalog.'
$prBody += [Environment]::NewLine + [Environment]::NewLine
$prBody += '- repo: https://github.com/yyyy231209/ai-company-framework'
$prBody += [Environment]::NewLine + '- category: market'
$prBody += [Environment]::NewLine + '- install: `dsh plugin --profile web add github:yyyy231209/ai-company-framework`'
$prBody += [Environment]::NewLine + [Environment]::NewLine
$prBody += 'AI Company Framework is a multi-agent company and workflow starter kit built on DeepSeek Harness. It includes 14 Skills (3 framework + 11 roles), 7 process templates, model routing rules, QA loop, delivery packaging, and an optional Feishu plugin. The repo ships a `plugin-manifest/v1` root manifest and is compatible with `dshmarket >= 1.9.0`.'
& $gh pr create --repo dsh-market/dsh-market --head 'yyyy231209:add-ai-company-framework' --title $prTitle --body $prBody 2>&1 | Out-String
Pop-Location
Remove-Item -Recurse -Force $tmpRepo