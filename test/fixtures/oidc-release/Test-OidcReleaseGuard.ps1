# Guards the merged release workflow's trusted-publishing shape.
# Reads .github/workflows/release.yml. Does not dispatch, publish, or edit it.
# Negative copies are temporary files outside the repository and are deleted.
# This is not the install allowlist from AGENTO-002/B.
# Does not call scripts/Verify.ps1.
#Requires -Version 7.6
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
Set-StrictMode -Version Latest

if ($env:BRAID_OIDC_GUARD -eq '1') {
  Write-Error 'test/fixtures/oidc-release/Test-OidcReleaseGuard.ps1 must not invoke itself.'
  exit 1
}
$env:BRAID_OIDC_GUARD = '1'

if ($args.Count -gt 0) {
  [Console]::Error.WriteLine('oidc-release failed: this check takes no arguments and does not dispatch workflows.')
  exit 1
}

$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../..'))
$workflowPath = Join-Path $repoRoot '.github/workflows/release.yml'

function Fail {
  param([Parameter(Mandatory = $true)][string]$Message)
  [Console]::Error.WriteLine("oidc-release failed: $Message")
  exit 1
}

function ConvertTo-YamlCode {
  param([Parameter(Mandatory = $true)][AllowEmptyString()][string]$Line)
  $inSingle = $false
  $inDouble = $false
  $builder = [System.Text.StringBuilder]::new()
  foreach ($char in $Line.ToCharArray()) {
    if ($char -eq "'" -and -not $inDouble) {
      $inSingle = -not $inSingle
      [void]$builder.Append($char)
      continue
    }
    if ($char -eq '"' -and -not $inSingle) {
      $inDouble = -not $inDouble
      [void]$builder.Append($char)
      continue
    }
    if ($char -eq '#' -and -not $inSingle -and -not $inDouble) {
      break
    }
    [void]$builder.Append($char)
  }
  return $builder.ToString().Trim()
}

function Get-DocumentLines {
  param([Parameter(Mandatory = $true)][AllowEmptyString()][string]$Text)
  $normalized = $Text.Replace("`r`n", "`n").Replace("`r", "`n")
  $rows = [System.Collections.Generic.List[object]]::new()
  $number = 0
  foreach ($raw in $normalized.Split("`n")) {
    $indent = 0
    $tab = $false
    if ($raw.Contains("`t")) {
      $tab = $true
    }
    if ($raw -match '^( *)') {
      $indent = $Matches[1].Length
    }
    $code = ConvertTo-YamlCode -Line $raw
    $rows.Add([pscustomobject]@{
        Number = (++$number)
        Index  = $rows.Count
        Raw    = $raw
        Code   = $code
        Indent = $indent
        Blank  = [string]::IsNullOrWhiteSpace($code)
        Tab    = $tab
      })
  }
  return $rows
}

function Get-FollowingLines {
  param(
    [Parameter(Mandatory = $true)]$Lines,
    [Parameter(Mandatory = $true)][int]$Start,
    [Parameter(Mandatory = $true)][int]$ParentIndent
  )
  $body = [System.Collections.Generic.List[object]]::new()
  for ($i = $Start + 1; $i -lt $Lines.Count; $i++) {
    $line = $Lines[$i]
    if ($line.Blank) {
      continue
    }
    if ($line.Indent -le $ParentIndent) {
      break
    }
    $body.Add($line)
  }
  return $body
}

function Get-LineScript {
  param(
    [Parameter(Mandatory = $true)]$Lines,
    [Parameter(Mandatory = $true)]$RunLine
  )
  if ($RunLine.Code -match '^run:\s*[|>][+-]?\s*$') {
    $scriptLines = @(Get-FollowingLines -Lines $Lines -Start $RunLine.Index -ParentIndent $RunLine.Indent)
    return (($scriptLines | ForEach-Object { $_.Raw }) -join "`n")
  }
  if ($RunLine.Code -match '^run:\s*(.+)$') {
    return $Matches[1]
  }
  return ''
}

function Test-InvokesNpmPublish {
  param([Parameter(Mandatory = $true)][AllowEmptyString()][string]$Script)
  # `(& npm --version)` is the toolchain probe. Only the publish splat counts.
  return ($Script -match '&\s+npm\s+@publishArgs\b' -or $Script -match '(?m)^\s*npm\s+publish\b')
}

function Test-Node26Value {
  param([Parameter(Mandatory = $true)][AllowEmptyString()][string]$RawValue)
  $value = $RawValue.Trim()
  if ($value.Length -ge 2) {
    $quote = $value[0]
    if (($quote -eq '"' -or $quote -eq "'") -and $value[$value.Length - 1] -eq $quote) {
      $value = $value.Substring(1, $value.Length - 2).Trim()
    }
  }
  return $value -match '^v?26(?:\.\d+){0,2}$'
}

function Test-EnabledConjunction {
  param([Parameter(Mandatory = $true)][AllowEmptyString()][string]$Script)
  $privateSet = $Script -match '\$private\s*=\s*\$pkg\.private\s*-eq\s*\$true\b'
  $allowedSet = $Script -match '\$allowed\s*=\s*\$env:BRAID_RELEASE\s*-eq\s*[''"]enabled[''"]'
  $both = $Script -match '\$enabled\s*=\s*\(\s*-not\s+\$private\s*\)\s*-and\s+\$allowed\b'
  $output = ($Script -match 'enabled=') -and ($Script -match '\$env:GITHUB_OUTPUT\b')
  return ($privateSet -and $allowedSet -and $both -and $output)
}

function Get-Jobs {
  param([Parameter(Mandatory = $true)]$Lines)
  $jobsLine = $null
  foreach ($line in $Lines) {
    if (-not $line.Blank -and $line.Indent -eq 0 -and $line.Code -eq 'jobs:') {
      $jobsLine = $line
      break
    }
  }
  $jobs = [System.Collections.Generic.List[object]]::new()
  if ($null -eq $jobsLine) {
    return $jobs
  }
  $body = @(Get-FollowingLines -Lines $Lines -Start $jobsLine.Index -ParentIndent $jobsLine.Indent)
  $headerIndexes = [System.Collections.Generic.List[int]]::new()
  for ($i = 0; $i -lt $body.Count; $i++) {
    if ($body[$i].Indent -eq ($jobsLine.Indent + 2) -and $body[$i].Code -match '^[A-Za-z0-9_-]+:\s*$') {
      $headerIndexes.Add($i)
    }
  }
  for ($h = 0; $h -lt $headerIndexes.Count; $h++) {
    $start = $headerIndexes[$h]
    $end = if ($h + 1 -lt $headerIndexes.Count) { $headerIndexes[$h + 1] } else { $body.Count }
    $jobLines = [System.Collections.Generic.List[object]]::new()
    for ($i = $start; $i -lt $end; $i++) {
      $jobLines.Add($body[$i])
    }
    $name = $body[$start].Code.TrimEnd(':').Trim()
    $jobs.Add([pscustomobject]@{
        Name   = $name
        Indent = $body[$start].Indent
        Lines  = $jobLines
      })
  }
  return $jobs
}

function Get-Steps {
  param(
    [Parameter(Mandatory = $true)]$Lines,
    [Parameter(Mandatory = $true)]$Job
  )
  $stepsLine = $null
  foreach ($line in $Job.Lines) {
    if ($line.Indent -eq ($Job.Indent + 2) -and $line.Code -eq 'steps:') {
      $stepsLine = $line
      break
    }
  }
  $steps = [System.Collections.Generic.List[object]]::new()
  if ($null -eq $stepsLine) {
    return $steps
  }
  $body = @(Get-FollowingLines -Lines $Lines -Start $stepsLine.Index -ParentIndent $stepsLine.Indent)
  $starts = [System.Collections.Generic.List[int]]::new()
  for ($i = 0; $i -lt $body.Count; $i++) {
    if ($body[$i].Indent -eq ($stepsLine.Indent + 2) -and $body[$i].Code.StartsWith('- ')) {
      $starts.Add($i)
    }
  }
  for ($s = 0; $s -lt $starts.Count; $s++) {
    $start = $starts[$s]
    $end = if ($s + 1 -lt $starts.Count) { $starts[$s + 1] } else { $body.Count }
    $stepLines = [System.Collections.Generic.List[object]]::new()
    $runLine = $null
    for ($i = $start; $i -lt $end; $i++) {
      $stepLines.Add($body[$i])
      if ($null -eq $runLine -and $body[$i].Code -match '^run:') {
        $runLine = $body[$i]
      }
    }
    $script = ''
    if ($null -ne $runLine) {
      $script = Get-LineScript -Lines $Lines -RunLine $runLine
    }
    $steps.Add([pscustomobject]@{
        Lines  = $stepLines
        Script = $script
      })
  }
  return $steps
}

function Add-Finding {
  param(
    [Parameter(Mandatory = $true)]$Findings,
    [Parameter(Mandatory = $true)][string]$Code,
    [Parameter(Mandatory = $true)][string]$Detail
  )
  $Findings.Add("${Code}: $Detail")
}

function Get-OidcFindings {
  param([Parameter(Mandatory = $true)][AllowEmptyString()][string]$Text)
  $findings = [System.Collections.Generic.List[string]]::new()
  if ($Text -match '(?<![A-Za-z0-9_])NPM_TOKEN(?![A-Za-z0-9_])') {
    Add-Finding $findings 'NPM_TOKEN' 'workflow names NPM_TOKEN'
  }
  if ($Text -match '(?<![A-Za-z0-9_])NODE_AUTH_TOKEN(?![A-Za-z0-9_])') {
    Add-Finding $findings 'NODE_AUTH_TOKEN' 'workflow names NODE_AUTH_TOKEN'
  }

  $lines = @(Get-DocumentLines -Text $Text)
  foreach ($line in $lines) {
    if ($line.Tab) {
      Add-Finding $findings 'indent' 'workflow uses a tab; the guard reads space-indented YAML'
      break
    }
  }

  $onLine = $null
  foreach ($line in $lines) {
    if (-not $line.Blank -and $line.Indent -eq 0 -and $line.Code -eq 'on:') {
      $onLine = $line
      break
    }
  }
  $dispatchOk = $false
  if ($null -ne $onLine) {
    $onBody = @(Get-FollowingLines -Lines $lines -Start $onLine.Index -ParentIndent $onLine.Indent)
    $dispatch = $null
    foreach ($line in $onBody) {
      if ($line.Code -eq 'workflow_dispatch:') {
        $dispatch = $line
        break
      }
    }
    if ($null -ne $dispatch) {
      $dispatchBody = @(Get-FollowingLines -Lines $lines -Start $dispatch.Index -ParentIndent $dispatch.Indent)
      $inputs = $null
      foreach ($line in $dispatchBody) {
        if ($line.Code -eq 'inputs:') {
          $inputs = $line
          break
        }
      }
      if ($null -ne $inputs) {
        $inputBody = @(Get-FollowingLines -Lines $lines -Start $inputs.Index -ParentIndent $inputs.Indent)
        foreach ($line in $inputBody) {
          if ($line.Indent -eq ($inputs.Indent + 2) -and $line.Code -match '^confirm:\s*$') {
            $dispatchOk = $true
            break
          }
        }
      }
    }
  }
  if (-not $dispatchOk) {
    Add-Finding $findings 'workflow-dispatch' 'workflow_dispatch input confirm is absent'
  }

  $jobs = @(Get-Jobs -Lines $lines)
  $publishJobs = [System.Collections.Generic.List[object]]::new()
  foreach ($job in $jobs) {
    $steps = @(Get-Steps -Lines $lines -Job $job)
    $invokes = $false
    foreach ($step in $steps) {
      if (Test-InvokesNpmPublish -Script $step.Script) {
        $invokes = $true
        break
      }
    }
    if ($invokes) {
      $publishJobs.Add($job)
    }
  }
  if ($publishJobs.Count -ne 1) {
    Add-Finding $findings 'tarball' "expected one job that invokes npm publish, found $($publishJobs.Count)"
    Add-Finding $findings 'npm-gate' 'npm 11.5.1 gate is not on the publish job'
    Add-Finding $findings 'publish-condition' 'publish condition is not on the publish job'
    Add-Finding $findings 'id-token' 'publish job id-token: write is absent'
    Add-Finding $findings 'node-version' 'publish job Node.js 26 is absent'
    Add-Finding $findings 'confirm-publish' 'publish job confirm == publish is absent'
    return $findings
  }

  $job = $publishJobs[0]
  $permissions = $null
  foreach ($line in $job.Lines) {
    if ($line.Indent -eq ($job.Indent + 2) -and $line.Code -eq 'permissions:') {
      $permissions = $line
      break
    }
  }
  $idToken = $false
  if ($null -ne $permissions) {
    $permBody = @(Get-FollowingLines -Lines $lines -Start $permissions.Index -ParentIndent $permissions.Indent)
    foreach ($line in $permBody) {
      if ($line.Indent -eq ($permissions.Indent + 2) -and $line.Code -match '^id-token:\s*[''"]?write[''"]?\s*$') {
        $idToken = $true
        break
      }
    }
  }
  if (-not $idToken) {
    Add-Finding $findings 'id-token' "job $($job.Name) permissions lack id-token: write"
  }

  $confirm = $false
  foreach ($line in $job.Lines) {
    if ($line.Indent -eq ($job.Indent + 2) -and $line.Code -match '^if:\s*github\.event\.inputs\.confirm\s*==\s*[''"]publish[''"]\s*$') {
      $confirm = $true
      break
    }
  }
  if (-not $confirm) {
    Add-Finding $findings 'confirm-publish' "job $($job.Name) does not require confirm == publish"
  }

  $nodeValues = [System.Collections.Generic.List[string]]::new()
  foreach ($line in $job.Lines) {
    if ($line.Code -match '^node-version:\s*(.+)$') {
      $nodeValues.Add($Matches[1].Trim())
    }
  }
  if ($nodeValues.Count -eq 0) {
    Add-Finding $findings 'node-version' "job $($job.Name) does not set node-version"
  }
  foreach ($nodeValue in $nodeValues) {
    if (-not (Test-Node26Value -RawValue $nodeValue)) {
      Add-Finding $findings 'node-version' "node-version '$nodeValue' is not Node.js 26"
    }
  }

  $jobCodes = (($job.Lines | ForEach-Object { $_.Code }) -join "`n")
  if ($jobCodes -notmatch 'BRAID_RELEASE:\s*\$\{\{\s*vars\.BRAID_RELEASE\s*\}\}') {
    Add-Finding $findings 'publish-condition' 'BRAID_RELEASE is not read from vars.BRAID_RELEASE'
  }

  $steps = @(Get-Steps -Lines $lines -Job $job)
  $decision = $null
  $publishStep = $null
  foreach ($step in $steps) {
    if (Test-EnabledConjunction -Script $step.Script) {
      $decision = $step
    }
    if (Test-InvokesNpmPublish -Script $step.Script) {
      $publishStep = $step
    }
  }
  if ($null -eq $decision) {
    Add-Finding $findings 'publish-condition' 'missing private is not true AND BRAID_RELEASE == enabled'
  } else {
    $decisionId = $null
    foreach ($line in $decision.Lines) {
      if ($line.Code -match '^id:\s*([A-Za-z0-9_-]+)\s*$') {
        $decisionId = $Matches[1]
        break
      }
    }
    if ([string]::IsNullOrWhiteSpace($decisionId)) {
      Add-Finding $findings 'publish-condition' 'publication decision step has no id'
    } elseif ($null -eq $publishStep) {
      Add-Finding $findings 'publish-condition' 'npm publish step is absent'
    } else {
      $limited = $false
      $ifPattern = '^if:\s*' + [regex]::Escape("steps.$decisionId.outputs.enabled") + '\s*==\s*[''"]true[''"]\s*$'
      foreach ($line in $publishStep.Lines) {
        if ($line.Code -match $ifPattern) {
          $limited = $true
          break
        }
      }
      if (-not $limited) {
        Add-Finding $findings 'publish-condition' "npm publish is not limited to steps.$decisionId.outputs.enabled == true"
      }
    }
  }

  if ($null -eq $publishStep) {
    Add-Finding $findings 'npm-gate' 'npm publish step is absent'
    Add-Finding $findings 'tarball' 'npm publish step is absent'
    return $findings
  }

  $script = $publishStep.Script
  $invoke = [regex]::Match($script, '&\s+npm\s+@publishArgs\b|(?m)^\s*npm\s+publish\b')
  $gatePattern = @'
(?s)\$npmOk\s*=\s*\(\s*\$npmMajor\s+-gt\s+11\s*\)\s*-or\s*\(\s*\$npmMajor\s+-eq\s+11\s+-and\s+\$npmMinor\s+-gt\s+5\s*\)\s*-or\s*\(\s*\$npmMajor\s+-eq\s+11\s+-and\s+\$npmMinor\s+-eq\s+5\s+-and\s+\$npmPatch\s+-ge\s+1\s*\).*?if\s*\(\s*-not\s+\$npmOk\s*\).*?11\.5\.1.*?exit\s+1
'@
  $gate = [regex]::Match($script, $gatePattern)
  if (-not $invoke.Success -or -not $gate.Success -or $gate.Index -gt $invoke.Index) {
    Add-Finding $findings 'npm-gate' 'publish step does not exit before npm publish when npm is older than 11.5.1'
  }

  $listPattern = 'Get-ChildItem\s+-LiteralPath\s+artifacts/package\s+-Filter\s+\*\.tgz'
  $countPattern = '\$tarballs\.Count\s*-ne\s*1'
  $argsPattern = @'
(?s)\$publishArgs\s*=\s*@\(\s*(['"])publish\1\s*,\s*(['"])--ignore-scripts\2\s*,\s*\$tarballs\[0\]\.FullName\s*\)
'@
  $argsMatch = [regex]::Match($script, $argsPattern)
  $listed = $script -match $listPattern
  $counted = $script -match $countPattern
  if (-not $listed -or -not $counted -or -not $argsMatch.Success -or -not $invoke.Success -or $argsMatch.Index -gt $invoke.Index) {
    Add-Finding $findings 'tarball' 'npm publish must run --ignore-scripts on that job''s single artifacts/package tarball'
  }
  return $findings
}

function Assert-OnlyReleaseWorkflowPublishes {
  $dir = Join-Path $repoRoot '.github/workflows'
  $names = [System.Collections.Generic.List[string]]::new()
  foreach ($file in @(Get-ChildItem -LiteralPath $dir -File)) {
    if ($file.Name -notmatch '\.ya?ml$') {
      continue
    }
    $text = [System.IO.File]::ReadAllText($file.FullName)
    if (Test-InvokesNpmPublish -Script $text) {
      $names.Add($file.Name)
    }
  }
  if ($names.Count -ne 1 -or $names[0] -ne 'release.yml') {
    Fail "npm publish must stay only in release.yml, found [$($names -join ', ')]"
  }
}

function ConvertTo-Lf {
  param([Parameter(Mandatory = $true)][AllowEmptyString()][string]$Text)
  return $Text.Replace("`r`n", "`n").Replace("`r", "`n")
}

function Replace-Once {
  param(
    [Parameter(Mandatory = $true)][AllowEmptyString()][string]$Text,
    [Parameter(Mandatory = $true)][string]$Old,
    [Parameter(Mandatory = $true)][AllowEmptyString()][string]$New,
    [Parameter(Mandatory = $true)][string]$Name
  )
  $count = ([regex]::Matches($Text, [regex]::Escape($Old))).Count
  if ($count -ne 1) {
    Fail "$Name expected one occurrence, found $count"
  }
  return $Text.Replace($Old, $New)
}

function Remove-OneLine {
  param(
    [Parameter(Mandatory = $true)][AllowEmptyString()][string]$Text,
    [Parameter(Mandatory = $true)][string]$Pattern,
    [Parameter(Mandatory = $true)][string]$Name
  )
  $lines = $Text.Split("`n")
  $kept = [System.Collections.Generic.List[string]]::new()
  $removed = 0
  foreach ($line in $lines) {
    if ($line -match $Pattern) {
      $removed++
      continue
    }
    $kept.Add($line)
  }
  if ($removed -ne 1) {
    Fail "$Name removed $removed lines, expected 1"
  }
  return ($kept -join "`n")
}

function Remove-NpmGate {
  param([Parameter(Mandatory = $true)][AllowEmptyString()][string]$Text)
  $lines = $Text.Split("`n")
  $start = -1
  for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '\$npmOk\s*=') {
      $start = $i
      break
    }
  }
  if ($start -lt 0) {
    Fail 'npm-gate fixture could not find $npmOk'
  }
  $end = -1
  for ($i = $start; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match 'exit\s+1') {
      $end = $i
      break
    }
  }
  if ($end -lt 0) {
    Fail 'npm-gate fixture could not find the gate exit'
  }
  if (($end + 1) -lt $lines.Count -and $lines[$end + 1] -match '^\s*}\s*$') {
    $end++
  }
  $kept = [System.Collections.Generic.List[string]]::new()
  for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($i -ge $start -and $i -le $end) {
      continue
    }
    $kept.Add($lines[$i])
  }
  $updated = $kept -join "`n"
  if ($updated -eq $Text) {
    Fail 'npm-gate fixture did not change the workflow'
  }
  return $updated
}

function Move-IdTokenToWorkflowRoot {
  param([Parameter(Mandatory = $true)][AllowEmptyString()][string]$Text)
  $removed = Remove-OneLine -Text $Text -Pattern '^\s*id-token:\s*[''"]?write[''"]?\s*$' -Name 'workflow-level id-token'
  $pattern = "(?m)^permissions:\n  contents: read\n"
  $count = ([regex]::Matches($removed, $pattern)).Count
  if ($count -ne 1) {
    Fail "workflow-level id-token fixture matched root permissions $count times"
  }
  return [regex]::Replace($removed, $pattern, "permissions:`n  contents: read`n  id-token: write`n", 1)
}

function Write-Copy {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][AllowEmptyString()][string]$Text
  )
  $dir = Join-Path $script:TempRoot $Name
  New-Item -ItemType Directory -Path $dir | Out-Null
  $path = Join-Path $dir 'release.yml'
  $utf8 = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText($path, $Text, $utf8)
  return [System.IO.File]::ReadAllText($path)
}

function Assert-NegativeCopy {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][AllowEmptyString()][string]$Text,
    [Parameter(Mandatory = $true)][string]$ExpectedCode
  )
  if ($Text -eq $script:LiveText) {
    Fail "negative fixture '$Name' did not change release.yml"
  }
  $copy = Write-Copy -Name $Name -Text $Text
  $findings = @(Get-OidcFindings -Text $copy)
  $hit = $false
  foreach ($finding in $findings) {
    if ($finding.StartsWith("${ExpectedCode}:")) {
      $hit = $true
      break
    }
  }
  if (-not $hit) {
    $shown = if ($findings.Count -eq 0) { '(no findings; the bad copy passed)' } else { $findings -join "`n" }
    Fail "negative fixture '$Name' did not report $ExpectedCode`n$shown"
  }
  Write-Host "negative failed closed: $Name ($ExpectedCode)"
}

function Assert-PositiveCopy {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][AllowEmptyString()][string]$Text
  )
  if ($Text -eq $script:LiveText) {
    Fail "positive variant '$Name' did not change release.yml"
  }
  $copy = Write-Copy -Name $Name -Text $Text
  $findings = @(Get-OidcFindings -Text $copy)
  if ($findings.Count -ne 0) {
    Fail "positive variant '$Name' failed:`n$($findings -join "`n")"
  }
  Write-Host "variant still passed: $Name"
}

if (-not (Test-Path -LiteralPath $workflowPath)) {
  Fail "missing $workflowPath"
}
Assert-OnlyReleaseWorkflowPublishes

$script:LiveText = ConvertTo-Lf ([System.IO.File]::ReadAllText($workflowPath))
$liveFindings = @(Get-OidcFindings -Text $script:LiveText)
if ($liveFindings.Count -ne 0) {
  Fail "release.yml failed the OIDC guard:`n$($liveFindings -join "`n")"
}
Write-Host 'release.yml: oidc guard passed'
Write-Host '  job id-token: write'
Write-Host '  no NPM_TOKEN and no NODE_AUTH_TOKEN'
Write-Host '  Node.js 26'
Write-Host '  npm 11.5.1 or newer gate'
Write-Host '  workflow_dispatch confirm=publish'
Write-Host '  npm publish of the job tarball only when private is not true and BRAID_RELEASE is enabled'

$script:TempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ('braid-oidc-guard-' + [guid]::NewGuid().ToString('n'))
New-Item -ItemType Directory -Path $script:TempRoot | Out-Null
try {
  $missingIdToken = Remove-OneLine -Text $script:LiveText -Pattern '^\s*id-token:\s*[''"]?write[''"]?\s*$' -Name 'missing id-token'
  Assert-NegativeCopy -Name 'missing-id-token' -Text $missingIdToken -ExpectedCode 'id-token'

  $commentedIdToken = Replace-Once -Text $script:LiveText -Old '      id-token: write' -New '      # id-token: write' -Name 'commented id-token'
  Assert-NegativeCopy -Name 'commented-id-token' -Text $commentedIdToken -ExpectedCode 'id-token'

  $workflowLevel = Move-IdTokenToWorkflowRoot -Text $script:LiveText
  Assert-NegativeCopy -Name 'workflow-level-id-token' -Text $workflowLevel -ExpectedCode 'id-token'

  $npmToken = Replace-Once -Text $script:LiveText -Old '    runs-on: ubuntu-latest' -New "    runs-on: ubuntu-latest`n    env:`n      NPM_TOKEN: example" -Name 'NPM_TOKEN'
  Assert-NegativeCopy -Name 'names-npm-token' -Text $npmToken -ExpectedCode 'NPM_TOKEN'

  $nodeAuth = Replace-Once -Text $script:LiveText -Old '    runs-on: ubuntu-latest' -New "    runs-on: ubuntu-latest`n    env:`n      NODE_AUTH_TOKEN: example" -Name 'NODE_AUTH_TOKEN'
  Assert-NegativeCopy -Name 'names-node-auth-token' -Text $nodeAuth -ExpectedCode 'NODE_AUTH_TOKEN'

  $node24 = Replace-Once -Text $script:LiveText -Old 'node-version: "26"' -New 'node-version: "24"' -Name 'node 24'
  Assert-NegativeCopy -Name 'node-24' -Text $node24 -ExpectedCode 'node-version'

  $weakerGate = Replace-Once -Text $script:LiveText -Old '$npmPatch -ge 1' -New '$npmPatch -ge 0' -Name 'npm 11.5.0'
  Assert-NegativeCopy -Name 'npm-gate-1150' -Text $weakerGate -ExpectedCode 'npm-gate'

  $removedGate = Remove-NpmGate -Text $script:LiveText
  Assert-NegativeCopy -Name 'npm-gate-removed' -Text $removedGate -ExpectedCode 'npm-gate'

  $ship = Replace-Once -Text $script:LiveText -Old "github.event.inputs.confirm == 'publish'" -New "github.event.inputs.confirm == 'ship'" -Name 'confirm ship'
  Assert-NegativeCopy -Name 'confirm-ship' -Text $ship -ExpectedCode 'confirm-publish'

  $called = Replace-Once -Text $script:LiveText -Old 'workflow_dispatch:' -New 'workflow_call:' -Name 'workflow_call'
  Assert-NegativeCopy -Name 'workflow-call' -Text $called -ExpectedCode 'workflow-dispatch'

  $renamed = $script:LiveText.Replace('BRAID_RELEASE', 'AGENTO_RELEASE')
  if ($renamed -eq $script:LiveText) {
    Fail 'AGENTO_RELEASE fixture did not change release.yml'
  }
  Assert-NegativeCopy -Name 'agento-release-name' -Text $renamed -ExpectedCode 'publish-condition'

  $orGate = Replace-Once -Text $script:LiveText -Old '(-not $private) -and $allowed' -New '(-not $private) -or $allowed' -Name 'or gate'
  Assert-NegativeCopy -Name 'publish-or' -Text $orGate -ExpectedCode 'publish-condition'

  $always = Remove-OneLine -Text $script:LiveText -Pattern '^\s*if:\s*steps\.publication\.outputs\.enabled\s*==\s*[''"]true[''"]\s*$' -Name 'unconditional publish'
  Assert-NegativeCopy -Name 'unconditional-publish' -Text $always -ExpectedCode 'publish-condition'

  $directoryPublish = Replace-Once -Text $script:LiveText -Old "'--ignore-scripts', `$tarballs[0].FullName" -New "'--ignore-scripts'" -Name 'directory publish'
  Assert-NegativeCopy -Name 'directory-publish' -Text $directoryPublish -ExpectedCode 'tarball'

  $nodePin = Replace-Once -Text $script:LiveText -Old 'node-version: "26"' -New 'node-version: "26.13.0"' -Name 'node pin'
  Assert-PositiveCopy -Name 'node-26-pin' -Text $nodePin

  $nodeBare = Replace-Once -Text $script:LiveText -Old 'node-version: "26"' -New 'node-version: 26' -Name 'node bare'
  Assert-PositiveCopy -Name 'node-26-bare' -Text $nodeBare
} finally {
  if ($null -ne $script:TempRoot -and (Test-Path -LiteralPath $script:TempRoot)) {
    Remove-Item -LiteralPath $script:TempRoot -Recurse -Force
  }
}

Write-Host 'oidc-release: negative fixtures failed closed'
exit 0
