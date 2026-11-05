# Temporary current-head pull-request proof.
# Superseded by roadmap stage 2 gate reports.
# PowerShell 7 and gh. Full artifact mode is the default.
# -SkipArtifacts is an explicit caller assertion that the packet waived
# artifact verification. A download, auth, schema, or digest failure never
# selects that switch.
# Prints one PASS, FAIL, or PENDING line, then one JSON line.
# Exit 0 only for PASS. Exit 1 for FAIL. Exit 2 for PENDING.
# Downloads go under ignored .tools/pr-proof.
# This command is a finite snapshot. It does not poll, watch, or wait.
# -Fixture reads offline evidence and is not acceptance proof.
#Requires -Version 7.6
[CmdletBinding()]
param(
  [string]$PullRequest,
  [switch]$SkipArtifacts,
  [string]$Fixture
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
Set-StrictMode -Version Latest
Add-Type -AssemblyName System.IO.Compression.FileSystem

$script:WorkflowPath = '.github/workflows/ci.yml'
$script:WorkflowName = 'CI'
$script:Events = @('push', 'pull_request')
$script:RequiredJobs = @(
  @{ Key = 'ubuntu'; Name = 'verify (ubuntu-latest)'; Artifact = 'braid-package-ubuntu-latest' }
  @{ Key = 'windows'; Name = 'verify (windows-latest)'; Artifact = 'braid-package-windows-latest' }
)
$script:RequiredSteps = @('Install dependencies', 'Verify', 'Upload packed tarball')
$script:TerminalConclusions = @(
  'failure', 'cancelled', 'timed_out', 'startup_failure', 'action_required', 'skipped', 'stale', 'neutral'
)
function New-JsonObject {
  $object = [ordered]@{}
  return ,$object
}

function New-StringList {
  $list = [System.Collections.Generic.List[string]]::new()
  return ,$list
}

function Get-Prop {
  param($Object, [Parameter(Mandatory = $true)][string]$Name)
  if ($null -eq $Object) {
    return $null
  }
  if ($Object -is [System.Collections.IDictionary]) {
    if ($Object.Contains($Name)) {
      return $Object[$Name]
    }
    return $null
  }
  $property = $Object.PSObject.Properties[$Name]
  if ($null -eq $property) {
    return $null
  }
  return $property.Value
}

function Get-ObjectList {
  param($Value)
  $items = @()
  if ($null -eq $Value) {
    return $items
  }
  foreach ($item in @($Value)) {
    if ($null -ne $item) {
      $items += $item
    }
  }
  return $items
}

function ConvertTo-Sha {
  param($Value)
  return ([string]$Value).Trim().ToLowerInvariant()
}

function Test-FullSha {
  param([string]$Value)
  return $Value -match '^[0-9a-f]{40}$'
}

function Add-CleanReason {
  param(
    [Parameter(Mandatory = $true)]$List,
    [Parameter(Mandatory = $true)][string]$Reason
  )
  $clean = (($Reason -replace "`r", ' ' -replace "`n", ' ').Trim())
  [void]$List.Add($clean)
}

function Get-PrProofNodeKind {
  param($NodeStatus, $NodeConclusion)
  $statusText = ([string]$NodeStatus).ToLowerInvariant()
  $conclusionText = ''
  if ($null -ne $NodeConclusion -and -not [string]::IsNullOrWhiteSpace([string]$NodeConclusion)) {
    $conclusionText = ([string]$NodeConclusion).ToLowerInvariant()
  }
  if ($conclusionText -eq 'success') {
    if ($statusText -eq 'completed') {
      return 'pass'
    }
    return 'fail'
  }
  if ($script:TerminalConclusions -contains $conclusionText) {
    return 'fail'
  }
  if ($statusText -eq 'completed') {
    return 'fail'
  }
  if (@('queued', 'in_progress', 'waiting', 'pending', 'requested', '') -contains $statusText) {
    return 'pending'
  }
  return 'fail'
}

function Select-PrProofRun {
  param($Runs, [Parameter(Mandatory = $true)][string]$Event, [Parameter(Mandatory = $true)][string]$Head)
  $matching = @()
  foreach ($run in @($Runs)) {
    if ($null -eq $run) {
      continue
    }
    if ($run.event -ne $Event -or $run.path -ne $script:WorkflowPath -or $run.name -ne $script:WorkflowName) {
      continue
    }
    if ($run.headSha -ne $Head) {
      continue
    }
    $matching += $run
  }
  if ($matching.Count -eq 0) {
    return $null
  }
  $byId = @{}
  foreach ($run in $matching) {
    $id = [string]$run.id
    $current = $byId[$id]
    if ($null -eq $current -or [int]$run.runAttempt -gt [int]$current.runAttempt) {
      $byId[$id] = $run
      continue
    }
    if ([int]$run.runAttempt -eq [int]$current.runAttempt -and [string]$run.createdAt -gt [string]$current.createdAt) {
      $byId[$id] = $run
    }
  }
  $winner = $null
  foreach ($run in $byId.Values) {
    if ($null -eq $winner) {
      $winner = $run
      continue
    }
    $created = [string]$run.createdAt
    $winnerCreated = [string]$winner.createdAt
    if ($created -gt $winnerCreated -or ($created -eq $winnerCreated -and [int64]$run.id -gt [int64]$winner.id)) {
      $winner = $run
    }
  }
  return $winner
}

function Resolve-PrProofArtifact {
  param($Artifacts, [Parameter(Mandatory = $true)][string]$Name)
  $named = @()
  foreach ($artifact in @($Artifacts)) {
    if ($null -ne $artifact -and [string](Get-Prop $artifact 'name') -eq $Name) {
      $named += $artifact
    }
  }
  if ($named.Count -eq 0) {
    return @{ Artifact = $null; Error = "artifact $Name missing" }
  }
  $fresh = @()
  foreach ($artifact in $named) {
    if ((Get-Prop $artifact 'expired') -ne $true) {
      $fresh += $artifact
    }
  }
  if ($fresh.Count -eq 0) {
    return @{ Artifact = $named[0]; Error = "artifact $Name expired" }
  }
  if ($fresh.Count -eq 1) {
    return @{ Artifact = $fresh[0]; Error = $null }
  }
  $sorted = @($fresh | Sort-Object { [string](Get-Prop $_ 'updatedAt') } -Descending)
  $firstStamp = [string](Get-Prop $sorted[0] 'updatedAt')
  $secondStamp = [string](Get-Prop $sorted[1] 'updatedAt')
  if ($firstStamp -eq $secondStamp) {
    return @{ Artifact = $null; Error = "artifact $Name ambiguous" }
  }
  return @{ Artifact = $sorted[0]; Error = $null }
}

function Read-EntryBytes {
  param($Entry)
  if ($Entry.Length -gt 50MB) {
    throw 'artifact entry is larger than 50MB'
  }
  $stream = $Entry.Open()
  try {
    $memory = [System.IO.MemoryStream]::new()
    try {
      $stream.CopyTo($memory)
      return $memory.ToArray()
    } finally {
      $memory.Dispose()
    }
  } finally {
    $stream.Dispose()
  }
}

function Get-ByteSha256 {
  param([Parameter(Mandatory = $true)][byte[]]$Bytes)
  $algorithm = [System.Security.Cryptography.SHA256]::Create()
  try {
    return ([System.BitConverter]::ToString($algorithm.ComputeHash($Bytes)).Replace('-', '').ToLowerInvariant())
  } finally {
    $algorithm.Dispose()
  }
}

function Read-PrProofPackage {
  param([Parameter(Mandatory = $true)][string]$ZipPath)
  $zip = $null
  try {
    $zip = [System.IO.Compression.ZipFile]::OpenRead($ZipPath)
    $tarballs = @($zip.Entries | Where-Object { $_.Name -like '*.tgz' })
    $provenances = @($zip.Entries | Where-Object { $_.Name -like '*.provenance.json' })
    if ($tarballs.Count -ne 1 -or $provenances.Count -ne 1) {
      return @{ Error = 'artifact zip schema'; Provenance = $null }
    }
    $tarballBytes = Read-EntryBytes $tarballs[0]
    $tarballHash = Get-ByteSha256 $tarballBytes
    $provenanceBytes = Read-EntryBytes $provenances[0]
    $provenanceText = [System.Text.UTF8Encoding]::new($false).GetString($provenanceBytes).TrimStart([char]0xFEFF)
    try {
      $provenance = $provenanceText | ConvertFrom-Json
    } catch {
      return @{ Error = 'provenance schema'; Provenance = $null }
    }
    $result = @{
      Error = $null
      TarballName = [string]$tarballs[0].Name
      TarballHash = $tarballHash
      Provenance = $provenance
    }
    $required = @(
      'sourceRevision', 'worktreeDirty', 'candidate', 'tarball', 'digestAlgorithm', 'digest', 'githubSha', 'pullRequestHeadSha'
    )
    $names = @($provenance.PSObject.Properties.Name)
    foreach ($field in $required) {
      if ($names -notcontains $field) {
        $result.Error = 'provenance schema'
        return $result
      }
    }
    if ([string](Get-Prop $provenance 'digestAlgorithm') -ne 'sha256') {
      $result.Error = 'provenance schema'
      return $result
    }
    if ([string](Get-Prop $provenance 'tarball') -ne $result.TarballName) {
      $result.Error = 'provenance schema'
      return $result
    }
    $pullHeadRaw = Get-Prop $provenance 'pullRequestHeadSha'
    if ($pullHeadRaw -isnot [string]) {
      $result.Error = 'provenance schema'
      return $result
    }
    $candidate = Get-Prop $provenance 'candidate'
    $dirty = Get-Prop $provenance 'worktreeDirty'
    if ($candidate -isnot [bool] -or $dirty -isnot [bool] -or $candidate -ne $true -or $dirty -ne $false) {
      $result.Error = 'provenance is not a clean candidate'
      return $result
    }
    $digest = ConvertTo-Sha (Get-Prop $provenance 'digest')
    if ($digest -notmatch '^[0-9a-f]{64}$') {
      $result.Error = 'provenance schema'
      return $result
    }
    if ($digest -ne $tarballHash) {
      $result.Error = 'provenance digest mismatch'
    }
    return $result
  } catch {
    return @{ Error = 'artifact zip unreadable'; Provenance = $null }
  } finally {
    if ($null -ne $zip) {
      $zip.Dispose()
    }
  }
}

function ConvertTo-FixtureRun {
  param($Raw)
  $jobs = @()
  foreach ($job in @(Get-ObjectList (Get-Prop $Raw 'jobs'))) {
    $steps = @()
    foreach ($step in @(Get-ObjectList (Get-Prop $job 'steps'))) {
      $steps += @{
        name = [string](Get-Prop $step 'name')
        status = [string](Get-Prop $step 'status')
        conclusion = Get-Prop $step 'conclusion'
      }
    }
    $attempt = Get-Prop $job 'runAttempt'
    $jobs += @{
      id = [int64](Get-Prop $job 'id')
      name = [string](Get-Prop $job 'name')
      status = [string](Get-Prop $job 'status')
      conclusion = Get-Prop $job 'conclusion'
      runAttempt = $(if ($null -eq $attempt) { 0 } else { [int]$attempt })
      headSha = ConvertTo-Sha (Get-Prop $job 'headSha')
      steps = $steps
    }
  }
  $artifacts = @()
  foreach ($artifact in @(Get-ObjectList (Get-Prop $Raw 'artifacts'))) {
    $attemptValue = Get-Prop $artifact 'sizeBytes'
    $artifacts += @{
      id = [int64](Get-Prop $artifact 'id')
      name = [string](Get-Prop $artifact 'name')
      expired = Get-Prop $artifact 'expired'
      digest = [string](Get-Prop $artifact 'digest')
      sizeBytes = $(if ($null -eq $attemptValue) { $null } else { [int64]$attemptValue })
      updatedAt = [string](Get-Prop $artifact 'updatedAt')
      zipPath = [string](Get-Prop $artifact 'zipPath')
    }
  }
  $runAttempt = Get-Prop $Raw 'runAttempt'
  return @{
    id = [int64](Get-Prop $Raw 'id')
    name = [string](Get-Prop $Raw 'name')
    path = [string](Get-Prop $Raw 'path')
    event = [string](Get-Prop $Raw 'event')
    status = [string](Get-Prop $Raw 'status')
    conclusion = Get-Prop $Raw 'conclusion'
    runAttempt = $(if ($null -eq $runAttempt) { 0 } else { [int]$runAttempt })
    headSha = ConvertTo-Sha (Get-Prop $Raw 'headSha')
    createdAt = [string](Get-Prop $Raw 'createdAt')
    htmlUrl = [string](Get-Prop $Raw 'htmlUrl')
    jobs = $jobs
    artifacts = $artifacts
  }
}

function Get-FixtureModel {
  param([Parameter(Mandatory = $true)][string]$FixturePath)
  $root = [System.IO.Path]::GetFullPath($FixturePath)
  $evidencePath = Join-Path $root 'evidence.json'
  if (-not (Test-Path -LiteralPath $evidencePath -PathType Leaf)) {
    throw "fixture evidence is missing: $evidencePath"
  }
  $raw = [System.IO.File]::ReadAllText($evidencePath) | ConvertFrom-Json
  $pr = Get-Prop $raw 'pr'
  $runs = @()
  foreach ($run in @(Get-ObjectList (Get-Prop $raw 'runs'))) {
    $normalized = ConvertTo-FixtureRun $run
    foreach ($artifact in @($normalized.artifacts)) {
      $relative = [string]$artifact.zipPath
      if ([string]::IsNullOrWhiteSpace($relative)) {
        continue
      }
      if ([System.IO.Path]::IsPathRooted($relative)) {
        throw 'fixture zip path must be relative'
      }
      $full = [System.IO.Path]::GetFullPath((Join-Path $root $relative))
      $prefix = $root.TrimEnd('\', '/') + [System.IO.Path]::DirectorySeparatorChar
      $comparison = if ($IsWindows) { [StringComparison]::OrdinalIgnoreCase } else { [StringComparison]::Ordinal }
      if (-not $full.StartsWith($prefix, $comparison)) {
        throw 'fixture zip path escapes the fixture directory'
      }
      $artifact.zipPath = $full
    }
    $runs += $normalized
  }
  $commits = [System.Collections.Generic.Dictionary[string, string[]]]::new([StringComparer]::Ordinal)
  $rawCommits = Get-Prop $raw 'commits'
  if ($null -ne $rawCommits) {
    foreach ($property in @($rawCommits.PSObject.Properties)) {
      $parents = @()
      foreach ($parent in @(Get-ObjectList $property.Value)) {
        $parents += (ConvertTo-Sha $parent)
      }
      $commits[(ConvertTo-Sha $property.Name)] = [string[]]$parents
    }
  }
  $head = ConvertTo-Sha (Get-Prop $pr 'head')
  return @{
    mode = 'fixture'
    skipArtifacts = [bool]$SkipArtifacts
    pr = @{
      number = Get-Prop $pr 'number'
      url = [string](Get-Prop $pr 'url')
      repository = [string](Get-Prop $pr 'repository')
      head = $head
      base = ConvertTo-Sha (Get-Prop $pr 'base')
    }
    headAfter = ConvertTo-Sha (Get-Prop $raw 'headAfter')
    baseAfter = ConvertTo-Sha (Get-Prop $raw 'baseAfter')
    runs = $runs
    commits = $commits
  }
}

function Invoke-GhProcess {
  param([Parameter(Mandatory = $true)][string[]]$Arguments, [string]$OutFile)
  $command = Get-Command -Name gh -ErrorAction SilentlyContinue
  if ($null -eq $command) {
    return @{ Code = 127; Error = 'gh not found'; Bytes = [byte[]]::new(0) }
  }
  $start = [System.Diagnostics.ProcessStartInfo]::new()
  $start.FileName = $command.Source
  $start.UseShellExecute = $false
  $start.RedirectStandardOutput = $true
  $start.RedirectStandardError = $true
  $start.CreateNoWindow = $true
  foreach ($argument in $Arguments) {
    [void]$start.ArgumentList.Add($argument)
  }
  $process = [System.Diagnostics.Process]::new()
  $process.StartInfo = $start
  [void]$process.Start()
  $errorTask = $process.StandardError.ReadToEndAsync()
  if ([string]::IsNullOrWhiteSpace($OutFile)) {
    $memory = [System.IO.MemoryStream]::new()
    try {
      $process.StandardOutput.BaseStream.CopyTo($memory)
      $bytes = $memory.ToArray()
    } finally {
      $memory.Dispose()
    }
  } else {
    $directory = Split-Path -Parent $OutFile
    if (-not (Test-Path -LiteralPath $directory)) {
      New-Item -ItemType Directory -Path $directory | Out-Null
    }
    $file = [System.IO.File]::Create($OutFile)
    try {
      $process.StandardOutput.BaseStream.CopyTo($file)
    } finally {
      $file.Dispose()
    }
    $bytes = [byte[]]::new(0)
  }
  $process.WaitForExit()
  return @{ Code = $process.ExitCode; Error = $errorTask.GetAwaiter().GetResult(); Bytes = $bytes }
}

function Format-GhFailure {
  param($Result)
  $detail = [string]$Result.Error
  if ([string]::IsNullOrWhiteSpace($detail) -and $Result.Bytes.Length -gt 0) {
    $detail = [System.Text.UTF8Encoding]::new($false).GetString($Result.Bytes)
  }
  $line = (($detail -replace "`r", ' ' -replace "`n", ' ').Trim())
  if ($line.Length -gt 300) {
    $line = $line.Substring(0, 300)
  }
  if ([string]::IsNullOrWhiteSpace($line)) {
    return "gh exited $($Result.Code)"
  }
  return "gh exited $($Result.Code): $line"
}

function Invoke-GhJson {
  param([Parameter(Mandatory = $true)][string[]]$Arguments)
  $result = Invoke-GhProcess -Arguments $Arguments
  if ($result.Code -ne 0) {
    throw (Format-GhFailure $result)
  }
  $text = [System.Text.UTF8Encoding]::new($false).GetString($result.Bytes).TrimStart([char]0xFEFF).Trim()
  if ([string]::IsNullOrWhiteSpace($text)) {
    throw 'github api returned an empty body'
  }
  try {
    return $text | ConvertFrom-Json
  } catch {
    throw 'github api schema: response was not JSON'
  }
}

function Get-GhPages {
  param(
    [Parameter(Mandatory = $true)][string]$Repository,
    [Parameter(Mandatory = $true)][string]$Endpoint,
    [Parameter(Mandatory = $true)][string]$Property
  )
  $page = 1
  $all = @()
  do {
    $separator = $(if ($Endpoint.Contains('?')) { '&' } else { '?' })
    $path = "repos/$Repository/$Endpoint${separator}per_page=100&page=$page"
    $parsed = Invoke-GhJson -Arguments @('api', '--method', 'GET', '-H', 'Accept: application/vnd.github+json', $path)
    $batch = @(Get-ObjectList (Get-Prop $parsed $Property))
    $all += $batch
    $page++
  } while ($batch.Count -eq 100)
  return $all
}

function ConvertTo-ApiRun {
  param($Api)
  $attempt = Get-Prop $Api 'run_attempt'
  return @{
    id = [int64](Get-Prop $Api 'id')
    name = [string](Get-Prop $Api 'name')
    path = [string](Get-Prop $Api 'path')
    event = [string](Get-Prop $Api 'event')
    status = [string](Get-Prop $Api 'status')
    conclusion = Get-Prop $Api 'conclusion'
    runAttempt = $(if ($null -eq $attempt) { 0 } else { [int]$attempt })
    headSha = ConvertTo-Sha (Get-Prop $Api 'head_sha')
    createdAt = [string](Get-Prop $Api 'created_at')
    htmlUrl = [string](Get-Prop $Api 'html_url')
    jobs = @()
    artifacts = @()
  }
}

function ConvertTo-ApiJob {
  param($Api)
  $steps = @()
  foreach ($step in @(Get-ObjectList (Get-Prop $Api 'steps'))) {
    $steps += @{
      name = [string](Get-Prop $step 'name')
      status = [string](Get-Prop $step 'status')
      conclusion = Get-Prop $step 'conclusion'
    }
  }
  $attempt = Get-Prop $Api 'run_attempt'
  return @{
    id = [int64](Get-Prop $Api 'id')
    name = [string](Get-Prop $Api 'name')
    status = [string](Get-Prop $Api 'status')
    conclusion = Get-Prop $Api 'conclusion'
    runAttempt = $(if ($null -eq $attempt) { 0 } else { [int]$attempt })
    headSha = ConvertTo-Sha (Get-Prop $Api 'head_sha')
    steps = $steps
  }
}

function ConvertTo-ApiArtifact {
  param($Api)
  $size = Get-Prop $Api 'size_in_bytes'
  return @{
    id = [int64](Get-Prop $Api 'id')
    name = [string](Get-Prop $Api 'name')
    expired = $(if ($null -eq (Get-Prop $Api 'expired')) { $null } else { [bool](Get-Prop $Api 'expired') })
    digest = [string](Get-Prop $Api 'digest')
    sizeBytes = $(if ($null -eq $size) { $null } else { [int64]$size })
    updatedAt = [string](Get-Prop $Api 'updated_at')
    zipPath = ''
  }
}

function Get-PullRequestView {
  param([Parameter(Mandatory = $true)][string]$Repository, [Parameter(Mandatory = $true)][string]$Number)
  $view = Invoke-GhJson -Arguments @(
    'pr', 'view', $Number, '--repo', $Repository, '--json', 'number,url,headRefOid,baseRefOid'
  )
  return @{
    number = Get-Prop $view 'number'
    url = [string](Get-Prop $view 'url')
    head = ConvertTo-Sha (Get-Prop $view 'headRefOid')
    base = ConvertTo-Sha (Get-Prop $view 'baseRefOid')
  }
}

function Get-LiveModel {
  param([Parameter(Mandatory = $true)][string]$PullRequestValue)
  $repositoryJson = Invoke-GhJson -Arguments @('repo', 'view', '--json', 'nameWithOwner')
  $repository = [string](Get-Prop $repositoryJson 'nameWithOwner')
  if ($repository -notmatch '^[^/\s]+/[^/\s]+$') {
    throw 'github api schema: repository name missing'
  }
  $first = Get-PullRequestView -Repository $repository -Number $PullRequestValue
  if (-not (Test-FullSha $first.head) -or -not (Test-FullSha $first.base)) {
    throw 'github api schema: pull request head or base is not a full SHA'
  }
  $apiRuns = @(Get-GhPages -Repository $repository -Endpoint "actions/runs?head_sha=$($first.head)" -Property 'workflow_runs')
  $runs = @()
  foreach ($apiRun in $apiRuns) {
    $runs += ConvertTo-ApiRun $apiRun
  }
  $selected = @{}
  foreach ($event in $script:Events) {
    $selected[$event] = Select-PrProofRun -Runs $runs -Event $event -Head $first.head
  }
  $downloadRoot = Join-Path ([System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))) (".tools/pr-proof/$($first.number)-$($first.head.Substring(0, 12))")
  if (-not $SkipArtifacts) {
    if (Test-Path -LiteralPath $downloadRoot) {
      Remove-Item -LiteralPath $downloadRoot -Recurse -Force
    }
    New-Item -ItemType Directory -Path $downloadRoot | Out-Null
  }
  foreach ($event in $script:Events) {
    $run = $selected[$event]
    if ($null -eq $run -or $run.runAttempt -lt 1) {
      continue
    }
    $jobEndpoint = "actions/runs/$($run.id)/attempts/$($run.runAttempt)/jobs"
    $apiJobs = @(Get-GhPages -Repository $repository -Endpoint $jobEndpoint -Property 'jobs')
    $jobs = @()
    foreach ($apiJob in $apiJobs) {
      $jobs += ConvertTo-ApiJob $apiJob
    }
    $run.jobs = $jobs
    $apiArtifacts = @(Get-GhPages -Repository $repository -Endpoint "actions/runs/$($run.id)/artifacts" -Property 'artifacts')
    $artifacts = @()
    foreach ($apiArtifact in $apiArtifacts) {
      $artifacts += ConvertTo-ApiArtifact $apiArtifact
    }
    $run.artifacts = $artifacts
    if ($SkipArtifacts) {
      continue
    }
    foreach ($required in $script:RequiredJobs) {
      $resolved = Resolve-PrProofArtifact -Artifacts $run.artifacts -Name $required.Artifact
      if ($null -eq $resolved.Artifact -or $null -ne $resolved.Error) {
        continue
      }
      $artifact = $resolved.Artifact
      if ($null -ne $artifact.sizeBytes -and [int64]$artifact.sizeBytes -gt 50MB) {
        throw "artifact $($artifact.name) is larger than 50MB"
      }
      $zipPath = Join-Path $downloadRoot "$event-$($artifact.name).zip"
      $downloaded = Invoke-GhProcess -Arguments @(
        'api', '--method', 'GET', '-H', 'Accept: application/vnd.github+json',
        "repos/$repository/actions/artifacts/$($artifact.id)/zip"
      ) -OutFile $zipPath
      if ($downloaded.Code -ne 0) {
        if (Test-Path -LiteralPath $zipPath) {
          Remove-Item -LiteralPath $zipPath -Force
        }
        throw (Format-GhFailure $downloaded)
      }
      $artifact.zipPath = $zipPath
    }
  }
  $commits = [System.Collections.Generic.Dictionary[string, string[]]]::new([StringComparer]::Ordinal)
  if (-not $SkipArtifacts) {
    $pullRequestRun = $selected['pull_request']
    if ($null -ne $pullRequestRun) {
      foreach ($required in $script:RequiredJobs) {
        $resolved = Resolve-PrProofArtifact -Artifacts $pullRequestRun.artifacts -Name $required.Artifact
        if ($null -eq $resolved.Artifact -or [string]::IsNullOrWhiteSpace([string]$resolved.Artifact.zipPath)) {
          continue
        }
        $package = Read-PrProofPackage -ZipPath ([string]$resolved.Artifact.zipPath)
        if ($null -eq $package.Provenance) {
          continue
        }
        $source = ConvertTo-Sha (Get-Prop $package.Provenance 'sourceRevision')
        if (-not (Test-FullSha $source) -or $commits.ContainsKey($source)) {
          continue
        }
        $commit = Invoke-GhJson -Arguments @(
          'api', '--method', 'GET', '-H', 'Accept: application/vnd.github+json', "repos/$repository/commits/$source"
        )
        $returned = ConvertTo-Sha (Get-Prop $commit 'sha')
        if ($returned -ne $source) {
          throw "merge-test commit $source schema mismatch"
        }
        $parents = @()
        foreach ($parent in @(Get-ObjectList (Get-Prop $commit 'parents'))) {
          $parents += (ConvertTo-Sha (Get-Prop $parent 'sha'))
        }
        $commits[$source] = [string[]]$parents
      }
    }
  }
  $second = Get-PullRequestView -Repository $repository -Number $PullRequestValue
  return @{
    mode = 'live'
    skipArtifacts = [bool]$SkipArtifacts
    pr = @{
      number = $first.number
      url = $first.url
      repository = $repository
      head = $first.head
      base = $first.base
    }
    headAfter = $second.head
    baseAfter = $second.base
    runs = $runs
    selected = $selected
    commits = $commits
  }
}

function Add-ArtifactProof {
  param($Failures, $JobOut, $Run, $Required, $Model)
  $resolved = Resolve-PrProofArtifact -Artifacts $Run.artifacts -Name $Required.Artifact
  if ($null -ne $resolved.Error) {
    Add-CleanReason -List $Failures -Reason $resolved.Error
    return
  }
  $artifact = $resolved.Artifact
  $artifactOut = New-JsonObject
  $artifactOut['id'] = [int64]$artifact.id
  $artifactOut['name'] = [string]$artifact.name
  $artifactOut['expired'] = [bool]($artifact.expired -eq $true)
  $artifactOut['digest'] = [string]$artifact.digest
  $JobOut['artifact'] = $artifactOut
  if ($null -eq $artifact.expired) {
    Add-CleanReason -List $Failures -Reason "artifact $($Required.Artifact) expired field missing"
    return
  }
  $digestText = [string]$artifact.digest
  if ($digestText -notmatch '^sha256:([0-9a-fA-F]{64})$') {
    Add-CleanReason -List $Failures -Reason "artifact $($Required.Artifact) digest schema"
    return
  }
  $expected = $Matches[1].ToLowerInvariant()
  $zipPath = [string]$artifact.zipPath
  if ([string]::IsNullOrWhiteSpace($zipPath) -or -not (Test-Path -LiteralPath $zipPath -PathType Leaf)) {
    Add-CleanReason -List $Failures -Reason "artifact $($Required.Artifact) zip missing"
    return
  }
  $file = Get-Item -LiteralPath $zipPath
  if ($null -ne $artifact.sizeBytes -and [int64]$file.Length -ne [int64]$artifact.sizeBytes) {
    Add-CleanReason -List $Failures -Reason "artifact download size mismatch for $($Required.Artifact)"
  }
  $header = [byte[]]::new(2)
  $stream = [System.IO.File]::OpenRead($zipPath)
  try {
    [void]$stream.Read($header, 0, 2)
  } finally {
    $stream.Dispose()
  }
  if ($header[0] -ne 0x50 -or $header[1] -ne 0x4B) {
    Add-CleanReason -List $Failures -Reason "artifact download is not a zip for $($Required.Artifact)"
    return
  }
  $archiveHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $zipPath).Hash.ToLowerInvariant()
  $artifactOut['archiveSha256'] = $archiveHash
  if ($archiveHash -ne $expected) {
    Add-CleanReason -List $Failures -Reason "artifact archive digest mismatch for $($Required.Artifact)"
  }
  $package = Read-PrProofPackage -ZipPath $zipPath
  if ($null -eq $package.Provenance) {
    Add-CleanReason -List $Failures -Reason "$($package.Error) for $($Required.Artifact)"
    return
  }
  $provenance = $package.Provenance
  $artifactOut['tarball'] = [string](Get-Prop $provenance 'tarball')
  $artifactOut['tarballSha256'] = [string]$package.TarballHash
  $artifactOut['provenanceDigest'] = ConvertTo-Sha (Get-Prop $provenance 'digest')
  $source = ConvertTo-Sha (Get-Prop $provenance 'sourceRevision')
  $github = ConvertTo-Sha (Get-Prop $provenance 'githubSha')
  $pullHead = [string](Get-Prop $provenance 'pullRequestHeadSha')
  $artifactOut['sourceRevision'] = $source
  $artifactOut['githubSha'] = $github
  $artifactOut['pullRequestHeadSha'] = $pullHead
  if ($null -ne $package.Error) {
    Add-CleanReason -List $Failures -Reason "$($package.Error) for $($Required.Artifact)"
  }
  if (-not (Test-FullSha $source) -or -not (Test-FullSha $github)) {
    Add-CleanReason -List $Failures -Reason "provenance source schema for $($Required.Artifact)"
    return
  }
  if ($Run.event -eq 'push') {
    if ($source -ne $Model.pr.head -or $github -ne $Model.pr.head -or $pullHead -ne '') {
      Add-CleanReason -List $Failures -Reason "push source is not the pull request head for $($Required.Artifact)"
    }
    return
  }
  if ($source -ne $github -or $pullHead -ne $Model.pr.head) {
    Add-CleanReason -List $Failures -Reason "pull_request source mapping mismatch for $($Required.Artifact)"
  }
  if (-not $Model.commits.ContainsKey($source)) {
    Add-CleanReason -List $Failures -Reason "merge-test commit $source unavailable"
    return
  }
  $parents = $Model.commits[$source]
  $parentOut = New-StringList
  foreach ($parent in @($parents)) {
    [void]$parentOut.Add([string]$parent)
  }
  $artifactOut['parents'] = $parentOut
  if ($parents.Length -ne 2 -or $parents[0] -ne $Model.pr.base -or $parents[1] -ne $Model.pr.head) {
    Add-CleanReason -List $Failures -Reason 'merge-test parents are not base then head'
  }
}

function Get-PrProofJudgment {
  param($Model)
  $failures = New-StringList
  $pending = New-StringList
  $limitations = New-StringList
  if ($Model.skipArtifacts) {
    Add-CleanReason -List $limitations -Reason 'artifact verification skipped by caller assertion that the packet waived it'
  }
  if (-not (Test-FullSha $Model.pr.head) -or -not (Test-FullSha $Model.pr.base)) {
    Add-CleanReason -List $failures -Reason 'pull request head or base schema'
  }
  $selected = @{}
  if ($Model.Contains('selected')) {
    $selected = $Model.selected
  } else {
    foreach ($event in $script:Events) {
      $selected[$event] = Select-PrProofRun -Runs $Model.runs -Event $event -Head $Model.pr.head
    }
  }
  $runsOut = New-JsonObject
  foreach ($event in $script:Events) {
    $run = $selected[$event]
    if ($null -eq $run) {
      Add-CleanReason -List $pending -Reason "$event run for head not found"
      $runsOut[$event] = $null
      continue
    }
    if ([int]$run.runAttempt -lt 1) {
      Add-CleanReason -List $failures -Reason "$event run attempt schema"
    }
    $runKind = Get-PrProofNodeKind $run.status $run.conclusion
    $runOut = New-JsonObject
    $runOut['id'] = [int64]$run.id
    $runOut['attempt'] = [int]$run.runAttempt
    $runOut['event'] = $event
    $runOut['status'] = [string]$run.status
    $runOut['conclusion'] = $(if ($null -eq $run.conclusion) { $null } else { [string]$run.conclusion })
    $runOut['headSha'] = [string]$run.headSha
    $runOut['htmlUrl'] = [string]$run.htmlUrl
    $jobsOut = New-JsonObject
    $failBefore = $failures.Count
    $pendingBefore = $pending.Count
    foreach ($required in $script:RequiredJobs) {
      $job = $null
      foreach ($candidate in @($run.jobs)) {
        if ($candidate.name -eq $required.Name) {
          $job = $candidate
          break
        }
      }
      if ($null -eq $job) {
        if ($runKind -eq 'pending') {
          Add-CleanReason -List $pending -Reason "required job $($required.Name) not started"
        } else {
          Add-CleanReason -List $failures -Reason "required job $($required.Name) missing"
        }
        $jobsOut[$required.Key] = $null
        continue
      }
      $jobOut = New-JsonObject
      $jobOut['id'] = [int64]$job.id
      $jobOut['name'] = [string]$job.name
      $jobOut['conclusion'] = $(if ($null -eq $job.conclusion) { $null } else { [string]$job.conclusion })
      $stepsOut = New-JsonObject
      $jobKind = Get-PrProofNodeKind $job.status $job.conclusion
      if ($job.headSha -and $job.headSha -ne $Model.pr.head) {
        Add-CleanReason -List $failures -Reason "job $($required.Name) head is not the pull request head"
      }
      if ([int]$job.runAttempt -ne [int]$run.runAttempt) {
        Add-CleanReason -List $failures -Reason "job $($required.Name) attempt does not match the latest run attempt"
      }
      if ($jobKind -eq 'fail') {
        Add-CleanReason -List $failures -Reason "required job $($required.Name) conclusion=$($job.conclusion)"
      } elseif ($jobKind -eq 'pending') {
        Add-CleanReason -List $pending -Reason "required job $($required.Name) status=$($job.status)"
      }
      $uploadPassed = $false
      foreach ($stepName in $script:RequiredSteps) {
        $step = $null
        foreach ($candidateStep in @($job.steps)) {
          if ($candidateStep.name -eq $stepName) {
            $step = $candidateStep
            break
          }
        }
        if ($null -eq $step) {
          $stepsOut[$stepName] = $null
          if ($jobKind -eq 'pending' -or $runKind -eq 'pending') {
            Add-CleanReason -List $pending -Reason "required step $stepName not started on $($required.Name)"
          } else {
            Add-CleanReason -List $failures -Reason "required step $stepName missing on $($required.Name)"
          }
          continue
        }
        $stepKind = Get-PrProofNodeKind $step.status $step.conclusion
        $stepsOut[$stepName] = $(if ($null -eq $step.conclusion) { $null } else { [string]$step.conclusion })
        if ($stepKind -eq 'fail') {
          Add-CleanReason -List $failures -Reason "required step $stepName on $($required.Name) conclusion=$($step.conclusion)"
        } elseif ($stepKind -eq 'pending') {
          Add-CleanReason -List $pending -Reason "required step $stepName on $($required.Name) status=$($step.status)"
        } elseif ($stepName -eq 'Upload packed tarball') {
          $uploadPassed = $true
        }
      }
      $jobOut['steps'] = $stepsOut
      if ($Model.skipArtifacts) {
        $skipped = New-JsonObject
        $skipped['skipped'] = $true
        $jobOut['artifact'] = $skipped
      } elseif ($uploadPassed) {
        Add-ArtifactProof -Failures $failures -JobOut $jobOut -Run $run -Required $required -Model $Model
      }
      $jobsOut[$required.Key] = $jobOut
    }
    $runOut['jobs'] = $jobsOut
    if ($runKind -eq 'fail' -and $failures.Count -eq $failBefore) {
      Add-CleanReason -List $failures -Reason "$event run $($run.id) attempt $($run.runAttempt) conclusion=$($run.conclusion)"
    }
    if ($runKind -eq 'pending' -and $pending.Count -eq $pendingBefore -and $failures.Count -eq $failBefore) {
      Add-CleanReason -List $pending -Reason "$event run $($run.id) attempt $($run.runAttempt) status=$($run.status)"
    }
    $runsOut[$event] = $runOut
  }
  $unchanged = (Test-FullSha $Model.headAfter) -and (Test-FullSha $Model.baseAfter) -and $Model.headAfter -eq $Model.pr.head -and $Model.baseAfter -eq $Model.pr.base
  if (-not (Test-FullSha $Model.headAfter) -or -not (Test-FullSha $Model.baseAfter)) {
    Add-CleanReason -List $failures -Reason 'head re-read missing'
  } elseif ($Model.headAfter -ne $Model.pr.head) {
    Add-CleanReason -List $failures -Reason 'pull request head changed during proof'
  } elseif ($Model.baseAfter -ne $Model.pr.base) {
    Add-CleanReason -List $failures -Reason 'pull request base changed during proof'
  }
  $verdict = 'PASS'
  $reason = ''
  if ($failures.Count -gt 0) {
    $verdict = 'FAIL'
    $reason = $failures[0]
  } elseif ($pending.Count -gt 0) {
    $verdict = 'PENDING'
    $reason = $pending[0]
  }
  $payload = New-JsonObject
  $payload['verdict'] = $verdict
  $payload['reason'] = $reason
  $payload['mode'] = [string]$Model.mode
  $payload['skipArtifacts'] = [bool]$Model.skipArtifacts
  $payload['limitations'] = $limitations
  $prOut = New-JsonObject
  $prOut['number'] = $Model.pr.number
  $prOut['url'] = [string]$Model.pr.url
  $prOut['repository'] = [string]$Model.pr.repository
  $prOut['head'] = [string]$Model.pr.head
  $prOut['base'] = [string]$Model.pr.base
  $payload['pr'] = $prOut
  $recheck = New-JsonObject
  $recheck['head'] = [string]$Model.headAfter
  $recheck['base'] = [string]$Model.baseAfter
  $recheck['unchanged'] = [bool]$unchanged
  $payload['headRecheck'] = $recheck
  $payload['runs'] = $runsOut
  $payload['failures'] = $failures
  $payload['pending'] = $pending
  return @{ Verdict = $verdict; Reason = $reason; Payload = $payload }
}

function Write-PrProofContract {
  param(
    [Parameter(Mandatory = $true)][string]$Verdict,
    [string]$Reason,
    $Payload
  )
  $line = $Verdict
  if ($Verdict -ne 'PASS' -and -not [string]::IsNullOrWhiteSpace($Reason)) {
    $line = "$Verdict $Reason"
  }
  $json = '{}'
  if ($null -ne $Payload) {
    $json = ConvertTo-Json -InputObject $Payload -Depth 40 -Compress
  }
  [Console]::Out.WriteLine($line)
  [Console]::Out.WriteLine($json)
}

$mode = 'live'
try {
  $hasFixture = -not [string]::IsNullOrWhiteSpace($Fixture)
  $hasPullRequest = -not [string]::IsNullOrWhiteSpace($PullRequest)
  if ($hasFixture -and $hasPullRequest) {
    throw '-Fixture cannot be combined with -PullRequest'
  }
  if (-not $hasFixture -and -not $hasPullRequest) {
    throw '-PullRequest is required'
  }
  if ($hasFixture) {
    $mode = 'fixture'
    $model = Get-FixtureModel -FixturePath $Fixture
  } else {
    $model = Get-LiveModel -PullRequestValue $PullRequest
  }
  $judgment = Get-PrProofJudgment -Model $model
  Write-PrProofContract -Verdict $judgment.Verdict -Reason $judgment.Reason -Payload $judgment.Payload
  if ($judgment.Verdict -eq 'PASS') {
    exit 0
  }
  if ($judgment.Verdict -eq 'PENDING') {
    exit 2
  }
  exit 1
} catch {
  $message = [string]$_.Exception.Message
  if ([string]::IsNullOrWhiteSpace($message)) {
    $message = [string]$_
  }
  $message = (($message -replace "`r", ' ' -replace "`n", ' ').Trim())
  $payload = New-JsonObject
  $payload['verdict'] = 'FAIL'
  $payload['reason'] = $message
  $payload['mode'] = $mode
  $payload['skipArtifacts'] = [bool]$SkipArtifacts
  $limitations = New-StringList
  if ($SkipArtifacts) {
    Add-CleanReason -List $limitations -Reason 'artifact verification skipped by caller assertion that the packet waived it'
  }
  $payload['limitations'] = $limitations
  $payload['failures'] = New-StringList
  Add-CleanReason -List $payload['failures'] -Reason $message
  Write-PrProofContract -Verdict 'FAIL' -Reason $message -Payload $payload
  exit 1
}
