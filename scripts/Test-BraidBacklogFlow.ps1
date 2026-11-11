# Checks the Backlog.md commands that the braid skills prescribe, without running agents.
# It installs the pinned backlog.md into temp folders (npm prefix; also an isolated Volta
# home when Volta is installed), finds the executable with the lookup quoted from
# .agents/skills/braid/assets/task.md, and replays the coordinator's and worker's command
# sequence in throwaway Git repositories with a local bare "origin". It then asserts the
# files and Git state. Run by hand: it downloads backlog.md, so it is not part of the gate.
# The installs, npm cache, Git config and profile variables all live in the temp folder, which is
# removed at the end (-Keep keeps it); the real Volta and npm installs are only read. It works from
# any current directory.
#Requires -Version 7.6
[CmdletBinding()]
param(
  [string]$RepositoryRoot = (Split-Path -Parent $PSScriptRoot),
  [switch]$SkipVolta,
  [switch]$Keep
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
Set-StrictMode -Version Latest
[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)

$skillDir = Join-Path $RepositoryRoot '.agents/skills/braid'
$taskDoc = Get-Content -Raw (Join-Path $skillDir 'assets/task.md')
$configTemplate = Join-Path $skillDir 'assets/backlog-config.yml'
$pin = [regex]::Match($taskDoc, 'npm install -g backlog\.md@([0-9.]+)').Groups[1].Value
$lookup = [regex]::Match($taskDoc, '(?s)## Call `backlog`.*?```powershell\r?\n(.*?)```').Groups[1].Value
if (-not $pin -or -not $lookup) { throw 'task.md: pinned version or lookup block not found' }

$work = Join-Path ([IO.Path]::GetTempPath()) ('braid-flow-' + [guid]::NewGuid().ToString('n'))
New-Item -ItemType Directory $work | Out-Null
$script:failures = 0
$script:checks = 0

function Check {
  param([bool]$Condition, [string]$Message)
  $script:checks++
  if ($Condition) { Write-Host "  ok   $Message" } else { $script:failures++; Write-Host "  FAIL $Message" -ForegroundColor Red }
}

function Invoke-Native {
  param([string]$Exe, [string[]]$CommandArguments)
  $out = & $Exe @CommandArguments 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0) { throw "$Exe $($CommandArguments -join ' ') exited ${LASTEXITCODE}: $out" }
  return $out
}

function GitRun { Invoke-Native 'git' (@('-C', $script:cwd) + $args) | Out-Null }
function GitText { (Invoke-Native 'git' (@('-C', $script:cwd) + $args)).Trim() }
function Invoke-Backlog { Push-Location $script:cwd; try { Invoke-Native $script:backlog $args } finally { Pop-Location } }
function Commit { param([string]$Message) GitRun add -A; GitRun commit -q -m $Message }
function TaskView { param([string]$Id) Invoke-Backlog task view $Id --plain }
function TaskFile { param([string]$Id) Get-Content -Raw (Get-ChildItem (Join-Path $script:cwd 'backlog/tasks') -Filter "$Id - *.md" | Select-Object -First 1).FullName }
function StatusOf { param([string]$Id) [regex]::Match((TaskFile $Id), '(?m)^status: (.+)$').Groups[1].Value.Trim() }
function MainHas { param([string]$Path) (GitText ls-tree -r --name-only main -- backlog/tasks) -match [regex]::Escape($Path) }

# A worktree on a new branch from origin/main, the way the skill creates a story.
function New-Worktree {
  param([string]$Name, [string]$Branch, [string]$From)
  $dir = Join-Path $script:repoRoot $Name
  GitRun worktree add -q -b $Branch $dir $From
  return $dir
}

function Install-Npm {
  $prefix = Join-Path $work 'npm'
  Invoke-Native 'npm' @('install', '-g', '--prefix', $prefix, "backlog.md@$pin", '--no-audit', '--no-fund') | Out-Null
  return $IsWindows ? $prefix : (Join-Path $prefix 'bin')
}

function Install-Volta {
  $home_ = Join-Path $work 'volta'
  $env:VOLTA_HOME = $home_
  Invoke-Native 'volta' @('install', "node@$script:nodeVersion", "backlog.md@$pin") | Out-Null
  return Join-Path $home_ 'bin'
}

function Find-Backlog {
  if (-not $IsWindows) { return 'backlog' }
  $found = (& ([scriptblock]::Create($lookup)) | Select-Object -Last 1)
  return [string]$found
}

function Test-Flow {
  param([string]$Label)
  Write-Host "`n== Flow under $Label =="
  $script:backlog = Find-Backlog
  Write-Host "  backlog: $script:backlog"
  Check ((Invoke-Native $script:backlog @('--version')).Trim() -eq $pin) "--version is $pin"
  if ($IsWindows) {
    Check ($script:backlog -like '*backlog.exe' -and (Test-Path $script:backlog)) 'lookup printed the native backlog.exe'
    Check ($script:backlog.StartsWith($work, [StringComparison]::OrdinalIgnoreCase)) 'the lookup resolved to this run''s own install, not another one on the machine'
  }

  $script:repoRoot = Join-Path $work ("flow-$Label")
  $origin = Join-Path $work "origin-$Label.git"
  $main = Join-Path $script:repoRoot 'main'
  New-Item -ItemType Directory $script:repoRoot | Out-Null
  Invoke-Native 'git' @('init', '-q', '--bare', '-b', 'main', $origin) | Out-Null
  Invoke-Native 'git' @('init', '-q', '-b', 'main', $main) | Out-Null
  $script:cwd = $main
  GitRun config user.name braid-flow
  GitRun config user.email braid-flow@example.invalid
  GitRun config core.autocrlf false
  New-Item -ItemType Directory (Join-Path $main 'backlog') | Out-Null
  (Get-Content -Raw $configTemplate).Replace('<project>', 'flow-check') | Set-Content -NoNewline (Join-Path $main 'backlog/config.yml')
  Commit 'chore: init'
  GitRun remote add origin $origin
  GitRun push -q -u origin main

  # --- 1. Planning branch: a parent with two subtasks ---
  Write-Host '[1] Planning branch'
  GitRun switch -q -c plan/demo
  $multi = @'
Goal: line one, with `code` and "quotes" & 50%.
Second line: Привет 汉字.

Change:
- `a.txt`: add it
'@
  Invoke-Backlog task create 'Demo goal' --labels 'kind:story,tier:M' --ordinal 10 --description $multi --ac 'Parent outcome one' --ac 'Parent outcome two' | Out-Null
  Invoke-Backlog task create 'First step' --parent task-1 --labels 'kind:task,tier:S' --ordinal 10 --description $multi --ac 'Step one works' | Out-Null
  Invoke-Backlog task create 'Second step' --parent task-1 --labels 'kind:task,tier:M,ui' --ordinal 20 --dep task-1.1 --description 'Second' --ac 'Step two works' --ac 'Step two tested' | Out-Null
  Commit 'docs(backlog): plan task-1'
  GitRun push -q -u origin plan/demo
  $view = TaskView task-1
  Check ($view -match 'Goal: line one, with `code` and "quotes" & 50%\.' -and $view -match 'Second line: Привет 汉字\.' -and $view -match 'a\.txt') 'multi-line description kept whole (both lines, quotes, backticks, Unicode)'
  Check ($view -match 'Parent outcome one' -and $view -match 'Parent outcome two') '--ac after a multi-line --description kept (two criteria)'
  $sub = TaskView task-1.2
  Check ($sub -match 'Parent: TASK-1' -and $sub -match 'Ordinal: 20' -and $sub -match 'kind:task, tier:M, ui' -and $sub -match 'TASK-1\.1') 'subtask has parent, ordinal, labels and dependency'
  $ready = Invoke-Backlog task list --plain --ready -s 'To Do' -p task-1
  Check ($ready -match 'TASK-1\.1' -and $ready -notmatch 'TASK-1\.2') '--ready -s To Do -p lists only the first subtask'
  Check ((Invoke-Backlog doctor) -match 'No duplicate IDs') 'doctor is clean'
  GitRun switch -q main
  GitRun merge -q --no-ff plan/demo -m 'Merge pull request #1 from plan/demo'
  GitRun push -q origin main
  Check ((MainHas 'task-1 - ') -and (MainHas 'task-1.1 - ') -and (MainHas 'task-1.2 - ')) 'planning merged: all three tasks on main'

  # --- 2. Story: created on a new branch, worked by a worker, merged ---
  Write-Host '[2] Story'
  GitRun fetch -q
  $tmp = New-Worktree 'tmp-story' 'new-story' 'origin/main'
  $script:cwd = $tmp
  $created = Invoke-Backlog task create 'Lone story' --labels 'kind:story,tier:S' --ordinal 30 --description 'Story goal' --ac 'Works'
  $storyId = [regex]::Match($created, 'Created task (TASK-\d+)').Groups[1].Value.ToLower()
  Check ($storyId -eq 'task-2') "story got the next ID ($storyId)"
  GitRun branch -m "item/$storyId-lone-story"
  Commit "docs(backlog): plan $storyId"
  GitRun push -q -u origin "item/$storyId-lone-story"
  $script:cwd = $main
  GitRun worktree remove --force $tmp
  $worker = Join-Path $script:repoRoot 'worker-story'
  GitRun worktree add -q $worker "item/$storyId-lone-story"
  $script:cwd = $worker
  Invoke-Backlog task edit $storyId -s 'In Progress' | Out-Null
  Commit "docs(backlog): $storyId in progress"
  Invoke-Backlog task edit $storyId --plan @'
1. Write `a.txt`.
2. Check it.
'@ | Out-Null
  Invoke-Backlog task edit $storyId --append-notes 'Found X; decided Y.' | Out-Null
  Set-Content (Join-Path $worker 'a.txt') 'work'
  Commit 'feat: the work'
  Invoke-Backlog task edit $storyId --check-ac 1 --check-dod 1 --check-dod 2 | Out-Null
  Invoke-Backlog task edit $storyId --final-summary @'
Changed `a.txt`.
Validated by hand: "ok" & 100%.
'@ | Out-Null
  Invoke-Backlog task edit $storyId -s Done | Out-Null
  Commit "docs(backlog): $storyId done"
  GitRun push -q
  $file = TaskFile $storyId
  Check ($file -match '(?m)^status: Done' -and $file -match '- \[x\] #1 Works' -and $file -match '- \[x\] #2 Final summary' -and $file -match '1\. Write `a\.txt`\.\r?\n2\. Check it\.' -and $file -match 'Found X; decided Y\.' -and $file -match 'Validated by hand: "ok" & 100%\.') 'worker branch: Done, boxes checked, and the plan, notes and final summary written as sent'
  $script:cwd = $main
  Check (-not (MainHas "$storyId - ")) 'before the merge main has no copy of the story file'
  GitRun merge -q --no-ff "item/$storyId-lone-story" -m 'Merge pull request #2'
  GitRun push -q origin main
  $v = TaskView $storyId
  Check ($v -match 'Status: .*Done' -and $v -match 'Validated by hand') 'after the merge main shows Done with the final summary'
  GitRun worktree remove --force $worker

  # --- 3. Growth: a running story gets phases and a prerequisite ---
  Write-Host '[3] Growth'
  GitRun fetch -q
  $tmp = New-Worktree 'tmp-grow' 'new-grow' 'origin/main'
  $script:cwd = $tmp
  $created = Invoke-Backlog task create 'Growing story' --labels 'kind:story,tier:M' --ordinal 40 --description 'Grows' --ac 'All done'
  $growId = [regex]::Match($created, 'Created task (TASK-\d+)').Groups[1].Value.ToLower()
  GitRun branch -m "item/$growId-growing-story"
  Commit "docs(backlog): plan $growId"
  GitRun push -q -u origin "item/$growId-growing-story"
  $script:cwd = $main
  GitRun worktree remove --force $tmp
  $grow = Join-Path $script:repoRoot 'worker-grow'
  GitRun worktree add -q $grow "item/$growId-growing-story"
  $script:cwd = $grow
  Invoke-Backlog task edit $growId -s 'In Progress' | Out-Null
  Invoke-Backlog task edit $growId --append-notes 'Found more work: phases.' | Out-Null
  Commit "docs(backlog): $growId in progress, notes"
  GitRun push -q
  # Another story planned meanwhile from main must not reuse the running story's ID.
  GitRun fetch -q
  $tmp = New-Worktree 'tmp-other' 'new-other' 'origin/main'
  $script:cwd = $tmp
  $other = Invoke-Backlog task create 'Other story' --labels 'kind:story,tier:S' --ordinal 50 --description 'Other' --ac 'Fine'
  $otherId = [regex]::Match($other, 'Created task (TASK-\d+)').Groups[1].Value.ToLower()
  Check ($otherId -ne $growId) "a new story planned while $growId is unmerged gets its own ID ($otherId)"
  $script:cwd = $main
  GitRun worktree remove --force $tmp
  GitRun branch -D new-other | Out-Null
  # Coordinator: epic branch at the story branch tip, subtasks added on it.
  $growNum = $growId.Substring(5)
  $parent = "TASK-$growNum"
  $epicBranch = "epic/$growId-growing-story"
  $epic = New-Worktree 'epic' $epicBranch "item/$growId-growing-story"
  $script:cwd = $epic
  GitRun push -q -u origin $epicBranch
  Invoke-Backlog task edit $growId --append-notes 'Phases: reason.' | Out-Null
  Invoke-Backlog task create 'Phase one' --parent $growId --labels 'kind:task,tier:S' --ordinal 10 --description 'Phase one' --ac 'P1' | Out-Null
  Invoke-Backlog task create 'Phase two' --parent $growId --labels 'kind:task,tier:S' --ordinal 20 --dep "$growId.1" --description 'Phase two' --ac 'P2' | Out-Null
  Commit "docs(backlog): $growId phases: add $growId.1, $growId.2"
  GitRun push -q
  Check ((Invoke-Backlog task list --plain -p $growId) -match "TASK-$growNum\.2") 'phases listed under the parent'
  # Both phase workers start before the prerequisite exists.
  $w1 = New-Worktree 'worker-p1' "item/$growId.1-phase-one" $epicBranch
  $script:cwd = $w1
  Invoke-Backlog task edit "$growId.1" -s 'In Progress' | Out-Null
  Commit "docs(backlog): $growId.1 in progress"
  $w2 = New-Worktree 'worker-p2' "item/$growId.2-phase-two" $epicBranch
  $script:cwd = $w2
  Invoke-Backlog task edit "$growId.2" -s 'In Progress' | Out-Null
  Invoke-Backlog task edit "$growId.2" --append-notes 'Stopped: needs a prerequisite.' | Out-Null
  Commit "docs(backlog): $growId.2 in progress, stopped for a prerequisite"
  # Subtask 2 finds a prerequisite; the coordinator adds it on the epic branch.
  $script:cwd = $epic
  Invoke-Backlog task create 'Prerequisite' --parent $growId --labels 'kind:task,tier:S' --ordinal 15 --description 'Prereq' --ac 'PR' | Out-Null
  Commit "docs(backlog): $growId prerequisite"
  GitRun push -q
  $ids = [regex]::Matches((Invoke-Backlog task list --plain -p $growId), 'TASK-\d+\.\d+') | ForEach-Object { $_.Value } | Sort-Object -Unique
  Check ($ids.Count -eq 3) "three subtasks with unique IDs ($($ids -join ', '))"
  $preId = (($ids | Where-Object { $_ -notin @("$parent.1", "$parent.2") }) | Select-Object -First 1).ToLower()
  # The worker of subtask 2 merges the epic branch (which brings in the prerequisite), then adds
  # the dependency, repeating the old one.
  $script:cwd = $w2
  $preFile = Join-Path $w2 "backlog/tasks/$preId - Prerequisite.md"
  Check (-not (Test-Path $preFile)) 'before the merge the worker branch has no prerequisite'
  GitRun fetch -q
  GitRun merge -q --no-edit "origin/$epicBranch"
  Check (Test-Path $preFile) 'merging the epic branch brought the prerequisite in'
  Invoke-Backlog task edit "$growId.2" --dep "$growId.1,$preId" | Out-Null
  $v = TaskView "$growId.2"
  Check ($v -match "$parent\.1" -and $v -match [regex]::Escape($preId.ToUpper())) 'subtask 2 depends on its old dependency and the prerequisite'
  Check ((Invoke-Backlog doctor) -match 'No duplicate IDs') 'doctor is clean after the dependency edit'
  Commit "docs(backlog): $growId.2 waits for $preId"
  GitRun push -q -u origin "item/$growId.2-phase-two"
  # Each remaining item is a worker branch: Done with a final summary, merged into the epic.
  # Subtask 2 resumes only after the prerequisite and subtask 1 are merged.
  $prereqDir = New-Worktree 'worker-pre' "item/$preId-prerequisite" $epicBranch
  foreach ($item in @(
      @{ Dir = $prereqDir; Id = $preId; Branch = "item/$preId-prerequisite"; Start = $true },
      @{ Dir = $w1; Id = "$growId.1"; Branch = "item/$growId.1-phase-one"; Start = $false })) {
    $script:cwd = $item.Dir
    if ($item.Start) { Invoke-Backlog task edit $item.Id -s 'In Progress' | Out-Null; Commit "docs(backlog): $($item.Id) in progress" }
    Invoke-Backlog task edit $item.Id --final-summary "Finished $($item.Id)." | Out-Null
    Invoke-Backlog task edit $item.Id -s Done | Out-Null
    Commit "docs(backlog): $($item.Id) done"
    GitRun push -q -u origin $item.Branch
    $script:cwd = $epic
    GitRun merge -q --no-ff $item.Branch -m "Merge pull request from $($item.Branch)"
    GitRun push -q
  }
  $script:cwd = $w2
  GitRun fetch -q
  GitRun merge -q --no-edit "origin/$epicBranch"
  Check ((StatusOf $preId) -eq 'Done' -and (StatusOf "$growId.1") -eq 'Done') 'subtask 2 resumes with the prerequisite and subtask 1 Done on its branch'
  Invoke-Backlog task edit "$growId.2" --final-summary "Finished $growId.2." | Out-Null
  Invoke-Backlog task edit "$growId.2" -s Done | Out-Null
  Commit "docs(backlog): $growId.2 done"
  GitRun push -q
  $script:cwd = $epic
  GitRun merge -q --no-ff "item/$growId.2-phase-two" -m 'Merge pull request from the phase two branch'
  Invoke-Backlog task edit $growId -s Done --append-notes 'Closed.' | Out-Null
  Commit "docs(backlog): $growId done"
  GitRun merge -q --no-edit main
  GitRun push -q
  $script:cwd = $main
  GitRun merge -q --no-ff $epicBranch -m 'Merge pull request #3 from epic'
  GitRun push -q origin main
  $all = @($growId, "$growId.1", "$growId.2", $preId) | ForEach-Object { StatusOf $_ }
  Check (@($all | Where-Object { $_ -eq 'Done' }).Count -eq 4) 'the final merge brings every status to main (parent and three subtasks Done)'
  $allIds = Get-ChildItem (Join-Path $main 'backlog/tasks') -Filter 'task-*.md' | ForEach-Object { ($_.Name -split ' - ')[0] }
  Check (@($allIds).Count -eq @($allIds | Sort-Object -Unique).Count) 'no duplicate IDs on main'
  Check ((Invoke-Backlog doctor) -match 'No duplicate IDs') 'doctor is clean on main'

  # --- 4. Multi-line text and options after it, in one command each ---
  Write-Host '[4] Multi-line fields followed by more options'
  $tmp = New-Worktree 'tmp-multi' 'multi' 'main'
  $script:cwd = $tmp
  $text = "First line`nSecond line with `` ` `` and `"quotes`"`nТретья строка 汉字"
  $made = Invoke-Backlog task create 'Multi' --labels 'kind:task,tier:S' --description $text --ac 'Kept after text' --ac 'Second kept'
  $multiId = [regex]::Match($made, 'Created task (TASK-\d+)').Groups[1].Value.ToLower()
  Invoke-Backlog task edit $multiId --plan $text --append-notes 'Note after plan' --check-ac 2 -s 'In Progress' | Out-Null
  Invoke-Backlog task edit $multiId --final-summary $text --check-dod 1 | Out-Null
  $f = TaskFile $multiId
  Check (([regex]::Matches($f, [regex]::Escape('Третья строка 汉字'))).Count -eq 3) 'description, plan and final summary each keep all three lines'
  Check ($f -match '(?m)^status: In Progress' -and $f -match '- \[x\] #2 Second kept' -and $f -match 'Note after plan' -and $f -match '- \[x\] #1 The gate') 'options after a multi-line field (--append-notes, --check-ac, -s, --check-dod) all applied'
  $script:cwd = $main
  GitRun worktree remove --force $tmp
  GitRun branch -D multi

  Check ((GitText status --porcelain) -eq '') 'main checkout is clean'
}

try {
  $savedPath = $env:PATH
  $savedVolta = $env:VOLTA_HOME
  $savedCache = $env:npm_config_cache
  $savedLocation = Get-Location
  $sep = [IO.Path]::PathSeparator
  # Resolve Node once, before any VOLTA_HOME or PATH change, so the script works from any directory.
  $hasVolta = $IsWindows -and [bool](Get-Command volta -ErrorAction SilentlyContinue)
  $nodeExe = $hasVolta ? (volta which node 2>$null) : $null
  if (-not $nodeExe) { $nodeExe = (Get-Command node -ErrorAction Stop).Source }
  $nodeDir = Split-Path $nodeExe
  $script:nodeVersion = (& $nodeExe -v).Trim().TrimStart('v')
  if (-not $script:nodeVersion) { throw "could not run node from $nodeExe" }
  Set-Location $work
  $env:npm_config_cache = Join-Path $work 'npm-cache'
  $noVoltaPath = (($savedPath -split [regex]::Escape($sep)) | Where-Object { $_ -and $_ -notmatch '(?i)[\\/]volta([\\/]bin)?[\\/]?$' }) -join $sep

  # npm flow PATH: the npm-prefix install, the real Node itself (no Volta shim), no Volta at all.
  $env:PATH = $nodeDir + $sep + $noVoltaPath
  $env:VOLTA_HOME = $null
  $npmPath = (Install-Npm) + $sep + $env:PATH
  $voltaPath = $null
  if (-not $SkipVolta -and $hasVolta) {
    $env:PATH = $savedPath
    $voltaPath = (Install-Volta) + $sep + $savedPath
    $voltaHome = $env:VOLTA_HOME
  } else {
    Write-Host 'Volta not used (not installed, not Windows, or -SkipVolta).'
  }

  # Isolate the flow's processes from the real profile.
  $fakeHome = Join-Path $work 'home'
  New-Item -ItemType Directory $fakeHome | Out-Null
  $saved = @{}
  foreach ($n in 'HOME', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA', 'XDG_CONFIG_HOME', 'XDG_DATA_HOME', 'XDG_CACHE_HOME', 'GIT_CONFIG_GLOBAL', 'GIT_CONFIG_NOSYSTEM', 'EDITOR', 'VISUAL') { $saved[$n] = [Environment]::GetEnvironmentVariable($n) }
  try {
    foreach ($n in 'HOME', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA', 'XDG_CONFIG_HOME', 'XDG_DATA_HOME', 'XDG_CACHE_HOME') { Set-Item "env:$n" $fakeHome }
    $env:GIT_CONFIG_GLOBAL = Join-Path $fakeHome 'gitconfig'
    $env:GIT_CONFIG_NOSYSTEM = '1'
    $env:EDITOR = $null; $env:VISUAL = $null
    $env:VOLTA_HOME = $null
    $env:PATH = $npmPath
    Test-Flow 'npm'
    if ($voltaPath) {
      $env:VOLTA_HOME = $voltaHome
      $env:PATH = $voltaPath
      Test-Flow 'volta'
    }
  } finally {
    foreach ($n in $saved.Keys) { [Environment]::SetEnvironmentVariable($n, $saved[$n]) }
    $env:PATH = $savedPath
    $env:VOLTA_HOME = $savedVolta
    $env:npm_config_cache = $savedCache
    Set-Location $savedLocation
  }
} catch {
  Write-Host "ABORTED before all checks ran: $($_.Exception.Message)`n$($_.ScriptStackTrace)" -ForegroundColor Red
  Check $false "script aborted: $($_.Exception.Message)"
} finally {
  if ($Keep) { Write-Host "Kept: $work" } else {
    # Worktrees mark their files read-only on some platforms; retry once after clearing it.
    try { Remove-Item $work -Recurse -Force } catch { Get-ChildItem $work -Recurse -Force | ForEach-Object { try { $_.Attributes = 'Normal' } catch {} }; Remove-Item $work -Recurse -Force -ErrorAction Continue }
  }
}

Write-Host "`n$($script:checks - $script:failures) of $($script:checks) checks passed."
if ($script:failures -gt 0) { exit 1 }
