# Offline FAIL, PENDING, and tamper cases for scripts/Test-PrProof.ps1.
# Does not call gh, and does not call scripts/Verify.ps1.
#Requires -Version 7.6
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
Set-StrictMode -Version Latest
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$script:Root = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../..'))
$script:Proof = Join-Path $script:Root 'scripts/Test-PrProof.ps1'
$script:Work = Join-Path ([System.IO.Path]::GetTempPath()) ("braid-pr-proof-" + [guid]::NewGuid().ToString('n'))
$script:Head = 'a' * 40
$script:Base = 'b' * 40
$script:Merge = 'c' * 40
$script:Other = 'd' * 40

function Fail {
  param([Parameter(Mandatory = $true)][string]$Message)
  [Console]::Error.WriteLine("pr-proof fixtures failed: $Message")
  exit 1
}

function Get-Sha256Bytes {
  param([Parameter(Mandatory = $true)][byte[]]$Bytes)
  $algorithm = [System.Security.Cryptography.SHA256]::Create()
  try {
    return ([System.BitConverter]::ToString($algorithm.ComputeHash($Bytes)).Replace('-', '').ToLowerInvariant())
  } finally {
    $algorithm.Dispose()
  }
}

function New-PackageZip {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Source,
    [Parameter(Mandatory = $true)][string]$Github,
    [string]$PullRequestHead = '',
    [string]$ProvenanceDigest
  )
  $tarballBytes = [System.Text.UTF8Encoding]::new($false).GetBytes("fixture-pack:$Path")
  $tarballHash = Get-Sha256Bytes $tarballBytes
  $digest = if ([string]::IsNullOrWhiteSpace($ProvenanceDigest)) { $tarballHash } else { $ProvenanceDigest }
  $provenance = [ordered]@{
    sourceRevision = $Source
    worktreeDirty = $false
    candidate = $true
    tarball = 'exones-braid-0.1.1.tgz'
    digestAlgorithm = 'sha256'
    digest = $digest
    githubSha = $Github
    pullRequestHeadSha = $PullRequestHead
  }
  $provenanceText = (($provenance | ConvertTo-Json -Compress) + "`n")
  $provenanceBytes = [System.Text.UTF8Encoding]::new($false).GetBytes($provenanceText)
  $packBytes = [System.Text.UTF8Encoding]::new($false).GetBytes("{`n}`n")
  if (Test-Path -LiteralPath $Path) {
    Remove-Item -LiteralPath $Path -Force
  }
  $zip = [System.IO.Compression.ZipFile]::Open($Path, [System.IO.Compression.ZipArchiveMode]::Create)
  try {
    foreach ($entrySpec in @(
        @{ Name = 'exones-braid-0.1.1.tgz'; Bytes = $tarballBytes }
        @{ Name = 'exones-braid-0.1.1.provenance.json'; Bytes = $provenanceBytes }
        @{ Name = 'npm-pack.json'; Bytes = $packBytes }
      )) {
      $entry = $zip.CreateEntry($entrySpec.Name)
      $stream = $entry.Open()
      try {
        $stream.Write($entrySpec.Bytes, 0, $entrySpec.Bytes.Length)
      } finally {
        $stream.Dispose()
      }
    }
  } finally {
    $zip.Dispose()
  }
  return @{
    ArchiveHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $Path).Hash.ToLowerInvariant()
    Size = (Get-Item -LiteralPath $Path).Length
  }
}

function New-Step {
  param([string]$Name, [string]$Status = 'completed', $Conclusion = 'success')
  return @{ name = $Name; status = $Status; conclusion = $Conclusion }
}

function New-Job {
  param(
    [int64]$Id,
    [string]$Name,
    [int]$Attempt,
    [string]$Status = 'completed',
    $Conclusion = 'success',
    [scriptblock]$Steps
  )
  $stepList = @(
    (New-Step 'Install dependencies')
    (New-Step 'Verify')
    (New-Step 'Upload packed tarball')
  )
  if ($null -ne $Steps) {
    $stepList = @(& $Steps)
  }
  return @{
    id = $Id
    name = $Name
    status = $Status
    conclusion = $Conclusion
    runAttempt = $Attempt
    headSha = $script:Head
    steps = $stepList
  }
}

function New-Run {
  param(
    [int64]$Id,
    [string]$Event,
    [int]$Attempt,
    [string]$CreatedAt,
    [string]$Status = 'completed',
    $Conclusion = 'success',
    $Jobs,
    $Artifacts
  )
  return @{
    id = $Id
    name = 'CI'
    path = '.github/workflows/ci.yml'
    event = $Event
    status = $Status
    conclusion = $Conclusion
    runAttempt = $Attempt
    headSha = $script:Head
    createdAt = $CreatedAt
    htmlUrl = "https://github.com/exones/braid/actions/runs/$Id"
    jobs = @($Jobs)
    artifacts = @($Artifacts)
  }
}

function New-Artifact {
  param([int64]$Id, [string]$Name, [string]$ZipName, [string]$Digest, [int64]$Size, [bool]$Expired = $false)
  return @{
    id = $Id
    name = $Name
    expired = $Expired
    digest = $Digest
    sizeBytes = $Size
    updatedAt = '2026-11-04T00:00:00Z'
    zipPath = $ZipName
  }
}

function New-Evidence {
  param(
    $Runs,
    $Commits,
    [string]$HeadAfter = $script:Head,
    [string]$BaseAfter = $script:Base,
    [string]$State = 'open',
    [string]$LiveBase = $script:Base,
    [string]$LiveBaseAfter = '',
    [string]$MergeTest = $script:Merge
  )
  if ([string]::IsNullOrWhiteSpace($LiveBaseAfter)) {
    $LiveBaseAfter = $LiveBase
  }
  return @{
    pr = @{
      number = 13
      url = 'https://github.com/exones/braid/pull/13'
      repository = 'exones/braid'
      head = $script:Head
      base = $script:Base
    }
    state = $State
    liveBase = $LiveBase
    liveBaseAfter = $LiveBaseAfter
    mergeTest = $MergeTest
    headAfter = $HeadAfter
    baseAfter = $BaseAfter
    commits = $Commits
    runs = @($Runs)
  }
}

function Write-Evidence {
  param([Parameter(Mandatory = $true)][string]$Dir, $Evidence)
  $path = Join-Path $Dir 'evidence.json'
  $json = ConvertTo-Json -InputObject $Evidence -Depth 30
  $encoding = [System.Text.UTF8Encoding]::new($false)
  [System.IO.File]::WriteAllText($path, $json.Trim() + "`n", $encoding)
}

function New-CaseDir {
  param([Parameter(Mandatory = $true)][string]$Name)
  $dir = Join-Path $script:Work $Name
  New-Item -ItemType Directory -Path $dir | Out-Null
  return $dir
}

function New-GreenPackages {
  param([Parameter(Mandatory = $true)][string]$Dir, [string]$ProvenanceDigest)
  $packages = @{}
  foreach ($spec in @(
      @{ Event = 'push'; Os = 'ubuntu'; Source = $script:Head; Github = $script:Head; Pull = '' }
      @{ Event = 'push'; Os = 'windows'; Source = $script:Head; Github = $script:Head; Pull = '' }
      @{ Event = 'pull_request'; Os = 'ubuntu'; Source = $script:Merge; Github = $script:Merge; Pull = $script:Head }
      @{ Event = 'pull_request'; Os = 'windows'; Source = $script:Merge; Github = $script:Merge; Pull = $script:Head }
    )) {
    $fileName = "$($spec.Event)-$($spec.Os).zip"
    $built = New-PackageZip -Path (Join-Path $Dir $fileName) -Source $spec.Source -Github $spec.Github -PullRequestHead $spec.Pull -ProvenanceDigest $ProvenanceDigest
    $packages["$($spec.Event)-$($spec.Os)"] = @{
      File = $fileName
      Digest = "sha256:$($built.ArchiveHash)"
      Size = [int64]$built.Size
    }
  }
  return $packages
}

function New-SuccessJobs {
  param([int]$Attempt, [int64]$UbuntuId, [int64]$WindowsId)
  return @(
    (New-Job -Id $UbuntuId -Name 'verify (ubuntu-latest)' -Attempt $Attempt)
    (New-Job -Id $WindowsId -Name 'verify (windows-latest)' -Attempt $Attempt)
  )
}

function New-SuccessArtifacts {
  param($Packages, [string]$Event, [int64]$UbuntuId, [int64]$WindowsId, [string]$UbuntuDigest, [string]$WindowsDigest)
  $ubuntu = $Packages["$Event-ubuntu"]
  $windows = $Packages["$Event-windows"]
  $ubuntuDigestValue = if ([string]::IsNullOrWhiteSpace($UbuntuDigest)) { $ubuntu.Digest } else { $UbuntuDigest }
  $windowsDigestValue = if ([string]::IsNullOrWhiteSpace($WindowsDigest)) { $windows.Digest } else { $WindowsDigest }
  return @(
    (New-Artifact -Id $UbuntuId -Name 'braid-package-ubuntu-latest' -ZipName $ubuntu.File -Digest $ubuntuDigestValue -Size $ubuntu.Size)
    (New-Artifact -Id $WindowsId -Name 'braid-package-windows-latest' -ZipName $windows.File -Digest $windowsDigestValue -Size $windows.Size)
  )
}

function Invoke-Proof {
  param([Parameter(Mandatory = $true)][string]$Dir, [switch]$SkipArtifacts, [switch]$NoFixture)
  $start = [System.Diagnostics.ProcessStartInfo]::new()
  $start.FileName = (Get-Command -Name pwsh).Source
  $start.UseShellExecute = $false
  $start.RedirectStandardOutput = $true
  $start.RedirectStandardError = $true
  $start.CreateNoWindow = $true
  foreach ($argument in @('-NoProfile', '-File', $script:Proof)) {
    [void]$start.ArgumentList.Add($argument)
  }
  if (-not $NoFixture) {
    [void]$start.ArgumentList.Add('-Fixture')
    [void]$start.ArgumentList.Add($Dir)
  }
  if ($SkipArtifacts) {
    [void]$start.ArgumentList.Add('-SkipArtifacts')
  }
  $process = [System.Diagnostics.Process]::new()
  $process.StartInfo = $start
  [void]$process.Start()
  $errorTask = $process.StandardError.ReadToEndAsync()
  $stdout = $process.StandardOutput.ReadToEnd()
  $process.WaitForExit()
  $stderr = $errorTask.GetAwaiter().GetResult()
  $lines = @($stdout -split "`r?`n" | Where-Object { $_ -ne '' })
  return [pscustomobject]@{
    Code = $process.ExitCode
    Lines = $lines
    Stderr = $stderr
  }
}

function Get-Verdict {
  param($Result)
  if ($Result.Lines.Count -lt 2) {
    Fail "expected two output lines, got [$($Result.Lines -join ' | ')] stderr=$($Result.Stderr)"
  }
  try {
    return ($Result.Lines[-1] | ConvertFrom-Json)
  } catch {
    Fail "verdict JSON did not parse: $($Result.Lines[-1])"
  }
}

function Assert-Case {
  param(
    [Parameter(Mandatory = $true)][string]$Label,
    [Parameter(Mandatory = $true)]$Result,
    [Parameter(Mandatory = $true)][int]$Code,
    [Parameter(Mandatory = $true)][string]$Verdict,
    [string]$ReasonMatch
  )
  $json = Get-Verdict $Result
  if ($Result.Code -ne $Code -or [string]$json.verdict -ne $Verdict) {
    Fail "$Label expected $Verdict exit $Code, got $($json.verdict) exit $($Result.Code): $($Result.Lines[0])"
  }
  if ($Verdict -eq 'PASS') {
    if ($Result.Lines[0] -ne 'PASS') {
      Fail "$Label PASS line was $($Result.Lines[0])"
    }
  } elseif ($Result.Lines[0] -notmatch "^$Verdict\b") {
    Fail "$Label line did not start with ${Verdict}: $($Result.Lines[0])"
  }
  if (-not [string]::IsNullOrWhiteSpace($ReasonMatch) -and [string]$json.reason -notmatch $ReasonMatch) {
    Fail "$Label reason '$($json.reason)' did not match $ReasonMatch"
  }
  if ([string]$json.mode -ne 'fixture' -and -not $Label.StartsWith('cli-')) {
    Fail "$Label mode was $($json.mode)"
  }
  Write-Host "pr-proof fixture ${Label}: $Verdict"
  return $json
}

$proofText = [System.IO.File]::ReadAllText($script:Proof)
if ($proofText -match 'Start-Sleep|gh run watch|watch_pull_request') {
  Fail 'proof command must not poll or watch'
}

try {
  New-Item -ItemType Directory -Path $script:Work | Out-Null
  $commits = @{ $script:Merge = @($script:Base, $script:Head) }

  $greenDir = New-CaseDir 'green'
  $greenPackages = New-GreenPackages -Dir $greenDir
  $greenRuns = @(
    (New-Run -Id 100 -Event 'push' -Attempt 1 -CreatedAt '2026-11-04T00:00:00Z' -Jobs (New-SuccessJobs -Attempt 1 -UbuntuId 1001 -WindowsId 1002) -Artifacts (New-SuccessArtifacts -Packages $greenPackages -Event 'push' -UbuntuId 5001 -WindowsId 5002))
    (New-Run -Id 200 -Event 'pull_request' -Attempt 1 -CreatedAt '2026-11-04T00:01:00Z' -Jobs (New-SuccessJobs -Attempt 1 -UbuntuId 2001 -WindowsId 2002) -Artifacts (New-SuccessArtifacts -Packages $greenPackages -Event 'pull_request' -UbuntuId 5003 -WindowsId 5004))
  )
  Write-Evidence -Dir $greenDir -Evidence (New-Evidence -Runs $greenRuns -Commits $commits)
  $green = Assert-Case -Label 'green' -Result (Invoke-Proof -Dir $greenDir) -Code 0 -Verdict 'PASS'
  $pushArchive = ($green.runs.push.jobs.ubuntu.artifact.digest -replace '^sha256:', '')
  if ($green.runs.push.jobs.ubuntu.artifact.archiveSha256 -ne $pushArchive) {
    Fail 'green archive hash did not match the declared digest'
  }
  if ($green.runs.push.jobs.ubuntu.artifact.pullRequestHeadSha -ne '') {
    Fail 'green push provenance had a pull request head'
  }
  if ([string]$green.proofScope -ne 'current' -or $green.currentReady -ne $true) {
    Fail "green proof scope was $($green.proofScope) currentReady=$($green.currentReady)"
  }
  $parents = @($green.runs.pull_request.jobs.ubuntu.artifact.parents)
  if ($parents.Count -ne 2 -or $parents[0] -ne $script:Base -or $parents[1] -ne $script:Head) {
    Fail "green merge parents were $($parents -join ',')"
  }

  $failedDir = New-CaseDir 'failed-attempt'
  $failedPackages = New-GreenPackages -Dir $failedDir
  $pendingSteps = {
    @(
      (New-Step 'Install dependencies')
      (New-Step 'Verify' 'in_progress' $null)
    )
  }
  $failedRuns = @(
    (New-Run -Id 100 -Event 'push' -Attempt 1 -CreatedAt '2026-11-04T00:00:00Z' -Jobs (New-SuccessJobs -Attempt 1 -UbuntuId 1001 -WindowsId 1002) -Artifacts (New-SuccessArtifacts -Packages $failedPackages -Event 'push' -UbuntuId 5001 -WindowsId 5002))
    (New-Run -Id 100 -Event 'push' -Attempt 2 -CreatedAt '2026-11-04T00:05:00Z' -Status 'completed' -Conclusion 'failure' -Jobs @(
        (New-Job -Id 1101 -Name 'verify (ubuntu-latest)' -Attempt 2 -Status 'in_progress' -Conclusion $null -Steps $pendingSteps)
        (New-Job -Id 1102 -Name 'verify (windows-latest)' -Attempt 2 -Status 'completed' -Conclusion 'failure' -Steps {
            @(
              (New-Step 'Install dependencies')
              (New-Step 'Verify' 'completed' 'failure')
              (New-Step 'Upload packed tarball' 'completed' 'skipped')
            )
          })
      ) -Artifacts @())
    (New-Run -Id 200 -Event 'pull_request' -Attempt 1 -CreatedAt '2026-11-04T00:06:00Z' -Status 'in_progress' -Conclusion $null -Jobs @(
        (New-Job -Id 2101 -Name 'verify (ubuntu-latest)' -Attempt 1 -Status 'in_progress' -Conclusion $null -Steps $pendingSteps)
        (New-Job -Id 2102 -Name 'verify (windows-latest)' -Attempt 1 -Status 'in_progress' -Conclusion $null -Steps $pendingSteps)
      ) -Artifacts @())
  )
  Write-Evidence -Dir $failedDir -Evidence (New-Evidence -Runs $failedRuns -Commits $commits)
  $failed = Assert-Case -Label 'failed-attempt' -Result (Invoke-Proof -Dir $failedDir) -Code 1 -Verdict 'FAIL' -ReasonMatch 'verify \(windows-latest\) conclusion=failure'
  if ([int]$failed.runs.push.attempt -ne 2) {
    Fail "failed-attempt selected push attempt $($failed.runs.push.attempt)"
  }

  $pendingDir = New-CaseDir 'pending'
  $pendingRuns = @(
    (New-Run -Id 300 -Event 'push' -Attempt 1 -CreatedAt '2026-11-04T00:00:00Z' -Status 'in_progress' -Conclusion $null -Jobs @(
        (New-Job -Id 3001 -Name 'verify (ubuntu-latest)' -Attempt 1 -Status 'in_progress' -Conclusion $null -Steps $pendingSteps)
        (New-Job -Id 3002 -Name 'verify (windows-latest)' -Attempt 1 -Status 'queued' -Conclusion $null -Steps { @() })
      ) -Artifacts @())
    (New-Run -Id 301 -Event 'pull_request' -Attempt 1 -CreatedAt '2026-11-04T00:01:00Z' -Status 'queued' -Conclusion $null -Jobs @() -Artifacts @())
  )
  Write-Evidence -Dir $pendingDir -Evidence (New-Evidence -Runs $pendingRuns -Commits $commits)
  Assert-Case -Label 'pending' -Result (Invoke-Proof -Dir $pendingDir) -Code 2 -Verdict 'PENDING' | Out-Null

  $newerDir = New-CaseDir 'newer-pending'
  $newerPackages = New-GreenPackages -Dir $newerDir
  $newerRuns = @(
    (New-Run -Id 10 -Event 'push' -Attempt 1 -CreatedAt '2026-11-03T00:00:00Z' -Jobs (New-SuccessJobs -Attempt 1 -UbuntuId 11 -WindowsId 12) -Artifacts (New-SuccessArtifacts -Packages $newerPackages -Event 'push' -UbuntuId 13 -WindowsId 14))
    (New-Run -Id 20 -Event 'push' -Attempt 1 -CreatedAt '2026-11-04T00:00:00Z' -Status 'in_progress' -Conclusion $null -Jobs @(
        (New-Job -Id 21 -Name 'verify (ubuntu-latest)' -Attempt 1 -Status 'in_progress' -Conclusion $null -Steps $pendingSteps)
        (New-Job -Id 22 -Name 'verify (windows-latest)' -Attempt 1 -Status 'in_progress' -Conclusion $null -Steps $pendingSteps)
      ) -Artifacts @())
    (New-Run -Id 30 -Event 'pull_request' -Attempt 1 -CreatedAt '2026-11-04T00:01:00Z' -Jobs (New-SuccessJobs -Attempt 1 -UbuntuId 31 -WindowsId 32) -Artifacts (New-SuccessArtifacts -Packages $newerPackages -Event 'pull_request' -UbuntuId 33 -WindowsId 34))
  )
  Write-Evidence -Dir $newerDir -Evidence (New-Evidence -Runs $newerRuns -Commits $commits)
  $newer = Assert-Case -Label 'newer-pending' -Result (Invoke-Proof -Dir $newerDir) -Code 2 -Verdict 'PENDING'
  if ([int64]$newer.runs.push.id -ne 20) {
    Fail "newer-pending selected push run $($newer.runs.push.id)"
  }

  $staleDir = New-CaseDir 'stale-head'
  $stalePackages = New-GreenPackages -Dir $staleDir
  $staleRuns = @(
    (New-Run -Id 100 -Event 'push' -Attempt 1 -CreatedAt '2026-11-04T00:00:00Z' -Jobs (New-SuccessJobs -Attempt 1 -UbuntuId 1001 -WindowsId 1002) -Artifacts (New-SuccessArtifacts -Packages $stalePackages -Event 'push' -UbuntuId 5001 -WindowsId 5002))
    (New-Run -Id 200 -Event 'pull_request' -Attempt 1 -CreatedAt '2026-11-04T00:01:00Z' -Jobs (New-SuccessJobs -Attempt 1 -UbuntuId 2001 -WindowsId 2002) -Artifacts (New-SuccessArtifacts -Packages $stalePackages -Event 'pull_request' -UbuntuId 5003 -WindowsId 5004))
  )
  Write-Evidence -Dir $staleDir -Evidence (New-Evidence -Runs $staleRuns -Commits $commits -HeadAfter $script:Other)
  Assert-Case -Label 'stale-head' -Result (Invoke-Proof -Dir $staleDir) -Code 1 -Verdict 'FAIL' -ReasonMatch 'head changed' | Out-Null

  $parentDir = New-CaseDir 'parent-order'
  $parentPackages = New-GreenPackages -Dir $parentDir
  $parentRuns = @(
    (New-Run -Id 100 -Event 'push' -Attempt 1 -CreatedAt '2026-11-04T00:00:00Z' -Jobs (New-SuccessJobs -Attempt 1 -UbuntuId 1001 -WindowsId 1002) -Artifacts (New-SuccessArtifacts -Packages $parentPackages -Event 'push' -UbuntuId 5001 -WindowsId 5002))
    (New-Run -Id 200 -Event 'pull_request' -Attempt 1 -CreatedAt '2026-11-04T00:01:00Z' -Jobs (New-SuccessJobs -Attempt 1 -UbuntuId 2001 -WindowsId 2002) -Artifacts (New-SuccessArtifacts -Packages $parentPackages -Event 'pull_request' -UbuntuId 5003 -WindowsId 5004))
  )
  $reversed = @{ $script:Merge = @($script:Head, $script:Base) }
  Write-Evidence -Dir $parentDir -Evidence (New-Evidence -Runs $parentRuns -Commits $reversed)
  Assert-Case -Label 'parent-order' -Result (Invoke-Proof -Dir $parentDir) -Code 1 -Verdict 'FAIL' -ReasonMatch 'live target tip' | Out-Null

  $archiveDir = New-CaseDir 'archive-digest'
  $archivePackages = New-GreenPackages -Dir $archiveDir
  $wrong = 'sha256:' + ('ab' * 32)
  $archiveRuns = @(
    (New-Run -Id 100 -Event 'push' -Attempt 1 -CreatedAt '2026-11-04T00:00:00Z' -Jobs (New-SuccessJobs -Attempt 1 -UbuntuId 1001 -WindowsId 1002) -Artifacts (New-SuccessArtifacts -Packages $archivePackages -Event 'push' -UbuntuId 5001 -WindowsId 5002 -UbuntuDigest $wrong))
    (New-Run -Id 200 -Event 'pull_request' -Attempt 1 -CreatedAt '2026-11-04T00:01:00Z' -Jobs (New-SuccessJobs -Attempt 1 -UbuntuId 2001 -WindowsId 2002) -Artifacts (New-SuccessArtifacts -Packages $archivePackages -Event 'pull_request' -UbuntuId 5003 -WindowsId 5004))
  )
  Write-Evidence -Dir $archiveDir -Evidence (New-Evidence -Runs $archiveRuns -Commits $commits)
  Assert-Case -Label 'archive-digest' -Result (Invoke-Proof -Dir $archiveDir) -Code 1 -Verdict 'FAIL' -ReasonMatch 'archive digest mismatch' | Out-Null

  $provenanceDir = New-CaseDir 'provenance-digest'
  $badDigest = 'cd' * 32
  $provenancePackages = New-GreenPackages -Dir $provenanceDir -ProvenanceDigest $badDigest
  $provenanceRuns = @(
    (New-Run -Id 100 -Event 'push' -Attempt 1 -CreatedAt '2026-11-04T00:00:00Z' -Jobs (New-SuccessJobs -Attempt 1 -UbuntuId 1001 -WindowsId 1002) -Artifacts (New-SuccessArtifacts -Packages $provenancePackages -Event 'push' -UbuntuId 5001 -WindowsId 5002))
    (New-Run -Id 200 -Event 'pull_request' -Attempt 1 -CreatedAt '2026-11-04T00:01:00Z' -Jobs (New-SuccessJobs -Attempt 1 -UbuntuId 2001 -WindowsId 2002) -Artifacts (New-SuccessArtifacts -Packages $provenancePackages -Event 'pull_request' -UbuntuId 5003 -WindowsId 5004))
  )
  Write-Evidence -Dir $provenanceDir -Evidence (New-Evidence -Runs $provenanceRuns -Commits $commits)
  Assert-Case -Label 'provenance-digest' -Result (Invoke-Proof -Dir $provenanceDir) -Code 1 -Verdict 'FAIL' -ReasonMatch 'provenance digest mismatch' | Out-Null

  $skip = Assert-Case -Label 'skip-artifacts' -Result (Invoke-Proof -Dir $archiveDir -SkipArtifacts) -Code 0 -Verdict 'PASS'
  if ([string]$skip.skipArtifacts -ne 'True' -or @($skip.limitations) -notcontains 'artifact verification skipped by caller assertion that the packet waived it') {
    Fail 'skip-artifacts did not record the caller limitation'
  }
  Assert-Case -Label 'skip-hides-nothing' -Result (Invoke-Proof -Dir $failedDir -SkipArtifacts) -Code 1 -Verdict 'FAIL' -ReasonMatch 'conclusion=failure' | Out-Null

  $expiredDir = New-CaseDir 'expired'
  $expiredPackages = New-GreenPackages -Dir $expiredDir
  $expiredArtifacts = New-SuccessArtifacts -Packages $expiredPackages -Event 'push' -UbuntuId 5001 -WindowsId 5002
  $expiredArtifacts[0].expired = $true
  $expiredRuns = @(
    (New-Run -Id 100 -Event 'push' -Attempt 1 -CreatedAt '2026-11-04T00:00:00Z' -Jobs (New-SuccessJobs -Attempt 1 -UbuntuId 1001 -WindowsId 1002) -Artifacts $expiredArtifacts)
    (New-Run -Id 200 -Event 'pull_request' -Attempt 1 -CreatedAt '2026-11-04T00:01:00Z' -Jobs (New-SuccessJobs -Attempt 1 -UbuntuId 2001 -WindowsId 2002) -Artifacts (New-SuccessArtifacts -Packages $expiredPackages -Event 'pull_request' -UbuntuId 5003 -WindowsId 5004))
  )
  Write-Evidence -Dir $expiredDir -Evidence (New-Evidence -Runs $expiredRuns -Commits $commits)
  Assert-Case -Label 'expired' -Result (Invoke-Proof -Dir $expiredDir) -Code 1 -Verdict 'FAIL' -ReasonMatch 'expired' | Out-Null

  $advancedDir = New-CaseDir 'live-base-advanced'
  $advancedPackages = New-GreenPackages -Dir $advancedDir
  $advancedRuns = @(
    (New-Run -Id 100 -Event 'push' -Attempt 1 -CreatedAt '2026-11-04T00:00:00Z' -Jobs (New-SuccessJobs -Attempt 1 -UbuntuId 1001 -WindowsId 1002) -Artifacts (New-SuccessArtifacts -Packages $advancedPackages -Event 'push' -UbuntuId 5001 -WindowsId 5002))
    (New-Run -Id 200 -Event 'pull_request' -Attempt 1 -CreatedAt '2026-11-04T00:01:00Z' -Jobs (New-SuccessJobs -Attempt 1 -UbuntuId 2001 -WindowsId 2002) -Artifacts (New-SuccessArtifacts -Packages $advancedPackages -Event 'pull_request' -UbuntuId 5003 -WindowsId 5004))
  )
  Write-Evidence -Dir $advancedDir -Evidence (New-Evidence -Runs $advancedRuns -Commits $commits -LiveBase $script:Other -LiveBaseAfter $script:Other)
  $advanced = Assert-Case -Label 'live-base-advanced' -Result (Invoke-Proof -Dir $advancedDir) -Code 1 -Verdict 'FAIL' -ReasonMatch 'live target tip'
  if ([string]$advanced.proofScope -ne 'current' -or [string]$advanced.runs.pull_request.jobs.ubuntu.artifact.archiveSha256 -eq '') {
    Fail 'live-base-advanced dropped current scope or archive diagnostics'
  }
  Assert-Case -Label 'live-base-advanced-skip' -Result (Invoke-Proof -Dir $advancedDir -SkipArtifacts) -Code 1 -Verdict 'FAIL' -ReasonMatch 'live target tip' | Out-Null

  $movingDir = New-CaseDir 'live-base-moved'
  $movingPackages = New-GreenPackages -Dir $movingDir
  $movingRuns = @(
    (New-Run -Id 100 -Event 'push' -Attempt 1 -CreatedAt '2026-11-04T00:00:00Z' -Jobs (New-SuccessJobs -Attempt 1 -UbuntuId 1001 -WindowsId 1002) -Artifacts (New-SuccessArtifacts -Packages $movingPackages -Event 'push' -UbuntuId 5001 -WindowsId 5002))
    (New-Run -Id 200 -Event 'pull_request' -Attempt 1 -CreatedAt '2026-11-04T00:01:00Z' -Jobs (New-SuccessJobs -Attempt 1 -UbuntuId 2001 -WindowsId 2002) -Artifacts (New-SuccessArtifacts -Packages $movingPackages -Event 'pull_request' -UbuntuId 5003 -WindowsId 5004))
  )
  Write-Evidence -Dir $movingDir -Evidence (New-Evidence -Runs $movingRuns -Commits $commits -LiveBase $script:Base -LiveBaseAfter $script:Other)
  Assert-Case -Label 'live-base-moved' -Result (Invoke-Proof -Dir $movingDir) -Code 1 -Verdict 'FAIL' -ReasonMatch 'live target ref changed' | Out-Null

  $match = Assert-Case -Label 'live-base-match' -Result (Invoke-Proof -Dir $greenDir) -Code 0 -Verdict 'PASS'
  if ([string]$match.proofScope -ne 'current' -or $match.currentReady -ne $true -or [string]$match.liveBase -ne $script:Base) {
    Fail "live-base-match scope was $($match.proofScope) liveBase=$($match.liveBase)"
  }

  $historicalDir = New-CaseDir 'historical-merged'
  $historicalPackages = New-GreenPackages -Dir $historicalDir
  $historicalRuns = @(
    (New-Run -Id 100 -Event 'push' -Attempt 1 -CreatedAt '2026-11-04T00:00:00Z' -Jobs (New-SuccessJobs -Attempt 1 -UbuntuId 1001 -WindowsId 1002) -Artifacts (New-SuccessArtifacts -Packages $historicalPackages -Event 'push' -UbuntuId 5001 -WindowsId 5002))
    (New-Run -Id 200 -Event 'pull_request' -Attempt 1 -CreatedAt '2026-11-04T00:01:00Z' -Jobs (New-SuccessJobs -Attempt 1 -UbuntuId 2001 -WindowsId 2002) -Artifacts (New-SuccessArtifacts -Packages $historicalPackages -Event 'pull_request' -UbuntuId 5003 -WindowsId 5004))
  )
  Write-Evidence -Dir $historicalDir -Evidence (New-Evidence -Runs $historicalRuns -Commits $commits -State 'merged' -LiveBase $script:Other -LiveBaseAfter $script:Other)
  $historical = Assert-Case -Label 'historical-merged' -Result (Invoke-Proof -Dir $historicalDir) -Code 0 -Verdict 'PASS'
  $historicalLimits = @($historical.limitations)
  if ([string]$historical.proofScope -ne 'historical' -or $historical.currentReady -eq $true -or ($historicalLimits -notcontains 'historical merged snapshot; not current pull-request readiness')) {
    Fail "historical-merged scope was $($historical.proofScope) currentReady=$($historical.currentReady)"
  }

  $missing = Invoke-Proof -Dir $greenDir -NoFixture
  if ($missing.Code -eq 0 -or $missing.Lines[0] -notmatch '^-PullRequest is required|PullRequest is required') {
    Fail "missing pull request was not rejected: $($missing.Lines -join ' | ') stderr=$($missing.Stderr)"
  }
  Write-Host 'pr-proof fixture missing-pull-request: FAIL'

  Write-Host 'pr-proof fixtures: passed'
} finally {
  if (Test-Path -LiteralPath $script:Work) {
    Remove-Item -LiteralPath $script:Work -Recurse -Force -ErrorAction SilentlyContinue
  }
}
