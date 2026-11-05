# Disposable-repository proof for the read-only workspace binding helper.
# Uses temporary roots only. Does not read or write the live checkout.
# Does not call scripts/Verify.ps1.
#Requires -Version 7.6
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
Set-StrictMode -Version Latest

$script:ToolRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../..'))
$script:Helper = Join-Path $script:ToolRoot 'scripts/Test-WorkspaceBinding.ps1'
$script:Work = Join-Path ([System.IO.Path]::GetTempPath()) ("braid binding " + [guid]::NewGuid().ToString('n'))
$script:Scratch = Join-Path $script:Work 'scratch'
$script:CaseName = 'setup'
$script:CaseCount = 0
$script:Failed = $false
$script:MatchElapsed = [System.Collections.Generic.List[int]]::new()
$script:Url = 'https://example.test/repo.git'
$script:Secret = 'binding-secret-7f3a'
$script:OtherSecret = 'binding-other-secret-91c'

function Fail {
  param([Parameter(Mandatory = $true)][string]$Message)
  $script:Failed = $true
  [Console]::Error.WriteLine("workspace-binding fixture failed: $($script:CaseName): $Message")
  exit 1
}

function Invoke-Case {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][scriptblock]$Body
  )
  $script:CaseName = $Name
  $script:CaseCount++
  & $Body
}

function Start-Captured {
  param(
    [Parameter(Mandatory = $true)][string]$FileName,
    [Parameter(Mandatory = $true)][string[]]$Arguments,
    [hashtable]$Environment
  )
  $start = [System.Diagnostics.ProcessStartInfo]::new()
  $start.FileName = $FileName
  $start.UseShellExecute = $false
  $start.CreateNoWindow = $true
  $start.RedirectStandardOutput = $true
  $start.RedirectStandardError = $true
  $start.WorkingDirectory = $script:Scratch
  $utf8 = [System.Text.UTF8Encoding]::new($false)
  $start.StandardOutputEncoding = $utf8
  $start.StandardErrorEncoding = $utf8
  foreach ($argument in $Arguments) { $start.ArgumentList.Add($argument) }
  if ($null -ne $Environment) {
    foreach ($key in @($Environment.Keys)) {
      $start.Environment[$key] = [string]$Environment[$key]
    }
  }
  $process = [System.Diagnostics.Process]::Start($start)
  return [pscustomobject]@{
    Process = $process
    StdoutTask = $process.StandardOutput.ReadToEndAsync()
    StderrTask = $process.StandardError.ReadToEndAsync()
  }
}

function Complete-Captured {
  param($Captured, [int]$TimeoutMilliseconds, [string]$Label)
  if (-not $Captured.Process.WaitForExit($TimeoutMilliseconds)) {
    try { $Captured.Process.Kill($true) } catch { }
    Fail "$Label timed out"
  }
  return [pscustomobject]@{
    Code = $Captured.Process.ExitCode
    Stdout = $Captured.StdoutTask.GetAwaiter().GetResult()
    Stderr = $Captured.StderrTask.GetAwaiter().GetResult()
  }
}

function Invoke-Git {
  param(
    [Parameter(Mandatory = $true)][string]$Root,
    [Parameter(Mandatory = $true)][string[]]$Arguments,
    [switch]$AllowFail
  )
  $captured = Start-Captured -FileName 'git' -Arguments (@('-C', $Root) + $Arguments)
  $result = Complete-Captured $captured 30000 "git $($Arguments -join ' ')"
  if ((-not $AllowFail) -and $result.Code -ne 0) {
    Fail "git $($Arguments -join ' ') exited $($result.Code): $($result.Stderr)"
  }
  return $result
}

function Invoke-Checker {
  param(
    [Parameter(Mandatory = $true)][string]$Root,
    [Parameter(Mandatory = $true)][string]$ContractPath,
    [hashtable]$Environment,
    [int]$TimeoutMilliseconds = 30000
  )
  if ([System.IO.Path]::IsPathFullyQualified($Root)) {
    $live = [System.IO.Path]::GetFullPath($script:ToolRoot).TrimEnd('\', '/')
    $candidate = [System.IO.Path]::GetFullPath($Root).TrimEnd('\', '/')
    $comparison = if ($IsWindows) { [System.StringComparison]::OrdinalIgnoreCase } else { [System.StringComparison]::Ordinal }
    if ([string]::Equals($live, $candidate, $comparison)) {
      Fail 'refusing to point the helper at the live checkout'
    }
  }
  $captured = Start-Captured -FileName 'pwsh' -Arguments @(
    '-NoProfile', '-File', $script:Helper, '-ContractPath', $ContractPath, '-RepositoryRoot', $Root
  ) -Environment $Environment
  return Complete-Captured $captured $TimeoutMilliseconds 'checker'
}

function Write-Contract {
  param($Value, [string]$Name = 'contract.json')
  $path = Join-Path $script:Scratch $Name
  $json = ($Value | ConvertTo-Json -Depth 12).Replace("`r`n", "`n").Replace("`r", "`n")
  [System.IO.File]::WriteAllText($path, $json + "`n", [System.Text.UTF8Encoding]::new($false))
  return $path
}

function Write-Raw {
  param([Parameter(Mandatory = $true)][string]$Name, [AllowEmptyString()][string]$Text)
  $path = Join-Path $script:Scratch $Name
  $normalized = $Text.Replace("`r`n", "`n").Replace("`r", "`n")
  [System.IO.File]::WriteAllText($path, $normalized, [System.Text.UTF8Encoding]::new($false))
  return $path
}

function Write-Bytes {
  param([Parameter(Mandatory = $true)][string]$Path, [Parameter(Mandatory = $true)][string]$Text)
  $directory = Split-Path -Parent $Path
  if (-not [string]::IsNullOrEmpty($directory)) {
    [System.IO.Directory]::CreateDirectory($directory) | Out-Null
  }
  [System.IO.File]::WriteAllBytes($Path, [System.Text.UTF8Encoding]::new($false).GetBytes($Text))
}

function New-Origin {
  param([string]$Fetch, [string]$Push = $Fetch)
  return [ordered]@{ fetch = $Fetch; push = $Push }
}

function New-Entry {
  param([string]$Xy, [string]$Path, [string]$OriginalPath)
  $entry = [ordered]@{ xy = $Xy; path = $Path }
  if ($PSBoundParameters.ContainsKey('OriginalPath')) { $entry.originalPath = $OriginalPath }
  return $entry
}

function New-BindingContract {
  param(
    [string]$Phase = 'initial',
    [string]$Root,
    $Branch,
    [string]$Head,
    $Origin,
    $Upstream,
    [bool]$Clean = $true,
    $Entries,
    [string]$LaunchHead,
    [string]$CandidateHead,
    [string]$PacketRevision
  )
  $worktree = [ordered]@{ clean = $Clean }
  if (-not $Clean) { $worktree.entries = $Entries }
  $contract = [ordered]@{
    schemaVersion = 1
    phase = $Phase
    expected = [ordered]@{
      repositoryRoot = $Root
      branch = $Branch
      head = $Head
      origin = $Origin
      upstream = $Upstream
      worktree = $worktree
    }
  }
  if ($Phase -eq 'resume') { $contract.launchHead = $LaunchHead }
  if ($Phase -eq 'review') {
    $contract.candidateHead = $CandidateHead
    $contract.packetRevision = $PacketRevision
  }
  return $contract
}

function New-Repo {
  param([Parameter(Mandatory = $true)][string]$Name)
  $root = [System.IO.Path]::GetFullPath((Join-Path $script:Work $Name))
  [System.IO.Directory]::CreateDirectory($root) | Out-Null
  Invoke-Git $root @('init', '-b', 'main') | Out-Null
  Invoke-Git $root @('config', 'user.email', 'binding-test@example.test') | Out-Null
  Invoke-Git $root @('config', 'user.name', 'Binding Test') | Out-Null
  Invoke-Git $root @('config', 'commit.gpgsign', 'false') | Out-Null
  Invoke-Git $root @('config', 'tag.gpgsign', 'false') | Out-Null
  Invoke-Git $root @('config', 'core.autocrlf', 'false') | Out-Null
  return $root
}

function Add-Commit {
  param([string]$Root, [string]$Message)
  Invoke-Git $Root @('add', '--all') | Out-Null
  Invoke-Git $Root @('commit', '-m', $Message) | Out-Null
}

function Get-Head {
  param([string]$Root)
  return (Invoke-Git $Root @('rev-parse', 'HEAD')).Stdout.Trim()
}

function Get-Manifest {
  param([string]$Root)
  $fullRoot = [System.IO.Path]::GetFullPath($Root)
  $files = [System.IO.Directory]::GetFiles($fullRoot, '*', [System.IO.SearchOption]::AllDirectories)
  $lines = [System.Collections.Generic.List[string]]::new()
  foreach ($file in $files) {
    $relative = $file.Substring($fullRoot.Length).TrimStart('\', '/')
    $bytes = [System.IO.File]::ReadAllBytes($file)
    $hash = [System.Security.Cryptography.SHA256]::HashData($bytes)
    $lines.Add($relative + '|' + $bytes.Length + '|' + [System.Convert]::ToHexString($hash))
  }
  $lines.Sort([System.StringComparer]::Ordinal)
  return ($lines -join "`n")
}

function Assert-SameManifest {
  param([string]$Before, [string]$After)
  if ($Before -eq $After) { return }
  $left = $Before -split "`n", -1
  $right = $After -split "`n", -1
  $count = [Math]::Max($left.Count, $right.Count)
  for ($i = 0; $i -lt $count; $i++) {
    $leftLine = if ($i -lt $left.Count) { $left[$i] } else { '<missing>' }
    $rightLine = if ($i -lt $right.Count) { $right[$i] } else { '<missing>' }
    if ($leftLine -ne $rightLine) { Fail "repository bytes changed: $leftLine -> $rightLine" }
  }
  Fail 'repository bytes changed'
}

function ConvertFrom-Checker {
  param($Run)
  if ([string]::IsNullOrWhiteSpace($Run.Stdout)) {
    Fail "checker produced no stdout. exit=$($Run.Code) stderr=$($Run.Stderr)"
  }
  try {
    return $Run.Stdout | ConvertFrom-Json -Depth 30 -AsHashtable
  } catch {
    Fail "checker stdout is not one JSON object. exit=$($Run.Code) stdout=$($Run.Stdout) stderr=$($Run.Stderr)"
  }
}

function Assert-Result {
  param($Run, [int]$Code, [string]$Outcome)
  $json = ConvertFrom-Checker $Run
  if ($Run.Code -ne $Code -or $json.outcome -ne $Outcome) {
    Fail "exit $($Run.Code) outcome $($json.outcome); expected $Code $Outcome. stderr=$($Run.Stderr)"
  }
  if ($Run.Stderr -notmatch 'workspace-binding:') {
    Fail "stderr missing diagnostic: $($Run.Stderr)"
  }
  if ($Outcome -eq 'match') { $script:MatchElapsed.Add([int]$json.elapsedMilliseconds) }
  return $json
}

function Assert-NoSecret {
  param($Run)
  foreach ($secret in @($script:Secret, $script:OtherSecret)) {
    if ($Run.Stdout.Contains($secret) -or $Run.Stderr.Contains($secret)) {
      Fail "credential leaked: $secret"
    }
  }
}

function Get-MismatchFields {
  param($Json)
  $fields = [System.Collections.Generic.List[string]]::new()
  foreach ($item in @($Json.mismatches)) {
    if ($null -ne $item) { $fields.Add([string]$item.field) }
  }
  return $fields
}

function Assert-ReadsAreLocal {
  param($Json, [bool]$ExpectUpstreamLiteral)
  $allowed = @('rev-parse', 'symbolic-ref', 'remote', 'for-each-ref', 'status')
  $sawUpstream = $false
  $sawStatusZ = $false
  foreach ($argv in @($Json.gitReads)) {
    $tokens = @($argv)
    $index = 0
    while ($index -lt $tokens.Count -and $tokens[$index].StartsWith('-')) {
      if ($tokens[$index] -eq '-C') { $index += 2 } else { $index++ }
    }
    if ($index -ge $tokens.Count) { Fail 'git read is missing a command' }
    $command = [string]$tokens[$index]
    if ($allowed -notcontains $command) { Fail "unexpected git command $command" }
    if ($command -eq 'remote' -and ($index + 1) -lt $tokens.Count -and [string]$tokens[$index + 1] -ne 'get-url') {
      Fail "unexpected remote subcommand $($tokens[$index + 1])"
    }
    if ($command -eq 'status' -and @($tokens) -contains '--porcelain=v1' -and @($tokens) -contains '-z') {
      $sawStatusZ = $true
    }
    foreach ($token in $tokens) {
      if ([string]$token -eq '@{upstream}') { $sawUpstream = $true }
    }
  }
  if (-not $sawStatusZ) { Fail 'status was not read as NUL-safe porcelain' }
  if ($ExpectUpstreamLiteral -ne $sawUpstream) {
    Fail "upstream literal present=$sawUpstream expected=$ExpectUpstreamLiteral"
  }
}

function New-CleanContract {
  param([string]$Root, [string]$Head, $Branch = 'main', $Origin = (New-Origin $script:Url), $Upstream = $null)
  return New-BindingContract -Root $Root -Branch $Branch -Head $Head -Origin $Origin -Upstream $Upstream -Clean $true
}

[System.IO.Directory]::CreateDirectory($script:Work) | Out-Null
[System.IO.Directory]::CreateDirectory($script:Scratch) | Out-Null

try {
  Invoke-Case 'clean-match' {
    $root = New-Repo 'clean'
    Invoke-Git $root @('commit', '--allow-empty', '-m', 'init') | Out-Null
    Invoke-Git $root @('remote', 'add', 'origin', $script:Url) | Out-Null
    $head = Get-Head $root
    $before = Get-Manifest $root
    $contract = Write-Contract (New-CleanContract -Root $root -Head $head) 'clean contract.json'
    $run = Invoke-Checker $root $contract
    $json = Assert-Result $run 0 'match'
    Assert-ReadsAreLocal $json $true
    if ($json.schemaVersion -ne 1 -or $json.phase -ne 'initial' -or $json.drift -or $json.context.launchHead) {
      Fail 'match result shape is wrong'
    }
    if ($run.Stdout -notmatch '"checkedAt": "\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z"') {
      Fail "checkedAt is not UTC: $($run.Stdout)"
    }
    if ($json.actual.branch -ne 'main' -or $json.actual.head -ne $head -or $json.actual.upstream) {
      Fail 'identity fields did not match the clean repository'
    }
    if ($json.actual.origin.fetch -ne $script:Url -or $json.actual.origin.push -ne $script:Url) {
      Fail 'origin URLs were normalized or dropped'
    }
    if (-not $json.actual.worktree.clean -or @($json.actual.worktree.entries).Count -ne 0) {
      Fail 'clean worktree was reported dirty'
    }
    $again = Invoke-Checker $root $contract
    Assert-Result $again 0 'match' | Out-Null
    Assert-SameManifest $before (Get-Manifest $root)
    $script:CleanRoot = $root
    $script:CleanHead = $head
  }

  Invoke-Case 'path-canonical-match' {
    $variant = $script:CleanRoot.TrimEnd('\', '/') + [System.IO.Path]::DirectorySeparatorChar
    if ($IsWindows) {
      $variant = $variant.Substring(0, 1).ToLowerInvariant() + $variant.Substring(1)
      $variant = $variant.Replace('\', '/')
    }
    $before = Get-Manifest $script:CleanRoot
    $contract = Write-Contract (New-CleanContract -Root $variant -Head $script:CleanHead)
    $run = Invoke-Checker $script:CleanRoot $contract
    Assert-Result $run 0 'match' | Out-Null
    Assert-SameManifest $before (Get-Manifest $script:CleanRoot)
  }

  Invoke-Case 'wrong-head-and-branch' {
    $before = Get-Manifest $script:CleanRoot
    $wrongHead = $script:CleanHead.Substring(0, 39) + $(if ($script:CleanHead.EndsWith('a')) { 'b' } else { 'a' })
    $headContract = Write-Contract (New-CleanContract -Root $script:CleanRoot -Head $wrongHead) 'wrong-head.json'
    $headRun = Invoke-Checker $script:CleanRoot $headContract
    $headJson = Assert-Result $headRun 1 'mismatch'
    if ((Get-MismatchFields $headJson) -notcontains 'head') { Fail 'wrong HEAD was not named' }
    $branchContract = Write-Contract (New-CleanContract -Root $script:CleanRoot -Head $script:CleanHead -Branch 'other') 'wrong-branch.json'
    $branchRun = Invoke-Checker $script:CleanRoot $branchContract
    $branchJson = Assert-Result $branchRun 1 'mismatch'
    if ((Get-MismatchFields $branchJson) -notcontains 'branch') { Fail 'wrong branch was not named' }
    Assert-SameManifest $before (Get-Manifest $script:CleanRoot)
  }

  Invoke-Case 'subdirectory-is-not-root' {
    $sub = Join-Path $script:CleanRoot 'sub dir'
    [System.IO.Directory]::CreateDirectory($sub) | Out-Null
    $before = Get-Manifest $script:CleanRoot
    $contract = Write-Contract (New-CleanContract -Root $script:CleanRoot -Head $script:CleanHead)
    $run = Invoke-Checker $sub $contract
    $json = Assert-Result $run 1 'mismatch'
    if ((Get-MismatchFields $json) -notcontains 'invocationRoot') { Fail 'subdirectory was accepted as the root' }
    Assert-SameManifest $before (Get-Manifest $script:CleanRoot)
  }

  Invoke-Case 'unexpected-dirty-preserved' {
    $root = New-Repo 'unexpected'
    Invoke-Git $root @('commit', '--allow-empty', '-m', 'init') | Out-Null
    Invoke-Git $root @('remote', 'add', 'origin', $script:Url) | Out-Null
    $note = Join-Path $root 'user note.txt'
    Write-Bytes $note 'keep this'
    $head = Get-Head $root
    $before = Get-Manifest $root
    $contract = Write-Contract (New-CleanContract -Root $root -Head $head)
    $run = Invoke-Checker $root $contract
    $json = Assert-Result $run 1 'mismatch'
    if ((Get-MismatchFields $json) -notcontains 'worktree.entries') { Fail 'unexpected file was not reported' }
    if ([System.IO.File]::ReadAllText($note) -ne 'keep this') { Fail 'unexpected file was edited or removed' }
    Assert-SameManifest $before (Get-Manifest $root)
  }

  Invoke-Case 'resume-owned-dirty' {
    $root = New-Repo 'resume'
    Invoke-Git $root @('commit', '--allow-empty', '-m', 'init') | Out-Null
    Invoke-Git $root @('remote', 'add', 'origin', $script:Url) | Out-Null
    Write-Bytes (Join-Path $root 'dir name/ünicode file.txt') 'unicode'
    Write-Bytes (Join-Path $root 'M file.txt') 'literal name'
    $head = Get-Head $root
    $launch = 'b' * 40
    $entries = @(
      (New-Entry '??' 'M file.txt'),
      (New-Entry '??' 'dir name/ünicode file.txt')
    )
    $before = Get-Manifest $root
    $contract = Write-Contract (New-BindingContract -Phase 'resume' -Root $root -Branch 'main' -Head $head -Origin (New-Origin $script:Url) -Upstream $null -Clean $false -Entries $entries -LaunchHead $launch)
    $run = Invoke-Checker $root $contract
    $json = Assert-Result $run 0 'match'
    if ($json.context.launchHead -ne $launch -or $json.actual.head -eq $launch) {
      Fail 'resume rewound toward launchHead or dropped it'
    }
    Assert-ReadsAreLocal $json $true
    Assert-SameManifest $before (Get-Manifest $root)
    if ((Get-Head $root) -ne $head) { Fail 'resume changed HEAD' }
  }

  Invoke-Case 'staged-unstaged-untracked' {
    $root = New-Repo 'mixed'
    Write-Bytes (Join-Path $root 'tracked.txt') 'one'
    Add-Commit $root 'tracked'
    Write-Bytes (Join-Path $root 'tracked.txt') 'two'
    Write-Bytes (Join-Path $root 'staged.txt') 'staged'
    Invoke-Git $root @('add', '--', 'staged.txt') | Out-Null
    Write-Bytes (Join-Path $root 'new file.txt') 'new'
    Invoke-Git $root @('remote', 'add', 'origin', $script:Url) | Out-Null
    $head = Get-Head $root
    $entries = @(
      (New-Entry 'A ' 'staged.txt'),
      (New-Entry ' M' 'tracked.txt'),
      (New-Entry '??' 'new file.txt')
    )
    $before = Get-Manifest $root
    $contract = Write-Contract (New-BindingContract -Root $root -Branch 'main' -Head $head -Origin (New-Origin $script:Url) -Upstream $null -Clean $false -Entries $entries)
    $run = Invoke-Checker $root $contract
    Assert-Result $run 0 'match' | Out-Null
    $partial = @(
      (New-Entry 'A ' 'staged.txt'),
      (New-Entry '??' 'new file.txt')
    )
    $partialContract = Write-Contract (New-BindingContract -Root $root -Branch 'main' -Head $head -Origin (New-Origin $script:Url) -Upstream $null -Clean $false -Entries $partial) 'partial.json'
    $partialRun = Invoke-Checker $root $partialContract
    Assert-Result $partialRun 1 'mismatch' | Out-Null
    Assert-SameManifest $before (Get-Manifest $root)
  }

  Invoke-Case 'rename-space' {
    $root = New-Repo 'rename'
    Write-Bytes (Join-Path $root 'old.txt') 'body'
    Add-Commit $root 'old'
    Invoke-Git $root @('mv', '--', 'old.txt', 'new name.txt') | Out-Null
    Invoke-Git $root @('remote', 'add', 'origin', $script:Url) | Out-Null
    $head = Get-Head $root
    $entries = @((New-Entry 'R ' 'new name.txt' 'old.txt'))
    $before = Get-Manifest $root
    $contract = Write-Contract (New-BindingContract -Root $root -Branch 'main' -Head $head -Origin (New-Origin $script:Url) -Upstream $null -Clean $false -Entries $entries)
    $run = Invoke-Checker $root $contract
    Assert-Result $run 0 'match' | Out-Null
    Assert-SameManifest $before (Get-Manifest $root)
  }

  Invoke-Case 'arrow-rename' {
    $root = New-Repo 'arrow'
    $from = if ($IsWindows) { 'from - old.txt' } else { 'from -> old.txt' }
    $to = if ($IsWindows) { 'to - new.txt' } else { 'to -> new.txt' }
    Write-Bytes (Join-Path $root $from) 'body'
    Add-Commit $root 'old'
    Invoke-Git $root @('mv', '--', $from, $to) | Out-Null
    Write-Bytes (Join-Path $root 'next file.txt') 'next'
    Invoke-Git $root @('remote', 'add', 'origin', $script:Url) | Out-Null
    $head = Get-Head $root
    $entries = @(
      (New-Entry 'R ' $to $from),
      (New-Entry '??' 'next file.txt')
    )
    $before = Get-Manifest $root
    $contract = Write-Contract (New-BindingContract -Root $root -Branch 'main' -Head $head -Origin (New-Origin $script:Url) -Upstream $null -Clean $false -Entries $entries)
    $run = Invoke-Checker $root $contract
    $json = Assert-Result $run 0 'match'
    $paths = @(@($json.actual.worktree.entries) | ForEach-Object { [string]$_.path })
    if ($paths -notcontains $to -or $paths -notcontains 'next file.txt') {
      Fail "NUL parser rewrote rename paths: $($paths -join ' | ')"
    }
    Assert-SameManifest $before (Get-Manifest $root)
  }

  Invoke-Case 'unmerged' {
    $root = New-Repo 'conflict'
    Write-Bytes (Join-Path $root 'file.txt') 'base'
    Add-Commit $root 'base'
    Invoke-Git $root @('checkout', '-b', 'side') | Out-Null
    Write-Bytes (Join-Path $root 'file.txt') 'side'
    Add-Commit $root 'side'
    Invoke-Git $root @('checkout', 'main') | Out-Null
    Write-Bytes (Join-Path $root 'file.txt') 'main'
    Add-Commit $root 'main'
    Invoke-Git $root @('merge', 'side') -AllowFail | Out-Null
    Invoke-Git $root @('remote', 'add', 'origin', $script:Url) | Out-Null
    $head = Get-Head $root
    $entries = @((New-Entry 'UU' 'file.txt'))
    $before = Get-Manifest $root
    $contract = Write-Contract (New-BindingContract -Root $root -Branch 'main' -Head $head -Origin (New-Origin $script:Url) -Upstream $null -Clean $false -Entries $entries)
    $run = Invoke-Checker $root $contract
    Assert-Result $run 0 'match' | Out-Null
    Assert-SameManifest $before (Get-Manifest $root)
    if (-not (Test-Path -LiteralPath (Join-Path $root '.git/MERGE_HEAD'))) {
      Fail 'conflict state was cleaned up'
    }
  }

  Invoke-Case 'ignored-stays-clean' {
    $root = New-Repo 'ignored'
    Write-Bytes (Join-Path $root '.gitignore') "ignored.txt`n"
    Add-Commit $root 'ignore'
    Invoke-Git $root @('remote', 'add', 'origin', $script:Url) | Out-Null
    Write-Bytes (Join-Path $root 'ignored.txt') 'hidden'
    $head = Get-Head $root
    $before = Get-Manifest $root
    $contract = Write-Contract (New-CleanContract -Root $root -Head $head)
    $run = Invoke-Checker $root $contract
    Assert-Result $run 0 'match' | Out-Null
    Assert-SameManifest $before (Get-Manifest $root)
  }

  Invoke-Case 'detached' {
    $root = New-Repo 'detached'
    Invoke-Git $root @('commit', '--allow-empty', '-m', 'init') | Out-Null
    Invoke-Git $root @('remote', 'add', 'origin', $script:Url) | Out-Null
    Invoke-Git $root @('checkout', '--detach') | Out-Null
    $head = Get-Head $root
    $before = Get-Manifest $root
    $contract = Write-Contract (New-CleanContract -Root $root -Head $head -Branch $null)
    $run = Invoke-Checker $root $contract
    $json = Assert-Result $run 0 'match'
    Assert-ReadsAreLocal $json $false
    if ($json.actual.branch -or $json.actual.upstream) { Fail 'detached HEAD gained a branch or upstream' }
    $attached = Write-Contract (New-CleanContract -Root $root -Head $head -Branch 'main') 'attached.json'
    $attachedRun = Invoke-Checker $root $attached
    $attachedJson = Assert-Result $attachedRun 1 'mismatch'
    if ((Get-MismatchFields $attachedJson) -notcontains 'branch') { Fail 'detached checkout matched an attached branch' }
    Assert-SameManifest $before (Get-Manifest $root)
  }

  Invoke-Case 'linked-worktree' {
    $main = New-Repo 'linked-main'
    Invoke-Git $main @('commit', '--allow-empty', '-m', 'init') | Out-Null
    Invoke-Git $main @('remote', 'add', 'origin', $script:Url) | Out-Null
    $linked = [System.IO.Path]::GetFullPath((Join-Path $script:Work 'linked checkout'))
    Invoke-Git $main @('worktree', 'add', '--detach', $linked) | Out-Null
    $head = Get-Head $linked
    $linkedBefore = Get-Manifest $linked
    $mainBefore = Get-Manifest $main
    $linkedContract = Write-Contract (New-CleanContract -Root $linked -Head $head -Branch $null) 'linked.json'
    $linkedRun = Invoke-Checker $linked $linkedContract
    $linkedJson = Assert-Result $linkedRun 0 'match'
    $common = [string]$linkedJson.actual.gitCommonDir
    $mainContract = Write-Contract (New-CleanContract -Root $main -Head (Get-Head $main)) 'main-root.json'
    $confused = Invoke-Checker $linked $mainContract
    $confusedJson = Assert-Result $confused 1 'mismatch'
    if ((Get-MismatchFields $confusedJson) -notcontains 'repositoryRoot') {
      Fail 'linked worktree was accepted as the main root'
    }
    if ([string]$confusedJson.actual.gitCommonDir -ne $common) {
      Fail 'common directory was not reported for the linked worktree'
    }
    Assert-SameManifest $linkedBefore (Get-Manifest $linked)
    Assert-SameManifest $mainBefore (Get-Manifest $main)
  }

  Invoke-Case 'origin-urls' {
    $absent = New-Repo 'no-origin'
    Invoke-Git $absent @('commit', '--allow-empty', '-m', 'init') | Out-Null
    $absentHead = Get-Head $absent
    $absentBefore = Get-Manifest $absent
    $absentContract = Write-Contract (New-CleanContract -Root $absent -Head $absentHead -Origin $null)
    Assert-Result (Invoke-Checker $absent $absentContract) 0 'match' | Out-Null
    $present = Write-Contract (New-CleanContract -Root $absent -Head $absentHead) 'expects-origin.json'
    $presentRun = Invoke-Checker $absent $present
    $presentJson = Assert-Result $presentRun 1 'mismatch'
    if ((Get-MismatchFields $presentJson) -notcontains 'origin') { Fail 'missing origin was treated as present' }
    Assert-SameManifest $absentBefore (Get-Manifest $absent)

    $root = New-Repo 'origins'
    Invoke-Git $root @('commit', '--allow-empty', '-m', 'init') | Out-Null
    Invoke-Git $root @('remote', 'add', 'origin', $script:Url) | Out-Null
    Invoke-Git $root @('remote', 'set-url', '--push', 'origin', 'https://example.test/push.git') | Out-Null
    $head = Get-Head $root
    $before = Get-Manifest $root
    $slash = Write-Contract (New-CleanContract -Root $root -Head $head -Origin (New-Origin ($script:Url + '/'))) 'slash.json'
    $slashJson = Assert-Result (Invoke-Checker $root $slash) 1 'mismatch'
    if ((Get-MismatchFields $slashJson) -notcontains 'origin.fetch') { Fail 'trailing slash was normalized away' }
    $caseUrl = 'https://Example.test/repo.git'
    $caseContract = Write-Contract (New-CleanContract -Root $root -Head $head -Origin (New-Origin $caseUrl $caseUrl)) 'case.json'
    $caseJson = Assert-Result (Invoke-Checker $root $caseContract) 1 'mismatch'
    if ((Get-MismatchFields $caseJson) -notcontains 'origin.fetch') { Fail 'URL case was normalized' }
    $pushContract = Write-Contract (New-CleanContract -Root $root -Head $head -Origin (New-Origin $script:Url $script:Url)) 'push.json'
    $pushJson = Assert-Result (Invoke-Checker $root $pushContract) 1 'mismatch'
    if ((Get-MismatchFields $pushJson) -notcontains 'origin.push') { Fail 'fetch and push were treated as one URL' }
    $exact = Write-Contract (New-CleanContract -Root $root -Head $head -Origin (New-Origin $script:Url 'https://example.test/push.git')) 'exact-push.json'
    Assert-Result (Invoke-Checker $root $exact) 0 'match' | Out-Null
    Assert-SameManifest $before (Get-Manifest $root)
  }

  Invoke-Case 'credentials-scrubbed' {
    $root = New-Repo 'credentials'
    Invoke-Git $root @('commit', '--allow-empty', '-m', 'init') | Out-Null
    $actualUrl = "https://user:$($script:Secret)@example.test/repo.git"
    $otherUrl = "https://reader:$($script:OtherSecret)@example.test/repo.git"
    Invoke-Git $root @('remote', 'add', 'origin', $actualUrl) | Out-Null
    $head = Get-Head $root
    $before = Get-Manifest $root
    $matchContract = Write-Contract (New-CleanContract -Root $root -Head $head -Origin (New-Origin $actualUrl))
    $matchRun = Invoke-Checker $root $matchContract
    $matchJson = Assert-Result $matchRun 0 'match'
    Assert-NoSecret $matchRun
    if ($matchJson.actual.origin.fetch -ne 'https://***@example.test/repo.git') {
      Fail 'matching credential URL was not scrubbed'
    }
    $differ = Write-Contract (New-CleanContract -Root $root -Head $head -Origin (New-Origin $otherUrl)) 'userinfo.json'
    $differRun = Invoke-Checker $root $differ
    $differJson = Assert-Result $differRun 1 'mismatch'
    Assert-NoSecret $differRun
    $fetch = @($differJson.mismatches) | Where-Object { $_.field -eq 'origin.fetch' } | Select-Object -First 1
    if ($null -eq $fetch -or $fetch.difference -ne 'userinfo') { Fail 'userinfo mismatch was not distinguished' }
    Assert-SameManifest $before (Get-Manifest $root)
  }

  Invoke-Case 'upstream' {
    $root = New-Repo 'upstream'
    Invoke-Git $root @('commit', '--allow-empty', '-m', 'init') | Out-Null
    Invoke-Git $root @('remote', 'add', 'origin', $script:Url) | Out-Null
    $head = Get-Head $root
    $noneBefore = Get-Manifest $root
    $none = Write-Contract (New-CleanContract -Root $root -Head $head)
    $noneRun = Invoke-Checker $root $none
    $noneJson = Assert-Result $noneRun 0 'match'
    Assert-ReadsAreLocal $noneJson $true
    $expects = Write-Contract (New-CleanContract -Root $root -Head $head -Upstream 'refs/remotes/origin/main') 'expects.json'
    $expectsJson = Assert-Result (Invoke-Checker $root $expects) 1 'mismatch'
    if ((Get-MismatchFields $expectsJson) -notcontains 'upstream') { Fail 'absent upstream matched a ref' }
    Assert-SameManifest $noneBefore (Get-Manifest $root)

    Invoke-Git $root @('update-ref', 'refs/remotes/origin/main', $head) | Out-Null
    Invoke-Git $root @('branch', '--set-upstream-to', 'refs/remotes/origin/main') | Out-Null
    $withBefore = Get-Manifest $root
    $with = Write-Contract (New-CleanContract -Root $root -Head $head -Upstream 'refs/remotes/origin/main') 'with.json'
    $withJson = Assert-Result (Invoke-Checker $root $with) 0 'match'
    if ($withJson.actual.upstream -ne 'refs/remotes/origin/main') { Fail 'upstream ref was rewritten' }
    $absent = Write-Contract (New-CleanContract -Root $root -Head $head) 'absent.json'
    $absentJson = Assert-Result (Invoke-Checker $root $absent) 1 'mismatch'
    if ((Get-MismatchFields $absentJson) -notcontains 'upstream') { Fail 'present upstream matched null' }
    $wrong = Write-Contract (New-CleanContract -Root $root -Head $head -Upstream 'refs/remotes/origin/other') 'wrong-upstream.json'
    $wrongJson = Assert-Result (Invoke-Checker $root $wrong) 1 'mismatch'
    if ((Get-MismatchFields $wrongJson) -notcontains 'upstream') { Fail 'wrong upstream ref matched' }
    Assert-SameManifest $withBefore (Get-Manifest $root)
  }

  Invoke-Case 'review-candidate' {
    $root = New-Repo 'review'
    Invoke-Git $root @('commit', '--allow-empty', '-m', 'candidate') | Out-Null
    $candidate = Get-Head $root
    Invoke-Git $root @('commit', '--allow-empty', '-m', 'packet') | Out-Null
    $packet = Get-Head $root
    Invoke-Git $root @('remote', 'add', 'origin', $script:Url) | Out-Null
    Invoke-Git $root @('checkout', '--detach', $candidate) | Out-Null
    $before = Get-Manifest $root
    $match = Write-Contract (New-BindingContract -Phase 'review' -Root $root -Branch $null -Head $candidate -Origin (New-Origin $script:Url) -Upstream $null -Clean $true -CandidateHead $candidate -PacketRevision $packet)
    $matchJson = Assert-Result (Invoke-Checker $root $match) 0 'match'
    if ($matchJson.context.candidateHead -ne $candidate -or $matchJson.context.packetRevision -ne $packet) {
      Fail 'review context dropped the candidate or the packet revision'
    }
    if ($matchJson.context.candidateHead -eq $matchJson.context.packetRevision) {
      Fail 'review fixture failed to keep the two revisions distinct'
    }
    Invoke-Git $root @('checkout', '--detach', $packet) | Out-Null
    $movedBefore = Get-Manifest $root
    $stale = Write-Contract (New-BindingContract -Phase 'review' -Root $root -Branch $null -Head $candidate -Origin (New-Origin $script:Url) -Upstream $null -Clean $true -CandidateHead $candidate -PacketRevision $packet) 'stale.json'
    $staleRun = Invoke-Checker $root $stale
    $staleJson = Assert-Result $staleRun 1 'mismatch'
    if ((Get-MismatchFields $staleJson) -notcontains 'head') { Fail 'packet revision was accepted as the candidate' }
    if ($staleJson.actual.head -ne $packet -or $staleJson.context.candidateHead -ne $candidate) {
      Fail 'review result confused the candidate with the packet revision'
    }
    $invalid = Write-Contract (New-BindingContract -Phase 'review' -Root $root -Branch $null -Head $packet -Origin (New-Origin $script:Url) -Upstream $null -Clean $true -CandidateHead $candidate -PacketRevision $packet) 'invalid-review.json'
    Assert-Result (Invoke-Checker $root $invalid) 2 'invalid' | Out-Null
    Assert-SameManifest $movedBefore (Get-Manifest $root)
  }

  Invoke-Case 'coordinator-and-initial-shape' {
    $before = Get-Manifest $script:CleanRoot
    $coordinator = Write-Contract (New-BindingContract -Phase 'coordinator' -Root $script:CleanRoot -Branch 'main' -Head $script:CleanHead -Origin (New-Origin $script:Url) -Upstream $null -Clean $true)
    Assert-Result (Invoke-Checker $script:CleanRoot $coordinator) 0 'match' | Out-Null
    $extra = New-BindingContract -Phase 'coordinator' -Root $script:CleanRoot -Branch 'main' -Head $script:CleanHead -Origin (New-Origin $script:Url) -Upstream $null -Clean $true
    $extra.candidateHead = $script:CleanHead
    Assert-Result (Invoke-Checker $script:CleanRoot (Write-Contract $extra 'coordinator-extra.json')) 2 'invalid' | Out-Null
    $launch = New-CleanContract -Root $script:CleanRoot -Head $script:CleanHead
    $launch.launchHead = ('c' * 40)
    Assert-Result (Invoke-Checker $script:CleanRoot (Write-Contract $launch 'initial-launch.json')) 2 'invalid' | Out-Null
    Assert-SameManifest $before (Get-Manifest $script:CleanRoot)
  }

  Invoke-Case 'invalid-contracts' {
    $root = $script:CleanRoot
    $head = $script:CleanHead
    $before = Get-Manifest $root
    $samples = @(
      @{ Name = 'broken.json'; Text = '{'; Outcome = 'invalid' },
      @{ Name = 'empty.json'; Text = ''; Outcome = 'invalid' },
      @{ Name = 'array.json'; Text = '[]'; Outcome = 'invalid' },
      @{ Name = 'duplicate.json'; Text = '{"schemaVersion":1,"schemaVersion":1,"phase":"initial"}'; Outcome = 'invalid' },
      @{ Name = 'string-schema.json'; Text = '{"schemaVersion":"1","phase":"initial"}'; Outcome = 'invalid' },
      @{ Name = 'schema-two.json'; Text = '{"schemaVersion":2,"phase":"initial"}'; Outcome = 'invalid' },
      @{ Name = 'bad-phase.json'; Text = '{"schemaVersion":1,"phase":"Review","expected":{}}'; Outcome = 'invalid' }
    )
    foreach ($sample in $samples) {
      $path = Write-Raw $sample.Name $sample.Text
      Assert-Result (Invoke-Checker $root $path) 2 $sample.Outcome | Out-Null
    }
    $relative = New-CleanContract -Root 'repo' -Head $head
    Assert-Result (Invoke-Checker $root (Write-Contract $relative 'relative.json')) 2 'invalid' | Out-Null
    $badUpstream = New-CleanContract -Root $root -Head $head -Upstream 'origin/main'
    Assert-Result (Invoke-Checker $root (Write-Contract $badUpstream 'bad-upstream.json')) 2 'invalid' | Out-Null
    $cleanEntries = New-BindingContract -Root $root -Branch 'main' -Head $head -Origin (New-Origin $script:Url) -Upstream $null -Clean $true
    $cleanEntries.expected.worktree.entries = @((New-Entry '??' 'x'))
    Assert-Result (Invoke-Checker $root (Write-Contract $cleanEntries 'clean-entries.json')) 2 'invalid' | Out-Null
    $dirty = New-BindingContract -Root $root -Branch 'main' -Head $head -Origin (New-Origin $script:Url) -Upstream $null -Clean $false -Entries @()
    Assert-Result (Invoke-Checker $root (Write-Contract $dirty 'dirty-empty.json')) 2 'invalid' | Out-Null
    $rename = New-BindingContract -Root $root -Branch 'main' -Head $head -Origin (New-Origin $script:Url) -Upstream $null -Clean $false -Entries @((New-Entry 'R ' 'new.txt'))
    Assert-Result (Invoke-Checker $root (Write-Contract $rename 'rename.json')) 2 'invalid' | Out-Null
    $copy = New-BindingContract -Root $root -Branch 'main' -Head $head -Origin (New-Origin $script:Url) -Upstream $null -Clean $false -Entries @((New-Entry 'C ' 'copy.txt'))
    Assert-Result (Invoke-Checker $root (Write-Contract $copy 'copy.json')) 2 'invalid' | Out-Null
    $ordinary = New-BindingContract -Root $root -Branch 'main' -Head $head -Origin (New-Origin $script:Url) -Upstream $null -Clean $false -Entries @((New-Entry '??' 'x' 'y'))
    Assert-Result (Invoke-Checker $root (Write-Contract $ordinary 'ordinary-original.json')) 2 'invalid' | Out-Null
    $missingFile = Join-Path $script:Scratch 'missing-contract.json'
    Assert-Result (Invoke-Checker $root $missingFile) 2 'invalid' | Out-Null
    Assert-Result (Invoke-Checker $root $script:Scratch) 2 'invalid' | Out-Null
    $emptyRoot = Write-Contract (New-CleanContract -Root $root -Head $head) 'empty-root.json'
    Assert-Result (Invoke-Checker 'relative-root' $emptyRoot) 2 'invalid' | Out-Null
    $notRepo = Join-Path $script:Work 'not-a-repo'
    [System.IO.Directory]::CreateDirectory($notRepo) | Out-Null
    $notRepoBefore = Get-Manifest $notRepo
    $notRepoContract = Write-Contract (New-CleanContract -Root $notRepo -Head $head) 'not-repo.json'
    Assert-Result (Invoke-Checker $notRepo $notRepoContract) 2 'inspection-failed' | Out-Null
    Assert-SameManifest $notRepoBefore (Get-Manifest $notRepo)
    $big = Join-Path $script:Scratch 'big contract.json'
    [System.IO.File]::WriteAllBytes($big, (New-Object byte[] ((1MB) + 1)))
    Assert-Result (Invoke-Checker $root $big) 2 'invalid' | Out-Null
    $inside = Join-Path $root 'inside-sync'
    [System.IO.Directory]::CreateDirectory($inside) | Out-Null
    $insideBefore = Get-Manifest $root
    $insideRun = Invoke-Checker $root (Write-Contract (New-CleanContract -Root $root -Head $head) 'inside.json') -Environment @{ BRAID_WORKSPACE_BINDING_SYNC_DIR = $inside }
    Assert-Result $insideRun 2 'invalid' | Out-Null
    if (Test-Path -LiteralPath (Join-Path $inside 'ready')) { Fail 'invalid sync directory was written' }
    $relativeSync = Invoke-Checker $root (Write-Contract (New-CleanContract -Root $root -Head $head) 'relative-sync.json') -Environment @{ BRAID_WORKSPACE_BINDING_SYNC_DIR = 'relative-sync' }
    Assert-Result $relativeSync 2 'invalid' | Out-Null
    Assert-SameManifest $insideBefore (Get-Manifest $root)
    Assert-SameManifest $before (Get-Manifest $root)
  }

  Invoke-Case 'failed-git' {
    $root = New-Repo 'git-fail'
    Invoke-Git $root @('commit', '--allow-empty', '-m', 'init') | Out-Null
    Invoke-Git $root @('remote', 'add', 'origin', $script:Url) | Out-Null
    $head = Get-Head $root
    Remove-Item -LiteralPath (Join-Path $root '.git/HEAD')
    $deletedBefore = Get-Manifest $root
    $deleted = Invoke-Checker $root (Write-Contract (New-CleanContract -Root $root -Head $head))
    $deletedJson = Assert-Result $deleted 2 'inspection-failed'
    if ($deletedJson.outcome -eq 'match') { Fail 'a failed HEAD read matched' }
    Assert-SameManifest $deletedBefore (Get-Manifest $root)

    $healthy = New-Repo 'git-exec'
    Invoke-Git $healthy @('commit', '--allow-empty', '-m', 'init') | Out-Null
    $brokenHead = Get-Head $healthy
    Rename-Item -LiteralPath (Join-Path $healthy '.git') -NewName '.git-real'
    [System.IO.File]::WriteAllText((Join-Path $healthy '.git'), "gitdir: $healthy/missing-gitdir`n", [System.Text.UTF8Encoding]::new($false))
    $healthyBefore = Get-Manifest $healthy
    $broken = Invoke-Checker $healthy (Write-Contract (New-CleanContract -Root $healthy -Head $brokenHead -Origin $null))
    $brokenJson = Assert-Result $broken 2 'inspection-failed'
    if (@($brokenJson.failures).Count -lt 1 -or $brokenJson.outcome -eq 'match') {
      Fail 'failed git startup counted as a match'
    }
    Assert-SameManifest $healthyBefore (Get-Manifest $healthy)
  }

  Invoke-Case 'head-drift' {
    $root = New-Repo 'drift-head'
    Invoke-Git $root @('commit', '--allow-empty', '-m', 'init') | Out-Null
    Invoke-Git $root @('remote', 'add', 'origin', $script:Url) | Out-Null
    $head = Get-Head $root
    $sync = Join-Path $script:Work 'sync-head'
    [System.IO.Directory]::CreateDirectory($sync) | Out-Null
    $contract = Write-Contract (New-CleanContract -Root $root -Head $head)
    $captured = Start-Captured -FileName 'pwsh' -Arguments @(
      '-NoProfile', '-File', $script:Helper, '-ContractPath', $contract, '-RepositoryRoot', $root
    ) -Environment @{ BRAID_WORKSPACE_BINDING_SYNC_DIR = $sync }
    $ready = Join-Path $sync 'ready'
    $deadline = [DateTime]::UtcNow.AddSeconds(20)
    while (-not (Test-Path -LiteralPath $ready)) {
      if ($captured.Process.HasExited) {
        $early = Complete-Captured $captured 1000 'early drift checker'
        Fail "checker exited before the sync window: $($early.Stderr)"
      }
      if ([DateTime]::UtcNow -gt $deadline) {
        try { $captured.Process.Kill($true) } catch { }
        Fail 'sync ready timed out'
      }
      Start-Sleep -Milliseconds 15
    }
    Invoke-Git $root @('commit', '--allow-empty', '-m', 'drift') | Out-Null
    $mid = Get-Manifest $root
    [System.IO.File]::WriteAllBytes((Join-Path $sync 'release'), [byte[]]@())
    $run = Complete-Captured $captured 20000 'head drift checker'
    $json = Assert-Result $run 1 'drift'
    if (-not $json.drift.recheckRequired) { Fail 'drift did not require a recheck' }
    $changed = @($json.drift.changes | ForEach-Object { $_.field })
    if ($changed -notcontains 'head') { Fail 'HEAD movement was not reported' }
    Assert-SameManifest $mid (Get-Manifest $root)
  }

  Invoke-Case 'branch-drift' {
    $root = New-Repo 'drift-branch'
    Invoke-Git $root @('commit', '--allow-empty', '-m', 'init') | Out-Null
    Invoke-Git $root @('remote', 'add', 'origin', $script:Url) | Out-Null
    $head = Get-Head $root
    $sync = Join-Path $script:Work 'sync-branch'
    [System.IO.Directory]::CreateDirectory($sync) | Out-Null
    $contract = Write-Contract (New-CleanContract -Root $root -Head $head) 'branch-drift.json'
    $captured = Start-Captured -FileName 'pwsh' -Arguments @(
      '-NoProfile', '-File', $script:Helper, '-ContractPath', $contract, '-RepositoryRoot', $root
    ) -Environment @{ BRAID_WORKSPACE_BINDING_SYNC_DIR = $sync }
    $ready = Join-Path $sync 'ready'
    $deadline = [DateTime]::UtcNow.AddSeconds(20)
    while (-not (Test-Path -LiteralPath $ready)) {
      if ($captured.Process.HasExited) { Fail 'branch drift checker exited before the sync window' }
      if ([DateTime]::UtcNow -gt $deadline) {
        try { $captured.Process.Kill($true) } catch { }
        Fail 'branch sync ready timed out'
      }
      Start-Sleep -Milliseconds 15
    }
    Invoke-Git $root @('checkout', '-b', 'side') | Out-Null
    $mid = Get-Manifest $root
    [System.IO.File]::WriteAllBytes((Join-Path $sync 'release'), [byte[]]@())
    $run = Complete-Captured $captured 20000 'branch drift checker'
    $json = Assert-Result $run 1 'drift'
    $changed = @($json.drift.changes | ForEach-Object { $_.field })
    if ($changed -notcontains 'branch') { Fail 'branch movement was not reported' }
    Assert-SameManifest $mid (Get-Manifest $root)
  }

  Invoke-Case 'quoting-and-passive-evidence' {
    $evidence = Join-Path $script:ToolRoot 'epics/braid/004-performance-optimization/validation/C/startup-probe-001/real-worker-cross-check.json'
    $text = [System.IO.File]::ReadAllText($evidence)
    if ($text -notmatch 'Missing ''='' operator after key in hash literal') {
      Fail 'passive A evidence no longer records the unquoted upstream parse error'
    }
    if ($text -notmatch 'The term ''='' is not recognized') {
      Fail 'passive A evidence no longer records the nested command expansion'
    }
    $upstream = Start-Captured -FileName 'pwsh' -Arguments @(
      '-NoProfile', '-Command', 'git rev-parse --abbrev-ref --symbolic-full-name @{upstream}'
    )
    $upstreamRun = Complete-Captured $upstream 30000 'unquoted upstream probe'
    if ($upstreamRun.Code -eq 0 -or $upstreamRun.Stderr -notmatch 'Missing ''='' operator after key in hash literal') {
      Fail "unquoted @{upstream} did not reproduce the parse error: $($upstreamRun.Stderr)"
    }
    $rootVariable = ''
    $gitVariable = ''
    $expanded = "$rootVariable = 'sentinel-root'; $gitVariable = 'sentinel-git'; Write-Output ROOT=$rootVariable"
    if ($expanded -notmatch '^\s*=') { Fail "the nested expansion fixture no longer strips the variable: $expanded" }
    $nested = Start-Captured -FileName 'pwsh' -Arguments @('-NoProfile', '-Command', $expanded)
    $nestedRun = Complete-Captured $nested 30000 'nested command probe'
    $nestedText = $nestedRun.Stdout + $nestedRun.Stderr
    if ($nestedText -notmatch 'not recognized' -or $nestedRun.Stdout -match 'sentinel-root') {
      Fail "nested command expansion did not strip the assignment ($($nestedRun.Code)): $nestedText"
    }
  }

  Invoke-Case 'supported-route-scenario' {
    $path = Join-Path $script:ToolRoot 'epics/braid/004-performance-optimization/validation/C/supported-route-scenario.json'
    $scenario = [System.IO.File]::ReadAllText($path) | ConvertFrom-Json -AsHashtable
    $expected = @(
      'create-idle-thread-bound-to-named-worktree',
      'host-returns-root-branch-and-full-head',
      'one-initial-send-contains-that-binding',
      'open-packet-pinned-skill-and-agents',
      'one-read-now-batch',
      'one-workspace-binding-invocation',
      'named-first-action'
    )
    $actual = @($scenario.steps)
    if ($actual.Count -ne $expected.Count) { Fail 'supported route step count changed' }
    for ($i = 0; $i -lt $expected.Count; $i++) {
      if ($actual[$i] -ne $expected[$i]) { Fail "step $($i + 1) is $($actual[$i])" }
    }
    foreach ($forbidden in @('heading-search', 'nested-pwsh-command', 'unquoted-at-upstream', 'upstream-repair', 'restart-live-worker')) {
      if (@($scenario.forbiddenBeforeFirstAction) -notcontains $forbidden) { Fail "scenario permits $forbidden" }
    }
    if ($scenario.route -ne 'idle-create-then-one-initial-send' -or [string]$scenario.observed -notmatch 'does not prove') {
      Fail 'scenario claims more than sequencing'
    }
  }

  Invoke-Case 'example-contracts' {
    $names = @('initial', 'resume', 'review', 'coordinator')
    foreach ($name in $names) {
      $path = Join-Path $script:ToolRoot "epics/braid/004-performance-optimization/validation/C/contracts/$name.json"
      $contract = [System.IO.File]::ReadAllText($path) | ConvertFrom-Json -AsHashtable
      foreach ($field in @('repositoryRoot', 'branch', 'head', 'origin', 'upstream', 'worktree')) {
        if (-not $contract.expected.ContainsKey($field)) { Fail "$name example is missing $field" }
      }
      if ($contract.schemaVersion -ne 1) { Fail "$name example schema is not 1" }
      if ($contract.phase -ne $name) { Fail "$name example phase drifted" }
    }
    $resume = [System.IO.File]::ReadAllText((Join-Path $script:ToolRoot 'epics/braid/004-performance-optimization/validation/C/contracts/resume.json')) | ConvertFrom-Json -AsHashtable
    if ($resume.launchHead -eq $resume.expected.head) { Fail 'resume example rewinds to launchHead' }
    $review = [System.IO.File]::ReadAllText((Join-Path $script:ToolRoot 'epics/braid/004-performance-optimization/validation/C/contracts/review.json')) | ConvertFrom-Json -AsHashtable
    if ($review.candidateHead -ne $review.expected.head -or $review.packetRevision -eq $review.candidateHead) {
      Fail 'review example confuses the candidate with the packet revision'
    }
  }
} finally {
  if (-not $script:Failed) {
    Remove-Item -LiteralPath $script:Work -Recurse -Force -ErrorAction SilentlyContinue
  } else {
    [Console]::Error.WriteLine("workspace-binding fixture left $($script:Work)")
  }
}

if ($script:Failed) { exit 1 }
$minimum = 0
$maximum = 0
if ($script:MatchElapsed.Count -gt 0) {
  $sorted = $script:MatchElapsed.ToArray()
  [Array]::Sort($sorted)
  $minimum = $sorted[0]
  $maximum = $sorted[$sorted.Count - 1]
}
Write-Host "workspace-binding fixture: cases=$($script:CaseCount) matchElapsedMs=$minimum-$maximum matchCount=$($script:MatchElapsed.Count)"
exit 0
