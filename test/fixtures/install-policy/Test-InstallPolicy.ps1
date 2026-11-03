# Separate install project for the repository .npmrc policy.
# Not a root dependency. Does not call scripts/Verify.ps1.
# An allowScripts value of false skips the script and lets install exit 0,
# so the failing project stays unreviewed. On npm 11.20.0 a file: dependency is
# linked, and the link records file:../scripty. That is the entry that matches
# the node whose script would run. The package name does not match a file: dep.
#Requires -Version 7.6
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
Set-StrictMode -Version Latest

if ($env:BRAID_INSTALL_POLICY -eq '1') {
  Write-Error 'test/fixtures/install-policy/Test-InstallPolicy.ps1 must not invoke itself.'
  exit 1
}
$env:BRAID_INSTALL_POLICY = '1'

$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../..'))
. (Join-Path $repoRoot 'scripts/Install-NodeToolchain.ps1')

$script:SourceMarker = Join-Path $PSScriptRoot 'scripty/ran.txt'
$script:Work = $null

function Fail {
  param([Parameter(Mandatory = $true)][string]$Message)
  [Console]::Error.WriteLine("install-policy failed: $Message")
  exit 1
}

function Remove-Work {
  param([Parameter(Mandatory = $true)][string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    return
  }
  for ($attempt = 0; $attempt -lt 3; $attempt++) {
    try {
      Remove-Item -LiteralPath $Path -Recurse -Force -ErrorAction Stop
      return
    } catch {
      Start-Sleep -Milliseconds 200
    }
  }
  [Console]::Error.WriteLine("install-policy: left temp directory in place: $Path")
}

function Write-Utf8NoBom {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [AllowEmptyString()][Parameter(Mandatory = $true)][string]$Text
  )
  $normalized = $Text.Replace("`r`n", "`n").Replace("`r", "`n")
  if ($normalized.Length -gt 0 -and -not $normalized.EndsWith("`n")) {
    $normalized += "`n"
  }
  $utf8 = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText($Path, $normalized, $utf8)
}

function Get-OutputText {
  param($Lines)
  if ($null -eq $Lines) {
    return ''
  }
  return ((@($Lines) | ForEach-Object { "$_" }) -join "`n")
}

function Get-LastOutputLine {
  param([Parameter(Mandatory = $true)][string]$Text)
  $kept = @($Text -split "`r?`n" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
  if ($kept.Count -eq 0) {
    return ''
  }
  return $kept[-1].Trim()
}

function Invoke-PolicyNpm {
  param(
    [Parameter(Mandatory = $true)][string]$WorkingDirectory,
    [Parameter(Mandatory = $true)][string[]]$NpmArguments
  )
  foreach ($arg in $NpmArguments) {
    if ($arg -match '^(?i)--ignore-scripts(?:=|$)' -or $arg -match '^(?i)--dangerously-allow-all-scripts(?:=|$)') {
      Fail 'fixture npm arguments must not bypass install scripts'
    }
  }
  $previous = Get-Location
  try {
    Set-Location -LiteralPath $WorkingDirectory
    $lines = @(& $node $npmCli @NpmArguments 2>&1)
    $code = $LASTEXITCODE
  } finally {
    Set-Location -LiteralPath $previous
  }
  return [pscustomobject]@{
    ExitCode = $code
    Text = (Get-OutputText $lines)
  }
}

function Assert-PolicyConfig {
  param(
    [Parameter(Mandatory = $true)][string]$Project,
    [Parameter(Mandatory = $true)][string]$Key,
    [Parameter(Mandatory = $true)][string]$Expected
  )
  $result = Invoke-PolicyNpm -WorkingDirectory $Project -NpmArguments (@('config', 'get', $Key) + $script:NpmIsolation)
  if ($result.ExitCode -ne 0) {
    Fail "npm config get $Key exited $($result.ExitCode)`n$($result.Text)"
  }
  $actual = Get-LastOutputLine $result.Text
  if ($actual -cne $Expected) {
    Fail "npm config get $Key returned '$actual', expected '$Expected'`n$($result.Text)"
  }
}

function New-PolicyProject {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$PackageJson,
    [switch]$IncludeScripty
  )
  $dir = Join-Path $script:Work $Name
  New-Item -ItemType Directory -Path $dir | Out-Null
  Copy-Item -LiteralPath $script:RepoNpmrc -Destination (Join-Path $dir '.npmrc')
  Write-Utf8NoBom -Path (Join-Path $dir 'package.json') -Text $PackageJson
  if ($IncludeScripty) {
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'scripty') -Destination (Join-Path $dir 'scripty') -Recurse
  }
  return $dir
}

function Clear-RunMarkers {
  param([Parameter(Mandatory = $true)][string]$Project)
  foreach ($path in @(
      (Join-Path $Project 'ran.txt'),
      (Join-Path $Project 'scripty/ran.txt'),
      (Join-Path $Project 'node_modules/install-policy-scripty/ran.txt'),
      $script:SourceMarker
    )) {
    if (Test-Path -LiteralPath $path) {
      Remove-Item -LiteralPath $path -Force
    }
  }
}

function Assert-ScriptDidNotRun {
  param(
    [Parameter(Mandatory = $true)][string]$Project,
    [Parameter(Mandatory = $true)][string]$Label
  )
  foreach ($path in @(
      (Join-Path $Project 'ran.txt'),
      (Join-Path $Project 'scripty/ran.txt'),
      (Join-Path $Project 'node_modules/install-policy-scripty/ran.txt'),
      $script:SourceMarker
    )) {
    if (Test-Path -LiteralPath $path) {
      Fail "$Label ran the postinstall script: $path"
    }
  }
}

function Assert-NpmFailed {
  param(
    $Result,
    [Parameter(Mandatory = $true)][string]$Code,
    [Parameter(Mandatory = $true)][string]$Label
  )
  if ($Result.ExitCode -ne 1) {
    Fail "$Label exited $($Result.ExitCode), expected 1`n$($Result.Text)"
  }
  if ($Result.Text -notmatch [regex]::Escape($Code)) {
    Fail "$Label did not report $Code`n$($Result.Text)"
  }
}

try {
  foreach ($name in @(
      'npm_config_ignore_scripts',
      'npm_config_strict_allow_scripts',
      'npm_config_allow_git',
      'npm_config_allow_remote',
      'npm_config_dangerously_allow_all_scripts',
      'npm_config_allow_scripts'
    )) {
    if (Test-Path -LiteralPath "Env:$name") {
      Remove-Item -LiteralPath "Env:$name"
    }
  }

  $script:RepoNpmrc = Join-Path $repoRoot '.npmrc'
  $rootManifestPath = Join-Path $repoRoot 'package.json'
  if (-not (Test-Path -LiteralPath $script:RepoNpmrc) -or -not (Test-Path -LiteralPath $rootManifestPath)) {
    Fail "repository policy files are missing under $repoRoot"
  }

  $npmrcLines = @(
    [System.IO.File]::ReadAllLines($script:RepoNpmrc) |
      ForEach-Object { $_.Trim() } |
      Where-Object { $_ -ne '' -and -not $_.StartsWith('#') -and -not $_.StartsWith(';') }
  )
  $expectedNpmrc = @(
    'engine-strict=true',
    'strict-allow-scripts=true',
    'allow-git=none',
    'allow-remote=none'
  )
  if ($npmrcLines.Count -ne $expectedNpmrc.Count) {
    Fail ".npmrc must contain only the install policy. Actual: $($npmrcLines -join ' | ')"
  }
  for ($i = 0; $i -lt $expectedNpmrc.Count; $i++) {
    if ($npmrcLines[$i] -cne $expectedNpmrc[$i]) {
      Fail ".npmrc line $($i + 1) is '$($npmrcLines[$i])', expected '$($expectedNpmrc[$i])'"
    }
  }

  $rootManifest = [System.IO.File]::ReadAllText($rootManifestPath) | ConvertFrom-Json
  if ($rootManifest.PSObject.Properties.Name -contains 'allowScripts') {
    Fail 'root package.json must not declare allowScripts'
  }
  if ([string]$rootManifest.engines.node -cne '>=26.13.0 <27') {
    Fail "engines.node is '$($rootManifest.engines.node)'"
  }

  $scriptyManifest = Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot 'scripty/package.json') | ConvertFrom-Json
  if ($scriptyManifest.name -cne 'install-policy-scripty' -or $scriptyManifest.scripts.postinstall -cne 'node ./postinstall.js') {
    Fail 'scripty fixture package.json changed'
  }
  if ($scriptyManifest.PSObject.Properties.Name -contains 'allowScripts') {
    Fail 'scripty fixture must not declare allowScripts'
  }

  $bin = Resolve-BraidNodeToolchain
  $separator = [System.IO.Path]::PathSeparator
  $env:PATH = "$bin$separator$env:PATH"
  $node = Join-Path $bin $(if ($IsWindows) { 'node.exe' } else { 'node' })
  $npmCliCandidates = @(
    (Join-Path $bin 'node_modules/npm/bin/npm-cli.js'),
    (Join-Path (Split-Path -Parent $bin) 'lib/node_modules/npm/bin/npm-cli.js')
  )
  $npmCli = $null
  foreach ($candidate in $npmCliCandidates) {
    if (Test-Path -LiteralPath $candidate) {
      $npmCli = (Resolve-Path -LiteralPath $candidate).Path
      break
    }
  }
  if (-not (Test-Path -LiteralPath $node) -or $null -eq $npmCli) {
    Fail "Node.js toolchain is incomplete: $bin"
  }
  $nodeVersion = "$((& $node --version) | Select-Object -Last 1)".Trim()
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
  $npmVersion = "$((& $node $npmCli --version) | Select-Object -Last 1)".Trim()
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
  Write-Host "node $nodeVersion ($node)"
  Write-Host "npm $npmVersion ($npmCli)"

  $directMarker = Join-Path ([System.IO.Path]::GetTempPath()) ("braid-install-policy-direct-" + [guid]::NewGuid().ToString('n') + '.txt')
  $env:INSTALL_POLICY_RAN = $directMarker
  & $node (Join-Path $PSScriptRoot 'scripty/postinstall.js')
  $directCode = $LASTEXITCODE
  $directWroteSource = Test-Path -LiteralPath $script:SourceMarker
  $directWroteEnv = Test-Path -LiteralPath $directMarker
  if (Test-Path -LiteralPath $script:SourceMarker) {
    Remove-Item -LiteralPath $script:SourceMarker -Force
  }
  if (Test-Path -LiteralPath $directMarker) {
    Remove-Item -LiteralPath $directMarker -Force
  }
  if ($directCode -ne 0 -or -not $directWroteSource -or -not $directWroteEnv) {
    Fail "direct postinstall did not write both markers (exit $directCode)"
  }

  $script:Work = Join-Path ([System.IO.Path]::GetTempPath()) ("braid-install-policy-" + [guid]::NewGuid().ToString('n'))
  New-Item -ItemType Directory -Path $script:Work | Out-Null
  $emptyUserConfig = Join-Path $script:Work 'empty-user.npmrc'
  $emptyGlobalConfig = Join-Path $script:Work 'empty-global.npmrc'
  Write-Utf8NoBom -Path $emptyUserConfig -Text ''
  Write-Utf8NoBom -Path $emptyGlobalConfig -Text ''
  $cacheDir = Join-Path $script:Work 'cache'
  New-Item -ItemType Directory -Path $cacheDir | Out-Null
  $script:NpmIsolation = @(
    '--userconfig', $emptyUserConfig,
    '--globalconfig', $emptyGlobalConfig,
    '--cache', $cacheDir,
    '--color=false',
    '--progress=false',
    '--loglevel=notice'
  )

  $probeJson = @'
{
  "name": "install-policy-config",
  "version": "1.0.0",
  "private": true
}
'@
  $probe = New-PolicyProject -Name 'config' -PackageJson $probeJson
  Assert-PolicyConfig -Project $probe -Key 'strict-allow-scripts' -Expected 'true'
  Assert-PolicyConfig -Project $probe -Key 'allow-git' -Expected 'none'
  Assert-PolicyConfig -Project $probe -Key 'allow-remote' -Expected 'none'
  Assert-PolicyConfig -Project $probe -Key 'engine-strict' -Expected 'true'
  Assert-PolicyConfig -Project $probe -Key 'ignore-scripts' -Expected 'false'

  $unreviewedJson = @'
{
  "name": "install-policy-unreviewed",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "install-policy-scripty": "file:./scripty"
  }
}
'@
  $unreviewedManifest = $unreviewedJson | ConvertFrom-Json
  if ($unreviewedManifest.PSObject.Properties.Name -contains 'allowScripts') {
    Fail 'unreviewed fixture must stay unreviewed'
  }
  $unreviewed = New-PolicyProject -Name 'unreviewed' -PackageJson $unreviewedJson -IncludeScripty
  $unreviewedMarker = Join-Path $unreviewed 'ran.txt'
  Clear-RunMarkers -Project $unreviewed
  $env:INSTALL_POLICY_RAN = $unreviewedMarker
  $unreviewedResult = Invoke-PolicyNpm -WorkingDirectory $unreviewed -NpmArguments (@('install') + $script:NpmIsolation)
  Assert-NpmFailed -Result $unreviewedResult -Code 'ESTRICTALLOWSCRIPTS' -Label 'unreviewed postinstall'
  Assert-ScriptDidNotRun -Project $unreviewed -Label 'unreviewed postinstall'
  Write-Host 'install-policy unreviewed: exit 1 ESTRICTALLOWSCRIPTS; script did not run'

  $deniedJson = @'
{
  "name": "install-policy-denied",
  "version": "1.0.0",
  "private": true,
  "allowScripts": {
    "file:./scripty": false,
    "file:../scripty": false
  },
  "dependencies": {
    "install-policy-scripty": "file:./scripty"
  }
}
'@
  $deniedManifest = $deniedJson | ConvertFrom-Json
  $deniedEntries = @($deniedManifest.allowScripts.PSObject.Properties)
  $deniedByName = @{}
  foreach ($entry in $deniedEntries) {
    $deniedByName[$entry.Name] = $entry.Value
  }
  if ($deniedEntries.Count -ne 2 -or $deniedByName['file:./scripty'] -ne $false -or $deniedByName['file:../scripty'] -ne $false) {
    Fail 'denied fixture must set both file: script specs to false'
  }
  $denied = New-PolicyProject -Name 'denied' -PackageJson $deniedJson -IncludeScripty
  $deniedMarker = Join-Path $denied 'ran.txt'
  Clear-RunMarkers -Project $denied
  $env:INSTALL_POLICY_RAN = $deniedMarker
  $deniedResult = Invoke-PolicyNpm -WorkingDirectory $denied -NpmArguments (@('install') + $script:NpmIsolation)
  if ($deniedResult.ExitCode -ne 0) {
    Fail "allowScripts false exited $($deniedResult.ExitCode), expected 0`n$($deniedResult.Text)"
  }
  Assert-ScriptDidNotRun -Project $denied -Label 'allowScripts false'
  Write-Host 'install-policy allowScripts false: exit 0; script did not run'

  $gitJson = @'
{
  "name": "install-policy-git",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "install-policy-git-dep": "git+https://example.invalid/install-policy/unreviewed.git"
  }
}
'@
  $gitProject = New-PolicyProject -Name 'git' -PackageJson $gitJson
  $gitResult = Invoke-PolicyNpm -WorkingDirectory $gitProject -NpmArguments (@('install') + $script:NpmIsolation)
  Assert-NpmFailed -Result $gitResult -Code 'EALLOWGIT' -Label 'git spec'
  Write-Host 'install-policy git: exit 1 EALLOWGIT'

  $remoteJson = @'
{
  "name": "install-policy-remote",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "install-policy-remote-dep": "https://example.invalid/install-policy/unreviewed.tgz"
  }
}
'@
  $remoteProject = New-PolicyProject -Name 'remote' -PackageJson $remoteJson
  $remoteResult = Invoke-PolicyNpm -WorkingDirectory $remoteProject -NpmArguments (@('install') + $script:NpmIsolation)
  Assert-NpmFailed -Result $remoteResult -Code 'EALLOWREMOTE' -Label 'remote spec'
  Write-Host 'install-policy remote: exit 1 EALLOWREMOTE'

  $registryJson = @'
{
  "name": "install-policy-registry",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "left-pad": "1.3.0"
  }
}
'@
  $registry = New-PolicyProject -Name 'registry' -PackageJson $registryJson
  $registryMarker = Join-Path $registry 'ran.txt'
  $env:INSTALL_POLICY_RAN = $registryMarker
  $registryResult = Invoke-PolicyNpm -WorkingDirectory $registry -NpmArguments (@('install') + $script:NpmIsolation)
  if ($registryResult.ExitCode -ne 0) {
    Fail "registry spec exited $($registryResult.ExitCode), expected 0`n$($registryResult.Text)"
  }
  if ($registryResult.Text -match 'ESTRICTALLOWSCRIPTS|EALLOWGIT|EALLOWREMOTE') {
    Fail "registry spec reported a policy error`n$($registryResult.Text)"
  }
  $leftPadPath = Join-Path $registry 'node_modules/left-pad/package.json'
  if (-not (Test-Path -LiteralPath $leftPadPath)) {
    Fail "registry spec did not install left-pad`n$($registryResult.Text)"
  }
  $leftPad = Get-Content -Raw -LiteralPath $leftPadPath | ConvertFrom-Json
  if ($leftPad.version -cne '1.3.0') {
    Fail "registry spec installed left-pad $($leftPad.version)"
  }
  Assert-ScriptDidNotRun -Project $registry -Label 'registry spec'
  Write-Host 'install-policy registry: exit 0 left-pad@1.3.0'

  Write-Host 'install-policy: passed'
} finally {
  if (Test-Path -LiteralPath $script:SourceMarker) {
    Remove-Item -LiteralPath $script:SourceMarker -Force -ErrorAction SilentlyContinue
  }
  if ($null -ne $script:Work) {
    Remove-Work -Path $script:Work
  }
}

exit 0
