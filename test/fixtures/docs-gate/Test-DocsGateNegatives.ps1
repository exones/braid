# Proves the docs gate fails closed, then deletes the disposable repository.
# Four cases: broken relative link, broken anchor, CR line ending, trailing
# whitespace. CR and trailing whitespace are shown in the index blob and,
# separately, in the worktree, because an empty worktree diff cannot see a
# bad blob and a clean blob cannot see a local edit.
# An untracked Markdown file with a broken link must not fail the gate.
# Does not call scripts/Verify.ps1.
#Requires -Version 7.6
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
Set-StrictMode -Version Latest

$script:ToolRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../..'))
$script:Gate = Join-Path $script:ToolRoot 'scripts/Test-DocsGate.ps1'
$script:Work = Join-Path ([System.IO.Path]::GetTempPath()) ("braid-docs-gate-" + [guid]::NewGuid().ToString('n'))

function Fail {
  param([Parameter(Mandatory = $true)][string]$Message)
  [Console]::Error.WriteLine("docs-gate negatives failed: $Message")
  exit 1
}

function Write-Utf8 {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][byte[]]$Bytes
  )
  $directory = Split-Path -Parent $Path
  if (-not (Test-Path -LiteralPath $directory)) {
    New-Item -ItemType Directory -Path $directory | Out-Null
  }
  [System.IO.File]::WriteAllBytes($Path, $Bytes)
}

function Convert-ToLfBytes {
  param([Parameter(Mandatory = $true)][string]$Text)
  $normalized = $Text.Replace("`r`n", "`n").Replace("`r", "`n")
  $encoding = [System.Text.UTF8Encoding]::new($false)
  return $encoding.GetBytes($normalized)
}

function Invoke-GitQuiet {
  param([Parameter(Mandatory = $true)][string[]]$GitArguments)
  & git -C $script:Work @GitArguments
  if ($LASTEXITCODE -ne 0) {
    Fail "git $($GitArguments -join ' ') exited $LASTEXITCODE"
  }
}

function Invoke-Gate {
  param([string]$Root = $script:Work)
  $lines = @(& pwsh -NoProfile -File $script:Gate -RepositoryRoot $Root -ToolRoot $script:ToolRoot 2>&1)
  return [pscustomobject]@{
    Code = $LASTEXITCODE
    Text = ((@($lines) | ForEach-Object { "$_" }) -join "`n")
  }
}

function Assert-Passes {
  param(
    [Parameter(Mandatory = $true)][string]$Label,
    [string]$Root = $script:Work
  )
  $result = Invoke-Gate -Root $Root
  if ($result.Code -ne 0 -or $result.Text -notmatch 'docs-gate: passed') {
    Fail "$Label should pass (exit $($result.Code)): $($result.Text)"
  }
  Write-Host "docs-gate negative ${Label}: passed"
}

function Assert-Fails {
  param(
    [Parameter(Mandatory = $true)][string]$Label,
    [Parameter(Mandatory = $true)][string]$Pattern
  )
  $result = Invoke-Gate
  if ($result.Code -eq 0) {
    Fail "$Label passed unexpectedly: $($result.Text)"
  }
  if ($result.Text -notmatch $Pattern) {
    Fail "$Label failed without /$Pattern/ (exit $($result.Code)): $($result.Text)"
  }
  Write-Host "docs-gate negative ${Label}: failed as required (exit $($result.Code))"
}

function Reset-Fixture {
  if (Test-Path -LiteralPath $script:Work) {
    Remove-Item -LiteralPath $script:Work -Recurse -Force
  }
  New-Item -ItemType Directory -Path $script:Work | Out-Null
  Invoke-GitQuiet -GitArguments @('init', '-q')
  Invoke-GitQuiet -GitArguments @('config', 'core.autocrlf', 'false')
  Invoke-GitQuiet -GitArguments @('config', 'core.safecrlf', 'false')
  $attributes = @(
    '* text=auto eol=lf',
    '*.png binary',
    ''
  ) -join "`n"
  Write-Utf8 -Path (Join-Path $script:Work '.gitattributes') -Bytes (Convert-ToLfBytes $attributes)
  $hello = @(
    '# Hello',
    '',
    'See [there](other.md#there).',
    ''
  ) -join "`n"
  $other = @(
    '# There',
    '',
    'Text.',
    ''
  ) -join "`n"
  Write-Utf8 -Path (Join-Path $script:Work 'hello.md') -Bytes (Convert-ToLfBytes $hello)
  Write-Utf8 -Path (Join-Path $script:Work 'other.md') -Bytes (Convert-ToLfBytes $other)
  Write-Utf8 -Path (Join-Path $script:Work 'sample.txt') -Bytes (Convert-ToLfBytes "ok`n")
  Write-Utf8 -Path (Join-Path $script:Work 'pixel.png') -Bytes ([byte[]](0, 13, 10))
  Invoke-GitQuiet -GitArguments @('add', '--', '.gitattributes', 'hello.md', 'other.md', 'sample.txt', 'pixel.png')
}

function Set-IndexBlob {
  param(
    [Parameter(Mandatory = $true)][string]$RelativePath,
    [Parameter(Mandatory = $true)][byte[]]$Bytes
  )
  # hash-object on a worktree path applies the eol=lf clean filter and would
  # drop CR before the blob exists. --stdin stores the bytes unchanged.
  $start = [System.Diagnostics.ProcessStartInfo]::new()
  $start.FileName = 'git'
  $start.WorkingDirectory = $script:Work
  $start.UseShellExecute = $false
  $start.RedirectStandardInput = $true
  $start.RedirectStandardOutput = $true
  $start.RedirectStandardError = $true
  $start.CreateNoWindow = $true
  foreach ($argument in @('-C', $script:Work, 'hash-object', '-w', '--stdin')) {
    $start.ArgumentList.Add($argument)
  }
  $process = [System.Diagnostics.Process]::Start($start)
  $process.StandardInput.BaseStream.Write($Bytes, 0, $Bytes.Length)
  $process.StandardInput.Close()
  $sha = $process.StandardOutput.ReadToEnd().Trim()
  $errorText = $process.StandardError.ReadToEnd()
  $process.WaitForExit()
  if ($process.ExitCode -ne 0 -or [string]::IsNullOrWhiteSpace($sha)) {
    Fail "git hash-object --stdin exited $($process.ExitCode): $errorText"
  }
  Invoke-GitQuiet -GitArguments @('update-index', '--add', '--cacheinfo', "100644,$sha,$RelativePath")
}

function Assert-CrossDriveBaseline {
  if (-not $IsWindows) {
    Write-Host 'docs-gate negative cross-drive: skipped on this OS'
    return
  }
  $used = @((Get-PSDrive -PSProvider FileSystem).Name)
  $letter = @('X', 'Y', 'Z', 'W', 'V', 'U', 'T', 'S', 'R') | Where-Object { $used -notcontains $_ } | Select-Object -First 1
  if (-not $letter) {
    Fail 'no free drive letter for the cross-drive fixture'
  }
  & subst "${letter}:" $script:Work
  if ($LASTEXITCODE -ne 0) {
    Fail "subst ${letter}: failed"
  }
  try {
    Assert-Passes -Label 'cross-drive-baseline' -Root "${letter}:\"
  } finally {
    & subst "${letter}:" /d | Out-Null
  }
}

try {
  Reset-Fixture
  Assert-Passes -Label 'baseline'
  Assert-CrossDriveBaseline

  $untracked = Join-Path $script:Work 'untracked.md'
  Write-Utf8 -Path $untracked -Bytes (Convert-ToLfBytes "# Hidden`n`n[missing](missing.md)`n")
  Assert-Passes -Label 'untracked-broken-link'
  Remove-Item -LiteralPath $untracked -Force

  $brokenLink = @(
    '# Hello',
    '',
    'See [there](other.md#there).',
    '',
    '[gone](missing.md)',
    ''
  ) -join "`n"
  Write-Utf8 -Path (Join-Path $script:Work 'hello.md') -Bytes (Convert-ToLfBytes $brokenLink)
  Invoke-GitQuiet -GitArguments @('add', '--', 'hello.md')
  Assert-Fails -Label 'broken-link' -Pattern 'broken link in hello\.md:.*missing\.md'

  Reset-Fixture
  $brokenAnchor = @(
    '# Hello',
    '',
    'See [missing](other.md#missing-heading).',
    ''
  ) -join "`n"
  Write-Utf8 -Path (Join-Path $script:Work 'hello.md') -Bytes (Convert-ToLfBytes $brokenAnchor)
  Invoke-GitQuiet -GitArguments @('add', '--', 'hello.md')
  Assert-Fails -Label 'broken-anchor' -Pattern 'broken link in hello\.md:.*missing-heading'

  Reset-Fixture
  $crBytes = [System.Text.UTF8Encoding]::new($false).GetBytes("crlf line`r`n")
  $lfBytes = Convert-ToLfBytes "crlf line`n"
  Set-IndexBlob -RelativePath 'sample.txt' -Bytes $crBytes
  Write-Utf8 -Path (Join-Path $script:Work 'sample.txt') -Bytes $lfBytes
  Assert-Fails -Label 'crlf-index' -Pattern 'CR line ending in index blob sample\.txt'
  Write-Utf8 -Path (Join-Path $script:Work 'sample.txt') -Bytes $lfBytes
  Invoke-GitQuiet -GitArguments @('add', '--', 'sample.txt')
  Write-Utf8 -Path (Join-Path $script:Work 'sample.txt') -Bytes $crBytes
  Assert-Fails -Label 'crlf-worktree' -Pattern 'CR line ending in worktree sample\.txt'

  Reset-Fixture
  $spaceBytes = Convert-ToLfBytes "hello `n"
  $cleanBytes = Convert-ToLfBytes "hello`n"
  Set-IndexBlob -RelativePath 'sample.txt' -Bytes $spaceBytes
  Write-Utf8 -Path (Join-Path $script:Work 'sample.txt') -Bytes $cleanBytes
  Assert-Fails -Label 'trailing-index' -Pattern 'trailing whitespace in index blob sample\.txt'
  Write-Utf8 -Path (Join-Path $script:Work 'sample.txt') -Bytes $cleanBytes
  Invoke-GitQuiet -GitArguments @('add', '--', 'sample.txt')
  Write-Utf8 -Path (Join-Path $script:Work 'sample.txt') -Bytes $spaceBytes
  Assert-Fails -Label 'trailing-worktree' -Pattern 'trailing whitespace in worktree sample\.txt'

  Write-Host 'docs-gate negatives: all four cases failed as required'
} finally {
  if (Test-Path -LiteralPath $script:Work) {
    Remove-Item -LiteralPath $script:Work -Recurse -Force -ErrorAction SilentlyContinue
  }
}
