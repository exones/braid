# Recreate the BRAID-003/D disposable Git fixtures, check preservation, and remove them.
# Requires -Version 7.6
[CmdletBinding()]
param(
  [switch]$Record,
  [switch]$Keep
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
Set-StrictMode -Version Latest

$SourceRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'fixtures'))
$ObservationPath = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'setup-observation.json'))
$BraidRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\..\..\..'))
$TempRoot = [System.IO.Path]::GetFullPath($env:TEMP)
$CleanupRoot = [System.IO.Path]::GetFullPath((Join-Path $TempRoot 'braid-003-d-fixtures'))
$MarkerName = 'BRAID-003-D-FIXTURE-ROOT'

function Assert-CleanupRootAllowed {
  if ([System.IO.Path]::GetFileName($CleanupRoot) -ne 'braid-003-d-fixtures') {
    throw "unexpected cleanup leaf: $CleanupRoot"
  }
  if (-not [string]::Equals([System.IO.Path]::GetDirectoryName($CleanupRoot), $TempRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "cleanup root is not a direct child of TEMP: $CleanupRoot"
  }
  if ($CleanupRoot.StartsWith($BraidRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "cleanup root is inside the braid checkout: $CleanupRoot"
  }
}

function Remove-CleanupRoot {
  Assert-CleanupRootAllowed
  if (-not (Test-Path -LiteralPath $CleanupRoot)) {
    return
  }
  $marker = Join-Path $CleanupRoot $MarkerName
  if (-not (Test-Path -LiteralPath $marker)) {
    throw "refusing to remove $CleanupRoot because $MarkerName is absent"
  }
  Remove-Item -LiteralPath $CleanupRoot -Recurse -Force -ErrorAction Stop
  if (Test-Path -LiteralPath $CleanupRoot) {
    throw "could not remove cleanup root $CleanupRoot"
  }
}

function Initialize-CleanupRoot {
  Assert-CleanupRootAllowed
  Remove-CleanupRoot
  New-Item -ItemType Directory -Path $CleanupRoot | Out-Null
  $utf8 = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText((Join-Path $CleanupRoot $MarkerName), 'disposable', $utf8)
  [System.IO.File]::WriteAllText((Join-Path $CleanupRoot 'empty-gitconfig'), '', $utf8)
}

function Assert-SourceBytes {
  $files = @(Get-ChildItem -LiteralPath $SourceRoot -Recurse -File)
  if ($files.Count -eq 0) {
    throw "no fixture sources under $SourceRoot"
  }
  foreach ($file in $files) {
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    if ($bytes -contains 13) {
      throw "CR in fixture source $($file.FullName)"
    }
  }
}

function Copy-SourceFile {
  param(
    [Parameter(Mandatory = $true)][string]$Repo,
    [Parameter(Mandatory = $true)][string]$SourceRelative,
    [Parameter(Mandatory = $true)][string]$DestinationRelative
  )
  $source = Join-Path $SourceRoot ($SourceRelative -replace '/', [System.IO.Path]::DirectorySeparatorChar)
  $destination = Join-Path $Repo ($DestinationRelative -replace '/', [System.IO.Path]::DirectorySeparatorChar)
  $parent = Split-Path -Parent $destination
  if (-not (Test-Path -LiteralPath $parent)) {
    New-Item -ItemType Directory -Path $parent | Out-Null
  }
  [System.IO.File]::Copy($source, $destination, $true)
}

function Invoke-FixtureGit {
  param(
    [Parameter(Mandatory = $true)][string]$Repo,
    [Parameter(Mandatory = $true)][string[]]$GitArguments,
    [switch]$AllowFailure
  )
  if (-not $Repo.StartsWith($CleanupRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "refusing git outside cleanup root: $Repo"
  }
  $output = & git -C $Repo -c core.autocrlf=false -c core.filemode=false -c core.eol=lf -c commit.gpgsign=false -c user.name=braid-d-fixture -c user.email=d-fixture@example.invalid @GitArguments 2>&1
  $code = $LASTEXITCODE
  $text = (($output | ForEach-Object { "$_" }) -join "`n").TrimEnd()
  if (-not $AllowFailure -and $code -ne 0) {
    throw "git $($GitArguments -join ' ') exited ${code}: $text"
  }
  return [pscustomobject]@{ Code = $code; Text = $text }
}

function New-WorkRepo {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Branch
  )
  $repo = Join-Path $CleanupRoot $Name
  $created = Invoke-FixtureGit -Repo $CleanupRoot -GitArguments @('init', '-b', $Branch, $Name)
  if ($created.Code -ne 0) {
    throw $created.Text
  }
  return $repo
}

function Add-Commit {
  param(
    [Parameter(Mandatory = $true)][string]$Repo,
    [Parameter(Mandatory = $true)][string]$Message
  )
  Invoke-FixtureGit -Repo $Repo -GitArguments @('add', '--', '.') | Out-Null
  Invoke-FixtureGit -Repo $Repo -GitArguments @('commit', '-m', $Message) | Out-Null
}

function Get-GitText {
  param(
    [Parameter(Mandatory = $true)][string]$Repo,
    [Parameter(Mandatory = $true)][string[]]$GitArguments,
    [switch]$AllowFailure
  )
  $result = Invoke-FixtureGit -Repo $Repo -GitArguments $GitArguments -AllowFailure:$AllowFailure
  return $result
}

function Protect-Identity {
  param(
    [Parameter(Mandatory = $true)][string]$Repo,
    [Parameter(Mandatory = $true)][scriptblock]$Snapshot
  )
  $before = & $Snapshot
  Invoke-FixtureGit -Repo $Repo -GitArguments @('status', '--porcelain=v1', '-uall') | Out-Null
  Invoke-FixtureGit -Repo $Repo -GitArguments @('rev-parse', 'HEAD') | Out-Null
  Invoke-FixtureGit -Repo $Repo -GitArguments @('branch', '--show-current') | Out-Null
  Invoke-FixtureGit -Repo $Repo -GitArguments @('rev-parse', '--abbrev-ref', '@{upstream}') -AllowFailure | Out-Null
  $after = & $Snapshot
  if ($before -ne $after) {
    throw "preservation changed identity for ${Repo}`nbefore=$before`nafter=$after"
  }
}

function Get-Probe1 {
  $origin = Join-Path $CleanupRoot 'probe-1-origin.git'
  Invoke-FixtureGit -Repo $CleanupRoot -GitArguments @('init', '--bare', '-b', 'item/d-probe-match', 'probe-1-origin.git') | Out-Null
  $repo = New-WorkRepo -Name 'probe-1' -Branch 'item/d-probe-match'
  Copy-SourceFile -Repo $repo -SourceRelative 'probe-1/owned/note.txt' -DestinationRelative 'owned/note.txt'
  Add-Commit -Repo $repo -Message 'seed'
  $originUrl = ($origin -replace '\\', '/')
  Invoke-FixtureGit -Repo $repo -GitArguments @('remote', 'add', 'origin', $originUrl) | Out-Null
  $snapshot = {
    $head = (Get-GitText -Repo $repo -GitArguments @('rev-parse', 'HEAD')).Text
    $tree = (Get-GitText -Repo $repo -GitArguments @('rev-parse', 'HEAD^{tree}')).Text
    $branch = (Get-GitText -Repo $repo -GitArguments @('branch', '--show-current')).Text
    $remote = (Get-GitText -Repo $repo -GitArguments @('remote', 'get-url', 'origin')).Text
    $upstream = Get-GitText -Repo $repo -GitArguments @('rev-parse', '--abbrev-ref', '@{upstream}') -AllowFailure
    $porcelain = (Get-GitText -Repo $repo -GitArguments @('status', '--porcelain=v1', '-uall')).Text
    $note = (Get-GitText -Repo $repo -GitArguments @('rev-parse', 'HEAD:owned/note.txt')).Text
    if ($upstream.Code -eq 0) { throw "probe-1 unexpectedly has upstream $($upstream.Text)" }
    return "head=$head tree=$tree branch=$branch remote=$remote porcelain=[$porcelain] note=$note"
  }
  Protect-Identity -Repo $repo -Snapshot $snapshot
  $head = (Get-GitText -Repo $repo -GitArguments @('rev-parse', 'HEAD')).Text
  return [pscustomobject]@{
    path = ($repo -replace '\\', '/')
    branch = 'item/d-probe-match'
    head = $head
    tree = (Get-GitText -Repo $repo -GitArguments @('rev-parse', 'HEAD^{tree}')).Text
    originAbsolute = $originUrl
    upstream = $null
    porcelain = ''
    noteBlob = (Get-GitText -Repo $repo -GitArguments @('rev-parse', 'HEAD:owned/note.txt')).Text
  }
}

function Get-Probe2 {
  $repo = New-WorkRepo -Name 'probe-2' -Branch 'topic/user-scratch'
  Copy-SourceFile -Repo $repo -SourceRelative 'probe-2/user-owned/keep-head.txt' -DestinationRelative 'user-owned/keep.txt'
  Copy-SourceFile -Repo $repo -SourceRelative 'probe-2/deps/status.txt' -DestinationRelative 'deps/status.txt'
  Add-Commit -Repo $repo -Message 'user-base'
  $indexSource = Join-Path $SourceRoot 'probe-2\user-owned\keep-index.txt'
  $indexBlob = (Get-GitText -Repo $repo -GitArguments @('hash-object', '-w', '--', $indexSource)).Text
  Invoke-FixtureGit -Repo $repo -GitArguments @('update-index', '--cacheinfo', "100644,$indexBlob,user-owned/keep.txt") | Out-Null
  Copy-SourceFile -Repo $repo -SourceRelative 'probe-2/user-owned/keep-worktree.txt' -DestinationRelative 'user-owned/keep.txt'
  Copy-SourceFile -Repo $repo -SourceRelative 'probe-2/user-owned/untracked.txt' -DestinationRelative 'user-owned/untracked.txt'
  Invoke-FixtureGit -Repo $repo -GitArguments @('remote', 'add', 'origin', 'https://example.invalid/not-braid.git') | Out-Null
  $expectedPorcelain = "MM user-owned/keep.txt`n?? user-owned/untracked.txt"
  $snapshot = {
    $head = (Get-GitText -Repo $repo -GitArguments @('rev-parse', 'HEAD')).Text
    $branch = (Get-GitText -Repo $repo -GitArguments @('branch', '--show-current')).Text
    $remote = (Get-GitText -Repo $repo -GitArguments @('remote', 'get-url', 'origin')).Text
    $porcelain = (Get-GitText -Repo $repo -GitArguments @('status', '--porcelain=v1', '-uall')).Text
    $index = (Get-GitText -Repo $repo -GitArguments @('rev-parse', ':user-owned/keep.txt')).Text
    $work = (Get-GitText -Repo $repo -GitArguments @('hash-object', '--', 'user-owned/keep.txt')).Text
    $untracked = (Get-GitText -Repo $repo -GitArguments @('hash-object', '--', 'user-owned/untracked.txt')).Text
    $deps = (Get-GitText -Repo $repo -GitArguments @('rev-parse', 'HEAD:deps/status.txt')).Text
    $writeTree = (Get-GitText -Repo $repo -GitArguments @('write-tree')).Text
    if ($porcelain -ne $expectedPorcelain) { throw "probe-2 porcelain [$porcelain]" }
    return "head=$head branch=$branch remote=$remote porcelain=[$porcelain] index=$index work=$work untracked=$untracked deps=$deps tree=$writeTree"
  }
  Protect-Identity -Repo $repo -Snapshot $snapshot
  return [pscustomobject]@{
    path = ($repo -replace '\\', '/')
    branch = 'topic/user-scratch'
    head = (Get-GitText -Repo $repo -GitArguments @('rev-parse', 'HEAD')).Text
    origin = 'https://example.invalid/not-braid.git'
    upstream = $null
    porcelain = $expectedPorcelain
    headBlob = (Get-GitText -Repo $repo -GitArguments @('rev-parse', 'HEAD:user-owned/keep.txt')).Text
    indexBlob = (Get-GitText -Repo $repo -GitArguments @('rev-parse', ':user-owned/keep.txt')).Text
    worktreeBlob = (Get-GitText -Repo $repo -GitArguments @('hash-object', '--', 'user-owned/keep.txt')).Text
    untrackedBlob = (Get-GitText -Repo $repo -GitArguments @('hash-object', '--', 'user-owned/untracked.txt')).Text
    depsBlob = (Get-GitText -Repo $repo -GitArguments @('rev-parse', 'HEAD:deps/status.txt')).Text
    indexTree = (Get-GitText -Repo $repo -GitArguments @('write-tree')).Text
  }
}

function Get-Probe3 {
  $repo = New-WorkRepo -Name 'probe-3' -Branch 'item/d-probe-resume'
  Copy-SourceFile -Repo $repo -SourceRelative 'probe-3/effects/base.txt' -DestinationRelative 'effects/base.txt'
  Add-Commit -Repo $repo -Message 'base'
  $parent = (Get-GitText -Repo $repo -GitArguments @('rev-parse', 'HEAD')).Text
  Copy-SourceFile -Repo $repo -SourceRelative 'probe-3/effects/pushed.txt' -DestinationRelative 'effects/pushed.txt'
  Copy-SourceFile -Repo $repo -SourceRelative 'probe-3/checkpoint.md' -DestinationRelative 'checkpoint.md'
  Copy-SourceFile -Repo $repo -SourceRelative 'probe-3/checks/simulated.json' -DestinationRelative 'checks/simulated.json'
  Add-Commit -Repo $repo -Message 'pushed'
  Invoke-FixtureGit -Repo $repo -GitArguments @('remote', 'add', 'origin', 'https://example.invalid/d-probe-resume.git') | Out-Null
  $snapshot = {
    $head = (Get-GitText -Repo $repo -GitArguments @('rev-parse', 'HEAD')).Text
    $parentText = (Get-GitText -Repo $repo -GitArguments @('rev-parse', 'HEAD~1')).Text
    $count = (Get-GitText -Repo $repo -GitArguments @('rev-list', '--count', 'HEAD')).Text
    $branch = (Get-GitText -Repo $repo -GitArguments @('branch', '--show-current')).Text
    $remote = (Get-GitText -Repo $repo -GitArguments @('remote', 'get-url', 'origin')).Text
    $porcelain = (Get-GitText -Repo $repo -GitArguments @('status', '--porcelain=v1', '-uall')).Text
    $checkpoint = (Get-GitText -Repo $repo -GitArguments @('rev-parse', 'HEAD:checkpoint.md')).Text
    $checks = (Get-GitText -Repo $repo -GitArguments @('rev-parse', 'HEAD:checks/simulated.json')).Text
    $pushed = (Get-GitText -Repo $repo -GitArguments @('rev-parse', 'HEAD:effects/pushed.txt')).Text
    if ($count -ne '2') { throw "probe-3 commit count $count" }
    if ($porcelain -ne '') { throw "probe-3 porcelain [$porcelain]" }
    return "head=$head parent=$parentText count=$count branch=$branch remote=$remote porcelain=[$porcelain] checkpoint=$checkpoint checks=$checks pushed=$pushed"
  }
  Protect-Identity -Repo $repo -Snapshot $snapshot
  return [pscustomobject]@{
    path = ($repo -replace '\\', '/')
    branch = 'item/d-probe-resume'
    head = (Get-GitText -Repo $repo -GitArguments @('rev-parse', 'HEAD')).Text
    parent = $parent
    commitCount = 2
    origin = 'https://example.invalid/d-probe-resume.git'
    upstream = $null
    porcelain = ''
    checkpointBlob = (Get-GitText -Repo $repo -GitArguments @('rev-parse', 'HEAD:checkpoint.md')).Text
    checksBlob = (Get-GitText -Repo $repo -GitArguments @('rev-parse', 'HEAD:checks/simulated.json')).Text
    pushedBlob = (Get-GitText -Repo $repo -GitArguments @('rev-parse', 'HEAD:effects/pushed.txt')).Text
  }
}

function Get-Suite {
  Initialize-CleanupRoot
  $previous = @{
    GIT_AUTHOR_DATE = $env:GIT_AUTHOR_DATE
    GIT_COMMITTER_DATE = $env:GIT_COMMITTER_DATE
    GIT_AUTHOR_NAME = $env:GIT_AUTHOR_NAME
    GIT_AUTHOR_EMAIL = $env:GIT_AUTHOR_EMAIL
    GIT_COMMITTER_NAME = $env:GIT_COMMITTER_NAME
    GIT_COMMITTER_EMAIL = $env:GIT_COMMITTER_EMAIL
    GIT_CONFIG_NOSYSTEM = $env:GIT_CONFIG_NOSYSTEM
    GIT_CONFIG_GLOBAL = $env:GIT_CONFIG_GLOBAL
  }
  $env:GIT_AUTHOR_DATE = '2026-11-05T00:00:00 +0000'
  $env:GIT_COMMITTER_DATE = '2026-11-05T00:00:00 +0000'
  $env:GIT_AUTHOR_NAME = 'braid-d-fixture'
  $env:GIT_AUTHOR_EMAIL = 'd-fixture@example.invalid'
  $env:GIT_COMMITTER_NAME = 'braid-d-fixture'
  $env:GIT_COMMITTER_EMAIL = 'd-fixture@example.invalid'
  $env:GIT_CONFIG_NOSYSTEM = '1'
  $env:GIT_CONFIG_GLOBAL = (Join-Path $CleanupRoot 'empty-gitconfig')
  try {
    return [pscustomobject]@{
      probe1 = Get-Probe1
      probe2 = Get-Probe2
      probe3 = Get-Probe3
    }
  } finally {
    foreach ($name in $previous.Keys) {
      [Environment]::SetEnvironmentVariable($name, $previous[$name])
      Set-Item -Path "Env:$name" -Value $previous[$name]
    }
  }
}

function ConvertTo-Signature {
  param($Suite)
  return @(
    $Suite.probe1.head
    $Suite.probe1.tree
    $Suite.probe1.branch
    $Suite.probe1.noteBlob
    $Suite.probe2.head
    $Suite.probe2.branch
    $Suite.probe2.origin
    $Suite.probe2.porcelain
    $Suite.probe2.headBlob
    $Suite.probe2.indexBlob
    $Suite.probe2.worktreeBlob
    $Suite.probe2.untrackedBlob
    $Suite.probe2.depsBlob
    $Suite.probe2.indexTree
    $Suite.probe3.head
    $Suite.probe3.parent
    $Suite.probe3.branch
    $Suite.probe3.origin
    $Suite.probe3.checkpointBlob
    $Suite.probe3.checksBlob
    $Suite.probe3.pushedBlob
  ) -join '|'
}

Assert-SourceBytes
$watch = [System.Diagnostics.Stopwatch]::StartNew()
$first = Get-Suite
Remove-CleanupRoot
$second = Get-Suite
$watch.Stop()
$firstSignature = ConvertTo-Signature $first
$secondSignature = ConvertTo-Signature $second
if ($firstSignature -ne $secondSignature) {
  throw "replay signatures differ`n$firstSignature`n$secondSignature"
}

$gitVersion = (& git --version).Trim()
$observation = [pscustomobject]@{
  schema = 1
  limit = 'Disposable local Git fixtures. Probe-3 checks are simulated and do not contact GitHub. Probe-1 origin is a local bare repository.'
  gitVersion = $gitVersion
  cleanupRoot = ($CleanupRoot -replace '\\', '/')
  removedAfterExercise = (-not $Keep)
  rounds = 2
  preservation = 'pass'
  replaySignature = $secondSignature
  elapsedMs = $watch.ElapsedMilliseconds
  probes = $second
}
if ($Record) {
  $json = ($observation | ConvertTo-Json -Depth 6) -replace "`r`n", "`n" -replace "`r", "`n"
  if (-not $json.EndsWith("`n")) { $json += "`n" }
  $utf8 = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText($ObservationPath, $json, $utf8)
} elseif (Test-Path -LiteralPath $ObservationPath) {
  $recorded = Get-Content -LiteralPath $ObservationPath -Raw | ConvertFrom-Json
  if ($recorded.replaySignature -ne $secondSignature) {
    throw "recorded replaySignature does not match this run"
  }
} else {
  throw "setup-observation.json is missing; run once with -Record"
}

if (-not $Keep) {
  Remove-CleanupRoot
}

Write-Output "PASS rounds=2 preservation=pass removed=$(-not $Keep) elapsedMs=$($watch.ElapsedMilliseconds)"
Write-Output "probe1.head=$($second.probe1.head)"
Write-Output "probe1.origin=$($second.probe1.originAbsolute)"
Write-Output "probe2.head=$($second.probe2.head)"
Write-Output "probe2.indexBlob=$($second.probe2.indexBlob)"
Write-Output "probe2.worktreeBlob=$($second.probe2.worktreeBlob)"
Write-Output "probe3.head=$($second.probe3.head)"
Write-Output "probe3.parent=$($second.probe3.parent)"
exit 0
