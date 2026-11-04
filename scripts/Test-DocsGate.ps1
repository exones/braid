# Offline docs gate for tracked Markdown links and tracked text.
# Links: remark-validate-links through unified-engine, with the engine cwd set
# to the repository being scanned. Options live in .remarkrc.mjs (repository
# false, so external URLs are not checked; inspiration/ is skipped). The
# remark-cli binary is not pointed at absolute paths outside that root:
# on Windows its ignore helper throws when path.relative crosses drives.
# Text: index blobs and worktree bytes. An empty `git diff --check` is not
# this check; a clean checkout still has to fail when a blob contains CR
# or trailing whitespace.
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
    [switch]$Bytes
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
  if ($process.ExitCode -ne 0) {
    Write-GateFailure "git $($GitArguments -join ' ') exited $($process.ExitCode): $errorText"
    Exit-Gate -Code $process.ExitCode
  }
  if ($Bytes) {
    return $stdout.ToArray()
  }
  return [System.Text.Encoding]::UTF8.GetString($stdout.ToArray())
}

function Read-Exact {
  param(
    [Parameter(Mandatory = $true)][System.IO.Stream]$Stream,
    [Parameter(Mandatory = $true)][int]$Count
  )
  $buffer = [byte[]]::new($Count)
  $offset = 0
  while ($offset -lt $Count) {
    $read = $Stream.Read($buffer, $offset, $Count - $offset)
    if ($read -le 0) {
      Write-GateFailure "git cat-file ended before $Count bytes"
      Exit-Gate -Code 1
    }
    $offset += $read
  }
  return $buffer
}

function Read-AsciiLine {
  param([Parameter(Mandatory = $true)][System.IO.Stream]$Stream)
  $bytes = [System.Collections.Generic.List[byte]]::new()
  while ($true) {
    $next = $Stream.ReadByte()
    if ($next -lt 0) {
      break
    }
    if ($next -eq 10) {
      break
    }
    if ($next -ne 13) {
      $bytes.Add([byte]$next)
    }
  }
  return [System.Text.Encoding]::ASCII.GetString($bytes.ToArray())
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

function Add-AttributeRecords {
  param(
    [Parameter(Mandatory = $true)][hashtable]$Map,
    [Parameter(Mandatory = $true)][string]$Text
  )
  $parts = @($Text -split "`0" | Where-Object { $_ -ne '' })
  if (($parts.Count % 3) -ne 0) {
    Write-GateFailure "git check-attr returned an incomplete record"
    Exit-Gate -Code 1
  }
  for ($index = 0; $index -lt $parts.Count; $index += 3) {
    $Map[$parts[$index] -replace '\\', '/'] = $parts[$index + 2]
  }
}

function Get-TextAttribute {
  param([Parameter(Mandatory = $true)][string[]]$Paths)
  $map = @{}
  if ($Paths.Count -eq 0) {
    return $map
  }
  for ($offset = 0; $offset -lt $Paths.Count; $offset += 40) {
    $end = [Math]::Min($offset + 39, $Paths.Count - 1)
    $batch = @($Paths[$offset..$end])
    $raw = [string](Invoke-Git -GitArguments (@('check-attr', '-z', 'text', '--') + $batch))
    Add-AttributeRecords -Map $map -Text $raw
  }
  return $map
}

function Get-BlobMap {
  param([Parameter(Mandatory = $true)][string[]]$Shas)
  $map = @{}
  if ($Shas.Count -eq 0) {
    return $map
  }
  $start = [System.Diagnostics.ProcessStartInfo]::new()
  $start.FileName = 'git'
  $start.WorkingDirectory = $script:RepoRoot
  $start.UseShellExecute = $false
  $start.RedirectStandardInput = $true
  $start.RedirectStandardOutput = $true
  $start.RedirectStandardError = $true
  $start.CreateNoWindow = $true
  foreach ($argument in @('-C', $script:RepoRoot, 'cat-file', '--batch')) {
    $start.ArgumentList.Add($argument)
  }
  $process = [System.Diagnostics.Process]::Start($start)
  $errorTask = $process.StandardError.ReadToEndAsync()
  $output = $process.StandardOutput.BaseStream
  foreach ($sha in $Shas) {
    $process.StandardInput.WriteLine($sha)
    $process.StandardInput.Flush()
    $header = Read-AsciiLine -Stream $output
    if ($header -notmatch "^$sha blob (\d+)$") {
      Write-GateFailure "git cat-file header for ${sha}: $header"
      Exit-Gate -Code 1
    }
    $size = [int]$Matches[1]
    $body = if ($size -eq 0) { [byte[]]::new(0) } else { Read-Exact -Stream $output -Count $size }
    $newline = $output.ReadByte()
    if ($newline -ne 10) {
      Write-GateFailure "git cat-file blob $sha was not followed by a newline"
      Exit-Gate -Code 1
    }
    $map[$sha] = $body
  }
  $process.StandardInput.Close()
  $process.WaitForExit()
  $errorText = $errorTask.GetAwaiter().GetResult()
  if ($process.ExitCode -ne 0) {
    Write-GateFailure "git cat-file --batch exited $($process.ExitCode): $errorText"
    Exit-Gate -Code $process.ExitCode
  }
  return $map
}

function Test-SameBytes {
  param(
    [Parameter(Mandatory = $true)][byte[]]$Left,
    [Parameter(Mandatory = $true)][byte[]]$Right
  )
  if ($Left.Length -ne $Right.Length) {
    return $false
  }
  for ($index = 0; $index -lt $Left.Length; $index++) {
    if ($Left[$index] -ne $Right[$index]) {
      return $false
    }
  }
  return $true
}

function Get-TextIssue {
  param([Parameter(Mandatory = $true)][AllowEmptyCollection()][byte[]]$Bytes)
  $sawNul = $false
  $sawCr = $false
  $trailingLine = 0
  $trailingCount = 0
  $line = 1
  $lineStart = 0
  for ($index = 0; $index -le $Bytes.Length; $index++) {
    $atEnd = $index -eq $Bytes.Length
    $byte = if ($atEnd) { [byte]10 } else { $Bytes[$index] }
    if (-not $atEnd -and $byte -eq 0) {
      $sawNul = $true
      break
    }
    if (-not $atEnd -and $byte -eq 13) {
      $sawCr = $true
    }
    if ($byte -eq 10) {
      $end = $index
      if ($end -gt $lineStart -and $Bytes[$end - 1] -eq 13) {
        $end--
      }
      if ($end -gt $lineStart) {
        $last = $Bytes[$end - 1]
        if ($last -eq 32 -or $last -eq 9) {
          if ($trailingCount -eq 0) {
            $trailingLine = $line
          }
          $trailingCount++
        }
      }
      if ($atEnd) {
        break
      }
      $line++
      $lineStart = $index + 1
    }
  }
  return [pscustomobject]@{
    Binary = $sawNul
    Cr = $sawCr
    TrailingLine = $trailingLine
    TrailingCount = $trailingCount
  }
}

function Add-TextFindings {
  param(
    [Parameter(Mandatory = $true)][AllowEmptyCollection()][System.Collections.Generic.List[string]]$Findings,
    [Parameter(Mandatory = $true)][string]$Label,
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)]$Issue
  )
  if ($Issue.Binary) {
    return
  }
  if ($Issue.Cr) {
    $Findings.Add("CR line ending in $Label $Path")
  }
  if ($Issue.TrailingCount -gt 0) {
    $suffix = if ($Issue.TrailingCount -eq 1) { '1 line' } else { "$($Issue.TrailingCount) lines" }
    $Findings.Add("trailing whitespace in $Label ${Path}:$($Issue.TrailingLine) ($suffix)")
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

function Get-LinkFindings {
  $markdown = @()
  foreach ($file in (Get-IndexFiles)) {
    if ($file.Path -like '*.md' -and $file.Path -notlike 'inspiration/*' -and $file.Path -ne 'inspiration') {
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
  foreach ($relative in $markdown) {
    $arguments.Add($relative)
  }

  $start = [System.Diagnostics.ProcessStartInfo]::new()
  $start.FileName = $node
  $start.WorkingDirectory = $script:ToolRoot
  $start.UseShellExecute = $false
  $start.RedirectStandardOutput = $true
  $start.RedirectStandardError = $true
  $start.CreateNoWindow = $true
  foreach ($argument in $arguments) {
    $start.ArgumentList.Add($argument)
  }
  $process = [System.Diagnostics.Process]::Start($start)
  $errorTask = $process.StandardError.ReadToEndAsync()
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

function Get-Exclusions {
  $path = Join-Path $script:RepoRoot 'scripts/markdown-link-exclusions.json'
  if (-not (Test-Path -LiteralPath $path)) {
    return @()
  }
  $parsed = Get-Content -LiteralPath $path -Raw -Encoding utf8 | ConvertFrom-Json
  if ($parsed.version -ne 1) {
    Write-GateFailure "scripts/markdown-link-exclusions.json version must be 1"
    Exit-Gate -Code 1
  }
  if (-not $parsed.exclusions) {
    return @()
  }
  $entries = @($parsed.exclusions)
  foreach ($entry in $entries) {
    foreach ($field in @('source', 'reasonIncludes', 'because')) {
      if ([string]::IsNullOrWhiteSpace([string]$entry.$field)) {
        Write-GateFailure "a link exclusion is missing $field"
        Exit-Gate -Code 1
      }
    }
  }
  return $entries
}

$failures = [System.Collections.Generic.List[string]]::new()
$linkFindings = @(Get-LinkFindings)
$exclusions = @(Get-Exclusions)
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

$indexFiles = @(Get-IndexFiles)
$pathList = @($indexFiles | ForEach-Object { $_.Path })
$shaList = @($indexFiles | ForEach-Object { $_.Sha } | Select-Object -Unique)
$attributes = Get-TextAttribute -Paths $pathList
$blobMap = Get-BlobMap -Shas $shaList
foreach ($file in $indexFiles) {
  $attribute = $attributes[$file.Path]
  if ($attribute -eq 'unset') {
    continue
  }
  if (-not $blobMap.ContainsKey($file.Sha)) {
    Write-GateFailure "missing blob for $($file.Path)"
    Exit-Gate -Code 1
  }
  $blob = [byte[]]$blobMap[$file.Sha]
  $blobIssue = Get-TextIssue -Bytes $blob
  if ($blobIssue.Binary) {
    continue
  }
  $workPath = Join-Path $script:RepoRoot ($file.Path -replace '/', [System.IO.Path]::DirectorySeparatorChar)
  $workIssue = $null
  if (Test-Path -LiteralPath $workPath -PathType Leaf) {
    $workBytes = [System.IO.File]::ReadAllBytes($workPath)
    if (-not (Test-SameBytes -Left $blob -Right $workBytes)) {
      $workIssue = Get-TextIssue -Bytes $workBytes
    }
  }
  Add-TextFindings -Findings $failures -Label 'index blob' -Path $file.Path -Issue $blobIssue
  if ($null -ne $workIssue) {
    Add-TextFindings -Findings $failures -Label 'worktree' -Path $file.Path -Issue $workIssue
  }
}

if ($failures.Count -gt 0) {
  foreach ($failure in $failures) {
    Write-GateFailure $failure
  }
  Exit-Gate -Code 1
}

Write-Output "docs-gate: passed suppressed=$($linkFindings.Count) exclusions=$($exclusions.Count) text=$($indexFiles.Count)"
Exit-Gate -Code 0
