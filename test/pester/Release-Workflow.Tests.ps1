#Requires -Version 7.6
# Guards the trusted-publishing shape of .github/workflows/release.yml: OIDC
# (id-token: write on the publishing job only), no npm token, a manual
# confirm=publish dispatch as the only trigger, Node.js 26, the npm 11.5.1 gate,
# and npm publish of the job's own tarball only when publication is enabled.
# Reads the workflow and edited copies under TestDrive; never dispatches or edits it.

BeforeAll {
  $script:RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
  $script:WorkflowPath = Join-Path $script:RepoRoot '.github/workflows/release.yml'

  # The smallest YAML reader release.yml needs: block mappings, block sequences,
  # `|` scalars, plain and quoted scalars, comments. Anything else throws, so a
  # workflow it can't read fails the suite instead of passing empty.
  function ConvertFrom-WorkflowYaml {
    param([Parameter(Mandatory)][AllowEmptyString()][string]$Text)
    if ($Text.Contains("`t")) { throw 'the workflow uses a tab; the reader takes space-indented YAML' }
    $script:Raw = $Text.Split("`n")
    $script:Rows = [System.Collections.Generic.List[object]]::new()
    for ($i = 0; $i -lt $script:Raw.Count; $i++) {
      $code = Remove-YamlComment $script:Raw[$i]
      if ($code.Trim()) {
        $script:Rows.Add([pscustomobject]@{ Index = $i; Indent = $code.Length - $code.TrimStart().Length; Code = $code.Trim() })
      }
    }
    if ($script:Rows.Count -eq 0) { throw 'the workflow is empty' }
    $script:Pos = 0
    $doc = Read-YamlMapping $script:Rows[0].Indent
    if ($script:Pos -lt $script:Rows.Count) { throw "line $($script:Rows[$script:Pos].Index + 1): unexpected indentation" }
    return $doc
  }

  function Remove-YamlComment([string]$Line) {
    $quote = $null
    for ($i = 0; $i -lt $Line.Length; $i++) {
      $c = $Line[$i]
      if ($quote) { if ($c -eq $quote) { $quote = $null } }
      elseif (($c -eq "'" -or $c -eq '"') -and ($i -eq 0 -or $Line[$i - 1] -match '[\s:\-]')) { $quote = $c }
      elseif ($c -eq '#' -and ($i -eq 0 -or $Line[$i - 1] -match '\s')) { return $Line.Substring(0, $i).TrimEnd() }
    }
    return $Line.TrimEnd()
  }

  function ConvertFrom-YamlScalar([string]$Value) {
    $v = $Value.Trim()
    if ($v -match "^'(.*)'$") { return $Matches[1].Replace("''", "'") }
    if ($v -match '^"(.*)"$') { return $Matches[1] }
    if ($v -match '^[\[\{&*!]') { throw "unsupported YAML value '$v'" }
    return $v
  }

  $script:KeyPattern = '^(?!-(\s|$))([^\s:''"][^:]*?|''[^'']*''|"[^"]*"):(?:\s+(.*))?$'

  function Read-YamlNode {
    $row = $script:Rows[$script:Pos]
    if ($row.Code -match '^-(\s|$)') { return , (Read-YamlSequence $row.Indent) }
    return Read-YamlMapping $row.Indent
  }

  function Read-YamlMapping([int]$Indent) {
    $map = [ordered]@{}
    while ($script:Pos -lt $script:Rows.Count) {
      $row = $script:Rows[$script:Pos]
      if ($row.Indent -lt $Indent -or ($row.Indent -eq $Indent -and $row.Code -match '^-(\s|$)')) { break }
      if ($row.Indent -gt $Indent -or $row.Code -notmatch $script:KeyPattern) { throw "line $($row.Index + 1): cannot read '$($row.Code)'" }
      $key = ConvertFrom-YamlScalar $Matches[2]
      $rest = $Matches[3]
      if ($map.Contains($key)) { throw "line $($row.Index + 1): duplicate key '$key'" }
      $script:Pos++
      $next = if ($script:Pos -lt $script:Rows.Count) { $script:Rows[$script:Pos] } else { $null }
      if (-not $rest) {
        $nested = $null -ne $next -and ($next.Indent -gt $Indent -or ($next.Indent -eq $Indent -and $next.Code -match '^-(\s|$)'))
        $map[$key] = if ($nested) { Read-YamlNode } else { $null }
      } elseif ($rest -match '^[|>][+-]?$') {
        $map[$key] = Read-YamlBlockScalar $row $Indent
      } else {
        $map[$key] = ConvertFrom-YamlScalar $rest
      }
    }
    return $map
  }

  function Read-YamlSequence([int]$Indent) {
    $list = [System.Collections.Generic.List[object]]::new()
    while ($script:Pos -lt $script:Rows.Count) {
      $row = $script:Rows[$script:Pos]
      if ($row.Indent -ne $Indent -or $row.Code -notmatch '^-(?:\s+(.*))?$') { break }
      $rest = $Matches[1]
      if ($rest -and $rest -match $script:KeyPattern) {
        # `- key: value` starts a mapping at the column of `key`.
        $script:Rows[$script:Pos] = [pscustomobject]@{ Index = $row.Index; Indent = $Indent + $row.Code.Length - $rest.Length; Code = $rest }
        $list.Add((Read-YamlMapping $script:Rows[$script:Pos].Indent))
      } else {
        $script:Pos++
        $list.Add($(if ($rest) { ConvertFrom-YamlScalar $rest } else { Read-YamlNode }))
      }
    }
    return , $list.ToArray()
  }

  function Read-YamlBlockScalar($Row, [int]$Indent) {
    $lines = [System.Collections.Generic.List[string]]::new()
    $i = $Row.Index + 1
    while ($i -lt $script:Raw.Count -and ($script:Raw[$i].Trim() -eq '' -or ($script:Raw[$i].Length - $script:Raw[$i].TrimStart().Length) -gt $Indent)) {
      $lines.Add($script:Raw[$i]); $i++
    }
    while ($lines.Count -gt 0 -and $lines[$lines.Count - 1].Trim() -eq '') { $lines.RemoveAt($lines.Count - 1) }
    while ($script:Pos -lt $script:Rows.Count -and $script:Rows[$script:Pos].Index -lt $i) { $script:Pos++ }
    if ($lines.Count -eq 0) { return '' }
    $cut = $lines[0].Length - $lines[0].TrimStart().Length
    return (($lines | ForEach-Object { if ($_.Length -gt $cut) { $_.Substring($cut) } else { $_.Trim() } }) -join "`n")
  }

  function Get-Value($Node, [string[]]$Path) {
    foreach ($key in $Path) {
      if ($Node -isnot [System.Collections.IDictionary] -or -not $Node.Contains($key)) { return $null }
      $Node = $Node[$key]
    }
    return $Node
  }

  function Test-NpmPublish([string]$Script) {
    # `(& npm --version)` is the toolchain probe; only the publish call counts.
    return $Script -match '&\s+npm\s+@publishArgs\b' -or $Script -match '(?m)^\s*npm\s+publish\b'
  }

  # Returns one "<code>: <detail>" line per broken property; throws when the
  # file is missing or unreadable.
  function Get-ReleaseFindings([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { throw "missing $Path" }
    $text = [System.IO.File]::ReadAllText($Path).Replace("`r`n", "`n")
    $doc = ConvertFrom-WorkflowYaml $text
    $jobs = Get-Value $doc 'jobs'
    if ($jobs -isnot [System.Collections.IDictionary] -or $jobs.Count -eq 0) { throw "$Path has no jobs" }
    $f = [System.Collections.Generic.List[string]]::new()

    foreach ($name in 'NPM_TOKEN', 'NODE_AUTH_TOKEN') {
      if ($text -match "(?<![A-Za-z0-9_])$name(?![A-Za-z0-9_])") { $f.Add("token: the workflow names $name") }
    }

    $on = Get-Value $doc 'on'
    if ($on -isnot [System.Collections.IDictionary] -or (@($on.Keys) -join ',') -ne 'workflow_dispatch' -or
      $null -eq (Get-Value $on 'workflow_dispatch', 'inputs', 'confirm')) {
      $f.Add('trigger: the only trigger must be workflow_dispatch with the confirm input')
    }

    $rootPermissions = Get-Value $doc 'permissions'
    if ($rootPermissions -isnot [System.Collections.IDictionary] -or $rootPermissions.Contains('id-token')) {
      $f.Add('id-token: workflow-level permissions must be a map without id-token')
    }

    $publishJobs = @($jobs.Keys | Where-Object { @(Get-Value $jobs[$_] 'steps') | Where-Object { Test-NpmPublish (Get-Value $_ 'run') } })
    if ($publishJobs.Count -ne 1) {
      $f.Add("publish-job: expected one job that runs npm publish, found $($publishJobs.Count)")
      return $f
    }
    foreach ($other in @($jobs.Keys | Where-Object { $_ -ne $publishJobs[0] })) {
      $permissions = Get-Value $jobs[$other] 'permissions'
      if ($null -ne $permissions -and ($permissions -isnot [System.Collections.IDictionary] -or $permissions.Contains('id-token'))) {
        $f.Add("id-token: job $other must not get id-token or write-all")
      }
    }

    $job = $jobs[$publishJobs[0]]
    if ((Get-Value $job 'permissions', 'id-token') -ne 'write') { $f.Add('id-token: the publish job lacks id-token: write') }
    if ((Get-Value $job 'if') -notmatch "^github\.event\.inputs\.confirm\s*==\s*'publish'$") { $f.Add('confirm: the publish job does not require confirm == publish') }
    if ((Get-Value $job 'runs-on') -ne 'ubuntu-latest') { $f.Add('runner: trusted publishing needs the GitHub-hosted ubuntu-latest runner') }

    $steps = @(Get-Value $job 'steps')
    $nodeVersions = @($steps | ForEach-Object { Get-Value $_ 'with', 'node-version' } | Where-Object { $null -ne $_ })
    if ($nodeVersions.Count -eq 0 -or @($nodeVersions | Where-Object { $_ -notmatch '^v?26(\.\d+){0,2}$' }).Count -gt 0) {
      $f.Add("node-version: the publish job must set Node.js 26, found [$($nodeVersions -join ', ')]")
    }

    $decision = $steps | Where-Object {
      $run = [string](Get-Value $_ 'run')
      (Get-Value $_ 'id') -and (Get-Value $_ 'env', 'BRAID_RELEASE') -match '^\$\{\{\s*vars\.BRAID_RELEASE\s*\}\}$' -and
      $run -match '\$private\s*=\s*\$pkg\.private\s*-eq\s*\$true\b' -and
      $run -match '\$allowed\s*=\s*\$env:BRAID_RELEASE\s*-eq\s*[''"]enabled[''"]' -and
      $run -match '\$enabled\s*=\s*\(\s*-not\s+\$private\s*\)\s*-and\s+\$allowed\b' -and
      $run -match 'enabled=' -and $run -match '\$env:GITHUB_OUTPUT\b'
    } | Select-Object -First 1
    $publish = $steps | Where-Object { Test-NpmPublish (Get-Value $_ 'run') } | Select-Object -First 1
    if ($null -eq $decision) {
      $f.Add('publish-condition: no step with an id sets enabled from private not true AND vars.BRAID_RELEASE == enabled')
    } elseif ((Get-Value $publish 'if') -notmatch ('^steps\.' + [regex]::Escape($decision.id) + "\.outputs\.enabled\s*==\s*'true'$")) {
      $f.Add("publish-condition: npm publish is not limited to steps.$($decision.id).outputs.enabled == 'true'")
    }

    $run = [string](Get-Value $publish 'run')
    $invoke = [regex]::Match($run, '&\s+npm\s+@publishArgs\b|(?m)^\s*npm\s+publish\b')
    $gate = [regex]::Match($run, '(?s)\$npmOk\s*=\s*\(\s*\$npmMajor\s+-gt\s+11\s*\)\s*-or\s*\(\s*\$npmMajor\s+-eq\s+11\s+-and\s+\$npmMinor\s+-gt\s+5\s*\)\s*-or\s*\(\s*\$npmMajor\s+-eq\s+11\s+-and\s+\$npmMinor\s+-eq\s+5\s+-and\s+\$npmPatch\s+-ge\s+1\s*\).*?if\s*\(\s*-not\s+\$npmOk\s*\).*?11\.5\.1.*?exit\s+1')
    if (-not $gate.Success -or $gate.Index -gt $invoke.Index) { $f.Add('npm-gate: the publish step must exit before npm publish when npm is older than 11.5.1') }
    $publishArgs = [regex]::Match($run, '(?s)\$publishArgs\s*=\s*@\(\s*([''"])publish\1\s*,\s*([''"])--ignore-scripts\2\s*,\s*\$tarballs\[0\]\.FullName\s*\)')
    if ($run -notmatch 'Get-ChildItem\s+-LiteralPath\s+artifacts/package\s+-Filter\s+\*\.tgz' -or $run -notmatch '\$tarballs\.Count\s*-ne\s*1' -or
      -not $publishArgs.Success -or $publishArgs.Index -gt $invoke.Index) {
      $f.Add('tarball: npm publish must run --ignore-scripts on the job''s single artifacts/package tarball')
    }
    return $f
  }

  $script:LiveText = [System.IO.File]::ReadAllText($script:WorkflowPath).Replace("`r`n", "`n")

  # Writes release.yml with each Old replaced by New (each Old must occur once,
  # or everywhere with All) and returns the copy's path.
  function New-EditedCopy([object[]]$Edits) {
    $text = $script:LiveText
    foreach ($edit in $Edits) {
      $count = ([regex]::Matches($text, [regex]::Escape($edit.Old))).Count
      if ($count -eq 0 -or ($count -gt 1 -and -not $edit['All'])) { throw "edit '$($edit.Old)' matched $count times" }
      $text = $text.Replace($edit.Old, $edit.New)
    }
    $text | Should -Not -Be $script:LiveText
    $path = Join-Path $TestDrive "$([guid]::NewGuid().ToString('n')).yml"
    [System.IO.File]::WriteAllText($path, $text)
    return $path
  }
}

Describe 'release.yml trusted publishing' {
  It 'passes on the live workflow' {
    Get-ReleaseFindings $script:WorkflowPath | Should -BeNullOrEmpty
  }

  It 'keeps npm publish only in release.yml' {
    $publishing = @(Get-ChildItem -LiteralPath (Join-Path $script:RepoRoot '.github/workflows') -File |
        Where-Object { $_.Name -match '\.ya?ml$' -and (Test-NpmPublish ([System.IO.File]::ReadAllText($_.FullName))) } |
        ForEach-Object Name)
    $publishing | Should -Be @('release.yml')
  }

  It 'fails when <Name>' -ForEach @(
    @{ Name = 'id-token is removed'; Code = 'id-token'; Edits = @(@{ Old = "      id-token: write`n"; New = '' }) }
    @{ Name = 'id-token is commented out'; Code = 'id-token'; Edits = @(@{ Old = '      id-token: write'; New = '      # id-token: write' }) }
    @{ Name = 'id-token moves to the workflow level'; Code = 'id-token'; Edits = @(
        @{ Old = "      id-token: write`n"; New = '' }
        @{ Old = "permissions:`n  contents: read`n`njobs:"; New = "permissions:`n  contents: read`n  id-token: write`n`njobs:" }) }
    @{ Name = 'another job gets id-token'; Code = 'id-token'; Edits = @(@{ Old = "jobs:`n"; New = "jobs:`n  other:`n    runs-on: ubuntu-latest`n    permissions:`n      id-token: write`n    steps:`n      - run: echo other`n" }) }
    @{ Name = 'the job names NPM_TOKEN'; Code = 'token'; Edits = @(@{ Old = "    runs-on: ubuntu-latest`n"; New = "    runs-on: ubuntu-latest`n    env:`n      NPM_TOKEN: example`n" }) }
    @{ Name = 'the job names NODE_AUTH_TOKEN'; Code = 'token'; Edits = @(@{ Old = "    runs-on: ubuntu-latest`n"; New = "    runs-on: ubuntu-latest`n    env:`n      NODE_AUTH_TOKEN: example`n" }) }
    @{ Name = 'a push trigger is added'; Code = 'trigger'; Edits = @(@{ Old = "on:`n  workflow_dispatch:"; New = "on:`n  push:`n    branches:`n      - main`n  workflow_dispatch:" }) }
    @{ Name = 'dispatch becomes workflow_call'; Code = 'trigger'; Edits = @(@{ Old = 'workflow_dispatch:'; New = 'workflow_call:' }) }
    @{ Name = 'confirm is ship'; Code = 'confirm'; Edits = @(@{ Old = "confirm == 'publish'"; New = "confirm == 'ship'" }) }
    @{ Name = 'the job runs self-hosted'; Code = 'runner'; Edits = @(@{ Old = 'runs-on: ubuntu-latest'; New = 'runs-on: self-hosted' }) }
    @{ Name = 'Node.js is 24'; Code = 'node-version'; Edits = @(@{ Old = 'node-version: "26"'; New = 'node-version: "24"' }) }
    @{ Name = 'the npm gate accepts 11.5.0'; Code = 'npm-gate'; Edits = @(@{ Old = '$npmPatch -ge 1'; New = '$npmPatch -ge 0' }) }
    @{ Name = 'the npm gate is removed'; Code = 'npm-gate'; Edits = @(@{ Old = "          if (-not `$npmOk) {`n            Write-Error `"npm `$npmVersionText is below the trusted-publishing requirement 11.5.1.`"`n            exit 1`n          }`n"; New = '' }) }
    @{ Name = 'BRAID_RELEASE is renamed'; Code = 'publish-condition'; Edits = @(@{ Old = 'BRAID_RELEASE'; New = 'AGENTO_RELEASE'; All = $true }) }
    @{ Name = 'the condition uses -or'; Code = 'publish-condition'; Edits = @(@{ Old = '(-not $private) -and $allowed'; New = '(-not $private) -or $allowed' }) }
    @{ Name = 'npm publish is unconditional'; Code = 'publish-condition'; Edits = @(@{ Old = "        if: steps.publication.outputs.enabled == 'true'`n"; New = '' }) }
    @{ Name = 'npm publish gets no tarball'; Code = 'tarball'; Edits = @(@{ Old = "'--ignore-scripts', `$tarballs[0].FullName"; New = "'--ignore-scripts'" }) }
    @{ Name = 'a second job runs npm publish'; Code = 'publish-job'; Edits = @(@{ Old = "jobs:`n"; New = "jobs:`n  other:`n    runs-on: ubuntu-latest`n    steps:`n      - run: npm publish`n" }) }
  ) {
    $findings = @(Get-ReleaseFindings (New-EditedCopy $Edits))
    $findings | Where-Object { $_.StartsWith("${Code}:") } | Should -Not -BeNullOrEmpty -Because ($findings -join '; ')
  }

  It 'still passes with node-version <Value>' -ForEach @(
    @{ Value = '"26.13.0"' }
    @{ Value = '26' }
  ) {
    Get-ReleaseFindings (New-EditedCopy @(@{ Old = 'node-version: "26"'; New = "node-version: $Value" })) | Should -BeNullOrEmpty
  }

  It 'throws when the workflow is <Name>' -ForEach @(
    @{ Name = 'missing'; Text = $null }
    @{ Name = 'empty'; Text = '' }
    @{ Name = 'without jobs'; Text = "name: Release`non:`n  workflow_dispatch:`n" }
    @{ Name = 'tab-indented'; Text = "jobs:`n`trelease:`n" }
    @{ Name = 'in flow style'; Text = "jobs: { release: {} }`n" }
  ) {
    $path = Join-Path $TestDrive "$([guid]::NewGuid().ToString('n')).yml"
    if ($null -ne $Text) { [System.IO.File]::WriteAllText($path, $Text) }
    { Get-ReleaseFindings $path } | Should -Throw
  }
}
