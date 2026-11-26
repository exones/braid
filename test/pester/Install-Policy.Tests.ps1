#Requires -Version 7.6
# The repository .npmrc policy, proven with real installs in disposable projects
# that are separate from the root package. An allowScripts value of false skips
# the script and lets install exit 0, so the failing project stays unreviewed.
# On npm 11.20.0 a file: dependency is linked, and the link records
# file:../scripty. That is the entry that matches the node whose script would run.
# The package name does not match a file: dep. The registry case uses the network.

BeforeAll {
  $ErrorActionPreference = 'Stop'
  $PSNativeCommandUseErrorActionPreference = $false
  Set-StrictMode -Version Latest

  $script:RepoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
  $script:Fixture = Join-Path $script:RepoRoot 'test/fixtures/install-policy'
  . (Join-Path $script:RepoRoot 'scripts/Install-NodeToolchain.ps1')
  $script:SourceMarker = Join-Path $script:Fixture 'scripty/ran.txt'
  $script:Work = $null
  # The cases change environment variables; AfterAll puts them all back.
  $script:SavedEnv = [System.Environment]::GetEnvironmentVariables()

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
        throw 'fixture npm arguments must not bypass install scripts'
      }
    }
    $previous = Get-Location
    try {
      Set-Location -LiteralPath $WorkingDirectory
      $lines = @(& $script:Node $script:NpmCli @NpmArguments 2>&1)
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
      throw "npm config get $Key exited $($result.ExitCode)`n$($result.Text)"
    }
    $actual = Get-LastOutputLine $result.Text
    if ($actual -cne $Expected) {
      throw "npm config get $Key returned '$actual', expected '$Expected'`n$($result.Text)"
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
      Copy-Item -LiteralPath (Join-Path $script:Fixture 'scripty') -Destination (Join-Path $dir 'scripty') -Recurse
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
        throw "$Label ran the postinstall script: $path"
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
      throw "$Label exited $($Result.ExitCode), expected 1`n$($Result.Text)"
    }
    if ($Result.Text -notmatch [regex]::Escape($Code)) {
      throw "$Label did not report $Code`n$($Result.Text)"
    }
  }

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

  $script:RepoNpmrc = Join-Path $script:RepoRoot '.npmrc'
  $script:RootManifestPath = Join-Path $script:RepoRoot 'package.json'
  $bin = Resolve-BraidNodeToolchain
  $separator = [System.IO.Path]::PathSeparator
  $env:PATH = "$bin$separator$env:PATH"
  $script:Node = Join-Path $bin $(if ($IsWindows) { 'node.exe' } else { 'node' })
  $npmCliCandidates = @(
    (Join-Path $bin 'node_modules/npm/bin/npm-cli.js'),
    (Join-Path (Split-Path -Parent $bin) 'lib/node_modules/npm/bin/npm-cli.js')
  )
  $script:NpmCli = $null
  foreach ($candidate in $npmCliCandidates) {
    if (Test-Path -LiteralPath $candidate) {
      $script:NpmCli = (Resolve-Path -LiteralPath $candidate).Path
      break
    }
  }
  if (-not (Test-Path -LiteralPath $script:Node) -or $null -eq $script:NpmCli) {
    throw "Node.js toolchain is incomplete: $bin"
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
}

AfterAll {
  if (Test-Path -LiteralPath $script:SourceMarker) {
    Remove-Item -LiteralPath $script:SourceMarker -Force -ErrorAction SilentlyContinue
  }
  foreach ($name in @([System.Environment]::GetEnvironmentVariables().Keys)) {
    if (-not $script:SavedEnv.Contains($name)) {
      [System.Environment]::SetEnvironmentVariable($name, $null)
    }
  }
  foreach ($name in @($script:SavedEnv.Keys)) {
    [System.Environment]::SetEnvironmentVariable($name, [string]$script:SavedEnv[$name])
  }
  # npm can hold a file for a moment after it exits on Windows.
  for ($attempt = 0; $attempt -lt 3 -and $null -ne $script:Work -and (Test-Path -LiteralPath $script:Work); $attempt++) {
    Remove-Item -LiteralPath $script:Work -Recurse -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 200
  }
}

Describe 'the repository install policy' {
  It 'keeps .npmrc, the root manifest and the scripty fixture as the policy needs them' {
    if (-not (Test-Path -LiteralPath $script:RepoNpmrc) -or -not (Test-Path -LiteralPath $script:RootManifestPath)) {
      throw "repository policy files are missing under $script:RepoRoot"
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
      throw ".npmrc must contain only the install policy. Actual: $($npmrcLines -join ' | ')"
    }
    for ($i = 0; $i -lt $expectedNpmrc.Count; $i++) {
      if ($npmrcLines[$i] -cne $expectedNpmrc[$i]) {
        throw ".npmrc line $($i + 1) is '$($npmrcLines[$i])', expected '$($expectedNpmrc[$i])'"
      }
    }

    $rootManifest = [System.IO.File]::ReadAllText($script:RootManifestPath) | ConvertFrom-Json
    if ($rootManifest.PSObject.Properties.Name -contains 'allowScripts') {
      throw 'root package.json must not declare allowScripts'
    }
    if ([string]$rootManifest.engines.node -cne '>=26.13.0 <27') {
      throw "engines.node is '$($rootManifest.engines.node)'"
    }

    $scriptyManifest = Get-Content -Raw -LiteralPath (Join-Path $script:Fixture 'scripty/package.json') | ConvertFrom-Json
    if ($scriptyManifest.name -cne 'install-policy-scripty' -or $scriptyManifest.scripts.postinstall -cne 'node ./postinstall.js') {
      throw 'scripty fixture package.json changed'
    }
    if ($scriptyManifest.PSObject.Properties.Name -contains 'allowScripts') {
      throw 'scripty fixture must not declare allowScripts'
    }
  }

  It 'has a postinstall script that writes both markers when run directly' {
    $directMarker = Join-Path ([System.IO.Path]::GetTempPath()) ("braid-install-policy-direct-" + [guid]::NewGuid().ToString('n') + '.txt')
    $env:INSTALL_POLICY_RAN = $directMarker
    & $script:Node (Join-Path $script:Fixture 'scripty/postinstall.js')
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
      throw "direct postinstall did not write both markers (exit $directCode)"
    }
  }

  It 'is the configuration npm reads in a project' {
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
  }

  It 'refuses an unreviewed postinstall script' {
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
      throw 'unreviewed fixture must stay unreviewed'
    }
    $unreviewed = New-PolicyProject -Name 'unreviewed' -PackageJson $unreviewedJson -IncludeScripty
    $unreviewedMarker = Join-Path $unreviewed 'ran.txt'
    Clear-RunMarkers -Project $unreviewed
    $env:INSTALL_POLICY_RAN = $unreviewedMarker
    $unreviewedResult = Invoke-PolicyNpm -WorkingDirectory $unreviewed -NpmArguments (@('install') + $script:NpmIsolation)
    Assert-NpmFailed -Result $unreviewedResult -Code 'ESTRICTALLOWSCRIPTS' -Label 'unreviewed postinstall'
    Assert-ScriptDidNotRun -Project $unreviewed -Label 'unreviewed postinstall'
  }

  It 'skips a script that allowScripts sets to false' {
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
      throw 'denied fixture must set both file: script specs to false'
    }
    $denied = New-PolicyProject -Name 'denied' -PackageJson $deniedJson -IncludeScripty
    $deniedMarker = Join-Path $denied 'ran.txt'
    Clear-RunMarkers -Project $denied
    $env:INSTALL_POLICY_RAN = $deniedMarker
    $deniedResult = Invoke-PolicyNpm -WorkingDirectory $denied -NpmArguments (@('install') + $script:NpmIsolation)
    if ($deniedResult.ExitCode -ne 0) {
      throw "allowScripts false exited $($deniedResult.ExitCode), expected 0`n$($deniedResult.Text)"
    }
    Assert-ScriptDidNotRun -Project $denied -Label 'allowScripts false'
  }

  It 'refuses a git dependency' {
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
  }

  It 'refuses a remote URL dependency' {
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
  }

  It 'installs a registry dependency' {
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
      throw "registry spec exited $($registryResult.ExitCode), expected 0`n$($registryResult.Text)"
    }
    if ($registryResult.Text -match 'ESTRICTALLOWSCRIPTS|EALLOWGIT|EALLOWREMOTE') {
      throw "registry spec reported a policy error`n$($registryResult.Text)"
    }
    $leftPadPath = Join-Path $registry 'node_modules/left-pad/package.json'
    if (-not (Test-Path -LiteralPath $leftPadPath)) {
      throw "registry spec did not install left-pad`n$($registryResult.Text)"
    }
    $leftPad = Get-Content -Raw -LiteralPath $leftPadPath | ConvertFrom-Json
    if ($leftPad.version -cne '1.3.0') {
      throw "registry spec installed left-pad $($leftPad.version)"
    }
    Assert-ScriptDidNotRun -Project $registry -Label 'registry spec'
  }
}
