# Selects a Node.js toolchain and writes its directory to stdout.
# Order, for direct execution and for Resolve-BraidNodeToolchain:
#   1. a compatible Node.js already on PATH whose bundled npm runs
#   2. the selected pin already published in the shared store
#   3. on Windows, install that pin into the shared store
# The shared root is %LOCALAPPDATA%/braid/toolchains, or an absolute
# BRAID_TOOLCHAIN_DIR. The override does not change the version or hashes.
# Checkout-local .tools is not read, migrated, or written.
# Diagnostics go to stderr. The system Node.js install is not changed.
# Official SHA-256 lines for node-v26.13.0 were fetched 2026-11-03.
#Requires -Version 7.6
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
Set-StrictMode -Version Latest

function Write-ToolchainNote {
  param([Parameter(Mandatory = $true)][string]$Message)
  [Console]::Error.WriteLine($Message)
}

$Script:BraidNodeVersion = '26.13.0'
# Official SHA-256 lines from SHASUMS256.txt for node-v26.13.0, fetched 2026-11-03.
$Script:BraidNodeZipHash = @{
  'win-x64'   = 'dcc60d59a0746999f99064a01c020445d54d84228c691cdbf25b49ac3b59150a'
  'win-arm64' = 'a9427139595156ef484e1fb08957676e09d4232368dd1743a2a9f93f3d241b14'
}
# Per-key exclusive lock. The file is kept; the OS releases the handle on exit.
$Script:BraidToolchainLockTimeoutSeconds = 120

function Get-BraidNodePlatform {
  param(
    [bool]$ForWindows = $IsWindows,
    [string]$Architecture = ''
  )
  if (-not $ForWindows) {
    return $null
  }
  if ([string]::IsNullOrWhiteSpace($Architecture)) {
    $Architecture = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString()
  }
  switch ($Architecture) {
    'X64' { return 'win-x64' }
    'Arm64' { return 'win-arm64' }
    default { throw "Unsupported Windows architecture for the local Node.js toolchain: $Architecture. x64 and arm64 are the supported pins." }
  }
}

function Test-BraidNodeInRange {
  param([Parameter(Mandatory = $true)][string]$NodeExe)
  try {
    $raw = (& $NodeExe --version)
  } catch {
    return $false
  }
  if ($LASTEXITCODE -ne 0) {
    return $false
  }
  $text = "$raw".Trim()
  if ($text -notmatch '^v(26)\.(\d+)\.(\d+)$') {
    return $false
  }
  $minor = [int]$Matches[2]
  return $minor -ge 13
}

function Get-BraidBundledNpmCli {
  param([Parameter(Mandatory = $true)][string]$NodeExe)
  $runtime = Split-Path -Parent $NodeExe
  $prefix = Split-Path -Parent $runtime
  $candidates = @(
    (Join-Path $runtime 'node_modules/npm/bin/npm-cli.js'),
    (Join-Path $prefix 'lib/node_modules/npm/bin/npm-cli.js')
  )
  foreach ($candidate in $candidates) {
    if (Test-Path -LiteralPath $candidate -PathType Leaf) {
      return $candidate
    }
  }
  return $null
}

function Test-BraidBundledNpm {
  param([Parameter(Mandatory = $true)][string]$NodeExe)
  $npmCli = Get-BraidBundledNpmCli -NodeExe $NodeExe
  if ($null -eq $npmCli) {
    return $false
  }
  try {
    $raw = (& $NodeExe $npmCli --version)
  } catch {
    return $false
  }
  if ($LASTEXITCODE -ne 0) {
    return $false
  }
  return -not [string]::IsNullOrWhiteSpace("$raw".Trim())
}

function Get-BraidPathToolchain {
  $command = Get-Command node -ErrorAction SilentlyContinue
  if ($null -eq $command -or [string]::IsNullOrWhiteSpace($command.Source)) {
    return $null
  }
  if (-not (Test-BraidNodeInRange -NodeExe $command.Source)) {
    return $null
  }
  if (-not (Test-BraidBundledNpm -NodeExe $command.Source)) {
    return $null
  }
  return [System.IO.Path]::GetFullPath((Split-Path -Parent $command.Source))
}

function Get-BraidToolchainRoot {
  if (-not [string]::IsNullOrWhiteSpace($env:BRAID_TOOLCHAIN_DIR)) {
    $override = $env:BRAID_TOOLCHAIN_DIR.Trim()
    if (-not [System.IO.Path]::IsPathFullyQualified($override)) {
      throw "BRAID_TOOLCHAIN_DIR must be an absolute path. The value '$override' was rejected so it is not resolved against the current checkout. Set it to an absolute directory. The selected Node.js version and checksums are unchanged."
    }
    return [System.IO.Path]::GetFullPath($override)
  }
  if ([string]::IsNullOrWhiteSpace($env:LOCALAPPDATA)) {
    throw 'LOCALAPPDATA is unavailable, so the shared Node.js toolchain root %LOCALAPPDATA%/braid/toolchains cannot be resolved. Set BRAID_TOOLCHAIN_DIR to an absolute directory. Nothing was installed.'
  }
  return [System.IO.Path]::GetFullPath((Join-Path (Join-Path $env:LOCALAPPDATA 'braid') 'toolchains'))
}

function Get-BraidRuntimeFault {
  param(
    [Parameter(Mandatory = $true)][string]$RuntimeDir,
    [Parameter(Mandatory = $true)][string]$Version
  )
  $node = Join-Path $RuntimeDir 'node.exe'
  if (-not (Test-Path -LiteralPath $node -PathType Leaf)) {
    return "node.exe is missing at $node"
  }
  try {
    $raw = (& $node --version)
  } catch {
    return "node.exe at $node could not be started"
  }
  if ($LASTEXITCODE -ne 0) {
    return "node.exe at $node exited $LASTEXITCODE"
  }
  $reported = "$raw".Trim()
  if ($reported -ne "v$Version") {
    return "node.exe reported '$reported' instead of v$Version"
  }
  $npm = Join-Path $RuntimeDir 'node_modules/npm/bin/npm-cli.js'
  if (-not (Test-Path -LiteralPath $npm -PathType Leaf)) {
    return "bundled npm is missing at $npm"
  }
  try {
    $npmRaw = (& $node $npm --version)
  } catch {
    return "bundled npm at $npm could not be started"
  }
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace("$npmRaw".Trim())) {
    return "bundled npm at $npm is not usable"
  }
  return $null
}

function Get-BraidCompletedToolchainFault {
  param(
    [Parameter(Mandatory = $true)][string]$Dest,
    [Parameter(Mandatory = $true)][string]$Version,
    [Parameter(Mandatory = $true)][string]$Platform,
    [Parameter(Mandatory = $true)][string]$ExpectedHash
  )
  if (-not (Test-Path -LiteralPath $Dest)) {
    return 'missing'
  }
  if (-not (Test-Path -LiteralPath $Dest -PathType Container)) {
    return "expected a directory at $Dest"
  }
  $metaPath = Join-Path $Dest '.braid-toolchain.json'
  if (-not (Test-Path -LiteralPath $metaPath -PathType Leaf)) {
    return "completion metadata is missing at $metaPath"
  }
  try {
    $meta = Get-Content -Raw -LiteralPath $metaPath | ConvertFrom-Json
  } catch {
    return "completion metadata is unreadable at $metaPath"
  }
  $names = @($meta.PSObject.Properties.Name)
  if ($names -notcontains 'version' -or [string]$meta.version -ne $Version) {
    return "completion metadata at $metaPath does not record pin $Version"
  }
  if ($names -notcontains 'platform' -or [string]$meta.platform -ne $Platform) {
    return "completion metadata at $metaPath does not record platform $Platform"
  }
  $hash = ''
  if ($names -contains 'archiveSha256') {
    $hash = ([string]$meta.archiveSha256).ToLowerInvariant()
  }
  if ($hash -ne $ExpectedHash.ToLowerInvariant()) {
    return "completion metadata at $metaPath does not record the pinned archive SHA-256"
  }
  return Get-BraidRuntimeFault -RuntimeDir $Dest -Version $Version
}

function Get-BraidPreserveMessage {
  param(
    [Parameter(Mandatory = $true)][string]$Dest,
    [Parameter(Mandatory = $true)][string]$Fault
  )
  return "Shared Node.js toolchain at '$Dest' cannot be reused: $Fault. The directory was preserved; inspect or remove it, then retry. Other versions and unrelated files were not changed."
}

function Write-BraidToolchainMetadata {
  param(
    [Parameter(Mandatory = $true)][string]$RuntimeDir,
    [Parameter(Mandatory = $true)][string]$Version,
    [Parameter(Mandatory = $true)][string]$Platform,
    [Parameter(Mandatory = $true)][string]$ArchiveSha256
  )
  $payload = [ordered]@{
    version        = $Version
    platform       = $Platform
    archiveSha256  = $ArchiveSha256.ToLowerInvariant()
  }
  $json = ($payload | ConvertTo-Json -Compress) + "`n"
  $utf8 = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText((Join-Path $RuntimeDir '.braid-toolchain.json'), $json, $utf8)
}

function Save-BraidNodeArchive {
  param(
    [Parameter(Mandatory = $true)][string]$Version,
    [Parameter(Mandatory = $true)][string]$Platform,
    [Parameter(Mandatory = $true)][string]$CacheDirectory
  )
  $zipName = "node-v$Version-$Platform.zip"
  $base = "https://nodejs.org/dist/v$Version"
  New-Item -ItemType Directory -Force -Path $CacheDirectory | Out-Null
  $zipPath = Join-Path $CacheDirectory $zipName
  $sumPath = Join-Path $CacheDirectory 'SHASUMS256.txt'
  $previousProgress = $ProgressPreference
  $ProgressPreference = 'SilentlyContinue'
  try {
    Write-ToolchainNote "Downloading $base/SHASUMS256.txt"
    $null = Invoke-WebRequest -Uri "$base/SHASUMS256.txt" -OutFile $sumPath
    Write-ToolchainNote "Downloading $base/$zipName"
    $null = Invoke-WebRequest -Uri "$base/$zipName" -OutFile $zipPath
  } finally {
    $ProgressPreference = $previousProgress
  }
  return @{
    ZipPath = $zipPath
    SumPath = $sumPath
    ZipName = $zipName
  }
}

function Assert-BraidArchiveIntegrity {
  param(
    [Parameter(Mandatory = $true)][string]$ZipPath,
    [Parameter(Mandatory = $true)][string]$SumPath,
    [Parameter(Mandatory = $true)][string]$ZipName,
    [Parameter(Mandatory = $true)][string]$PinnedHash
  )
  $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $ZipPath).Hash.ToLowerInvariant()
  $pinned = $PinnedHash.ToLowerInvariant()
  $official = $null
  foreach ($line in @(Get-Content -LiteralPath $SumPath)) {
    if ($line -match "\s$([regex]::Escape($ZipName))$" -and $line -match '^([a-fA-F0-9]{64})\s+') {
      $official = $Matches[1].ToLowerInvariant()
      break
    }
  }
  if ($actual -ne $pinned -or $official -ne $pinned) {
    Remove-Item -LiteralPath $ZipPath -Force -ErrorAction SilentlyContinue
    throw "Node.js archive integrity check failed for $ZipName. pinned=$pinned actual=$actual official=$official"
  }
  Write-ToolchainNote "Verified SHA-256 $actual"
}

function Expand-BraidNodeArchive {
  param(
    [Parameter(Mandatory = $true)][string]$ZipPath,
    [Parameter(Mandatory = $true)][string]$StagingDirectory,
    [Parameter(Mandatory = $true)][string]$Version,
    [Parameter(Mandatory = $true)][string]$Platform
  )
  Unblock-File -LiteralPath $ZipPath
  Expand-Archive -LiteralPath $ZipPath -DestinationPath $StagingDirectory -Force
  $inner = Join-Path $StagingDirectory "node-v$Version-$Platform"
  $node = Join-Path $inner 'node.exe'
  if (-not (Test-Path -LiteralPath $node -PathType Leaf)) {
    throw "Node.js archive did not contain $node"
  }
  return $inner
}

# Default publication hook. A fixture process may replace this function to
# pause after validation and before the atomic rename.
function Invoke-BraidBeforePublish {
}

function Invoke-BraidToolchainLocked {
  param(
    [Parameter(Mandatory = $true)][string]$LockPath,
    [Parameter(Mandatory = $true)][scriptblock]$Action,
    [int]$TimeoutSeconds = $Script:BraidToolchainLockTimeoutSeconds
  )
  $directory = Split-Path -Parent $LockPath
  if (-not (Test-Path -LiteralPath $directory)) {
    New-Item -ItemType Directory -Force -Path $directory | Out-Null
  }
  $deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)
  $stream = $null
  while ($null -eq $stream) {
    try {
      $stream = [System.IO.FileStream]::new(
        $LockPath,
        [System.IO.FileMode]::OpenOrCreate,
        [System.IO.FileAccess]::ReadWrite,
        [System.IO.FileShare]::None)
    } catch [System.IO.IOException] {
      if ([DateTime]::UtcNow -ge $deadline) {
        throw "Timed out after $TimeoutSeconds seconds waiting for the Node.js toolchain lock '$LockPath'. Another installation is still publishing this pin. Retry after it exits. The lock file is kept and the operating system releases it when that process ends."
      }
      Start-Sleep -Milliseconds 100
    } catch [System.UnauthorizedAccessException] {
      if ([DateTime]::UtcNow -ge $deadline) {
        throw "Timed out after $TimeoutSeconds seconds waiting for the Node.js toolchain lock '$LockPath'. Another installation is still publishing this pin. Retry after it exits. The lock file is kept and the operating system releases it when that process ends."
      }
      Start-Sleep -Milliseconds 100
    }
  }
  try {
    & $Action
  } finally {
    $stream.Dispose()
  }
}

function Install-BraidNodeToolchain {
  param(
    [Parameter(Mandatory = $true)][string]$Root,
    [Parameter(Mandatory = $true)][string]$Dest,
    [Parameter(Mandatory = $true)][string]$Version,
    [Parameter(Mandatory = $true)][string]$Platform,
    [Parameter(Mandatory = $true)][string]$PinnedHash,
    [int]$LockTimeoutSeconds = $Script:BraidToolchainLockTimeoutSeconds,
    [scriptblock]$BeforePublish = $null,
    [scriptblock]$SaveArchive = $null,
    [scriptblock]$ExpandArchive = $null
  )
  if (-not (Test-Path -LiteralPath $Root)) {
    New-Item -ItemType Directory -Force -Path $Root | Out-Null
  }
  $lockPath = Join-Path $Root "locks/node-v$Version-$Platform.lock"
  return Invoke-BraidToolchainLocked -LockPath $lockPath -TimeoutSeconds $LockTimeoutSeconds -Action {
    $faultNow = Get-BraidCompletedToolchainFault -Dest $Dest -Version $Version -Platform $Platform -ExpectedHash $PinnedHash
    if ($null -eq $faultNow) {
      Write-ToolchainNote "Using shared Node.js toolchain: $Dest"
      return $Dest
    }
    if ($faultNow -ne 'missing') {
      throw (Get-BraidPreserveMessage -Dest $Dest -Fault $faultNow)
    }

    Write-ToolchainNote "Installing Node.js $Version ($Platform) into $Dest"
    $cache = Join-Path $Root "cache/node-v$Version-$Platform"
    if ($null -ne $SaveArchive) {
      $saved = & $SaveArchive -Version $Version -Platform $Platform -CacheDirectory $cache
    } else {
      $saved = Save-BraidNodeArchive -Version $Version -Platform $Platform -CacheDirectory $cache
    }
    Assert-BraidArchiveIntegrity -ZipPath $saved.ZipPath -SumPath $saved.SumPath -ZipName $saved.ZipName -PinnedHash $PinnedHash

    $staging = Join-Path $Root ("staging/" + [guid]::NewGuid().ToString('n'))
    New-Item -ItemType Directory -Force -Path $staging | Out-Null
    try {
      if ($null -ne $ExpandArchive) {
        $inner = & $ExpandArchive -ZipPath $saved.ZipPath -StagingDirectory $staging -Version $Version -Platform $Platform
      } else {
        $inner = Expand-BraidNodeArchive -ZipPath $saved.ZipPath -StagingDirectory $staging -Version $Version -Platform $Platform
      }
      $runtimeFault = Get-BraidRuntimeFault -RuntimeDir $inner -Version $Version
      if ($null -ne $runtimeFault) {
        throw "Extracted Node.js toolchain is unusable: $runtimeFault"
      }
      Write-BraidToolchainMetadata -RuntimeDir $inner -Version $Version -Platform $Platform -ArchiveSha256 $PinnedHash
      if ($null -ne $BeforePublish) {
        & $BeforePublish
      }
      Invoke-BraidBeforePublish
      if (Test-Path -LiteralPath $Dest) {
        throw (Get-BraidPreserveMessage -Dest $Dest -Fault 'the destination appeared before publication')
      }
      [System.IO.Directory]::Move($inner, $Dest)
      Remove-Item -LiteralPath $staging -Recurse -Force -ErrorAction SilentlyContinue
    } catch {
      if (Test-Path -LiteralPath $staging) {
        Remove-Item -LiteralPath $staging -Recurse -Force -ErrorAction SilentlyContinue
      }
      throw
    }
    Write-ToolchainNote "Using shared Node.js toolchain: $Dest"
    return $Dest
  }
}

function Resolve-BraidNodeToolchain {
  param(
    [bool]$ForWindows = $IsWindows,
    [string]$Architecture = '',
    [string]$Version = $Script:BraidNodeVersion,
    [hashtable]$PinnedHashes = $Script:BraidNodeZipHash,
    [int]$LockTimeoutSeconds = $Script:BraidToolchainLockTimeoutSeconds,
    [scriptblock]$BeforePublish = $null,
    [scriptblock]$SaveArchive = $null,
    [scriptblock]$ExpandArchive = $null
  )
  $pathToolchain = Get-BraidPathToolchain
  if ($null -ne $pathToolchain) {
    Write-ToolchainNote "Using Node.js on PATH: $pathToolchain"
    return $pathToolchain
  }

  $platform = Get-BraidNodePlatform -ForWindows:$ForWindows -Architecture $Architecture
  if ($null -eq $platform) {
    throw 'Node.js >=26.13.0 <27 with its bundled npm is not on PATH. This system does not download a Node.js archive. GitHub Actions supplies Node.js with actions/setup-node. On Windows, a checkout installs the pinned archive into the shared toolchain store.'
  }

  $pinnedHash = $null
  if ($PinnedHashes.ContainsKey($platform)) {
    $pinnedHash = [string]$PinnedHashes[$platform]
  }
  if ([string]::IsNullOrWhiteSpace($pinnedHash)) {
    throw "No pinned SHA-256 is recorded for $platform."
  }

  $root = Get-BraidToolchainRoot
  $dest = [System.IO.Path]::GetFullPath((Join-Path $root "node-v$Version-$platform"))
  $fault = Get-BraidCompletedToolchainFault -Dest $dest -Version $Version -Platform $platform -ExpectedHash $pinnedHash
  if ($null -eq $fault) {
    Write-ToolchainNote "Using shared Node.js toolchain: $dest"
    return $dest
  }
  if ($fault -ne 'missing') {
    throw (Get-BraidPreserveMessage -Dest $dest -Fault $fault)
  }

  $installed = Install-BraidNodeToolchain `
    -Root $root `
    -Dest $dest `
    -Version $Version `
    -Platform $platform `
    -PinnedHash $pinnedHash `
    -LockTimeoutSeconds $LockTimeoutSeconds `
    -BeforePublish $BeforePublish `
    -SaveArchive $SaveArchive `
    -ExpandArchive $ExpandArchive
  return [System.IO.Path]::GetFullPath($installed)
}

if ($MyInvocation.InvocationName -ne '.') {
  Write-Output (Resolve-BraidNodeToolchain)
}
