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
#Requires -Version 7.6
[CmdletBinding()]
param(
  [string]$Ref = 'main',
  [string[]]$Target,
  [string]$RepositoryRoot = (Split-Path -Parent $PSScriptRoot),
  [switch]$Force
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
  $export = Join-Path $work 'export'
  Expand-Archive -LiteralPath $zip -DestinationPath $export
  $stamp = [ordered]@{
    ref = $Ref
    commit = $commit
    installedAt = [DateTime]::UtcNow.ToString('o')
    source = [System.IO.Path]::GetFullPath($RepositoryRoot)
  } | ConvertTo-Json
  foreach ($name in $skills) {
    [System.IO.File]::WriteAllText((Join-Path $export ".agents/skills/$name/$StampName"), "$stamp`n", [System.Text.UTF8Encoding]::new($false))
  }

  $roots = @($Target | ForEach-Object { [System.IO.Path]::GetFullPath($_) })
  foreach ($rootFull in $roots) {
    foreach ($name in $skills) {
      $destination = Join-Path $rootFull $name
      if ((Test-Path -LiteralPath $destination) -and -not $Force -and -not (Test-Path -LiteralPath (Join-Path $destination $StampName) -PathType Leaf)) {
        Fail "$destination exists and was not installed by this script; use -Force to replace it"
      }
    }
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
