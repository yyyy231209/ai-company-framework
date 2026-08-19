$gh = 'C:\Program Files\GitHub CLI\gh.exe'
$raw = & $gh api repos/dsh-market/dsh-market/contents/data/registry-snapshot.json | ConvertFrom-Json
$downloadUrl = $raw.download_url
Write-Output "download_url: $downloadUrl"
$json = Invoke-RestMethod -Uri $downloadUrl
$obj = $json | ConvertFrom-Json
Write-Output '--- top-level structure ---'
foreach ($p in $obj.PSObject.Properties) {
  Write-Output ("key=" + $p.Name + " type=" + $p.Type.Name)
}
Write-Output '--- first plugin sample ---'
$sample = $null
if ($obj.plugins) { $sample = $obj.plugins | Select-Object -First 1 }
elseif ($obj.entries) { $sample = $obj.entries | Select-Object -First 1 }
elseif ($obj[0]) { $sample = $obj[0] }
if ($sample) {
  $sample | ConvertTo-Json -Depth 6
}