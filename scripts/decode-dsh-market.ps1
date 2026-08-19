$gh = 'C:\Program Files\GitHub CLI\gh.exe'
$raw = & $gh api repos/dsh-market/dsh-market/contents/data/registry-snapshot.json | ConvertFrom-Json
$bytes = [System.Convert]::FromBase64String($raw.content)
$json = [System.Text.Encoding]::UTF8.GetString($bytes)
$obj = $json | ConvertFrom-Json
Write-Output '--- top-level keys ---'
foreach($p in $obj.PSObject.Properties) {
  Write-Output ("key=" + $p.Name + " type=" + $p.Type.Name)
}
Write-Output '--- schema ---'
if($obj.schema) { $obj.schema | ConvertTo-Json -Depth 6 }
if($obj.plugins) { Write-Output ("plugin count=" + $obj.plugins.Count) }
Write-Output '--- first plugin ---'
if($obj.plugins) {
  $first = $obj.plugins | Select-Object -First 1
  $first | ConvertTo-Json -Depth 6
}