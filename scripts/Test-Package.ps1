# Pack the candidate, install that tarball outside the source checkout, and run the
# ledger scenario through the installed braid executable.
# Does not call scripts/Verify.ps1 or npm run verify.
# npm pack and npm install use --ignore-scripts so package lifecycle scripts cannot re-enter this proof.
#Requires -Version 7.6
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
Set-StrictMode -Version Latest

if ($env:BRAID_PACKAGE_PROOF -eq '1') {
  Write-Error 'scripts/Test-Package.ps1 must not invoke itself.'
  exit 1
}
$env:BRAID_PACKAGE_PROOF = '1'

$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
Set-Location -LiteralPath $repoRoot
. (Join-Path $PSScriptRoot 'Install-NodeToolchain.ps1')

$script:ProofParent = $null
$script:LinkTarget = $null

function Fail {
  param([Parameter(Mandatory = $true)][string]$Message)
  [Console]::Error.WriteLine("package proof failed: $Message")
  exit 1
}

function Assert-Native {
  param(
    [Parameter(Mandatory = $true)][string]$Label,
    [Parameter(Mandatory = $true)][int]$Code
  )
  if ($Code -ne 0) {
    [Console]::Error.WriteLine("package proof failed: $Label exited $Code")
    exit $Code
  }
}

function Get-NormalizedPath {
  param([Parameter(Mandatory = $true)][string]$Path)
  return [System.IO.Path]::GetFullPath($Path).TrimEnd('\', '/')
}

function Test-IsInside {
  param(
    [Parameter(Mandatory = $true)][string]$Parent,
    [Parameter(Mandatory = $true)][string]$Child
  )
  $parentFull = Get-NormalizedPath $Parent
  $childFull = Get-NormalizedPath $Child
  $comparison = if ($IsWindows) { [StringComparison]::OrdinalIgnoreCase } else { [StringComparison]::Ordinal }
  if ($childFull.Equals($parentFull, $comparison)) {
    return $true
  }
  $separator = [System.IO.Path]::DirectorySeparatorChar
  return $childFull.StartsWith($parentFull + $separator, $comparison)
}

function Get-GitIdentity {
  $shaLines = @(& git -C $repoRoot rev-parse 'HEAD')
  Assert-Native -Label 'git rev-parse HEAD' -Code $LASTEXITCODE
  $statusLines = @(& git -C $repoRoot status '--porcelain=v1')
  Assert-Native -Label 'git status --porcelain=v1' -Code $LASTEXITCODE
  $kept = [System.Collections.Generic.List[string]]::new()
  foreach ($line in $statusLines) {
    if (-not [string]::IsNullOrWhiteSpace("$line")) {
      $kept.Add("$line")
    }
  }
  $statusText = $kept -join "`n"
  return [pscustomobject]@{
    Sha = ("$($shaLines | Select-Object -Last 1)").Trim()
    Dirty = -not [string]::IsNullOrWhiteSpace($statusText)
    StatusText = $statusText
  }
}

function Get-Sha256 {
  param([Parameter(Mandatory = $true)][string]$Path)
  return (Get-FileHash -Algorithm SHA256 -LiteralPath $Path).Hash.ToLowerInvariant()
}

function Test-SameBytes {
  param($Left, $Right)
  $leftMissing = $null -eq $Left
  $rightMissing = $null -eq $Right
  if ($leftMissing -and $rightMissing) {
    return $true
  }
  if ($leftMissing -or $rightMissing) {
    return $false
  }
  return [Convert]::ToBase64String([byte[]]$Left) -eq [Convert]::ToBase64String([byte[]]$Right)
}

function Get-Ledger {
  param([Parameter(Mandatory = $true)][string]$Root)
  $statePath = Join-Path $Root '.braid/state.json'
  $eventsPath = Join-Path $Root '.braid/events.jsonl'
  $state = $null
  $events = $null
  if (Test-Path -LiteralPath $statePath) {
    $state = [System.IO.File]::ReadAllBytes($statePath)
  }
  if (Test-Path -LiteralPath $eventsPath) {
    $events = [System.IO.File]::ReadAllBytes($eventsPath)
  }
  return [pscustomobject]@{
    State = $state
    Events = $events
  }
}

function Assert-SameLedger {
  param(
    $Before,
    $After,
    [Parameter(Mandatory = $true)][string]$Label
  )
  if (-not (Test-SameBytes $Before.State $After.State) -or -not (Test-SameBytes $Before.Events $After.Events)) {
    Fail "$Label changed ledger bytes"
  }
}

function Join-Lines {
  param([Parameter(Mandatory = $true)]$Lines)
  return ([string[]]$Lines -join "`n")
}

function Remove-TreeSafe {
  param([Parameter(Mandatory = $true)][string]$RootPath)
  if (-not (Test-Path -LiteralPath $RootPath)) {
    return
  }
  $directories = [System.Collections.Generic.List[string]]::new()
  $pending = [System.Collections.Generic.Stack[string]]::new()
  $pending.Push((Get-NormalizedPath $RootPath))
  while ($pending.Count -gt 0) {
    $current = $pending.Pop()
    $directories.Add($current)
    foreach ($entry in [System.IO.Directory]::EnumerateFileSystemEntries($current)) {
      $attributes = [System.IO.File]::GetAttributes($entry)
      $isReparse = ($attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0
      $isDirectory = ($attributes -band [System.IO.FileAttributes]::Directory) -ne 0
      if ($isReparse) {
        if ($isDirectory) {
          [System.IO.Directory]::Delete($entry)
        } else {
          [System.IO.File]::Delete($entry)
        }
        continue
      }
      if ($isDirectory) {
        $pending.Push($entry)
        continue
      }
      [System.IO.File]::SetAttributes($entry, [System.IO.FileAttributes]::Normal)
      [System.IO.File]::Delete($entry)
    }
  }
  for ($index = $directories.Count - 1; $index -ge 0; $index--) {
    $directory = $directories[$index]
    if ([System.IO.Directory]::Exists($directory)) {
      [System.IO.Directory]::Delete($directory)
    }
  }
}

function Get-DirectoryNameText {
  param([Parameter(Mandatory = $true)][string]$Path)
  $names = [System.Collections.Generic.List[string]]::new()
  if (Test-Path -LiteralPath $Path) {
    foreach ($entry in [System.IO.Directory]::EnumerateFileSystemEntries($Path)) {
      [void]$names.Add([System.IO.Path]::GetFileName($entry))
    }
  }
  $names.Sort([StringComparer]::Ordinal)
  return [pscustomobject]@{
    Text = [string]::Join('|', $names)
  }
}

function Assert-EmptyDirectory {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Label
  )
  $actual = (Get-DirectoryNameText -Path $Path).Text
  if ($actual -ne '') {
    Fail "$Label directory names [$actual] expected empty"
  }
}

function Assert-DirectoryNames {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string[]]$Expected,
    [Parameter(Mandatory = $true)][string]$Label
  )
  $actual = (Get-DirectoryNameText -Path $Path).Text
  $expectedList = [System.Collections.Generic.List[string]]::new()
  $expectedList.AddRange($Expected)
  $expectedList.Sort([StringComparer]::Ordinal)
  $right = [string]::Join('|', $expectedList)
  if ($actual -ne $right) {
    Fail "$Label directory names [$actual] expected [$right]"
  }
}

function New-BraidStartInfo {
  param(
    [Parameter(Mandatory = $true)][string]$WorkingDirectory,
    [Parameter(Mandatory = $true)][string[]]$Arguments
  )
  $psi = [System.Diagnostics.ProcessStartInfo]::new()
  $psi.WorkingDirectory = $WorkingDirectory
  $psi.UseShellExecute = $false
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.RedirectStandardInput = $true
  $utf8 = [System.Text.UTF8Encoding]::new($false)
  $psi.StandardOutputEncoding = $utf8
  $psi.StandardErrorEncoding = $utf8
  $psi.Environment['PATH'] = $env:PATH
  if ($IsWindows) {
    $psi.FileName = $script:PwshPath
    [void]$psi.ArgumentList.Add('-NoProfile')
    [void]$psi.ArgumentList.Add('-File')
    [void]$psi.ArgumentList.Add($script:ShimPath)
  } else {
    $psi.FileName = $script:ShimPath
  }
  foreach ($argument in $Arguments) {
    [void]$psi.ArgumentList.Add($argument)
  }
  return $psi
}

function Read-BraidProcess {
  param(
    [Parameter(Mandatory = $true)]$Process,
    $StdoutTask,
    $StderrTask
  )
  $Process.StandardInput.Close()
  $Process.WaitForExit()
  $stdout = $StdoutTask.GetAwaiter().GetResult()
  $stderr = $StderrTask.GetAwaiter().GetResult()
  $code = $Process.ExitCode
  $Process.Dispose()
  return [pscustomobject]@{
    Code = $code
    Stdout = $stdout
    Stderr = $stderr
  }
}

function Invoke-Braid {
  param(
    [Parameter(Mandatory = $true)][string]$WorkingDirectory,
    [Parameter(Mandatory = $true)][string[]]$Arguments
  )
  $psi = New-BraidStartInfo -WorkingDirectory $WorkingDirectory -Arguments $Arguments
  $process = [System.Diagnostics.Process]::Start($psi)
  $stdoutTask = $process.StandardOutput.ReadToEndAsync()
  $stderrTask = $process.StandardError.ReadToEndAsync()
  return Read-BraidProcess -Process $process -StdoutTask $stdoutTask -StderrTask $stderrTask
}

function Assert-Ok {
  param(
    $Result,
    [Parameter(Mandatory = $true)][string]$Stdout,
    [Parameter(Mandatory = $true)][string]$Label
  )
  if ($Result.Code -ne 0 -or $Result.Stderr -ne '' -or $Result.Stdout -ne $Stdout) {
    Fail ("{0} expected exit 0. code={1} stdout={2} stderr={3} expected={4}" -f $Label, $Result.Code, ($Result.Stdout | ConvertTo-Json -Compress), ($Result.Stderr | ConvertTo-Json -Compress), ($Stdout | ConvertTo-Json -Compress))
  }
}

function Assert-Err {
  param(
    $Result,
    [Parameter(Mandatory = $true)][int]$Code,
    [Parameter(Mandatory = $true)][string]$Stderr,
    [Parameter(Mandatory = $true)][string]$Label
  )
  if ($Result.Code -ne $Code -or $Result.Stdout -ne '' -or $Result.Stderr -ne $Stderr) {
    Fail ("{0} expected exit {1}. code={2} stdout={3} stderr={4} expectedStderr={5}" -f $Label, $Code, $Result.Code, ($Result.Stdout | ConvertTo-Json -Compress), ($Result.Stderr | ConvertTo-Json -Compress), ($Stderr | ConvertTo-Json -Compress))
  }
}

function New-ProofDirectory {
  param([Parameter(Mandatory = $true)][string]$Name)
  $path = Join-Path $script:ProofParent $Name
  New-Item -ItemType Directory -Path $path | Out-Null
  if ($path -notmatch ' ') {
    Fail "proof path has no space: $path"
  }
  if (Test-IsInside -Parent $repoRoot -Child $path) {
    Fail "proof path is inside the source checkout: $path"
  }
  return $path
}

function Initialize-Demo {
  param([Parameter(Mandatory = $true)][string]$Root)
  Assert-Ok (Invoke-Braid -WorkingDirectory $Root -Arguments @('init')) "initialized schema 1`n" 'init'
  Assert-Ok (Invoke-Braid -WorkingDirectory $Root -Arguments @('new', 'DEMO-001', '--title', 'Demo ledger', '--outcome', 'Track one story by hand')) "created epic DEMO-001`n" 'new'
}

function Write-Utf8File {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Text
  )
  $encoding = [System.Text.UTF8Encoding]::new($false)
  [System.IO.File]::WriteAllText($Path, $Text, $encoding)
}

try {
  $identity = Get-GitIdentity
  if ($env:BRAID_REQUIRE_CLEAN -eq '1' -and $identity.Dirty) {
    Fail "clean candidate required but the worktree is dirty: $($identity.StatusText)"
  }
  if ($identity.Dirty) {
    Write-Host "package proof: worktree is dirty; this pack is a pre-commit probe, not a committed candidate"
    Write-Host $identity.StatusText
  } else {
    Write-Host "package proof: clean worktree $($identity.Sha)"
  }

  $packagePath = Join-Path $repoRoot 'package.json'
  $packageJson = Get-Content -Raw -LiteralPath $packagePath | ConvertFrom-Json
  if ([string]::IsNullOrWhiteSpace($packageJson.name) -or [string]::IsNullOrWhiteSpace($packageJson.version) -or $packageJson.private -isnot [bool]) {
    Fail 'package.json must declare name, version, and an explicit boolean private flag'
  }
  $packageName = [string]$packageJson.name
  $packageVersion = [string]$packageJson.version
  $packagePrivate = [bool]$packageJson.private
  if ($packageJson.bin.braid -ne 'dist/cli.js' -or $packageJson.type -ne 'module') {
    Fail 'package.json bin or module type changed'
  }
  $scriptNames = @($packageJson.scripts.PSObject.Properties.Name)
  foreach ($lifecycle in @('prepare', 'prepack', 'postpack', 'prepublish', 'prepublishOnly', 'publish', 'postpublish', 'install')) {
    if ($scriptNames -contains $lifecycle) {
      Fail "package lifecycle script '$lifecycle' can re-enter packaging"
    }
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
  Assert-Native -Label 'node --version' -Code $LASTEXITCODE
  $npmVersion = "$((& $node $npmCli --version) | Select-Object -Last 1)".Trim()
  Assert-Native -Label 'npm --version' -Code $LASTEXITCODE
  Write-Host "node $nodeVersion ($node)"
  Write-Host "npm $npmVersion ($npmCli)"
  Write-Host "pwsh $($PSVersionTable.PSVersion)"

  $typescript = Join-Path $repoRoot 'node_modules/typescript/package.json'
  $tscJs = Join-Path $repoRoot 'node_modules/typescript/bin/tsc'
  if (-not (Test-Path -LiteralPath $typescript) -or -not (Test-Path -LiteralPath $tscJs)) {
    Fail "Dependencies are not installed. Prepend '$bin' to PATH and run 'npm ci' from the repository root."
  }

  Write-Host 'build: tsc before pack'
  & $node $tscJs '-p' (Join-Path $repoRoot 'tsconfig.build.json')
  Assert-Native -Label 'tsc -p tsconfig.build.json' -Code $LASTEXITCODE

  $artifactDir = Join-Path $repoRoot 'artifacts/package'
  if (Test-Path -LiteralPath $artifactDir) {
    Remove-TreeSafe -RootPath $artifactDir
  }
  New-Item -ItemType Directory -Path $artifactDir | Out-Null

  Write-Host 'pack: npm pack --ignore-scripts'
  $packOutput = @(& $node $npmCli pack '--ignore-scripts' '--json' '--pack-destination' $artifactDir)
  Assert-Native -Label 'npm pack' -Code $LASTEXITCODE
  $packText = ($packOutput -join "`n").Trim()
  if ([string]::IsNullOrWhiteSpace($packText)) {
    Fail 'npm pack produced no JSON'
  }
  Write-Utf8File -Path (Join-Path $artifactDir 'npm-pack.json') -Text ($packText + "`n")
  $packParsed = @($packText | ConvertFrom-Json)
  if ($packParsed.Count -ne 1) {
    Fail "npm pack JSON described $($packParsed.Count) packages"
  }
  $tarballs = @(Get-ChildItem -LiteralPath $artifactDir -Filter '*.tgz' -File)
  if ($tarballs.Count -ne 1) {
    Fail "expected one tarball in $artifactDir"
  }
  $tarball = $tarballs[0].FullName
  $tarballName = $tarballs[0].Name
  if ($packParsed[0].name -ne $packageName -or $packParsed[0].version -ne $packageVersion -or $packParsed[0].filename -ne $tarballName) {
    Fail 'npm pack metadata does not match the selected package identity and tarball'
  }
  $stray = @(Get-ChildItem -LiteralPath $repoRoot -Filter '*.tgz' -File)
  if ($stray.Count -ne 0) {
    Fail 'npm pack also wrote a tarball into the source checkout'
  }
  $digest = Get-Sha256 $tarball
  Write-Host "tarball $tarballName sha256:$digest"

  $extract = Join-Path $artifactDir 'inspect'
  New-Item -ItemType Directory -Path $extract | Out-Null
  & tar '-xf' $tarball '-C' $extract
  Assert-Native -Label 'tar -xf' -Code $LASTEXITCODE
  $packedRoot = Join-Path $extract 'package'
  foreach ($required in @('package.json', 'README.md', 'dist/cli.js', 'dist/main.js')) {
    if (-not (Test-Path -LiteralPath (Join-Path $packedRoot $required))) {
      Fail "tarball is missing $required"
    }
  }
  foreach ($banned in @('src', 'test', 'scripts', '.github', 'epics', 'node_modules', '.braid', '.tools', 'artifacts', '.git')) {
    if (Test-Path -LiteralPath (Join-Path $packedRoot $banned)) {
      Fail "tarball contains $banned"
    }
  }
  $packedPackage = Get-Content -Raw -LiteralPath (Join-Path $packedRoot 'package.json') | ConvertFrom-Json
  if ($packedPackage.private -ne $packagePrivate -or $packedPackage.version -ne $packageVersion -or $packedPackage.name -ne $packageName) {
    Fail 'packed package.json does not match the selected package identity and privacy mode'
  }
  $packedCli = Join-Path $packedRoot 'dist/cli.js'
  $cliText = [System.IO.File]::ReadAllText($packedCli)
  if (-not $cliText.StartsWith("#!/usr/bin/env node`n")) {
    Fail 'packed dist/cli.js is missing the node shebang'
  }
  $repoNeedles = @($repoRoot, ($repoRoot.Replace('\', '/')))
  $packedFiles = [System.IO.Directory]::EnumerateFiles($packedRoot, '*', [System.IO.SearchOption]::AllDirectories)
  foreach ($packedFile in $packedFiles) {
    $extension = [System.IO.Path]::GetExtension($packedFile)
    if ($extension -ne '.js' -and $extension -ne '.map' -and $extension -ne '.json' -and $extension -ne '.md') {
      continue
    }
    $text = [System.IO.File]::ReadAllText($packedFile)
    foreach ($needle in $repoNeedles) {
      if ($text.Contains($needle)) {
        Fail "packed file references the source checkout: $packedFile"
      }
    }
  }

  $script:ProofParent = Join-Path ([System.IO.Path]::GetTempPath()) ("braid package proof {0}" -f [guid]::NewGuid().ToString('n'))
  New-Item -ItemType Directory -Path $script:ProofParent | Out-Null
  if (Test-IsInside -Parent $repoRoot -Child $script:ProofParent) {
    Fail "temporary proof directory is inside the source checkout: $($script:ProofParent)"
  }
  $consumer = New-ProofDirectory 'clean consumer'
  $otherCwd = New-ProofDirectory 'other cwd'
  Write-Host "install: $tarballName -> $consumer"

  Push-Location -LiteralPath $consumer
  try {
    & $node $npmCli init '--yes'
    Assert-Native -Label 'npm init consumer' -Code $LASTEXITCODE
    & $node $npmCli install '--ignore-scripts' '--omit=dev' '--no-fund' '--no-audit' '--no-package-lock' '--engine-strict' $tarball
    Assert-Native -Label 'npm install tarball' -Code $LASTEXITCODE
  } finally {
    Pop-Location
  }

  $installedRoot = Join-Path (Join-Path $consumer 'node_modules') $packageName
  $installedCli = Join-Path $installedRoot 'dist/cli.js'
  if (-not (Test-Path -LiteralPath $installedCli)) {
    Fail 'installed package has no dist/cli.js'
  }
  $installedAttributes = [System.IO.File]::GetAttributes($installedRoot)
  if (($installedAttributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) {
    Fail 'installed package is a link'
  }
  if (Test-IsInside -Parent $repoRoot -Child $installedCli) {
    Fail 'installed cli.js resolved inside the source checkout'
  }
  if ((Get-Sha256 $installedCli) -ne (Get-Sha256 $packedCli)) {
    Fail 'installed dist/cli.js does not match the packed tarball'
  }
  Remove-TreeSafe -RootPath $extract
  $installedPackage = Get-Content -Raw -LiteralPath (Join-Path $installedRoot 'package.json') | ConvertFrom-Json
  if ($installedPackage.name -ne $packageName -or $installedPackage.version -ne $packageVersion -or $installedPackage.private -ne $packagePrivate) {
    Fail 'installed package.json does not match the selected package identity and privacy mode'
  }

  $binDir = Join-Path $consumer 'node_modules/.bin'
  if ($IsWindows) {
    $script:ShimPath = Join-Path $binDir 'braid.ps1'
    $script:PwshPath = (Get-Command pwsh -ErrorAction Stop).Source
  } else {
    $script:ShimPath = Join-Path $binDir 'braid'
    $script:PwshPath = $null
  }
  if (-not (Test-Path -LiteralPath $script:ShimPath)) {
    $listing = (Get-DirectoryNameText -Path $binDir).Text
    Fail "installed braid executable is missing at $($script:ShimPath). bin: $listing"
  }
  if ($IsWindows) {
    $shimText = [System.IO.File]::ReadAllText($script:ShimPath).Replace('\', '/')
    if (-not $shimText.Contains("$packageName/dist/cli.js")) {
      Fail 'installed Windows shim does not point at the selected package entry'
    }
  } else {
    $shimFile = Get-Item -LiteralPath $script:ShimPath
    $shimTarget = $shimFile.ResolveLinkTarget($true)
    if ($null -eq $shimTarget -or (Get-NormalizedPath $shimTarget.FullName) -cne (Get-NormalizedPath $installedCli)) {
      Fail 'installed POSIX bin symlink does not point at the selected package entry'
    }
  }
  Write-Host "executable: $($script:ShimPath)"

  Assert-Ok (Invoke-Braid -WorkingDirectory $otherCwd -Arguments @('--version')) "braid $packageVersion`n" 'version'
  Assert-Ok (Invoke-Braid -WorkingDirectory $otherCwd -Arguments @('--version', 'story', 'add')) "braid $packageVersion`n" 'version with arguments'
  $help = Invoke-Braid -WorkingDirectory $otherCwd -Arguments @('--help')
  if ($help.Code -ne 0 -or $help.Stderr -ne '' -or -not $help.Stdout.StartsWith("braid $packageVersion`n") -or -not $help.Stdout.Contains('Completion is a manual record, not gate acceptance.')) {
    Fail 'installed help did not describe the manual ledger'
  }
  Assert-Err (Invoke-Braid -WorkingDirectory $otherCwd -Arguments @('task')) 1 "error: unknown command: task`nRun braid --help.`n" 'unknown task'
  Assert-EmptyDirectory $otherCwd 'other cwd after help'

  $ledger = New-ProofDirectory 'ledger root'
  Initialize-Demo $ledger
  Assert-Ok (Invoke-Braid -WorkingDirectory $ledger -Arguments @('story', 'add', 'DEMO-001', 'S', '--title', 'Ship the ledger', '--kind', 'story', '--note', 'operator note')) "added story S backlog`n" 'add story'
  Assert-Ok (Invoke-Braid -WorkingDirectory $ledger -Arguments @('story', 'start', 'DEMO-001', 'S', '--next', 'Write the ledger.')) "started story S in-progress`n" 'start story'
  $mid = Invoke-Braid -WorkingDirectory $ledger -Arguments @('status', 'DEMO-001', '--json')
  Assert-Ok $mid ($mid.Stdout) 'status json process'
  if ($mid.Stderr -ne '' -or $mid.Code -ne 0) {
    Fail 'status json failed'
  }
  $midBody = $mid.Stdout | ConvertFrom-Json
  if ($midBody.schemaVersion -ne 1 -or $midBody.revision -ne 3 -or $midBody.eventsRevision -ne 3 -or $midBody.eventsLag -ne $false) {
    Fail 'resumed status json did not match revision 3'
  }
  if ($midBody.epic.items[0].id -ne 'S' -or $midBody.epic.items[0].state -ne 'in-progress' -or $midBody.epic.items[0].note -ne 'operator note' -or $midBody.epic.items[0].nextAction -ne 'Write the ledger.') {
    Fail 'resumed status json did not show story S in progress'
  }
  Assert-Ok (Invoke-Braid -WorkingDirectory $ledger -Arguments @('status', 'DEMO-001')) (Join-Lines @(
      'schema 1',
      'revision 3',
      'epic DEMO-001',
      'title Demo ledger',
      'outcome Track one story by hand',
      '',
      'S story in-progress Ship the ledger',
      '  next: Write the ledger.',
      '  note: operator note',
      ''
    )) 'status after start'
  Assert-Ok (Invoke-Braid -WorkingDirectory $ledger -Arguments @('story', 'block', 'DEMO-001', 'S', '--reason', 'Waiting on review notes')) "blocked story S`n" 'block story'
  Assert-Ok (Invoke-Braid -WorkingDirectory $ledger -Arguments @('story', 'start', 'DEMO-001', 'S')) "resumed story S in-progress`n" 'resume story'
  Assert-Ok (Invoke-Braid -WorkingDirectory $ledger -Arguments @('story', 'complete', 'DEMO-001', 'S', '--evidence', 'Reviewed the manual record')) "completed story S manual`n" 'complete story'
  Assert-Ok (Invoke-Braid -WorkingDirectory $ledger -Arguments @('status', 'DEMO-001')) (Join-Lines @(
      'schema 1',
      'revision 6',
      'epic DEMO-001',
      'title Demo ledger',
      'outcome Track one story by hand',
      '',
      'S story done Ship the ledger',
      '  next: None. Manual record only.',
      '  note: operator note',
      '  evidence: manual record; not gate acceptance',
      '  evidence-note: Reviewed the manual record',
      ''
    )) 'status after complete'
  $kinds = @(
    @{ Id = 'T'; Kind = 'task'; Title = 'Prepare the package' },
    @{ Id = 'K'; Kind = 'spike'; Title = 'Check a limit' }
  )
  foreach ($kind in $kinds) {
    Assert-Ok (Invoke-Braid -WorkingDirectory $ledger -Arguments @('story', 'add', 'DEMO-001', $kind.Id, '--kind', $kind.Kind, '--title', $kind.Title)) "added $($kind.Kind) $($kind.Id) backlog`n" "add $($kind.Id)"
    Assert-Ok (Invoke-Braid -WorkingDirectory $ledger -Arguments @('story', 'start', 'DEMO-001', $kind.Id)) "started $($kind.Kind) $($kind.Id) in-progress`n" "start $($kind.Id)"
    Assert-Ok (Invoke-Braid -WorkingDirectory $ledger -Arguments @('story', 'block', 'DEMO-001', $kind.Id, '--reason', "Wait on $($kind.Id)")) "blocked $($kind.Kind) $($kind.Id)`n" "block $($kind.Id)"
    Assert-Ok (Invoke-Braid -WorkingDirectory $ledger -Arguments @('story', 'start', 'DEMO-001', $kind.Id)) "resumed $($kind.Kind) $($kind.Id) in-progress`n" "resume $($kind.Id)"
    Assert-Ok (Invoke-Braid -WorkingDirectory $ledger -Arguments @('story', 'complete', 'DEMO-001', $kind.Id, '--evidence', "Recorded $($kind.Id)")) "completed $($kind.Kind) $($kind.Id) manual`n" "complete $($kind.Id)"
  }
  Assert-Ok (Invoke-Braid -WorkingDirectory $ledger -Arguments @('status')) (Join-Lines @(
      'schema 1',
      'revision 16',
      'epics 1',
      '',
      'DEMO-001 backlog=0 in-progress=0 blocked=0 done=3 Demo ledger',
      ''
    )) 'final status'
  $finalState = Get-Content -Raw -LiteralPath (Join-Path $ledger '.braid/state.json') | ConvertFrom-Json
  if ($finalState.revision -ne 16 -or $finalState.epics[0].items.Count -ne 3) {
    Fail 'final ledger did not contain three done items at revision 16'
  }
  $acceptance = @($finalState.epics[0].items | ForEach-Object { $_.acceptance })
  if (@($acceptance | Where-Object { $_ -eq 'manual' }).Count -ne 3) {
    Fail 'final items were not manual records'
  }
  $eventBytes = [System.IO.File]::ReadAllBytes((Join-Path $ledger '.braid/events.jsonl'))
  if ($eventBytes -contains 13 -or $eventBytes.Length -eq 0 -or $eventBytes[$eventBytes.Length - 1] -ne 10) {
    Fail 'events.jsonl is not LF-terminated UTF-8'
  }
  $eventText = [System.Text.Encoding]::UTF8.GetString($eventBytes)
  $eventLines = @($eventText.TrimEnd("`n").Split("`n"))
  if ($eventLines.Count -ne 16) {
    Fail "expected 16 events, found $($eventLines.Count)"
  }
  Assert-DirectoryNames (Join-Path $ledger '.braid') @('events.jsonl', 'state.json') 'finished ledger'
  Assert-DirectoryNames $ledger @('.braid') 'finished root'
  if (Test-Path -LiteralPath (Join-Path $ledger '.crew')) {
    Fail 'lifecycle created .crew'
  }

  $invalid = New-ProofDirectory 'invalid root'
  Initialize-Demo $invalid
  Assert-Ok (Invoke-Braid -WorkingDirectory $invalid -Arguments @('story', 'add', 'DEMO-001', 'S', '--title', 'Ship', '--note', 'kept')) "added story S backlog`n" 'invalid setup add'
  Assert-Ok (Invoke-Braid -WorkingDirectory $invalid -Arguments @('story', 'start', 'DEMO-001', 'S')) "started story S in-progress`n" 'invalid setup start'
  Assert-Ok (Invoke-Braid -WorkingDirectory $invalid -Arguments @('story', 'complete', 'DEMO-001', 'S', '--evidence', 'Reviewed the manual record')) "completed story S manual`n" 'invalid setup complete'
  Assert-Ok (Invoke-Braid -WorkingDirectory $invalid -Arguments @('story', 'add', 'DEMO-001', 'B', '--title', 'Backlog')) "added story B backlog`n" 'invalid setup backlog'
  Assert-Ok (Invoke-Braid -WorkingDirectory $invalid -Arguments @('story', 'add', 'DEMO-001', 'R', '--title', 'Running')) "added story R backlog`n" 'invalid setup running'
  Assert-Ok (Invoke-Braid -WorkingDirectory $invalid -Arguments @('story', 'start', 'DEMO-001', 'R')) "started story R in-progress`n" 'invalid setup running start'
  $beforeInvalid = Get-Ledger $invalid
  Assert-Err (Invoke-Braid -WorkingDirectory $invalid -Arguments @('story', 'start', 'DEMO-001', 'S')) 2 "error: cannot start item S from done`n" 'start done'
  Assert-SameLedger $beforeInvalid (Get-Ledger $invalid) 'start done'
  Assert-Err (Invoke-Braid -WorkingDirectory $invalid -Arguments @('story', 'complete', 'DEMO-001', 'B', '--evidence', 'No')) 2 "error: cannot complete item B from backlog`n" 'complete backlog'
  Assert-SameLedger $beforeInvalid (Get-Ledger $invalid) 'complete backlog'
  Assert-Err (Invoke-Braid -WorkingDirectory $invalid -Arguments @('story', 'start', 'DEMO-001', 'R')) 2 "error: cannot start item R from in-progress`n" 'second start'
  Assert-SameLedger $beforeInvalid (Get-Ledger $invalid) 'second start'
  Assert-Err (Invoke-Braid -WorkingDirectory $otherCwd -Arguments @('--root', $invalid, 'new', 'DEMO-001', '--title', 'Other', '--outcome', 'Other')) 2 "error: epic DEMO-001 already exists`n" 'duplicate epic'
  Assert-SameLedger $beforeInvalid (Get-Ledger $invalid) 'duplicate epic'
  Assert-EmptyDirectory $otherCwd 'other cwd after --root'

  $repeat = New-ProofDirectory 'repeat root'
  Initialize-Demo $repeat
  Assert-Ok (Invoke-Braid -WorkingDirectory $repeat -Arguments @('story', 'add', 'DEMO-001', 'S', '--title', 'Ship', '--note', 'kept')) "added story S backlog`n" 'repeat add'
  $eventsPath = Join-Path $repeat '.braid/events.jsonl'
  $append = [System.IO.File]::Open($eventsPath, [System.IO.FileMode]::Append, [System.IO.FileAccess]::Write)
  try {
    $append.WriteByte(123)
  } finally {
    $append.Dispose()
  }
  $beforeRepeat = Get-Ledger $repeat
  Assert-Ok (Invoke-Braid -WorkingDirectory $repeat -Arguments @('init')) "already initialized schema 1`n" 'repeat init'
  Assert-SameLedger $beforeRepeat (Get-Ledger $repeat) 'repeat init'

  $safe = New-ProofDirectory 'safe root'
  Assert-Err (Invoke-Braid -WorkingDirectory $safe -Arguments @('story', 'add', 'DEMO-001', '..', '--title', 'Title')) 1 "error: invalid item id`n" 'bad item id'
  Assert-Err (Invoke-Braid -WorkingDirectory $safe -Arguments @('new', 'DEMO-001/../NO', '--title', 'Title', '--outcome', 'Outcome')) 1 "error: invalid epic id`n" 'bad epic slash'
  Assert-Err (Invoke-Braid -WorkingDirectory $safe -Arguments @('new', 'DEMO-001\NO', '--title', 'Title', '--outcome', 'Outcome')) 1 "error: invalid epic id`n" 'bad epic backslash'
  Assert-EmptyDirectory $safe 'safe root'
  $missing = Join-Path $safe 'missing root'
  Assert-Err (Invoke-Braid -WorkingDirectory $otherCwd -Arguments @('--root', $missing, 'init')) 1 "error: root does not exist`n" 'missing root'
  if (Test-Path -LiteralPath $missing) {
    Fail 'missing root was created'
  }

  $crewRoot = New-ProofDirectory 'crew root'
  $crewDir = Join-Path $crewRoot '.crew'
  $formerDir = Join-Path $crewRoot '.agento'
  New-Item -ItemType Directory -Path $crewDir | Out-Null
  New-Item -ItemType Directory -Path $formerDir | Out-Null
  $crewState = '{"schemaVersion":1,"revision":9,"kept":true}' + "`n"
  $crewEvents = '{"revision":9}' + "`n"
  $crewNotes = "disposable ledger`n"
  Write-Utf8File -Path (Join-Path $crewDir 'state.json') -Text $crewState
  Write-Utf8File -Path (Join-Path $crewDir 'events.jsonl') -Text $crewEvents
  Write-Utf8File -Path (Join-Path $crewDir 'notes.txt') -Text $crewNotes
  Write-Utf8File -Path (Join-Path $formerDir 'state.json') -Text $crewState
  Write-Utf8File -Path (Join-Path $formerDir 'notes.txt') -Text $crewNotes
  Assert-Err (Invoke-Braid -WorkingDirectory $otherCwd -Arguments @('--root', $crewRoot, 'status')) 1 "error: not initialized; run braid init`n" 'crew status'
  Assert-Ok (Invoke-Braid -WorkingDirectory $otherCwd -Arguments @('--root', $crewRoot, 'init')) "initialized schema 1`n" 'crew init'
  Assert-Ok (Invoke-Braid -WorkingDirectory $otherCwd -Arguments @('--root', $crewRoot, 'new', 'DEMO-001', '--title', 'Demo ledger', '--outcome', 'Track one story by hand')) "created epic DEMO-001`n" 'crew new'
  $crewStateAfter = [System.IO.File]::ReadAllText((Join-Path $crewDir 'state.json'))
  $crewEventsAfter = [System.IO.File]::ReadAllText((Join-Path $crewDir 'events.jsonl'))
  $crewNotesAfter = [System.IO.File]::ReadAllText((Join-Path $crewDir 'notes.txt'))
  $formerStateAfter = [System.IO.File]::ReadAllText((Join-Path $formerDir 'state.json'))
  $formerNotesAfter = [System.IO.File]::ReadAllText((Join-Path $formerDir 'notes.txt'))
  if ($crewStateAfter -ne $crewState -or $crewEventsAfter -ne $crewEvents -or $crewNotesAfter -ne $crewNotes) {
    Fail '.crew contents changed'
  }
  if ($formerStateAfter -ne $crewState -or $formerNotesAfter -ne $crewNotes) {
    Fail '.agento contents changed'
  }
  Assert-DirectoryNames $crewRoot @('.agento', '.braid', '.crew') 'crew root'
  Assert-DirectoryNames $crewDir @('events.jsonl', 'notes.txt', 'state.json') 'crew directory'

  $linkRoot = New-ProofDirectory 'link root'
  $script:LinkTarget = Join-Path ([System.IO.Path]::GetTempPath()) ("braid link target {0}" -f [guid]::NewGuid().ToString('n'))
  New-Item -ItemType Directory -Path $script:LinkTarget | Out-Null
  Write-Utf8File -Path (Join-Path $script:LinkTarget 'marker.txt') -Text 'keep'
  $linkPath = Join-Path $linkRoot '.braid'
  if ($IsWindows) {
    New-Item -ItemType Junction -Path $linkPath -Target $script:LinkTarget | Out-Null
  } else {
    New-Item -ItemType SymbolicLink -Path $linkPath -Target $script:LinkTarget | Out-Null
  }
  Assert-Err (Invoke-Braid -WorkingDirectory $linkRoot -Arguments @('init')) 1 "error: .braid must be a real directory inside the project root`n" 'linked ledger'
  $marker = [System.IO.File]::ReadAllText((Join-Path $script:LinkTarget 'marker.txt'))
  if ($marker -ne 'keep') {
    Fail 'link target marker changed'
  }
  [System.IO.Directory]::Delete($linkPath)

  $plant = New-ProofDirectory 'plant root'
  Initialize-Demo $plant
  $plantState = Join-Path $plant '.braid/state.json'
  $schema2 = '{"schemaVersion":2,"revision":0,"epics":[]}' + "`n"
  Write-Utf8File -Path $plantState -Text $schema2
  $beforeSchema = Get-Ledger $plant
  Assert-Err (Invoke-Braid -WorkingDirectory $plant -Arguments @('story', 'add', 'DEMO-001', 'S', '--title', 'Ship')) 3 "error: unsupported schema version 2; supported schema 1; state preserved`n" 'schema 2'
  Assert-SameLedger $beforeSchema (Get-Ledger $plant) 'schema 2'

  $display = New-ProofDirectory 'display root'
  Initialize-Demo $display
  $plantEvents = Join-Path $display '.braid/events.jsonl'
  Write-Utf8File -Path (Join-Path $display '.braid/state.json.tmp') -Text ('{"revision":999}' + "`n")
  $tempStatus = Invoke-Braid -WorkingDirectory $display -Arguments @('status')
  Assert-Ok $tempStatus (Join-Lines @('schema 1', 'revision 1', 'epics 1', '', 'DEMO-001 backlog=0 in-progress=0 blocked=0 done=0 Demo ledger', '')) 'temp status'
  if ($tempStatus.Stdout.Contains('999')) {
    Fail 'status promoted state.json.tmp'
  }
  $tempText = [System.IO.File]::ReadAllText((Join-Path $display '.braid/state.json.tmp'))
  if ($tempText -ne ('{"revision":999}' + "`n")) {
    Fail 'status rewrote state.json.tmp'
  }
  $healthyEvents = [System.IO.File]::ReadAllBytes($plantEvents)
  $partial = [System.IO.File]::Open($plantEvents, [System.IO.FileMode]::Append, [System.IO.FileAccess]::Write)
  try {
    $partial.WriteByte(123)
  } finally {
    $partial.Dispose()
  }
  $beforePartial = Get-Ledger $display
  $partialStatus = Invoke-Braid -WorkingDirectory $display -Arguments @('status')
  if ($partialStatus.Code -ne 0 -or $partialStatus.Stderr -ne "warning: events log ends with a partial line; ignored for display`n") {
    Fail "partial status warning mismatch: $($partialStatus.Stderr | ConvertTo-Json -Compress)"
  }
  Assert-Err (Invoke-Braid -WorkingDirectory $display -Arguments @('story', 'add', 'DEMO-001', 'U', '--title', 'Nope')) 3 "error: events log has a partial trailing line; state preserved`n" 'partial mutation'
  Assert-SameLedger $beforePartial (Get-Ledger $display) 'partial mutation'
  $currentEvents = [System.IO.File]::ReadAllBytes($plantEvents)
  if ($currentEvents.Length -ne ($healthyEvents.Length + 1) -or $currentEvents[$currentEvents.Length - 1] -ne 123) {
    Fail 'partial tail was rewritten'
  }

  $lockRoot = New-ProofDirectory 'lock root'
  Initialize-Demo $lockRoot
  New-Item -ItemType Directory -Path (Join-Path $lockRoot '.braid/lock') | Out-Null
  $beforeLock = Get-Ledger $lockRoot
  $lockWatch = [System.Diagnostics.Stopwatch]::StartNew()
  $lockResult = Invoke-Braid -WorkingDirectory $lockRoot -Arguments @('story', 'add', 'DEMO-001', 'S', '--title', 'Ship')
  $lockWatch.Stop()
  Assert-Err $lockResult 4 "error: state lock held at .braid/lock`n" 'lock timeout'
  $lockElapsed = $lockWatch.ElapsedMilliseconds
  if ($lockElapsed -lt 5000 -or $lockElapsed -ge 15000) {
    Fail "lock timeout elapsed ${lockElapsed}ms"
  }
  Assert-SameLedger $beforeLock (Get-Ledger $lockRoot) 'lock timeout'
  if (-not (Test-Path -LiteralPath (Join-Path $lockRoot '.braid/lock'))) {
    Fail 'lock timeout removed the held lock'
  }
  Write-Host "lock timeout ${lockElapsed}ms"

  $concurrent = New-ProofDirectory 'concurrent root'
  Initialize-Demo $concurrent
  $firstInfo = New-BraidStartInfo -WorkingDirectory $concurrent -Arguments @('story', 'add', 'DEMO-001', 'A', '--title', 'Alpha')
  $secondInfo = New-BraidStartInfo -WorkingDirectory $concurrent -Arguments @('story', 'add', 'DEMO-001', 'B', '--title', 'Beta')
  $firstProcess = [System.Diagnostics.Process]::Start($firstInfo)
  $secondProcess = [System.Diagnostics.Process]::Start($secondInfo)
  $firstOut = $firstProcess.StandardOutput.ReadToEndAsync()
  $firstErr = $firstProcess.StandardError.ReadToEndAsync()
  $secondOut = $secondProcess.StandardOutput.ReadToEndAsync()
  $secondErr = $secondProcess.StandardError.ReadToEndAsync()
  $firstResult = Read-BraidProcess -Process $firstProcess -StdoutTask $firstOut -StderrTask $firstErr
  $secondResult = Read-BraidProcess -Process $secondProcess -StdoutTask $secondOut -StderrTask $secondErr
  $concurrentStdout = @($firstResult.Stdout, $secondResult.Stdout) | Sort-Object
  $expectedStdout = @("added story A backlog`n", "added story B backlog`n") | Sort-Object
  if ($firstResult.Code -ne 0 -or $secondResult.Code -ne 0 -or $firstResult.Stderr -ne '' -or $secondResult.Stderr -ne '' -or ($concurrentStdout -join '|') -ne ($expectedStdout -join '|')) {
    Fail "concurrent adds failed: $($firstResult.Stdout | ConvertTo-Json -Compress) $($secondResult.Stdout | ConvertTo-Json -Compress) $($firstResult.Stderr | ConvertTo-Json -Compress) $($secondResult.Stderr | ConvertTo-Json -Compress)"
  }
  $concurrentState = Get-Content -Raw -LiteralPath (Join-Path $concurrent '.braid/state.json') | ConvertFrom-Json
  $concurrentIds = @($concurrentState.epics[0].items | ForEach-Object { $_.id } | Sort-Object)
  if ($concurrentState.revision -ne 3 -or ($concurrentIds -join '|') -ne 'A|B') {
    Fail 'concurrent adds did not store both items at revision 3'
  }

  $readonlyRoot = New-ProofDirectory 'readonly root'
  Initialize-Demo $readonlyRoot
  $readonlyState = Join-Path $readonlyRoot '.braid/state.json'
  $beforeReadonly = Get-Ledger $readonlyRoot
  if ($IsWindows) {
    [System.IO.File]::SetAttributes($readonlyState, [System.IO.FileAttributes]::ReadOnly)
    try {
      Assert-Err (Invoke-Braid -WorkingDirectory $readonlyRoot -Arguments @('story', 'add', 'DEMO-001', 'S', '--title', 'Ship')) 5 "error: cannot write state`n" 'readonly state'
      Assert-SameLedger $beforeReadonly (Get-Ledger $readonlyRoot) 'readonly state'
      $tempPath = Join-Path $readonlyRoot '.braid/state.json.tmp'
      if (-not (Test-Path -LiteralPath $tempPath)) {
        Fail 'readonly replacement left no diagnostic temp file'
      }
      $tempBody = [System.IO.File]::ReadAllText($tempPath)
      if (-not $tempBody.Contains('"revision": 2') -or -not $tempBody.Contains('Ship')) {
        Fail 'readonly diagnostic temp is missing the uncommitted write'
      }
    } finally {
      [System.IO.File]::SetAttributes($readonlyState, [System.IO.FileAttributes]::Normal)
    }
  } else {
    & chmod '444' $readonlyState
    Assert-Native -Label 'chmod 444' -Code $LASTEXITCODE
    try {
      Assert-Ok (Invoke-Braid -WorkingDirectory $readonlyRoot -Arguments @('story', 'add', 'DEMO-001', 'S', '--title', 'Ship')) "added story S backlog`n" 'posix rename over read-only state'
      $posix = Get-Content -Raw -LiteralPath (Join-Path $readonlyRoot '.braid/state.json') | ConvertFrom-Json
      if ($posix.revision -ne 2) {
        Fail 'posix rename-over did not commit revision 2'
      }
    } finally {
      & chmod '644' $readonlyState
      Assert-Native -Label 'chmod 644' -Code $LASTEXITCODE
    }
  }

  if (Test-Path -LiteralPath (Join-Path $repoRoot '.braid') -PathType Container) {
    Fail 'package proof created .braid in the source checkout'
  }
  if (Test-Path -LiteralPath (Join-Path $repoRoot '.crew') -PathType Container) {
    Fail 'package proof created .crew in the source checkout'
  }

  $after = Get-GitIdentity
  if ($after.Sha -ne $identity.Sha -or $after.StatusText -ne $identity.StatusText) {
    Fail 'package proof changed HEAD or the worktree status'
  }

  $provenancePath = Join-Path $artifactDir ([System.IO.Path]::GetFileNameWithoutExtension($tarballName) + '.provenance.json')
  $provenance = [ordered]@{
    name = $packageName
    version = $packageVersion
    private = $packagePrivate
    released = $false
    registryPublication = 'not performed'
    sourceRevision = $identity.Sha
    worktreeDirty = $identity.Dirty
    candidate = (-not $identity.Dirty)
    tarball = $tarballName
    digestAlgorithm = 'sha256'
    digest = $digest
    npmIntegrity = [string]$packParsed[0].integrity
    node = $nodeVersion
    npm = $npmVersion
    pwsh = "$($PSVersionTable.PSVersion)"
    os = if ($IsWindows) { 'windows' } else { 'linux' }
    packedAt = [DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
    installOutsideCheckout = $true
    ledgerPathContainedSpace = $true
    executable = 'braid'
    githubSha = [string]$env:GITHUB_SHA
    githubRef = [string]$env:GITHUB_REF
    pullRequestHeadSha = [string]$env:BRAID_PR_HEAD_SHA
    lockTimeoutMilliseconds = $lockElapsed
    reproducibility = 'This record identifies this pack only. Cross-machine and cross-OS equality is not claimed.'
  }
  $provenanceJson = ($provenance | ConvertTo-Json -Depth 5).Trim() + "`n"
  Write-Utf8File -Path $provenancePath -Text $provenanceJson
  Write-Host "package-proof digest sha256:$digest"
  Write-Host "package-proof source-revision $($identity.Sha)"
  Write-Host "package-proof worktree-dirty $($identity.Dirty)"
  Write-Host "package-proof candidate $(-not $identity.Dirty)"
  Write-Host "package-proof provenance $provenancePath"
} finally {
  if ($null -ne $script:LinkTarget) {
    Remove-TreeSafe -RootPath $script:LinkTarget
  }
  if ($null -ne $script:ProofParent) {
    Remove-TreeSafe -RootPath $script:ProofParent
  }
}
exit 0
