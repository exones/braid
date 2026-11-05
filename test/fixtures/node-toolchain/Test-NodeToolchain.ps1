# Offline fixture for PATH-first Node.js resolution and the shared Windows store.
# Disposable roots and stub runtimes only. Does not download Node.js.
# Does not call scripts/Verify.ps1.
#Requires -Version 7.6
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
Set-StrictMode -Version Latest

$script:RepoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../..'))
$script:Installer = Join-Path $script:RepoRoot 'scripts/Install-NodeToolchain.ps1'
$script:Pwsh = (Get-Command pwsh).Source
$script:Work = Join-Path ([System.IO.Path]::GetTempPath()) ("braid-node-toolchain-" + [guid]::NewGuid().ToString('n'))
$script:Children = [System.Collections.Generic.List[System.Diagnostics.Process]]::new()
$script:ChildTasks = @{}
$script:OriginalPath = $env:PATH
$script:OriginalStorePresent = Test-Path Env:BRAID_TOOLCHAIN_DIR
$script:OriginalStore = $env:BRAID_TOOLCHAIN_DIR
$script:OriginalLocalPresent = Test-Path Env:LOCALAPPDATA
$script:OriginalLocal = $env:LOCALAPPDATA
$script:ToolsBefore = Test-Path -LiteralPath (Join-Path $script:RepoRoot '.tools')
$script:Utf8 = New-Object System.Text.UTF8Encoding $false

function Fail {
  param([Parameter(Mandatory = $true)][string]$Message)
  [Console]::Error.WriteLine("node-toolchain failed: $Message")
  exit 1
}

function Assert-True {
  param([bool]$Condition, [Parameter(Mandatory = $true)][string]$Message)
  if (-not $Condition) {
    Fail $Message
  }
}

function Assert-SamePath {
  param([string]$Actual, [string]$Expected, [Parameter(Mandatory = $true)][string]$Label)
  $left = [System.IO.Path]::GetFullPath($Actual).TrimEnd('\', '/')
  $right = [System.IO.Path]::GetFullPath($Expected).TrimEnd('\', '/')
  if (-not $left.Equals($right, [System.StringComparison]::OrdinalIgnoreCase)) {
    Fail "$Label expected '$right' actual '$left'"
  }
}

function Assert-Match {
  param([string]$Text, [Parameter(Mandatory = $true)][string]$Pattern, [Parameter(Mandatory = $true)][string]$Label)
  if ("$Text" -notmatch $Pattern) {
    Fail "$Label did not match /$Pattern/: $Text"
  }
}

function Get-SingleLine {
  param([AllowEmptyString()][string]$Text)
  $lines = @("$Text" -split "`r?`n" | ForEach-Object { $_.Trim().TrimStart([char]0xFEFF) } | Where-Object { $_ -ne '' })
  if ($lines.Count -ne 1) {
    Fail "expected one stdout line, got $($lines.Count): $Text"
  }
  return [string]$lines[0]
}

function Reset-FixtureState {
  $script:FixturePayload = ''
  $script:FixtureLog = ''
  $script:FixtureDelayMs = 0
  $script:FixtureFailSave = $false
  $script:FixtureFailExpand = $false
  $script:FixtureOmitNpm = $false
  $script:FixtureFailNpm = $false
  $script:FixtureReportedVersion = ''
}

function Grant-Execute {
  param([Parameter(Mandatory = $true)][string]$Path)
  if ($IsWindows) {
    return
  }
  [System.IO.File]::SetUnixFileMode(
    $Path,
    [System.IO.UnixFileMode]::UserRead -bor [System.IO.UnixFileMode]::UserWrite -bor [System.IO.UnixFileMode]::UserExecute)
}

function Save-FixtureArchive {
  param(
    [Parameter(Mandatory = $true)][string]$Version,
    [Parameter(Mandatory = $true)][string]$Platform,
    [Parameter(Mandatory = $true)][string]$CacheDirectory
  )
  if ($script:FixtureFailSave) {
    throw 'fixture download is disabled'
  }
  if ([string]::IsNullOrWhiteSpace($script:FixturePayload)) {
    throw 'fixture payload is not set'
  }
  New-Item -ItemType Directory -Force -Path $CacheDirectory | Out-Null
  $zipName = "node-v$Version-$Platform.zip"
  $zipPath = Join-Path $CacheDirectory $zipName
  $sumPath = Join-Path $CacheDirectory 'SHASUMS256.txt'
  Copy-Item -LiteralPath (Join-Path $script:FixturePayload $zipName) -Destination $zipPath
  Copy-Item -LiteralPath (Join-Path $script:FixturePayload 'SHASUMS256.txt') -Destination $sumPath
  if (-not [string]::IsNullOrWhiteSpace($script:FixtureLog)) {
    [System.IO.File]::AppendAllText($script:FixtureLog, "save $Version`n")
  }
  if ($script:FixtureDelayMs -gt 0) {
    Start-Sleep -Milliseconds $script:FixtureDelayMs
  }
  return @{ ZipPath = $zipPath; SumPath = $sumPath; ZipName = $zipName }
}

function Expand-FixtureArchive {
  param(
    [Parameter(Mandatory = $true)][string]$ZipPath,
    [Parameter(Mandatory = $true)][string]$StagingDirectory,
    [Parameter(Mandatory = $true)][string]$Version,
    [Parameter(Mandatory = $true)][string]$Platform
  )
  if ($script:FixtureFailExpand) {
    throw 'fixture expand is disabled'
  }
  $inner = Join-Path $StagingDirectory "node-v$Version-$Platform"
  $npmDir = Join-Path $inner 'node_modules/npm/bin'
  New-Item -ItemType Directory -Force -Path $npmDir | Out-Null
  $nodePath = Join-Path $inner 'node.exe'
  Copy-Item -LiteralPath $script:StubExe -Destination $nodePath
  Grant-Execute $nodePath
  $versionText = if ($script:FixtureReportedVersion) { $script:FixtureReportedVersion } else { "v$Version" }
  [System.IO.File]::WriteAllText((Join-Path $inner 'fixture-version.txt'), $versionText, $script:Utf8)
  if ($script:FixtureFailNpm) {
    [System.IO.File]::WriteAllText((Join-Path $inner 'fail-npm'), '1', $script:Utf8)
  }
  if (-not $script:FixtureOmitNpm) {
    [System.IO.File]::WriteAllText((Join-Path $npmDir 'npm-cli.js'), "// fixture`n", $script:Utf8)
  }
  return $inner
}

function New-FixturePayload {
  param(
    [Parameter(Mandatory = $true)][string]$Directory,
    [Parameter(Mandatory = $true)][string]$Version,
    [string]$Platform = 'win-x64',
    [string]$OfficialHash = ''
  )
  New-Item -ItemType Directory -Force -Path $Directory | Out-Null
  $zipName = "node-v$Version-$Platform.zip"
  $zipPath = Join-Path $Directory $zipName
  $bytes = [System.Text.Encoding]::UTF8.GetBytes("fixture-archive-$Version-$Platform")
  [System.IO.File]::WriteAllBytes($zipPath, $bytes)
  $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $zipPath).Hash.ToLowerInvariant()
  $published = if ($OfficialHash) { $OfficialHash } else { $hash }
  [System.IO.File]::WriteAllText((Join-Path $Directory 'SHASUMS256.txt'), "$published  $zipName`n", $script:Utf8)
  return @{ Directory = $Directory; Hash = $hash; ZipName = $zipName; Version = $Version; Platform = $Platform }
}

function New-NodeLayout {
  param(
    [Parameter(Mandatory = $true)][string]$Directory,
    [Parameter(Mandatory = $true)][string]$VersionText,
    [ValidateSet('path', 'bin-lib')]
    [string]$Layout = 'path',
    [switch]$OmitNpm,
    [switch]$FailNpm
  )
  $runtime = $Directory
  if ($Layout -eq 'bin-lib') {
    $runtime = Join-Path $Directory 'bin'
  }
  New-Item -ItemType Directory -Force -Path $runtime | Out-Null
  $leaf = if ($IsWindows) { 'node.exe' } else { 'node' }
  $nodePath = Join-Path $runtime $leaf
  Copy-Item -LiteralPath $script:StubExe -Destination $nodePath
  Grant-Execute $nodePath
  [System.IO.File]::WriteAllText((Join-Path $runtime 'fixture-version.txt'), $VersionText, $script:Utf8)
  if ($FailNpm) {
    [System.IO.File]::WriteAllText((Join-Path $runtime 'fail-npm'), '1', $script:Utf8)
  }
  if (-not $OmitNpm) {
    $npm = if ($Layout -eq 'bin-lib') {
      Join-Path $Directory 'lib/node_modules/npm/bin'
    } else {
      Join-Path $runtime 'node_modules/npm/bin'
    }
    New-Item -ItemType Directory -Force -Path $npm | Out-Null
    [System.IO.File]::WriteAllText((Join-Path $npm 'npm-cli.js'), "// fixture`n", $script:Utf8)
  }
  return [System.IO.Path]::GetFullPath($runtime)
}

function Enter-Env {
  param(
    [string]$PathDir,
    [string]$Store,
    [string]$LocalAppData,
    [switch]$ClearStore,
    [switch]$ClearLocal
  )
  $script:SavedPath = $env:PATH
  $script:SavedStorePresent = Test-Path Env:BRAID_TOOLCHAIN_DIR
  $script:SavedStore = $env:BRAID_TOOLCHAIN_DIR
  $script:SavedLocalPresent = Test-Path Env:LOCALAPPDATA
  $script:SavedLocal = $env:LOCALAPPDATA
  if ($PathDir) {
    $env:PATH = $PathDir
  }
  if ($ClearStore) {
    Remove-Item Env:BRAID_TOOLCHAIN_DIR -ErrorAction SilentlyContinue
  } elseif ($PSBoundParameters.ContainsKey('Store')) {
    $env:BRAID_TOOLCHAIN_DIR = $Store
  }
  if ($ClearLocal) {
    Remove-Item Env:LOCALAPPDATA -ErrorAction SilentlyContinue
  } elseif ($LocalAppData) {
    $env:LOCALAPPDATA = $LocalAppData
  }
}

function Exit-Env {
  $env:PATH = $script:SavedPath
  if ($script:SavedStorePresent) {
    $env:BRAID_TOOLCHAIN_DIR = $script:SavedStore
  } else {
    Remove-Item Env:BRAID_TOOLCHAIN_DIR -ErrorAction SilentlyContinue
  }
  if ($script:SavedLocalPresent) {
    $env:LOCALAPPDATA = $script:SavedLocal
  } else {
    Remove-Item Env:LOCALAPPDATA -ErrorAction SilentlyContinue
  }
}

function Invoke-FixtureResolve {
  param(
    [Parameter(Mandatory = $true)][string]$Store,
    [Parameter(Mandatory = $true)][string]$Version,
    [Parameter(Mandatory = $true)][string]$Hash,
    [string]$PathDir = '',
    [string]$Platform = 'win-x64',
    [bool]$ForWindows = $true,
    [int]$LockTimeoutSeconds = 120,
    [scriptblock]$BeforePublish = $null,
    [switch]$UseFixtureCopy
  )
  if (-not $PathDir) {
    $PathDir = $script:EmptyPath
  }
  $architecture = if ($Platform -eq 'win-arm64') { 'Arm64' } else { 'X64' }
  Enter-Env -PathDir $PathDir -Store $Store
  try {
    $params = @{
      ForWindows          = $ForWindows
      Architecture        = $architecture
      Version             = $Version
      PinnedHashes        = @{ $Platform = $Hash }
      LockTimeoutSeconds  = $LockTimeoutSeconds
    }
    if ($UseFixtureCopy) {
      $params.SaveArchive = ${function:Save-FixtureArchive}
      $params.ExpandArchive = ${function:Expand-FixtureArchive}
    }
    if ($null -ne $BeforePublish) {
      $params.BeforePublish = $BeforePublish
    }
    return Resolve-BraidNodeToolchain @params
  } finally {
    Exit-Env
  }
}

function New-Store {
  return Join-Path $script:Work ("store-" + [guid]::NewGuid().ToString('n'))
}

function Invoke-Direct {
  param(
    [Parameter(Mandatory = $true)][string]$PathDir,
    [string]$Store = '',
    [string]$WorkingDirectory = ''
  )
  if (-not $WorkingDirectory) {
    $WorkingDirectory = $script:Work
  }
  $psi = [System.Diagnostics.ProcessStartInfo]::new()
  $psi.FileName = $script:Pwsh
  $psi.UseShellExecute = $false
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.CreateNoWindow = $true
  $psi.WorkingDirectory = $WorkingDirectory
  $psi.ArgumentList.Add('-NoProfile')
  $psi.ArgumentList.Add('-File')
  $psi.ArgumentList.Add($script:Installer)
  $psi.Environment['PATH'] = $PathDir
  $psi.Environment['BRAID_TOOLCHAIN_DIR'] = $Store
  $proc = [System.Diagnostics.Process]::new()
  $proc.StartInfo = $psi
  $null = $proc.Start()
  $outTask = $proc.StandardOutput.ReadToEndAsync()
  $errTask = $proc.StandardError.ReadToEndAsync()
  if (-not $proc.WaitForExit(60000)) {
    try { $proc.Kill() } catch { }
    Fail 'direct installer timed out'
  }
  return @{ Exit = $proc.ExitCode; Stdout = $outTask.Result; Stderr = $errTask.Result }
}

function Start-Driver {
  param(
    [Parameter(Mandatory = $true)][string]$Mode,
    [Parameter(Mandatory = $true)][string]$Store,
    [Parameter(Mandatory = $true)][string]$Payload,
    [Parameter(Mandatory = $true)][string]$Version,
    [Parameter(Mandatory = $true)][string]$Hash,
    [string]$Log = '',
    [string]$Ready = '',
    [string]$Release = '',
    [int]$DelayMs = 0,
    [int]$LockTimeoutSeconds = 120
  )
  $psi = [System.Diagnostics.ProcessStartInfo]::new()
  $psi.FileName = $script:Pwsh
  $psi.UseShellExecute = $false
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.CreateNoWindow = $true
  $psi.WorkingDirectory = $script:Work
  foreach ($argument in @(
      '-NoProfile', '-File', $script:Driver,
      '-Installer', $script:Installer,
      '-Store', $Store,
      '-Payload', $Payload,
      '-Stub', $script:StubExe,
      '-Version', $Version,
      '-Platform', 'win-x64',
      '-Hash', $Hash,
      '-Mode', $Mode,
      '-Log', $Log,
      '-Ready', $Ready,
      '-Release', $Release,
      '-DelayMs', "$DelayMs",
      '-LockTimeoutSeconds', "$LockTimeoutSeconds"
    )) {
    $psi.ArgumentList.Add($argument)
  }
  $proc = [System.Diagnostics.Process]::new()
  $proc.StartInfo = $psi
  $null = $proc.Start()
  $script:Children.Add($proc)
  $script:ChildTasks[$proc.Id] = @{
    Out = $proc.StandardOutput.ReadToEndAsync()
    Err = $proc.StandardError.ReadToEndAsync()
  }
  return $proc
}

function Wait-Driver {
  param(
    [Parameter(Mandatory = $true)]$Proc,
    [int]$TimeoutSeconds = 60
  )
  if (-not $Proc.WaitForExit($TimeoutSeconds * 1000)) {
    try { $Proc.Kill() } catch { }
    Fail "driver $($Proc.Id) timed out"
  }
  $tasks = $script:ChildTasks[$Proc.Id]
  $stdout = ''
  $stderr = ''
  if ($tasks.Out.Wait(5000)) { $stdout = $tasks.Out.Result }
  if ($tasks.Err.Wait(5000)) { $stderr = $tasks.Err.Result }
  return @{ Exit = $Proc.ExitCode; Stdout = $stdout; Stderr = $stderr }
}

function Wait-Ready {
  param([Parameter(Mandatory = $true)][string]$Ready)
  $deadline = [DateTime]::UtcNow.AddSeconds(20)
  while (-not (Test-Path -LiteralPath $Ready)) {
    if ([DateTime]::UtcNow -ge $deadline) {
      Fail "ready file was not written: $Ready"
    }
    Start-Sleep -Milliseconds 50
  }
}

function Stop-Children {
  foreach ($proc in @($script:Children)) {
    try {
      if (-not $proc.HasExited) {
        $proc.Kill()
      }
    } catch { }
  }
}

function New-Stub {
  $stubDir = Join-Path $script:Work 'stub'
  New-Item -ItemType Directory -Force -Path $stubDir | Out-Null
  if ($IsWindows) {
    $source = Join-Path $stubDir 'stub.cs'
    $script:StubExe = Join-Path $stubDir 'node-stub.exe'
    [System.IO.File]::WriteAllText($source, @'
using System;
using System.IO;
public class Program {
  public static int Main(string[] args) {
    string dir = Path.GetDirectoryName(System.Reflection.Assembly.GetExecutingAssembly().Location);
    string versionPath = Path.Combine(dir, "fixture-version.txt");
    string version = File.Exists(versionPath) ? File.ReadAllText(versionPath).Trim() : "";
    if (args.Length >= 1 && args[0] == "--version") {
      Console.WriteLine(version);
      return 0;
    }
    bool failNpm = File.Exists(Path.Combine(dir, "fail-npm"));
    if (args.Length >= 2 && args[1] == "--version") {
      if (failNpm || !File.Exists(args[0])) {
        return 1;
      }
      Console.WriteLine("10.9.0");
      return 0;
    }
    return 1;
  }
}
'@, $script:Utf8)
    $csc = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
    & $csc /nologo /optimize+ /out:$script:StubExe $source
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $script:StubExe)) {
      Fail "csc could not build the Node.js stub (exit $LASTEXITCODE)"
    }
  } else {
    $script:StubExe = Join-Path $stubDir 'node-stub'
    [System.IO.File]::WriteAllText($script:StubExe, @'
#!/bin/sh
dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
version=$(tr -d '\r\n' < "$dir/fixture-version.txt")
if [ "$1" = "--version" ]; then
  printf '%s\n' "$version"
  exit 0
fi
if [ -f "$dir/fail-npm" ]; then
  exit 1
fi
if [ "$2" = "--version" ] && [ -f "$1" ]; then
  printf '%s\n' "10.9.0"
  exit 0
fi
exit 1
'@, $script:Utf8)
    Grant-Execute $script:StubExe
  }
}

function Write-Driver {
  $script:Driver = Join-Path $script:Work 'Invoke-ToolchainDriver.ps1'
  [System.IO.File]::WriteAllText($script:Driver, @'
# Fixture driver for shared Node.js toolchain publication.
#Requires -Version 7.6
param(
  [Parameter(Mandatory = $true)][string]$Installer,
  [Parameter(Mandatory = $true)][string]$Store,
  [Parameter(Mandatory = $true)][string]$Payload,
  [Parameter(Mandatory = $true)][string]$Stub,
  [Parameter(Mandatory = $true)][string]$Version,
  [Parameter(Mandatory = $true)][string]$Platform,
  [Parameter(Mandatory = $true)][string]$Hash,
  [Parameter(Mandatory = $true)][string]$Mode,
  [string]$Log = '',
  [string]$Ready = '',
  [string]$Release = '',
  [int]$DelayMs = 0,
  [int]$LockTimeoutSeconds = 120
)
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
Set-StrictMode -Version Latest
if ($Platform -ne 'win-x64') {
  throw "driver expects win-x64, got $Platform"
}
$empty = Join-Path $Payload 'empty-path'
New-Item -ItemType Directory -Force -Path $empty | Out-Null
$env:PATH = $empty
$env:BRAID_TOOLCHAIN_DIR = $Store
. $Installer

function Save-BraidNodeArchive {
  param(
    [Parameter(Mandatory = $true)][string]$Version,
    [Parameter(Mandatory = $true)][string]$Platform,
    [Parameter(Mandatory = $true)][string]$CacheDirectory
  )
  New-Item -ItemType Directory -Force -Path $CacheDirectory | Out-Null
  $zipName = "node-v$Version-$Platform.zip"
  $zipPath = Join-Path $CacheDirectory $zipName
  $sumPath = Join-Path $CacheDirectory 'SHASUMS256.txt'
  Copy-Item -LiteralPath (Join-Path $Payload $zipName) -Destination $zipPath
  Copy-Item -LiteralPath (Join-Path $Payload 'SHASUMS256.txt') -Destination $sumPath
  if (-not [string]::IsNullOrWhiteSpace($Log)) {
    [System.IO.File]::AppendAllText($Log, "save $Version`n")
  }
  if ($DelayMs -gt 0) {
    Start-Sleep -Milliseconds $DelayMs
  }
  return @{ ZipPath = $zipPath; SumPath = $sumPath; ZipName = $zipName }
}

function Expand-BraidNodeArchive {
  param(
    [Parameter(Mandatory = $true)][string]$ZipPath,
    [Parameter(Mandatory = $true)][string]$StagingDirectory,
    [Parameter(Mandatory = $true)][string]$Version,
    [Parameter(Mandatory = $true)][string]$Platform
  )
  $inner = Join-Path $StagingDirectory "node-v$Version-$Platform"
  $npmDir = Join-Path $inner 'node_modules/npm/bin'
  New-Item -ItemType Directory -Force -Path $npmDir | Out-Null
  $nodePath = Join-Path $inner 'node.exe'
  Copy-Item -LiteralPath $Stub -Destination $nodePath
  if (-not $IsWindows) {
    [System.IO.File]::SetUnixFileMode(
      $nodePath,
      [System.IO.UnixFileMode]::UserRead -bor [System.IO.UnixFileMode]::UserWrite -bor [System.IO.UnixFileMode]::UserExecute)
  }
  $utf8 = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText((Join-Path $inner 'fixture-version.txt'), "v$Version", $utf8)
  [System.IO.File]::WriteAllText((Join-Path $npmDir 'npm-cli.js'), "// fixture`n", $utf8)
  return $inner
}

function Invoke-BraidBeforePublish {
  if ($Mode -ne 'hold') {
    return
  }
  if ([string]::IsNullOrWhiteSpace($Ready) -or [string]::IsNullOrWhiteSpace($Release)) {
    throw 'hold mode requires ready and release files'
  }
  [System.IO.File]::WriteAllText($Ready, "ready`n")
  $deadline = [DateTime]::UtcNow.AddSeconds(45)
  while (-not (Test-Path -LiteralPath $Release)) {
    if ([DateTime]::UtcNow -ge $deadline) {
      throw 'timed out waiting for the fixture release file'
    }
    Start-Sleep -Milliseconds 50
  }
}

$hashes = @{ $Platform = $Hash }
$result = Resolve-BraidNodeToolchain -ForWindows:$true -Architecture 'X64' -Version $Version -PinnedHashes $hashes -LockTimeoutSeconds $LockTimeoutSeconds
Write-Output $result
'@, $script:Utf8)
}

function Assert-NoRuntimeLeft {
  param([Parameter(Mandatory = $true)][string]$Store)
  if (-not (Test-Path -LiteralPath $Store)) {
    return
  }
  $leftovers = @(Get-ChildItem -LiteralPath $Store -Recurse -Filter 'node.exe' -ErrorAction SilentlyContinue)
  if ($leftovers.Count -ne 0) {
    Fail "a runtime remained under ${Store}: $($leftovers.FullName -join ', ')"
  }
}

function Test-ProductionPins {
  $expectedX64 = 'dcc60d59a0746999f99064a01c020445d54d84228c691cdbf25b49ac3b59150a'
  $expectedArm = 'a9427139595156ef484e1fb08957676e09d4232368dd1743a2a9f93f3d241b14'
  Assert-True ($Script:BraidNodeZipHash.Count -eq 2) 'production pin table changed size'
  Assert-True ($Script:BraidNodeZipHash['win-x64'] -eq $expectedX64) 'win-x64 production hash changed'
  Assert-True ($Script:BraidNodeZipHash['win-arm64'] -eq $expectedArm) 'win-arm64 production hash changed'
  Assert-True ($Script:BraidNodeVersion -eq '26.13.0') 'production Node.js pin changed'
  Assert-True ($Script:BraidToolchainLockTimeoutSeconds -eq 120) 'lock timeout is not 120 seconds'
  $text = Get-Content -Raw -LiteralPath $script:Installer
  Assert-True ($text -match 'https://nodejs\.org/dist/v\$Version') 'official archive URL is missing'
  Assert-True ($text -match 'Write-Output \(Resolve-BraidNodeToolchain\)') 'direct entry does not call the resolver'
  Assert-True ($text -notmatch 'BraidRepoRoot|\.tools/node|\.tools/cache') 'installer still references checkout-local tools'
}

function Test-PlatformAndRange {
  Assert-True ($null -eq (Get-BraidNodePlatform -ForWindows:$false)) 'non-Windows platform was not empty'
  Assert-True ((Get-BraidNodePlatform -ForWindows:$true -Architecture 'X64') -eq 'win-x64') 'x64 platform mismatch'
  Assert-True ((Get-BraidNodePlatform -ForWindows:$true -Architecture 'Arm64') -eq 'win-arm64') 'arm64 platform mismatch'
  $unsupported = $false
  try {
    Get-BraidNodePlatform -ForWindows:$true -Architecture 'X86' | Out-Null
  } catch {
    $unsupported = $true
    Assert-Match "$_" 'X86' 'unsupported architecture'
  }
  Assert-True $unsupported 'unsupported architecture was accepted'
  $node26 = Join-Path $script:CompatibleRuntime $(if ($IsWindows) { 'node.exe' } else { 'node' })
  $nodeOld = Join-Path $script:OldRuntime $(if ($IsWindows) { 'node.exe' } else { 'node' })
  $nodeLow = Join-Path $script:LowRuntime $(if ($IsWindows) { 'node.exe' } else { 'node' })
  $nodeNext = Join-Path $script:NextRuntime $(if ($IsWindows) { 'node.exe' } else { 'node' })
  Assert-True (Test-BraidNodeInRange -NodeExe $node26) '26.13.0 was rejected'
  Assert-True (-not (Test-BraidNodeInRange -NodeExe $nodeOld)) '24.19.0 was accepted'
  Assert-True (-not (Test-BraidNodeInRange -NodeExe $nodeLow)) '26.12.0 was accepted'
  Assert-True (-not (Test-BraidNodeInRange -NodeExe $nodeNext)) '27.0.0 was accepted'
}

function Test-PathPrecedence {
  $store = New-Store
  $cwd = Join-Path $script:Work 'path-cwd'
  New-Item -ItemType Directory -Force -Path $cwd | Out-Null
  $previous = Get-Location
  Set-Location -LiteralPath $cwd
  try {
    Enter-Env -PathDir $script:CompatibleRuntime -Store 'rel-store'
    try {
      $resolved = Resolve-BraidNodeToolchain
      Assert-SamePath $resolved $script:CompatibleRuntime 'resolver PATH hit'
      Assert-True (-not (Test-Path -LiteralPath (Join-Path $cwd 'rel-store'))) 'PATH hit created a relative store'
      Assert-True (-not (Test-Path -LiteralPath (Join-Path $cwd '.tools'))) 'PATH hit created .tools'
    } finally {
      Exit-Env
    }
    $direct = Invoke-Direct -PathDir $script:CompatibleRuntime -Store $store -WorkingDirectory $cwd
    Assert-True ($direct.Exit -eq 0) "direct PATH installer exited $($direct.Exit): $($direct.Stderr)"
    $line = Get-SingleLine $direct.Stdout
    Assert-SamePath $line $script:CompatibleRuntime 'direct PATH stdout'
    Assert-True ("$($direct.Stdout)" -notmatch 'Using Node\.js') 'direct stdout contained a diagnostic'
    Assert-Match $direct.Stderr 'Using Node\.js on PATH' 'direct PATH stderr'
    Assert-True (-not (Test-Path -LiteralPath $store)) 'direct PATH hit created the store'
  } finally {
    Set-Location -LiteralPath $previous
  }
}

function Test-UnixLayoutPath {
  Enter-Env -PathDir $script:UnixRuntime -Store (New-Store)
  try {
    $resolved = Resolve-BraidNodeToolchain
    Assert-SamePath $resolved $script:UnixRuntime 'unix-layout PATH runtime'
  } finally {
    Exit-Env
  }
}

function Test-UnusableNpm {
  $store = New-Store
  $payload = New-FixturePayload -Directory (Join-Path $script:Work 'payload-unusable') -Version '0.0.1'
  Reset-FixtureState
  $script:FixturePayload = $payload.Directory
  $script:FixtureLog = Join-Path $script:Work 'unusable-saves.log'
  foreach ($runtime in @($script:NoNpmRuntime, $script:BadNpmRuntime)) {
    $result = Invoke-FixtureResolve -Store $store -Version '0.0.1' -Hash $payload.Hash -PathDir $runtime -UseFixtureCopy
    Assert-SamePath $result (Join-Path $store 'node-v0.0.1-win-x64') 'unusable npm fallback'
    Assert-True (Test-Path -LiteralPath $script:FixtureLog) 'unusable npm did not fall back to an install'
    Remove-Item -LiteralPath (Join-Path $store 'node-v0.0.1-win-x64') -Recurse -Force
    Remove-Item -LiteralPath $script:FixtureLog -Force
  }
}

function Test-IncompatibleFallback {
  $store = New-Store
  $payload = New-FixturePayload -Directory (Join-Path $script:Work 'payload-old') -Version '0.0.1'
  Reset-FixtureState
  $script:FixturePayload = $payload.Directory
  $script:FixtureLog = Join-Path $script:Work 'old-saves.log'
  $result = Invoke-FixtureResolve -Store $store -Version '0.0.1' -Hash $payload.Hash -PathDir $script:OldRuntime -UseFixtureCopy
  Assert-SamePath $result (Join-Path $store 'node-v0.0.1-win-x64') 'incompatible PATH fallback'
  Assert-True ((Get-Content -LiteralPath $script:FixtureLog) -match 'save 0\.0\.1') 'incompatible PATH did not install'
  Assert-True ($payload.Hash -ne $Script:BraidNodeZipHash['win-x64']) 'fixture hash collided with the production pin'
}

function Test-TwoRootsAndWarmReuse {
  $store = New-Store
  $payload = New-FixturePayload -Directory (Join-Path $script:Work 'payload-warm') -Version '0.0.1'
  $rootA = Join-Path $script:Work 'repo-a'
  $rootB = Join-Path $script:Work 'repo-b'
  New-Item -ItemType Directory -Force -Path $rootA, $rootB | Out-Null
  Reset-FixtureState
  $script:FixturePayload = $payload.Directory
  $script:FixtureLog = Join-Path $script:Work 'warm-saves.log'
  $previous = Get-Location
  try {
    Set-Location -LiteralPath $rootA
    $first = Invoke-FixtureResolve -Store $store -Version '0.0.1' -Hash $payload.Hash -UseFixtureCopy
    Set-Location -LiteralPath $rootB
    $script:FixtureFailSave = $true
    $script:FixtureFailExpand = $true
    $oldHttp = $env:HTTP_PROXY
    $oldHttps = $env:HTTPS_PROXY
    $env:HTTP_PROXY = 'http://127.0.0.1:9'
    $env:HTTPS_PROXY = 'http://127.0.0.1:9'
    try {
      $second = Invoke-FixtureResolve -Store $store -Version '0.0.1' -Hash $payload.Hash -UseFixtureCopy
    } finally {
      if ($null -eq $oldHttp) { Remove-Item Env:HTTP_PROXY -ErrorAction SilentlyContinue } else { $env:HTTP_PROXY = $oldHttp }
      if ($null -eq $oldHttps) { Remove-Item Env:HTTPS_PROXY -ErrorAction SilentlyContinue } else { $env:HTTPS_PROXY = $oldHttps }
    }
  } finally {
    Set-Location -LiteralPath $previous
  }
  Assert-SamePath $first (Join-Path $store 'node-v0.0.1-win-x64') 'first root'
  Assert-SamePath $second $first 'second root'
  $saves = @(Get-Content -LiteralPath $script:FixtureLog | Where-Object { $_ -match '^save ' })
  Assert-True ($saves.Count -eq 1) "warm reuse downloaded again: $($saves.Count)"
  Assert-True (-not (Test-Path -LiteralPath (Join-Path $rootA '.tools'))) 'repo A grew .tools'
  Assert-True (-not (Test-Path -LiteralPath (Join-Path $rootB '.tools'))) 'repo B grew .tools'
  Assert-True (Test-Path -LiteralPath (Join-Path $store 'locks/node-v0.0.1-win-x64.lock')) 'lock file was deleted'
  Assert-NoRuntimeLeft -Store (Join-Path $store 'staging')
}

function Test-TwoPins {
  $store = New-Store
  $firstPayload = New-FixturePayload -Directory (Join-Path $script:Work 'payload-a') -Version '0.0.1'
  $secondPayload = New-FixturePayload -Directory (Join-Path $script:Work 'payload-b') -Version '0.0.2'
  Assert-True ($firstPayload.Hash -ne $secondPayload.Hash) 'pin fixtures accidentally shared a hash'
  Reset-FixtureState
  $script:FixturePayload = $firstPayload.Directory
  $first = Invoke-FixtureResolve -Store $store -Version '0.0.1' -Hash $firstPayload.Hash -UseFixtureCopy
  [System.IO.File]::WriteAllText((Join-Path $first 'marker.txt'), "keep`n", $script:Utf8)
  $script:FixturePayload = $secondPayload.Directory
  $second = Invoke-FixtureResolve -Store $store -Version '0.0.2' -Hash $secondPayload.Hash -UseFixtureCopy
  Assert-SamePath $first (Join-Path $store 'node-v0.0.1-win-x64') 'pin A'
  Assert-SamePath $second (Join-Path $store 'node-v0.0.2-win-x64') 'pin B'
  Assert-True ((Get-Content -LiteralPath (Join-Path $first 'marker.txt')) -contains 'keep') 'pin A was rewritten'
  $meta = Get-Content -Raw -LiteralPath (Join-Path $first '.braid-toolchain.json') | ConvertFrom-Json
  Assert-True ($meta.version -eq '0.0.1' -and $meta.archiveSha256 -eq $firstPayload.Hash) 'pin A metadata changed'
  Assert-True ($Script:BraidNodeZipHash.Count -eq 2) 'test pins were written into the production table'
}

function Test-ChecksumFailures {
  $badOfficial = ''.PadLeft(64, '0')
  $badPinned = ''.PadLeft(64, 'e')
  $payload = New-FixturePayload -Directory (Join-Path $script:Work 'payload-bad-official') -Version '0.0.1' -OfficialHash $badOfficial
  Reset-FixtureState
  $script:FixturePayload = $payload.Directory
  $script:FixtureFailExpand = $true
  $store = New-Store
  $failed = $false
  try {
    Invoke-FixtureResolve -Store $store -Version '0.0.1' -Hash $payload.Hash -UseFixtureCopy | Out-Null
  } catch {
    $failed = $true
    Assert-Match "$_" 'integrity check failed' 'official checksum'
    Assert-Match "$_" 'official=0{64}' 'official checksum value'
  }
  Assert-True $failed 'wrong official checksum was accepted'
  Assert-True (-not (Test-Path -LiteralPath (Join-Path $store 'node-v0.0.1-win-x64'))) 'wrong official checksum published a key'
  Assert-NoRuntimeLeft -Store $store

  $payload2 = New-FixturePayload -Directory (Join-Path $script:Work 'payload-bad-pinned') -Version '0.0.1'
  $script:FixturePayload = $payload2.Directory
  $store2 = New-Store
  $failed = $false
  try {
    Invoke-FixtureResolve -Store $store2 -Version '0.0.1' -Hash $badPinned -UseFixtureCopy | Out-Null
  } catch {
    $failed = $true
    Assert-Match "$_" 'integrity check failed' 'pinned checksum'
    Assert-Match "$_" "pinned=$badPinned" 'pinned checksum value'
  }
  Assert-True $failed 'wrong pinned checksum was accepted'
  Assert-True (-not (Test-Path -LiteralPath (Join-Path $store2 'node-v0.0.1-win-x64'))) 'wrong pinned checksum published a key'
  $zip = Join-Path $store2 'cache/node-v0.0.1-win-x64/node-v0.0.1-win-x64.zip'
  Assert-True (-not (Test-Path -LiteralPath $zip)) 'failed archive was kept'
}

function Test-ExtractFailures {
  $payload = New-FixturePayload -Directory (Join-Path $script:Work 'payload-extract') -Version '0.0.1'
  Reset-FixtureState
  $script:FixturePayload = $payload.Directory
  $script:FixtureOmitNpm = $true
  $store = New-Store
  $failed = $false
  try {
    Invoke-FixtureResolve -Store $store -Version '0.0.1' -Hash $payload.Hash -UseFixtureCopy | Out-Null
  } catch {
    $failed = $true
    Assert-Match "$_" 'unusable' 'missing npm'
  }
  Assert-True $failed 'missing npm was published'
  Assert-NoRuntimeLeft -Store $store

  $script:FixtureOmitNpm = $false
  $script:FixtureReportedVersion = 'v26.12.0'
  $store2 = New-Store
  $failed = $false
  try {
    Invoke-FixtureResolve -Store $store2 -Version '0.0.1' -Hash $payload.Hash -UseFixtureCopy | Out-Null
  } catch {
    $failed = $true
    Assert-Match "$_" 'unusable' 'wrong extracted version'
  }
  Assert-True $failed 'wrong extracted version was published'
  Assert-NoRuntimeLeft -Store $store2
}

function Test-CorruptPreserved {
  $payload = New-FixturePayload -Directory (Join-Path $script:Work 'payload-corrupt') -Version '0.0.1'
  Reset-FixtureState
  $script:FixturePayload = $payload.Directory
  $store = New-Store
  $dest = Invoke-FixtureResolve -Store $store -Version '0.0.1' -Hash $payload.Hash -UseFixtureCopy
  [System.IO.File]::WriteAllText((Join-Path $dest 'marker.txt'), "keep`n", $script:Utf8)
  Remove-Item -LiteralPath (Join-Path $dest 'node_modules/npm/bin/npm-cli.js') -Force
  $script:FixtureFailSave = $true
  $failed = $false
  try {
    Invoke-FixtureResolve -Store $store -Version '0.0.1' -Hash $payload.Hash -UseFixtureCopy | Out-Null
  } catch {
    $failed = $true
    Assert-Match "$_" ([regex]::Escape($dest)) 'corrupt path'
    Assert-Match "$_" 'preserved' 'corrupt recovery'
  }
  Assert-True $failed 'corrupt toolchain was overwritten'
  Assert-True ((Get-Content -LiteralPath (Join-Path $dest 'marker.txt')) -contains 'keep') 'corrupt directory was replaced'

  $store2 = New-Store
  $script:FixtureFailSave = $false
  $dest2 = Invoke-FixtureResolve -Store $store2 -Version '0.0.1' -Hash $payload.Hash -UseFixtureCopy
  $metaPath = Join-Path $dest2 '.braid-toolchain.json'
  $meta = Get-Content -Raw -LiteralPath $metaPath | ConvertFrom-Json
  $meta.archiveSha256 = ''.PadLeft(64, 'a')
  [System.IO.File]::WriteAllText($metaPath, (($meta | ConvertTo-Json -Compress) + "`n"), $script:Utf8)
  $script:FixtureFailSave = $true
  $failed = $false
  try {
    Invoke-FixtureResolve -Store $store2 -Version '0.0.1' -Hash $payload.Hash -UseFixtureCopy | Out-Null
  } catch {
    $failed = $true
    Assert-Match "$_" 'preserved' 'metadata recovery'
  }
  Assert-True $failed 'inconsistent metadata was overwritten'
  Assert-True (Test-Path -LiteralPath $dest2) 'inconsistent directory was removed'
}

function Test-HandledFailure {
  $payload = New-FixturePayload -Directory (Join-Path $script:Work 'payload-handled') -Version '0.0.1'
  Reset-FixtureState
  $script:FixturePayload = $payload.Directory
  $store = New-Store
  New-Item -ItemType Directory -Force -Path $store | Out-Null
  [System.IO.File]::WriteAllText((Join-Path $store 'unrelated.txt'), "keep`n", $script:Utf8)
  $failed = $false
  try {
    Invoke-FixtureResolve -Store $store -Version '0.0.1' -Hash $payload.Hash -UseFixtureCopy -BeforePublish { throw 'stop before publish' } | Out-Null
  } catch {
    $failed = $true
    Assert-Match "$_" 'stop before publish' 'handled failure'
  }
  Assert-True $failed 'interrupted publication was treated as success'
  Assert-True (-not (Test-Path -LiteralPath (Join-Path $store 'node-v0.0.1-win-x64'))) 'handled failure published the key'
  Assert-NoRuntimeLeft -Store $store
  Assert-True ((Get-Content -LiteralPath (Join-Path $store 'unrelated.txt')) -contains 'keep') 'unrelated file was removed'
}

function Test-OverrideAndRoot {
  $cwd = Join-Path $script:Work 'override-cwd'
  New-Item -ItemType Directory -Force -Path $cwd | Out-Null
  $previous = Get-Location
  Set-Location -LiteralPath $cwd
  try {
    Enter-Env -PathDir $script:EmptyPath -Store 'rel-store'
    try {
      $failed = $false
      try {
        Resolve-BraidNodeToolchain -ForWindows:$true -Architecture 'X64' | Out-Null
      } catch {
        $failed = $true
        Assert-Match "$_" 'absolute' 'relative override'
      }
      Assert-True $failed 'relative override was accepted'
      Assert-True (-not (Test-Path -LiteralPath (Join-Path $cwd 'rel-store'))) 'relative override created a directory'
    } finally {
      Exit-Env
    }
    $direct = Invoke-Direct -PathDir $script:EmptyPath -Store 'rel-store' -WorkingDirectory $cwd
    Assert-True ($direct.Exit -ne 0) 'direct relative override exited 0'
    Assert-Match $direct.Stderr 'absolute' 'direct relative override'
    Assert-True (-not (Test-Path -LiteralPath (Join-Path $cwd 'rel-store'))) 'direct relative override created a directory'
  } finally {
    Set-Location -LiteralPath $previous
  }

  $local = Join-Path $script:Work 'localappdata'
  New-Item -ItemType Directory -Force -Path $local | Out-Null
  $payload = New-FixturePayload -Directory (Join-Path $script:Work 'payload-default-root') -Version '0.0.1'
  Reset-FixtureState
  $script:FixturePayload = $payload.Directory
  Enter-Env -PathDir $script:EmptyPath -ClearStore -LocalAppData $local
  try {
    $result = Resolve-BraidNodeToolchain -ForWindows:$true -Architecture 'X64' -Version '0.0.1' -PinnedHashes @{ 'win-x64' = $payload.Hash } -SaveArchive ${function:Save-FixtureArchive} -ExpandArchive ${function:Expand-FixtureArchive}
  } finally {
    Exit-Env
  }
  Assert-SamePath $result (Join-Path (Join-Path (Join-Path $local 'braid') 'toolchains') 'node-v0.0.1-win-x64') 'default root'

  Enter-Env -PathDir $script:EmptyPath -ClearStore -ClearLocal
  try {
    $failed = $false
    try {
      Resolve-BraidNodeToolchain -ForWindows:$true -Architecture 'X64' | Out-Null
    } catch {
      $failed = $true
      Assert-Match "$_" 'LOCALAPPDATA' 'missing LOCALAPPDATA'
    }
    Assert-True $failed 'missing LOCALAPPDATA was accepted'
  } finally {
    Exit-Env
  }
}

function Test-NonWindows {
  $store = New-Store
  Enter-Env -PathDir $script:EmptyPath -Store $store
  try {
    $failed = $false
    try {
      Resolve-BraidNodeToolchain -ForWindows:$false | Out-Null
    } catch {
      $failed = $true
      Assert-Match "$_" 'does not download' 'non-Windows failure'
    }
    Assert-True $failed 'non-Windows without PATH was accepted'
    Assert-True (-not (Test-Path -LiteralPath $store)) 'non-Windows failure created the store'
  } finally {
    Exit-Env
  }
  if (-not $IsWindows) {
    $direct = Invoke-Direct -PathDir $script:EmptyPath -Store $store
    Assert-True ($direct.Exit -ne 0) 'direct non-Windows installer exited 0'
    Assert-Match $direct.Stderr 'does not download' 'direct non-Windows failure'
  }
}

function Test-DirectWarmFallback {
  if (-not $IsWindows) {
    return
  }
  $store = New-Store
  $platform = Get-BraidNodePlatform
  $version = $Script:BraidNodeVersion
  $hash = [string]$Script:BraidNodeZipHash[$platform]
  $dest = Join-Path $store "node-v$version-$platform"
  $npmDir = Join-Path $dest 'node_modules/npm/bin'
  New-Item -ItemType Directory -Force -Path $npmDir | Out-Null
  Copy-Item -LiteralPath $script:StubExe -Destination (Join-Path $dest 'node.exe')
  [System.IO.File]::WriteAllText((Join-Path $dest 'fixture-version.txt'), "v$version", $script:Utf8)
  [System.IO.File]::WriteAllText((Join-Path $npmDir 'npm-cli.js'), "// fixture`n", $script:Utf8)
  $json = (@{ version = $version; platform = $platform; archiveSha256 = $hash } | ConvertTo-Json -Compress) + "`n"
  [System.IO.File]::WriteAllText((Join-Path $dest '.braid-toolchain.json'), $json, $script:Utf8)
  $direct = Invoke-Direct -PathDir $script:OldRuntime -Store $store
  Assert-True ($direct.Exit -eq 0) "direct warm fallback exited $($direct.Exit): $($direct.Stderr)"
  Assert-SamePath (Get-SingleLine $direct.Stdout) $dest 'direct warm stdout'
  Assert-True ($direct.Stderr -notmatch 'Downloading') 'direct warm fallback downloaded'
}

function Test-Concurrency {
  $store = New-Store
  $payload = New-FixturePayload -Directory (Join-Path $script:Work 'payload-concurrent') -Version '0.0.1'
  $log = Join-Path $script:Work 'concurrent-saves.log'
  $first = Start-Driver -Mode 'install' -Store $store -Payload $payload.Directory -Version '0.0.1' -Hash $payload.Hash -Log $log -DelayMs 1500
  $second = Start-Driver -Mode 'install' -Store $store -Payload $payload.Directory -Version '0.0.1' -Hash $payload.Hash -Log $log -DelayMs 1500
  $left = Wait-Driver -Proc $first
  $right = Wait-Driver -Proc $second
  Assert-True ($left.Exit -eq 0) "concurrent installer A exited $($left.Exit): $($left.Stderr)"
  Assert-True ($right.Exit -eq 0) "concurrent installer B exited $($right.Exit): $($right.Stderr)"
  $pathA = Get-SingleLine $left.Stdout
  $pathB = Get-SingleLine $right.Stdout
  Assert-SamePath $pathA (Join-Path $store 'node-v0.0.1-win-x64') 'concurrent result'
  Assert-SamePath $pathB $pathA 'concurrent waiter'
  $saves = @(Get-Content -LiteralPath $log | Where-Object { $_ -match '^save ' })
  Assert-True ($saves.Count -eq 1) "concurrent installers published separately: $($saves.Count)"
}

function Test-Interruption {
  $store = New-Store
  $payload = New-FixturePayload -Directory (Join-Path $script:Work 'payload-interrupt') -Version '0.0.1'
  $ready = Join-Path $script:Work 'interrupt-ready'
  $release = Join-Path $script:Work 'interrupt-release'
  $proc = Start-Driver -Mode 'hold' -Store $store -Payload $payload.Directory -Version '0.0.1' -Hash $payload.Hash -Ready $ready -Release $release
  Wait-Ready $ready
  try { $proc.Kill() } catch { Fail "could not interrupt the installer: $_" }
  Wait-Driver -Proc $proc | Out-Null
  $dest = Join-Path $store 'node-v0.0.1-win-x64'
  Assert-True (-not (Test-Path -LiteralPath $dest)) 'interrupted install published the final key'
  $staged = @(Get-ChildItem -LiteralPath (Join-Path $store 'staging') -Recurse -Filter '.braid-toolchain.json' -Force -ErrorAction SilentlyContinue)
  Assert-True ($staged.Count -ge 1) 'interrupted install left no staging metadata'
  Reset-FixtureState
  $script:FixturePayload = $payload.Directory
  $result = Invoke-FixtureResolve -Store $store -Version '0.0.1' -Hash $payload.Hash -UseFixtureCopy -LockTimeoutSeconds 30
  Assert-SamePath $result $dest 'install after interruption'
  Assert-True ($result -notmatch '[\\/]staging[\\/]') 'resolver selected abandoned staging'
  $stagedAfter = @(Get-ChildItem -LiteralPath (Join-Path $store 'staging') -Directory -ErrorAction SilentlyContinue)
  Assert-True ($stagedAfter.Count -ge 1) 'abandoned staging was deleted or selected'
}

function Test-LockTimeout {
  $store = New-Store
  $payload = New-FixturePayload -Directory (Join-Path $script:Work 'payload-timeout') -Version '0.0.1'
  $ready = Join-Path $script:Work 'timeout-ready'
  $release = Join-Path $script:Work 'timeout-release'
  $proc = Start-Driver -Mode 'hold' -Store $store -Payload $payload.Directory -Version '0.0.1' -Hash $payload.Hash -Ready $ready -Release $release
  Wait-Ready $ready
  Reset-FixtureState
  $script:FixturePayload = $payload.Directory
  $script:FixtureFailSave = $true
  $started = [DateTime]::UtcNow
  $failed = $false
  try {
    Invoke-FixtureResolve -Store $store -Version '0.0.1' -Hash $payload.Hash -UseFixtureCopy -LockTimeoutSeconds 2 | Out-Null
  } catch {
    $failed = $true
    Assert-Match "$_" 'Timed out after 2 seconds' 'lock timeout'
    Assert-Match "$_" ([regex]::Escape((Join-Path $store 'locks/node-v0.0.1-win-x64.lock'))) 'lock path'
    Assert-True ("$_" -notmatch 'fixture download is disabled') 'lock waiter started a second download'
  }
  $elapsed = ([DateTime]::UtcNow - $started).TotalSeconds
  Assert-True $failed 'lock waiter did not time out'
  Assert-True ($elapsed -ge 1 -and $elapsed -lt 20) "lock wait was not bounded: $elapsed seconds"
  [System.IO.File]::WriteAllText($release, "go`n", $script:Utf8)
  $finished = Wait-Driver -Proc $proc -TimeoutSeconds 30
  Assert-True ($finished.Exit -eq 0) "holder exited $($finished.Exit): $($finished.Stderr)"
  $script:FixtureFailSave = $true
  $script:FixtureFailExpand = $true
  $reused = Invoke-FixtureResolve -Store $store -Version '0.0.1' -Hash $payload.Hash -UseFixtureCopy
  Assert-SamePath $reused (Join-Path $store 'node-v0.0.1-win-x64') 'reuse after the lock holder published'
  Assert-True (Test-Path -LiteralPath (Join-Path $store 'locks/node-v0.0.1-win-x64.lock')) 'lock file was removed after publication'
}

function Test-CheckoutUntouched {
  Assert-True ((Test-Path -LiteralPath (Join-Path $script:RepoRoot '.tools')) -eq $script:ToolsBefore) 'the checkout .tools directory changed'
  Test-ProductionPins
}

New-Item -ItemType Directory -Force -Path $script:Work | Out-Null
try {
  New-Stub
  Write-Driver
  . $script:Installer
  $script:EmptyPath = Join-Path $script:Work 'empty-path'
  New-Item -ItemType Directory -Force -Path $script:EmptyPath | Out-Null
  $script:CompatibleRuntime = New-NodeLayout -Directory (Join-Path $script:Work 'path-ok') -VersionText 'v26.13.0'
  $script:OldRuntime = New-NodeLayout -Directory (Join-Path $script:Work 'path-old') -VersionText 'v24.19.0'
  $script:LowRuntime = New-NodeLayout -Directory (Join-Path $script:Work 'path-low') -VersionText 'v26.12.0'
  $script:NextRuntime = New-NodeLayout -Directory (Join-Path $script:Work 'path-next') -VersionText 'v27.0.0'
  $script:NoNpmRuntime = New-NodeLayout -Directory (Join-Path $script:Work 'path-no-npm') -VersionText 'v26.13.0' -OmitNpm
  $script:BadNpmRuntime = New-NodeLayout -Directory (Join-Path $script:Work 'path-bad-npm') -VersionText 'v26.13.0' -FailNpm
  $script:UnixRuntime = New-NodeLayout -Directory (Join-Path $script:Work 'path-unix') -VersionText 'v26.13.0' -Layout 'bin-lib'
  Reset-FixtureState
  Test-ProductionPins
  Test-PlatformAndRange
  Test-PathPrecedence
  Test-UnixLayoutPath
  Test-UnusableNpm
  Test-IncompatibleFallback
  Test-TwoRootsAndWarmReuse
  Test-TwoPins
  Test-ChecksumFailures
  Test-ExtractFailures
  Test-CorruptPreserved
  Test-HandledFailure
  Test-OverrideAndRoot
  Test-NonWindows
  Test-DirectWarmFallback
  Test-Concurrency
  Test-Interruption
  Test-LockTimeout
  Test-CheckoutUntouched
  Write-Output 'node-toolchain: ok'
  exit 0
} finally {
  Stop-Children
  if ($script:OriginalStorePresent) {
    $env:BRAID_TOOLCHAIN_DIR = $script:OriginalStore
  } else {
    Remove-Item Env:BRAID_TOOLCHAIN_DIR -ErrorAction SilentlyContinue
  }
  if ($script:OriginalLocalPresent) {
    $env:LOCALAPPDATA = $script:OriginalLocal
  } else {
    Remove-Item Env:LOCALAPPDATA -ErrorAction SilentlyContinue
  }
  $env:PATH = $script:OriginalPath
  if (Test-Path -LiteralPath $script:Work) {
    Start-Sleep -Milliseconds 200
    try {
      Remove-Item -LiteralPath $script:Work -Recurse -Force -ErrorAction Stop
    } catch {
      [Console]::Error.WriteLine("node-toolchain: left temp directory in place: $($script:Work)")
    }
  }
}
