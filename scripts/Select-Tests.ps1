# Picks the test files the quick gate (scripts/Verify.ps1) runs, from the import lines.
# Changed files: committed since the merge-base with the item's base branch (the braid
# branch `braid/<number>-<slug>` for a strand branch `braid/<number>/<letter>-<slug>`,
# else origin/main), plus staged, unstaged and untracked files.
# A test is picked when it changed, or imports a changed file directly or through the
# modules it imports. A test that reaches a module only by spawning dist/cli.js is not
# picked for it; the full run in CI covers that.
# Prints the choice and the reasons, and returns one object: Mode `all` (every test),
# `picked` (Tests, possibly none) or `docs` (only docs changed: nothing to build or test).
#Requires -Version 7.6
[CmdletBinding()]
param(
  [string]$RepositoryRoot = (Split-Path -Parent $PSScriptRoot)
)
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
Set-StrictMode -Version Latest

$root = [System.IO.Path]::GetFullPath($RepositoryRoot)

function Invoke-PickerGit {
  param([Parameter(Mandatory = $true)][string[]]$GitArguments)
  $lines = @(& git -C $root -c core.quotepath=false @GitArguments 2>$null)
  return [pscustomobject]@{ Code = $LASTEXITCODE; Lines = $lines }
}

function New-Selection {
  param([string]$Mode, [string[]]$Tests = @(), [string]$Why)
  Write-Host "select-tests: $Why"
  return [pscustomobject]@{ Mode = $Mode; Tests = $Tests; Why = $Why }
}

# The ref the branch started from, or $null with the reason it can't be told.
function Find-Base {
  $branch = "$((Invoke-PickerGit @('branch', '--show-current')).Lines)"
  if ($branch -match '^braid/(\d+)/') {
    $pattern = "braid/$($Matches[1])-*"
    foreach ($namespace in 'refs/remotes/origin', 'refs/heads') {
      $refs = @((Invoke-PickerGit @('for-each-ref', '--format=%(refname)', "$namespace/$pattern")).Lines)
      if ($refs.Count -eq 1) { return [pscustomobject]@{ Ref = $refs[0]; Why = $null } }
      if ($refs.Count -gt 1) { return [pscustomobject]@{ Ref = $null; Why = "several braid branches match $pattern" } }
    }
    return [pscustomobject]@{ Ref = $null; Why = "no braid branch $pattern for strand branch $branch" }
  }
  return [pscustomobject]@{ Ref = 'refs/remotes/origin/main'; Why = $null }
}

# Changed paths, forward slashes. --no-renames keeps the old path of a moved file.
function Get-ChangedFile {
  param([Parameter(Mandatory = $true)][string]$MergeBase)
  $changed = [System.Collections.Generic.SortedSet[string]]::new([System.StringComparer]::Ordinal)
  foreach ($query in @(
      @('diff', '--name-only', '--no-renames', '-z', $MergeBase, 'HEAD'),
      @('diff', '--name-only', '--no-renames', '-z', '--cached'),
      @('diff', '--name-only', '--no-renames', '-z'),
      @('ls-files', '--others', '--exclude-standard', '-z'))) {
    $result = Invoke-PickerGit $query
    if ($result.Code -ne 0) { throw "git $($query -join ' ') exited $($result.Code)" }
    foreach ($path in (($result.Lines -join "`n") -split "`0")) {
      if ($path) { [void]$changed.Add($path) }
    }
  }
  return @($changed)
}

function Get-Kind {
  param([Parameter(Mandatory = $true)][string]$Path)
  if ($Path -cmatch '^(src/cli\.ts|package\.json|package-lock\.json|(.*/)?tsconfig[^/]*\.json)$') { return 'shared' }
  if ($Path -cmatch '^(scripts|test/support|test/fixtures)/') { return 'shared' }
  if ($Path -cmatch '\.md$' -or $Path -cmatch '^(braids|docs)/') { return 'docs' }
  if ($Path -cmatch '^src/.+\.ts$') { return 'module' }
  if ($Path -cmatch '^test/.+\.test\.ts$') { return 'test' }
  return 'unknown'
}

# A relative specifier as a repository path: dist/<p>.js is built from src/<p>.ts, and a
# src module imports its neighbours as ./x.js.
function Resolve-Specifier {
  param([string]$From, [string]$Specifier)
  if ($Specifier -notmatch '^\.\.?/') { return $null }
  # Test helpers resolve load("../../dist/…") from test/support, so the leading dots don't count.
  $bare = $Specifier -replace '^(\.\.?/)+', ''
  if ($bare -cmatch '^(dist|src)/') {
    $path = $bare
  } else {
    $parts = [System.Collections.Generic.List[string]]::new()
    foreach ($part in ((($From -replace '[^/]*$', '') + $Specifier) -split '/')) {
      if ($part -eq '..' -and $parts.Count) { $parts.RemoveAt($parts.Count - 1) }
      elseif ($part -and $part -ne '.' -and $part -ne '..') { $parts.Add($part) }
    }
    $path = $parts -join '/'
  }
  $path = $path -creplace '^dist/', 'src/'
  if ($path -cmatch '^src/') { $path = $path -creplace '\.js$', '.ts' }
  return $path
}

# What a file imports: `import`/`export … from`, `import "x"`, `load("x")`, `import("x")`
# and `new URL("x", …)` of a source module. `import type` and `export type` are skipped:
# they are gone at runtime, and the gate still typechecks everything. new URL of dist/cli.js is how tests spawn the
# CLI, so it doesn't count.
$importPatterns = @(
  '(?m)^\s*(?:import|export)(?!\s+type\b)\b[^''"`;()=]*?\bfrom\s*["'']([^"'']+)["'']',
  '(?m)^\s*import\s*["'']([^"'']+)["'']',
  '\b(?:load|import)\(\s*["'']([^"'']+)["'']'
)
$urlPattern = 'new URL\(\s*["'']((?:\.\.?/)+(?:dist|src)/[^"'']+\.[jt]s)["'']'
$imports = @{}
function Get-Import {
  param([Parameter(Mandatory = $true)][string]$File)
  if ($imports.ContainsKey($File)) { return $imports[$File] }
  $found = [System.Collections.Generic.List[string]]::new()
  $full = Join-Path $root $File
  if (Test-Path -LiteralPath $full -PathType Leaf) {
    $text = [System.IO.File]::ReadAllText($full)
    foreach ($pattern in $importPatterns) {
      foreach ($match in [regex]::Matches($text, $pattern)) {
        $target = Resolve-Specifier $File $match.Groups[1].Value
        if ($target) { $found.Add($target) }
      }
    }
    foreach ($match in [regex]::Matches($text, $urlPattern)) {
      $target = Resolve-Specifier $File $match.Groups[1].Value
      if ($target -cne 'src/cli.ts') { $found.Add($target) }
    }
  }
  $imports[$File] = @($found | Select-Object -Unique)
  return $imports[$File]
}

# The import chain from a test to the nearest changed file, or $null.
function Find-Chain {
  param([string]$Test, [System.Collections.Generic.HashSet[string]]$Changed)
  $from = @{ $Test = $null }
  $queue = [System.Collections.Generic.Queue[string]]::new()
  $queue.Enqueue($Test)
  while ($queue.Count) {
    $file = $queue.Dequeue()
    if ($Changed.Contains($file)) {
      $chain = @($file)
      while ($from[$chain[0]]) { $chain = @($from[$chain[0]]) + $chain }
      return $chain
    }
    foreach ($next in (Get-Import $file)) {
      if (-not $from.ContainsKey($next)) {
        $from[$next] = $file
        $queue.Enqueue($next)
      }
    }
  }
  return $null
}

$base = Find-Base
if (-not $base.Ref) { return New-Selection -Mode all -Why "every test: $($base.Why)" }
$mergeBase = Invoke-PickerGit @('merge-base', 'HEAD', $base.Ref)
if ($mergeBase.Code -ne 0) { return New-Selection -Mode all -Why "every test: no merge-base with $($base.Ref)" }

$changed = @(Get-ChangedFile "$($mergeBase.Lines)")
Write-Host "select-tests: $($changed.Count) changed file(s) since $($base.Ref)"
if (-not $changed.Count) { return New-Selection -Mode all -Why 'every test: nothing changed, so there is nothing to pick from' }

$kinds = @{}
foreach ($path in $changed) { $kinds[$path] = Get-Kind $path }
$broad = @($changed | Where-Object { $kinds[$_] -in 'shared', 'unknown' })
if ($broad.Count) {
  foreach ($path in $broad) {
    Write-Host "  $path ($(if ($kinds[$path] -eq 'shared') { 'shared part' } else { 'not classified' }))"
  }
  return New-Selection -Mode all -Why 'every test: a shared or unclassified file changed'
}
$code = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
foreach ($path in $changed) {
  if ($kinds[$path] -ne 'docs') { [void]$code.Add($path) }
}
if (-not $code.Count) { return New-Selection -Mode docs -Why 'no tests, typecheck or build: only docs changed' }

$testRoot = Join-Path $root 'test'
$all = @()
if (Test-Path -LiteralPath $testRoot) {
  $all = @(Get-ChildItem -LiteralPath $testRoot -Recurse -File -Filter '*.test.ts' |
      ForEach-Object { [System.IO.Path]::GetRelativePath($root, $_.FullName).Replace('\', '/') } |
      Where-Object { $_ -cnotmatch '^test/(fixtures|support)/' } |
      Sort-Object)
}
$picked = [System.Collections.Generic.List[string]]::new()
foreach ($test in $all) {
  $chain = Find-Chain $test $code
  if ($null -eq $chain) { continue }
  $picked.Add($test)
  $reason = if (@($chain).Count -eq 1) { 'changed' } else { "imports $(@($chain)[1..(@($chain).Count - 1)] -join ' -> ')" }
  Write-Host "  $test ($reason)"
}
return New-Selection -Mode picked -Tests $picked.ToArray() -Why "$($picked.Count) of $($all.Count) test file(s) import the changed code"
