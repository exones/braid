# Pack the candidate, install that tarball outside the source checkout, and run the
# version and help check through the installed braid executable.
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
  foreach ($required in @('package.json', 'README.md', 'dist/cli.js', 'LICENSE')) {
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
  if ($help.Code -ne 0 -or $help.Stderr -ne '' -or -not $help.Stdout.StartsWith("braid $packageVersion`n") -or -not $help.Stdout.Contains('Usage: braid <command>')) {
    Fail 'installed help did not show usage'
  }
  Assert-Err (Invoke-Braid -WorkingDirectory $otherCwd -Arguments @('task')) 1 "error: unknown command: task`nRun braid help.`n" 'unknown task'
  Assert-EmptyDirectory $otherCwd 'other cwd after help'


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
    executable = 'braid'
    githubSha = [string]$env:GITHUB_SHA
    githubRef = [string]$env:GITHUB_REF
    pullRequestHeadSha = [string]$env:BRAID_PR_HEAD_SHA
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
