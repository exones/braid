# Publish the verified public package. The npm token comes from Infisical.
# The token is not printed, committed, or written into the repository.
# GitHub Actions release.yml stays on trusted publishing and does not call Infisical.
#Requires -Version 7.6
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot
. (Join-Path $PSScriptRoot 'Install-NodeToolchain.ps1')

$environment = if ($env:BRAID_INFISICAL_ENV) { $env:BRAID_INFISICAL_ENV } else { 'prod' }
$secretName = if ($env:BRAID_INFISICAL_SECRET) { $env:BRAID_INFISICAL_SECRET } else { 'NPM_TOKEN' }
$folder = if ($env:BRAID_INFISICAL_PATH) { $env:BRAID_INFISICAL_PATH } else { '/' }
$projectId = $env:BRAID_INFISICAL_PROJECT_ID

if ([string]::IsNullOrWhiteSpace($projectId)) {
  $yamlLink = Join-Path $repoRoot '.infisical.yaml'
  if (Test-Path -LiteralPath $yamlLink) {
    $yaml = Get-Content -LiteralPath $yamlLink
    $inSecrets = $false
    foreach ($line in $yaml) {
      if ($line -match '^\s*secrets-management:\s*$') { $inSecrets = $true; continue }
      if ($inSecrets -and $line -match '^\S') { break }
      if ($inSecrets -and $line -match '^\s*project-id:\s*(\S+)\s*$') { $projectId = $Matches[1]; break }
    }
  }
}
if ([string]::IsNullOrWhiteSpace($projectId)) {
  $link = Join-Path $repoRoot '.infisical.json'
  if (Test-Path -LiteralPath $link) {
    $linked = Get-Content -Raw -LiteralPath $link | ConvertFrom-Json
    if ($linked.workspaceId) { $projectId = [string]$linked.workspaceId }
    elseif ($linked.projectId) { $projectId = [string]$linked.projectId }
  }
}
if ([string]::IsNullOrWhiteSpace($projectId)) {
  Write-Error "No Infisical project is linked. Run 'infisical init' in the repository, or set BRAID_INFISICAL_PROJECT_ID. The secret name is $secretName in environment $environment."
  exit 1
}

$infisical = Get-Command infisical -ErrorAction SilentlyContinue
if ($null -eq $infisical) {
  Write-Error 'infisical is not on PATH.'
  exit 1
}

$fetch = & $infisical.Source @('sm', 'secrets', 'get', $secretName, '--env', $environment, '--path', $folder, '--projectId', $projectId, '--output', 'json', '--silent') 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Error "Infisical could not read $secretName from project $projectId, environment $environment, path $folder. The value was not printed."
  exit 1
}
$parsed = ($fetch | Out-String) | ConvertFrom-Json
$record = @($parsed) | Where-Object { $_.secretKey -eq $secretName } | Select-Object -First 1
$token = if ($null -ne $record) { [string]$record.secretValue } else { '' }
if ([string]::IsNullOrWhiteSpace($token)) {
  Write-Error "Infisical returned no value for $secretName. The value was not printed."
  exit 1
}

$bin = Resolve-BraidNodeToolchain
$node = Join-Path $bin $(if ($IsWindows) { 'node.exe' } else { 'node' })
$npmCli = Join-Path $bin 'node_modules/npm/bin/npm-cli.js'
if (-not (Test-Path -LiteralPath $npmCli)) {
  $npmCli = Join-Path (Split-Path -Parent $bin) 'lib/node_modules/npm/bin/npm-cli.js'
}
if (-not (Test-Path -LiteralPath $node) -or -not (Test-Path -LiteralPath $npmCli)) {
  Write-Error "Node.js toolchain is incomplete: $bin"
  exit 1
}

$pkg = Get-Content -Raw -LiteralPath (Join-Path $repoRoot 'package.json') | ConvertFrom-Json
if ($pkg.private -eq $true) {
  Write-Error 'package.json private is true. npm publish was not run.'
  exit 1
}
if ($pkg.name -ne 'braid' -or $pkg.version -ne '0.1.0') {
  Write-Error "Refusing to publish $($pkg.name)@$($pkg.version). This script publishes public braid@0.1.0."
  exit 1
}

$tarballDir = Join-Path $repoRoot 'artifacts/package'
$tarballs = @(Get-ChildItem -LiteralPath $tarballDir -Filter 'braid-0.1.0.tgz' -File -ErrorAction SilentlyContinue)
if ($tarballs.Count -ne 1) {
  Write-Error 'Expected artifacts/package/braid-0.1.0.tgz from a clean package proof. npm publish was not run.'
  exit 1
}

$npmrc = Join-Path ([System.IO.Path]::GetTempPath()) ("braid-npmrc-{0}" -f [guid]::NewGuid().ToString('n'))
$utf8 = New-Object System.Text.UTF8Encoding $false
try {
  [System.IO.File]::WriteAllText($npmrc, "//registry.npmjs.org/:_authToken=$token`n", $utf8)
  $token = $null
  & $node $npmCli @('publish', '--ignore-scripts', '--access', 'public', '--userconfig', $npmrc, $tarballs[0].FullName)
  $code = $LASTEXITCODE
  if ($code -ne 0) { exit $code }
}
finally {
  $token = $null
  if (Test-Path -LiteralPath $npmrc) { Remove-Item -LiteralPath $npmrc -Force }
}

Write-Output "published $($pkg.name)@$($pkg.version) from $($tarballs[0].Name)"
