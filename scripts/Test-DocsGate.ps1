# Offline docs gate for tracked Markdown links and tracked text.
# Links: remark-validate-links through unified-engine, with the engine cwd set
# to the repository being scanned. Options live in .remarkrc.mjs (repository
# false, so external URLs are not checked; inspiration/ is skipped). The
# remark-cli binary is not pointed at absolute paths outside that root:
# on Windows its ignore helper throws when path.relative crosses drives.
# Frozen paths in scripts/markdown-link-exclusions.json are closed records
# whose links are not validated; their text is still checked.
# Skills: a relative link in .agents/skills/<name>/ must stay inside that
# folder, because skills are installed elsewhere and used from other projects.
# The braid skills (braid and braid-*) are installed together by
# scripts/Install-Skills.ps1, so they may also link to each other.
# Text: `git grep` over index blobs and over the worktree. An empty
# `git diff --check` is not this check; a clean checkout still has to fail when
# a blob contains CR or trailing whitespace.
# Does not call scripts/Verify.ps1 or npm run verify.
#Requires -Version 7.6
[CmdletBinding()]
param(
  [string]$RepositoryRoot,
  [string]$ToolRoot
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
Set-StrictMode -Version Latest

$script:ToolRoot = if ([string]::IsNullOrWhiteSpace($ToolRoot)) {
  [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
} else {
  [System.IO.Path]::GetFullPath($ToolRoot)
}
$script:RepoRoot = if ([string]::IsNullOrWhiteSpace($RepositoryRoot)) {
  $script:ToolRoot
} else {
  [System.IO.Path]::GetFullPath($RepositoryRoot)
}

function Write-GateFailure {
  param([Parameter(Mandatory = $true)][string]$Message)
  [Console]::Error.WriteLine("docs-gate: $Message")
}

function Exit-Gate {
  param([Parameter(Mandatory = $true)][int]$Code)
  exit $Code
}

function Invoke-Git {
  param(
    [Parameter(Mandatory = $true)][string[]]$GitArguments,
    [int[]]$AllowedExitCodes = @(0)
  )
  $start = [System.Diagnostics.ProcessStartInfo]::new()
  $start.FileName = 'git'
  $start.WorkingDirectory = $script:RepoRoot
  $start.UseShellExecute = $false
  $start.RedirectStandardOutput = $true
  $start.RedirectStandardError = $true
  $start.CreateNoWindow = $true
  $start.ArgumentList.Add('-C')
  $start.ArgumentList.Add($script:RepoRoot)
  foreach ($argument in $GitArguments) {
    $start.ArgumentList.Add($argument)
  }
  $process = [System.Diagnostics.Process]::Start($start)
  $errorTask = $process.StandardError.ReadToEndAsync()
  $stdout = [System.IO.MemoryStream]::new()
  $process.StandardOutput.BaseStream.CopyTo($stdout)
  $process.WaitForExit()
  $errorText = $errorTask.GetAwaiter().GetResult()
  if ($process.ExitCode -notin $AllowedExitCodes) {
    Write-GateFailure "git $($GitArguments -join ' ') exited $($process.ExitCode): $errorText"
    Exit-Gate -Code $process.ExitCode
  }
  return [System.Text.Encoding]::UTF8.GetString($stdout.ToArray())
}

function Get-IndexFiles {
  $raw = [string](Invoke-Git -GitArguments @('ls-files', '--stage', '-z'))
  $records = @($raw -split "`0" | Where-Object { $_ -ne '' })
  $files = [System.Collections.Generic.List[object]]::new()
  foreach ($record in $records) {
    if ($record -notmatch '^(\d+) ([0-9a-f]+) (\d+)\t(.+)$') {
      Write-GateFailure "cannot parse git index record: $record"
      Exit-Gate -Code 1
    }
    $stage = [int]$Matches[3]
    if ($stage -ne 0) {
      Write-GateFailure "unmerged index path $($Matches[4])"
      Exit-Gate -Code 1
    }
    $mode = $Matches[1]
    if ($mode -ne '100644' -and $mode -ne '100755') {
      continue
    }
    $files.Add([pscustomobject]@{
        Mode = $mode
        Sha = $Matches[2]
        Path = ($Matches[4] -replace '\\', '/')
      })
  }
  return $files
}

# CR and trailing whitespace in tracked text, found by git itself. -I skips
# binary files and the pathspec skips files whose text attribute is unset.
# --cached reads index blobs; without it git reads the worktree bytes.
function Get-TextFindings {
  param([string[]]$Source = @())
  $label = if ($Source -contains '--cached') { 'index blob' } else { 'worktree' }
  # The --no- flags keep a user's git config out of the output.
  $grep = @('grep', '--no-color', '--no-column', '--no-recurse-submodules') + $Source + @('-I', '-z', '-P')
  $paths = @('--', '.', ':(exclude,attr:-text)')
  # git grep exits 1 when nothing matches.
  $cr = Invoke-Git -GitArguments ($grep + @('-l', '-e', '\r') + $paths) -AllowedExitCodes 0, 1
  foreach ($path in ($cr -split "`0" | Where-Object { $_ -ne '' })) {
    "CR line ending in $label $path"
  }
  $trailing = Invoke-Git -GitArguments ($grep + @('-n', '-e', '[ \t]\r?$') + $paths) -AllowedExitCodes 0, 1
  # One record per line, path NUL line number NUL content.
  $trailing -split "`n" | Where-Object { $_.Contains("`0") } |
    Group-Object { $_.Split("`0")[0] } -CaseSensitive |
    ForEach-Object {
      $suffix = if ($_.Count -eq 1) { '1 line' } else { "$($_.Count) lines" }
      "trailing whitespace in $label $($_.Name):$($_.Group[0].Split("`0")[1]) ($suffix)"
    }
}

function Get-RepoRelative {
  param([Parameter(Mandatory = $true)][string]$Reported)
  $candidate = $Reported.Trim()
  if (-not [System.IO.Path]::IsPathRooted($candidate)) {
    return ($candidate -replace '\\', '/')
  }
  $full = [System.IO.Path]::GetFullPath($candidate)
  $rootFull = [System.IO.Path]::GetFullPath($script:RepoRoot).TrimEnd('\', '/')
  $prefix = $rootFull + [System.IO.Path]::DirectorySeparatorChar
  if ($full.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    return ($full.Substring($prefix.Length) -replace '\\', '/')
  }
  return ($candidate -replace '\\', '/')
}

function Test-Frozen {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][AllowEmptyCollection()][string[]]$Frozen
  )
  foreach ($entry in $Frozen) {
    if ($entry.EndsWith('/')) {
      if ($Path.StartsWith($entry, [System.StringComparison]::Ordinal)) {
        return $true
      }
    } elseif ($Path -ceq $entry) {
      return $true
    }
  }
  return $false
}

function Get-LinkFindings {
  param([Parameter(Mandatory = $true)][AllowEmptyCollection()][string[]]$Frozen)
  $markdown = @()
  foreach ($file in (Get-IndexFiles)) {
    if ($file.Path -like '*.md' -and $file.Path -notlike 'inspiration/*' -and $file.Path -ne 'inspiration' -and -not (Test-Frozen -Path $file.Path -Frozen $Frozen)) {
      $markdown += $file.Path
    }
  }
  if ($markdown.Count -eq 0) {
    return @()
  }

  . (Join-Path $script:ToolRoot 'scripts/Install-NodeToolchain.ps1')
  $bin = Resolve-BraidNodeToolchain
  $node = Join-Path $bin $(if ($IsWindows) { 'node.exe' } else { 'node' })
  $checker = Join-Path $script:ToolRoot 'scripts/check-markdown-links.mjs'
  $plugin = Join-Path $script:ToolRoot 'node_modules/remark-validate-links/package.json'
  $engine = Join-Path $script:ToolRoot 'node_modules/unified-engine/package.json'
  foreach ($required in @($node, $checker, $plugin, $engine)) {
    if (-not (Test-Path -LiteralPath $required)) {
      Write-GateFailure "missing $required. Run npm ci from the repository root."
      Exit-Gate -Code 1
    }
  }

  $arguments = [System.Collections.Generic.List[string]]::new()
  $arguments.Add($checker)
  $arguments.Add($script:RepoRoot)

  $start = [System.Diagnostics.ProcessStartInfo]::new()
  $start.FileName = $node
  $start.WorkingDirectory = $script:ToolRoot
  $start.UseShellExecute = $false
  $start.RedirectStandardInput = $true
  $start.RedirectStandardOutput = $true
  $start.RedirectStandardError = $true
  $start.CreateNoWindow = $true
  foreach ($argument in $arguments) {
    $start.ArgumentList.Add($argument)
  }
  $process = [System.Diagnostics.Process]::Start($start)
  $errorTask = $process.StandardError.ReadToEndAsync()
  # The Markdown list goes on standard input: it can exceed the Windows command-line limit.
  try {
    $process.StandardInput.Write(($markdown -join "`n") + "`n")
    $process.StandardInput.Close()
  } catch [System.IO.IOException] {
    # The checker exited early; its exit code and stderr are reported below.
  }
  $stdout = $process.StandardOutput.ReadToEnd()
  $process.WaitForExit()
  $errorText = $errorTask.GetAwaiter().GetResult()
  if ($process.ExitCode -ne 0) {
    Write-GateFailure "markdown link check exited $($process.ExitCode)"
    if (-not [string]::IsNullOrWhiteSpace($errorText)) {
      [Console]::Error.WriteLine($errorText)
    }
    if (-not [string]::IsNullOrWhiteSpace($stdout)) {
      [Console]::Error.WriteLine($stdout)
    }
    Exit-Gate -Code $process.ExitCode
  }

  $parsed = @()
  if (-not [string]::IsNullOrWhiteSpace($stdout)) {
    $parsed = @($stdout | ConvertFrom-Json)
  }
  $findings = [System.Collections.Generic.List[object]]::new()
  foreach ($item in $parsed) {
    if ($null -eq $item) {
      continue
    }
    $findings.Add([pscustomobject]@{
        Source = Get-RepoRelative -Reported ([string]$item.file)
        Reason = [string]$item.reason
      })
  }
  return @($findings.ToArray())
}

function Get-LinkConfig {
  $config = [pscustomobject]@{ Frozen = @(); Exclusions = @() }
  $path = Join-Path $script:RepoRoot 'scripts/markdown-link-exclusions.json'
  if (-not (Test-Path -LiteralPath $path)) {
    return $config
  }
  $parsed = Get-Content -LiteralPath $path -Raw -Encoding utf8 | ConvertFrom-Json
  if ($parsed.version -ne 2) {
    Write-GateFailure "scripts/markdown-link-exclusions.json version must be 2"
    Exit-Gate -Code 1
  }
  if ($parsed.PSObject.Properties.Name -contains 'frozen' -and $parsed.frozen) {
    $config.Frozen = @($parsed.frozen | ForEach-Object {
        $entry = [string]$_
        if ([string]::IsNullOrWhiteSpace($entry) -or $entry.StartsWith('/') -or $entry.Contains('\')) {
          Write-GateFailure "frozen entry must be a repository-relative path with forward slashes: '$entry'"
          Exit-Gate -Code 1
        }
        $entry
      })
  }
  if ($parsed.PSObject.Properties.Name -contains 'exclusions' -and $parsed.exclusions) {
    $config.Exclusions = @($parsed.exclusions)
    foreach ($entry in $config.Exclusions) {
      foreach ($field in @('source', 'reasonIncludes', 'because')) {
        if ([string]::IsNullOrWhiteSpace([string]$entry.$field)) {
          Write-GateFailure "a link exclusion is missing $field"
          Exit-Gate -Code 1
        }
      }
    }
  }
  return $config
}

function Add-SkillContainmentFindings {
  param([Parameter(Mandatory = $true)][AllowEmptyCollection()][System.Collections.Generic.List[string]]$Findings)
  $linkPattern = '\]\(\s*<?([^)\s>]+)|^\s*\[[^\]]+\]:\s*<?([^\s>]+)'
  foreach ($file in (Get-IndexFiles)) {
    if ($file.Path -notmatch '^\.agents/skills/([^/]+)/.+\.md$') {
      continue
    }
    $skillName = $Matches[1]
    $skillsRoot = [System.IO.Path]::GetFullPath((Join-Path $script:RepoRoot '.agents/skills'))
    $skillRoot = Join-Path $skillsRoot $skillName
    $family = '^braid(-[a-z0-9-]+)?$'
    $fullPath = Join-Path $script:RepoRoot $file.Path
    if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
      continue
    }
    $text = [System.IO.File]::ReadAllText($fullPath)
    foreach ($match in [regex]::Matches($text, $linkPattern, [System.Text.RegularExpressions.RegexOptions]::Multiline)) {
      $target = if ($match.Groups[1].Success) { $match.Groups[1].Value } else { $match.Groups[2].Value }
      if ($target -match '^[A-Za-z][A-Za-z0-9+.-]*:' -or $target.StartsWith('#')) {
        continue
      }
      $relative = ($target -split '[#?]', 2)[0]
      if ([string]::IsNullOrEmpty($relative)) {
        continue
      }
      $resolved = [System.IO.Path]::GetFullPath((Join-Path (Split-Path -Parent $fullPath) $relative))
      $inside = $resolved.Equals($skillRoot, [System.StringComparison]::OrdinalIgnoreCase) -or
        $resolved.StartsWith($skillRoot + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)
      if (-not $inside -and $skillName -cmatch $family -and
        $resolved.StartsWith($skillsRoot + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
        $sibling = $resolved.Substring($skillsRoot.Length + 1).Split([char[]]@('\', '/'))
        $inside = $sibling.Count -gt 1 -and $sibling[0] -cmatch $family
      }
      if (-not $inside) {
        $Findings.Add("skill link leaves its folder in $($file.Path): $target")
      }
    }
  }
}

$failures = [System.Collections.Generic.List[string]]::new()
Add-SkillContainmentFindings -Findings $failures
$linkConfig = Get-LinkConfig
$linkFindings = @(Get-LinkFindings -Frozen ([string[]]$linkConfig.Frozen))
$exclusions = @($linkConfig.Exclusions)
$exclusionHits = @{}
for ($index = 0; $index -lt $exclusions.Count; $index++) {
  $exclusionHits[$index] = 0
}
foreach ($finding in $linkFindings) {
  $reason = $finding.Reason.Replace('\', '/')
  $matched = @()
  for ($index = 0; $index -lt $exclusions.Count; $index++) {
    $entry = $exclusions[$index]
    $source = ([string]$entry.source).Replace('\', '/')
    if ($finding.Source -eq $source -and $reason.Contains([string]$entry.reasonIncludes)) {
      $matched += $index
    }
  }
  if ($matched.Count -eq 1) {
    $exclusionHits[$matched[0]]++
    continue
  }
  if ($matched.Count -gt 1) {
    $failures.Add("ambiguous link exclusion for $($finding.Source): $($finding.Reason)")
    continue
  }
  $failures.Add("broken link in $($finding.Source): $($finding.Reason)")
}
for ($index = 0; $index -lt $exclusions.Count; $index++) {
  $hits = [int]$exclusionHits[$index]
  if ($hits -ne 1) {
    $entry = $exclusions[$index]
    $failures.Add("link exclusion for $($entry.source) ($($entry.reasonIncludes)) matched $hits findings; expected 1")
  }
}

$indexFindings = @(Get-TextFindings -Source '--cached')
# A worktree finding that repeats the index one says nothing new.
$worktreeFindings = @(Get-TextFindings | Where-Object { $indexFindings -cnotcontains ($_ -replace ' in worktree ', ' in index blob ') })
foreach ($finding in ($indexFindings + $worktreeFindings)) {
  $failures.Add($finding)
}

if ($failures.Count -gt 0) {
  foreach ($failure in $failures) {
    Write-GateFailure $failure
  }
  Exit-Gate -Code 1
}

Write-Output "docs-gate: passed suppressed=$($linkFindings.Count) exclusions=$($exclusions.Count) frozen=$($linkConfig.Frozen.Count) text=$(@(Get-IndexFiles).Count)"
Exit-Gate -Code 0
