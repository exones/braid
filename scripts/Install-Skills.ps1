# Installs the braid skills (.agents/skills/braid and braid-*) from a committed Git ref
# into each agent host's personal skills folder, so every project can use them.
# It copies, never links: installed skills change only when this script runs
# again. Uncommitted edits are never installed, because files come from the ref.
# Each installed skill gets .braid-install.json naming the ref and commit.
# An existing folder without that file is not ours and is left alone unless
# -Force is given; every target is checked before anything is copied. After
# every target is installed, a stamped braid skill folder that is no longer in
# the ref is removed; removal goes by the stamp, whatever checkout or fork
# installed it. -Target replaces the default host folders; separate several
# folders with the path separator (';' on Windows, ':' elsewhere).
# It also builds the braid CLI from the same ref (npm ci, npm run build, npm
# pack) and installs the tarball globally (npm install -g), then checks that
# `braid --version` prints that version; the version goes into the stamp.
# -SkipCli leaves the CLI alone. -NpmCommand and -BraidCommand are test seams.
#Requires -Version 7.6
[CmdletBinding()]
param(
  [string]$Ref = 'main',
  [string[]]$Target,
  [string]$RepositoryRoot = (Split-Path -Parent $PSScriptRoot),
  [switch]$Force,
  [switch]$SkipCli,
  [string]$NpmCommand = 'npm',
  [string]$BraidCommand = 'braid'
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
Set-StrictMode -Version Latest

$StampName = '.braid-install.json'

function Fail {
  param([Parameter(Mandatory = $true)][string]$Message)
  [Console]::Error.WriteLine("install-skills: $Message")
  exit 1
}

function Invoke-Git {
  param([Parameter(Mandatory = $true)][string[]]$GitArguments)
  $output = & git -C $RepositoryRoot @GitArguments 2>&1
  if ($LASTEXITCODE -ne 0) {
    Fail "git $($GitArguments -join ' ') exited ${LASTEXITCODE}: $output"
  }
  return $output
}

$Target = @($Target | ForEach-Object { ([string]$_).Split([System.IO.Path]::PathSeparator) } | Where-Object { $_ })
if ($Target.Count -eq 0) {
  $userHome = [Environment]::GetFolderPath('UserProfile')
  $Target = @(
    (Join-Path $userHome '.cursor/skills'),
    (Join-Path $userHome '.codex/skills'),
    (Join-Path $userHome '.claude/skills'),
    (Join-Path $userHome '.braid/skills')
  )
}

$commit = ([string](Invoke-Git @('rev-parse', '--verify', '--end-of-options', "$Ref^{commit}"))).Trim()
$skills = @(Invoke-Git @('ls-tree', '-d', '--name-only', $commit, '.agents/skills/') |
    ForEach-Object { ([string]$_).Trim() } |
    Where-Object { $_ -cmatch '^\.agents/skills/braid(-[a-z0-9-]+)?$' } |
    ForEach-Object { $_.Substring('.agents/skills/'.Length) })
if ($skills.Count -eq 0) {
  Fail "no .agents/skills/braid or braid-* folders at $Ref ($commit)"
}

$work = Join-Path ([System.IO.Path]::GetTempPath()) ('braid-install-' + [guid]::NewGuid().ToString('n'))
New-Item -ItemType Directory -Path $work | Out-Null
try {
  $zip = Join-Path $work 'skills.zip'
  Invoke-Git @('archive', '--format=zip', '-o', $zip, $commit, '.agents/skills/') | Out-Null
  $zipFull = Join-Path $work 'ref.zip'
  if (-not $SkipCli) { Invoke-Git @('archive', '--format=zip', '-o', $zipFull, $commit) | Out-Null }
  $export = Join-Path $work 'export'
  Expand-Archive -LiteralPath $zip -DestinationPath $export
  $roots = @($Target | ForEach-Object { [System.IO.Path]::GetFullPath($_) })
  foreach ($rootFull in $roots) {
    foreach ($name in $skills) {
      $destination = Join-Path $rootFull $name
      if ((Test-Path -LiteralPath $destination) -and -not $Force -and -not (Test-Path -LiteralPath (Join-Path $destination $StampName) -PathType Leaf)) {
        Fail "$destination exists and was not installed by this script; use -Force to replace it"
      }
    }
  }

  $cliVersion = $null
  if (-not $SkipCli) {
    $source = Join-Path $work 'source'
    Expand-Archive -LiteralPath $zipFull -DestinationPath $source
    $packageJson = Join-Path $source 'package.json'
    if (-not (Test-Path -LiteralPath $packageJson -PathType Leaf)) {
      Fail "no package.json at $Ref ($commit); the braid CLI cannot be built (-SkipCli skips it)"
    }
    $cliVersion = [string](Get-Content -LiteralPath $packageJson -Raw | ConvertFrom-Json).version
    $tarballs = Join-Path $work 'tarball'
    New-Item -ItemType Directory -Path $tarballs | Out-Null
    Push-Location -LiteralPath $source
    try {
      foreach ($npmArguments in @(@('ci'), @('run', 'build'), @('pack', '--pack-destination', $tarballs))) {
        $output = & $NpmCommand @npmArguments 2>&1
        if ($LASTEXITCODE -ne 0) { Fail "npm $($npmArguments -join ' ') exited ${LASTEXITCODE}: $output" }
      }
    } finally {
      Pop-Location
    }
    $tarball = @(Get-ChildItem -LiteralPath $tarballs -Filter '*.tgz')
    if ($tarball.Count -ne 1) { Fail "npm pack made $($tarball.Count) tarballs, expected 1" }
    $output = & $NpmCommand install -g $tarball[0].FullName 2>&1
    if ($LASTEXITCODE -ne 0) { Fail "npm install -g exited ${LASTEXITCODE}: $output" }
    $printed = (@(& $BraidCommand --version 2>&1) | ForEach-Object { "$_" }) -join "`n"
    if ($LASTEXITCODE -ne 0 -or $printed.Trim() -ne "braid $cliVersion") {
      Fail "braid --version printed '$($printed.Trim())' after install, expected 'braid $cliVersion'"
    }
    Write-Output "installed braid CLI $cliVersion from $($commit.Substring(0, 7)) ($Ref)"
  }

  $stamp = [ordered]@{
    ref = $Ref
    commit = $commit
    installedAt = [DateTime]::UtcNow.ToString('o')
    source = [System.IO.Path]::GetFullPath($RepositoryRoot)
  }
  if ($null -ne $cliVersion) { $stamp['cliVersion'] = $cliVersion }
  $stampJson = $stamp | ConvertTo-Json
  foreach ($name in $skills) {
    [System.IO.File]::WriteAllText((Join-Path $export ".agents/skills/$name/$StampName"), "$stampJson`n", [System.Text.UTF8Encoding]::new($false))
  }

  foreach ($rootFull in $roots) {
    New-Item -ItemType Directory -Force -Path $rootFull | Out-Null
    foreach ($name in $skills) {
      $destination = Join-Path $rootFull $name
      $staging = Join-Path $rootFull ".$name.new-$([guid]::NewGuid().ToString('n'))"
      Copy-Item -LiteralPath (Join-Path $export ".agents/skills/$name") -Destination $staging -Recurse
      if (Test-Path -LiteralPath $destination) {
        $old = Join-Path $rootFull ".$name.old-$([guid]::NewGuid().ToString('n'))"
        Move-Item -LiteralPath $destination -Destination $old
        Move-Item -LiteralPath $staging -Destination $destination
        Remove-Item -LiteralPath $old -Recurse -Force
      } else {
        Move-Item -LiteralPath $staging -Destination $destination
      }
    }
    Write-Output "installed $($skills -join ', ') at $($commit.Substring(0, 7)) ($Ref) -> $rootFull"
  }

  foreach ($rootFull in $roots) {
    $stale = @(Get-ChildItem -LiteralPath $rootFull -Directory -Force |
        Where-Object { $_.Name -cmatch '^braid(-[a-z0-9-]+)?$' -and $skills -cnotcontains $_.Name } |
        Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName $StampName) -PathType Leaf })
    foreach ($folder in $stale) {
      $old = Join-Path $rootFull ".$($folder.Name).old-$([guid]::NewGuid().ToString('n'))"
      Move-Item -LiteralPath $folder.FullName -Destination $old
      Remove-Item -LiteralPath $old -Recurse -Force
      Write-Output "removed $($folder.Name), no longer in $Ref -> $rootFull"
    }
  }
} finally {
  Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue
}
exit 0
