# Exercise-local static validation. Does not execute product/setup/build commands.
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$planRoot = [IO.Path]::GetFullPath($PSScriptRoot)
$repoRoot = [IO.Path]::GetFullPath((Join-Path $planRoot '../../../../..'))
$utf8 = [Text.UTF8Encoding]::new($false)
$newline = [string][char]10
$inventory = Get-Content -Raw -LiteralPath (Join-Path $planRoot 'evidence/inventory.json') | ConvertFrom-Json
$before = Get-Content -Raw -LiteralPath (Join-Path $planRoot 'evidence/preservation-before.json') | ConvertFrom-Json
$checks = [Collections.Generic.List[string]]::new()
$sourceReads = @($inventory.SourceContentReads)
$writePaths = @($inventory.GeneratedReadsAndWrites)
$checkedLinks = 0
$checkedAnchors = 0
$oldOptionalLocks = $env:GIT_OPTIONAL_LOCKS
$env:GIT_OPTIONAL_LOCKS = '0'
function Assert-Plan {
  param([bool]$Condition, [string]$Message)
  if (-not $Condition) { throw $Message }
}
function Read-Allowed {
  param([string]$Path)
  $relative = [IO.Path]::GetRelativePath($repoRoot, $Path).Replace('\', '/')
  Assert-Plan (($sourceReads -contains $relative) -or ($writePaths -contains $relative)) "Read outside inventory: $relative"
  return [IO.File]::ReadAllText($Path)
}
function Invoke-ReadGit {
  param([string[]]$Arguments)
  $result = @(& git -C $repoRoot @Arguments)
  if ($LASTEXITCODE -ne 0) { throw "Git read failed: $Arguments (exit $LASTEXITCODE)" }
  return $result
}
try {
  $expected = @($writePaths | Sort-Object)
  $actual = @(Get-ChildItem -LiteralPath $planRoot -Recurse -File | ForEach-Object {
    [IO.Path]::GetRelativePath($repoRoot, $_.FullName).Replace('\', '/')
  } | Sort-Object)
  Assert-Plan (($expected -join $newline) -ceq ($actual -join $newline)) 'Generated file inventory mismatch'
  $checks.Add("Exact generated inventory: $($actual.Count) files")
  $markdown = @(Get-ChildItem -LiteralPath $planRoot -Recurse -File -Filter '*.md')
  foreach ($file in $markdown) {
    $body = Read-Allowed $file.FullName
    Assert-Plan ($body.StartsWith('# ')) "Missing H1: $($file.Name)"
    Assert-Plan (-not [regex]::IsMatch($body, '(?m)[ \t]+$')) "Trailing whitespace: $($file.Name)"
    Assert-Plan (-not $body.Contains([string][char]9)) "Tab formatting: $($file.Name)"
    $fences = [regex]::Matches($body, '(?m)^' + [char]96 + [char]96 + [char]96).Count
    Assert-Plan (($fences % 2) -eq 0) "Unbalanced fences: $($file.Name)"
    Assert-Plan (-not [regex]::IsMatch($body, '<ID>|<path>|<task>|TODO|TBD|\{repo\}')) "Unresolved template marker: $($file.Name)"
    foreach ($match in [regex]::Matches($body, '\[[^\]]+\]\(([^)\s]+)\)')) {
      $target = $match.Groups[1].Value
      Assert-Plan (-not ($target -match '^[a-zA-Z]+:')) "Unexpected external link: $target"
      $parts = $target.Split('#', 2)
      $targetPath = if ($parts[0] -eq '') { $file.FullName } else {
        [IO.Path]::GetFullPath((Join-Path $file.DirectoryName $parts[0]))
      }
      $relativeTarget = [IO.Path]::GetRelativePath($repoRoot, $targetPath).Replace('\', '/')
      Assert-Plan (($sourceReads -contains $relativeTarget) -or ($writePaths -contains $relativeTarget)) "Link outside allowed context: $target"
      Assert-Plan (Test-Path -LiteralPath $targetPath -PathType Leaf) "Broken link: $($file.Name) -> $target"
      $checkedLinks++
      if ($parts.Count -eq 2) {
        $targetBody = Read-Allowed $targetPath
        $anchors = @([regex]::Matches($targetBody, '(?m)^#{1,6}\s+(.+?)\r?$') | ForEach-Object {
          $_.Groups[1].Value.ToLowerInvariant() -replace '[^\p{L}\p{N}_\s-]', '' -replace '\s', '-'
        })
        Assert-Plan ($anchors -contains $parts[1]) "Missing anchor: $target"
        $checkedAnchors++
      }
    }
  }
  $checks.Add("Markdown formatting: $($markdown.Count) files; relative links: $checkedLinks; anchors: $checkedAnchors")
  $epicBody = Read-Allowed (Join-Path $planRoot 'epic.md')
  foreach ($section in @('Problem and beneficiary','Outcomes and success measures','Scope and non-goals','Analysis','Features and prioritized backlog','Review gates','Definition of Ready and Definition of Done','Decisions and open questions','Delivery evidence and release checklist')) {
    Assert-Plan ($epicBody.Contains("## $section")) "Missing epic section: $section"
  }
  $items = @('A-find-prerequisites','B-first-local-run','C-troubleshoot-setup')
  $dependencies = @('none', 'A', 'A, B')
  $foundItems = @(Get-ChildItem -LiteralPath (Join-Path $planRoot 'backlog') -File | Sort-Object Name)
  Assert-Plan (($foundItems.BaseName -join ',') -ceq ($items -join ',')) 'Backlog sequence/filename mismatch'
  for ($i = 0; $i -lt $items.Count; $i++) {
    $body = Read-Allowed (Join-Path $planRoot "backlog/$($items[$i]).md")
    $id = $items[$i].Split('-')[0]
    Assert-Plan ($body.StartsWith(('# {0}:' -f $id))) "Title ID mismatch: $id"
    Assert-Plan ($body.Contains("Depends on: $($dependencies[$i]).")) "Dependency mismatch: $id"
    Assert-Plan ($body.Contains('Status: backlog.')) "Incorrect approval/status claim: $id"
    Assert-Plan ($epicBody.Contains("| $id | story |")) "Missing epic row: $id"
    foreach ($section in @('Read first','Value or research question','Scope and non-goals','Acceptance criteria','Implementation or research tasks','Ownership and verification','Review gates','Delivery record','Report and resume')) {
      Assert-Plan ($body.Contains("## $section")) "Missing $id section: $section"
    }
    $criteria = [regex]::Match($body, '(?s)## Acceptance criteria\s+(.*?)\s+## Implementation').Groups[1].Value
    Assert-Plan ([regex]::Matches($criteria, '(?m)^\d+\. ').Count -ge 3) "Insufficient testable criteria: $id"
  }
  $checks.Add('Epic/template structure; sequential IDs A/B/C; dependencies none/A/A,B; three backlog stories with criteria and future gate fields')
  $package = (Read-Allowed (Join-Path $repoRoot 'package.json')) | ConvertFrom-Json
  Assert-Plan ($package.engines.node -ceq '>=26.13.0 <27') 'Node engine source changed'
  Assert-Plan ($package.bin.agento -ceq 'dist/cli.js') 'Compiled bin source changed'
  Assert-Plan ($package.version -ceq '0.1.0') 'Version source changed'
  Assert-Plan ($package.private -eq $true) 'Private package source changed'
  $scripts = @{
    typecheck = 'tsc -p tsconfig.json --noEmit'
    build = 'tsc -p tsconfig.build.json'
    test = 'node --test --test-reporter spec test'
    verify = 'pwsh -NoProfile -File ./scripts/Verify.ps1'
    'package:proof' = 'pwsh -NoProfile -File ./scripts/Test-Package.ps1'
  }
  foreach ($name in $scripts.Keys) {
    Assert-Plan ($package.scripts.$name -ceq $scripts[$name]) "Script reference mismatch: $name"
  }
  foreach ($name in @('start','dev','doctor','setup')) {
    Assert-Plan ($package.scripts.PSObject.Properties.Name -notcontains $name) "Excluded script now exists: $name"
  }
  Assert-Plan ((Read-Allowed (Join-Path $repoRoot '.npmrc')).Trim() -ceq 'engine-strict=true') 'Engine guard source changed'
  $installer = Read-Allowed (Join-Path $repoRoot 'scripts/Install-NodeToolchain.ps1')
  Assert-Plan ($installer.Contains("AgentoNodeVersion = '26.13.0'")) 'Pinned Node source changed'
  Assert-Plan ($installer.Contains('#Requires -Version 7.6')) 'PowerShell minimum source changed'
  $checks.Add('Static source references: five npm scripts, four absent shortcuts, engine/bin/version/private/engine-strict and toolchain pins')
  $head = (Invoke-ReadGit @('rev-parse','HEAD')) -join ''
  $branch = (Invoke-ReadGit @('symbolic-ref','--quiet','--short','HEAD')) -join ''
  $indexPath = (Invoke-ReadGit @('rev-parse','--git-path','index')) -join ''
  $status = @(Invoke-ReadGit @('status','--porcelain=v1','--untracked-files=all'))
  & git -C $repoRoot diff --no-ext-diff --quiet
  $trackedCode = $LASTEXITCODE
  & git -C $repoRoot diff --cached --no-ext-diff --quiet
  $cachedCode = $LASTEXITCODE
  & git -C $repoRoot diff --check
  $whitespaceCode = $LASTEXITCODE
  $indexHash = (Get-FileHash -LiteralPath $indexPath -Algorithm SHA256).Hash
  Assert-Plan ($head -ceq $before.Head) 'HEAD changed'
  Assert-Plan ($branch -ceq $before.Branch) 'Branch changed'
  Assert-Plan ($indexHash -ceq $before.IndexSHA256) 'Index bytes changed'
  Assert-Plan (($trackedCode -eq 0) -and ($cachedCode -eq 0) -and ($whitespaceCode -eq 0)) 'Tracked/index diff or whitespace error'
  foreach ($line in $status) {
    Assert-Plan ($line.StartsWith('?? ')) "Non-additive working tree change: $line"
    Assert-Plan ($writePaths -contains $line.Substring(3)) "Change outside generated inventory: $line"
  }
  Assert-Plan ($status.Count -eq $writePaths.Count) 'Expected every generated file to be newly untracked'
  $checks.Add("Preservation: HEAD/branch/index SHA-256 unchanged; tracked/index diffs zero; $($status.Count) untracked files exactly in assigned inventory")
  $after = [ordered]@{
    Head=$head; Branch=$branch; IndexPath=$indexPath; IndexSHA256=$indexHash
    TrackedDiffExitCode=$trackedCode; CachedDiffExitCode=$cachedCode; TrackedWhitespaceExitCode=$whitespaceCode
    Status=$status; GeneratedFileCount=$actual.Count
    Scope='Only new untracked files in assigned validation root; no product commands executed.'
  }
  [IO.File]::WriteAllText((Join-Path $planRoot 'evidence/preservation-after.json'), (($after | ConvertTo-Json -Depth 6) + $newline), $utf8)
  $result = [ordered]@{
    Status='pass'; SourceHead=$head; CheckKind='Local static plan validation only'
    MarkdownFiles=$markdown.Count; RelativeLinks=$checkedLinks; HeadingAnchors=$checkedAnchors
    Results=@($checks); ProductCommandsExecuted=@(); ExternalServicesContacted=@()
    Limits='No runtime, dependency, failure-reproduction, hosted-CI, independent-review, merge, or release proof.'
  }
  [IO.File]::WriteAllText((Join-Path $planRoot 'evidence/checks.json'), (($result | ConvertTo-Json -Depth 6) + $newline), $utf8)
  $result | ConvertTo-Json -Depth 6
} finally {
  $env:GIT_OPTIONAL_LOCKS = $oldOptionalLocks
}
