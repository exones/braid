# Coordinator records-only push gate: commit range plus index/worktree/untracked scope,
# then the existing offline Markdown/text gate. Does not run the full verify suite.
#Requires -Version 7.6
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][ValidateNotNullOrEmpty()][string]$Base,
  [string]$RepositoryRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
Set-StrictMode -Version Latest
$repoRoot = [System.IO.Path]::GetFullPath($RepositoryRoot)

function Invoke-RecordsGit {
  param([Parameter(Mandatory = $true)][string[]]$GitArguments)
  $start = [System.Diagnostics.ProcessStartInfo]::new()
  $start.FileName = 'git'
  $start.WorkingDirectory = $repoRoot
  $start.UseShellExecute = $false
  $start.CreateNoWindow = $true
  $start.RedirectStandardOutput = $true
  $start.RedirectStandardError = $true
  $start.StandardOutputEncoding = [System.Text.UTF8Encoding]::new($false, $true)
  foreach ($argument in @('-C', $repoRoot) + $GitArguments) {
    $start.ArgumentList.Add($argument)
  }
  $process = [System.Diagnostics.Process]::Start($start)
  try {
    $outputTask = $process.StandardOutput.ReadToEndAsync()
    $errorTask = $process.StandardError.ReadToEndAsync()
    $process.WaitForExit()
    $output = $outputTask.GetAwaiter().GetResult()
    $errorText = $errorTask.GetAwaiter().GetResult()
    if ($process.ExitCode -ne 0) {
      [Console]::Error.WriteLine("records-gate: git failed: $errorText")
      exit $process.ExitCode
    }
    return $output
  } finally {
    $process.Dispose()
  }
}

$baseSha = (Invoke-RecordsGit @('rev-parse', '--verify', '--end-of-options', "${Base}^{commit}")).Trim()
$paths = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
$queries = @(
  @('diff', '--name-only', '--no-renames', '-z', $baseSha, 'HEAD', '--'),
  @('diff', '--cached', '--name-only', '--no-renames', '-z', '--'),
  @('diff', '--name-only', '--no-renames', '-z', '--'),
  @('ls-files', '--others', '--exclude-standard', '-z', '--')
)
foreach ($query in $queries) {
  foreach ($path in ((Invoke-RecordsGit $query) -split "`0")) {
    if ($path.Length -gt 0) { [void]$paths.Add($path) }
  }
}
$outside = @($paths | Where-Object { -not $_.StartsWith('epics/', [System.StringComparison]::Ordinal) } | Sort-Object)
if ($outside.Count -gt 0) {
  [Console]::Error.WriteLine('records-gate: USER REVIEW REQUIRED; changes outside epics/:')
  foreach ($path in $outside) {
    [Console]::Error.WriteLine(($path | ConvertTo-Json -Compress))
  }
  [Console]::Error.WriteLine('Show these changes to the user before treating the push as records-only.')
  exit 2
}
Write-Host "records-gate: scope passed ($($paths.Count) paths; base $baseSha)"
& pwsh -NoProfile -File (Join-Path $PSScriptRoot 'Test-DocsGate.ps1') -RepositoryRoot $repoRoot -ToolRoot (Split-Path -Parent $PSScriptRoot)
exit $LASTEXITCODE
