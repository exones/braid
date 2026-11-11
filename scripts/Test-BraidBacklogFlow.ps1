# Checks the Backlog.md commands that the braid skills prescribe, without running agents.
# It installs the pinned backlog.md into temp folders (npm prefix; also an isolated Volta
# home when Volta is installed), finds the executable with the lookup quoted from
# .agents/skills/braid/assets/task.md, and replays the coordinator's and worker's command
# sequence in throwaway Git repositories with a local bare "origin". It then asserts the
# files and Git state. Run by hand: it downloads backlog.md, so it is not part of the gate.
# Nothing outside the temp folder is touched; the folder is removed at the end (-Keep keeps it).
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
function Backlog { Push-Location $script:cwd; try { Invoke-Native $script:backlog $args } finally { Pop-Location } }
function Commit { param([string]$Message) GitRun add -A; GitRun commit -q -m $Message }
function TaskView { param([string]$Id) Backlog task view $Id --plain }
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
  Invoke-Native 'volta' @('install', "node@$((node -v).TrimStart('v'))", "backlog.md@$pin") | Out-Null
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
  if ($IsWindows) { Check ($script:backlog -like '*backlog.exe' -and (Test-Path $script:backlog)) 'lookup printed the native backlog.exe' }

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
  Backlog task create 'Demo goal' --labels 'kind:story,tier:M' --ordinal 10 --description $multi --ac 'Parent outcome one' --ac 'Parent outcome two' | Out-Null
  Backlog task create 'First step' --parent task-1 --labels 'kind:task,tier:S' --ordinal 10 --description $multi --ac 'Step one works' | Out-Null
  Backlog task create 'Second step' --parent task-1 --labels 'kind:task,tier:M,ui' --ordinal 20 --dep task-1.1 --description 'Second' --ac 'Step two works' --ac 'Step two tested' | Out-Null
  Commit 'docs(backlog): plan task-1'
  GitRun push -q -u origin plan/demo
  $view = TaskView task-1
  Check ($view -match 'Goal: line one, with `code` and "quotes" & 50%\.' -and $view -match 'Second line: Привет 汉字\.' -and $view -match 'a\.txt') 'multi-line description kept whole (both lines, quotes, backticks, Unicode)'
  Check ($view -match 'Parent outcome one' -and $view -match 'Parent outcome two') '--ac after a multi-line --description kept (two criteria)'
  $sub = TaskView task-1.2
  Check ($sub -match 'Parent: TASK-1' -and $sub -match 'Ordinal: 20' -and $sub -match 'kind:task, tier:M, ui' -and $sub -match 'TASK-1\.1') 'subtask has parent, ordinal, labels and dependency'
  $ready = Backlog task list --plain --ready -s 'To Do' -p task-1
  Check ($ready -match 'TASK-1\.1' -and $ready -notmatch 'TASK-1\.2') '--ready -s To Do -p lists only the first subtask'
  Check ((Backlog doctor) -match 'No duplicate IDs') 'doctor is clean'
  GitRun switch -q main
  GitRun merge -q --no-ff plan/demo -m 'Merge pull request #1 from plan/demo'
  Check ((StatusOf task-1.2) -eq 'To Do' -and (MainHas 'task-1.2 - ')) 'planning merged: all three tasks on main'

  # --- 2. Story: created on a new branch, worked by a worker, merged ---
  Write-Host '[2] Story'
  GitRun fetch -q
  $tmp = New-Worktree 'tmp-story' 'new-story' 'origin/main'
  $script:cwd = $tmp
  $created = Backlog task create 'Lone story' --labels 'kind:story,tier:S' --ordinal 30 --description 'Story goal' --ac 'Works'
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
  Backlog task edit $storyId -s 'In Progress' | Out-Null
  Commit "docs(backlog): $storyId in progress"
  Backlog task edit $storyId --plan @'
1. Write `a.txt`.
2. Check it.
'@ | Out-Null
  Backlog task edit $storyId --append-notes 'Found X; decided Y.' | Out-Null
  Set-Content (Join-Path $worker 'a.txt') 'work'
  Commit 'feat: the work'
  Backlog task edit $storyId --check-ac 1 --check-dod 1 --check-dod 2 | Out-Null
  Backlog task edit $storyId --final-summary @'
Changed `a.txt`.
Validated by hand: "ok" & 100%.
'@ | Out-Null
  Backlog task edit $storyId -s Done | Out-Null
  Commit "docs(backlog): $storyId done"
  GitRun push -q
  $file = TaskFile $storyId
  Check ($file -match '(?m)^status: Done' -and $file -match '- \[x\] #1 Works' -and $file -match '- \[x\] #2 Final summary' -and $file -match 'Found X; decided Y\.' -and $file -match 'Validated by hand: "ok" & 100%\.') 'worker branch: Done, boxes checked, plan, notes and final summary written'
  $script:cwd = $main
  Check (-not (MainHas "$storyId - ")) 'before the merge main has no copy of the story file'
  GitRun merge -q --no-ff "item/$storyId-lone-story" -m 'Merge pull request #2'
  $v = TaskView $storyId
  Check ($v -match 'Status: .*Done' -and $v -match 'Validated by hand') 'after the merge main shows Done with the final summary'
  GitRun worktree remove --force $worker

  # --- 3. Growth: a running story gets phases and a prerequisite ---
  Write-Host '[3] Growth'
  GitRun fetch -q
  $tmp = New-Worktree 'tmp-grow' 'new-grow' 'origin/main'
  $script:cwd = $tmp
  $created = Backlog task create 'Growing story' --labels 'kind:story,tier:M' --ordinal 40 --description 'Grows' --ac 'All done'
  $growId = [regex]::Match($created, 'Created task (TASK-\d+)').Groups[1].Value.ToLower()
  GitRun branch -m "item/$growId-growing-story"
  Commit "docs(backlog): plan $growId"
  GitRun push -q -u origin "item/$growId-growing-story"
  $script:cwd = $main
  GitRun worktree remove --force $tmp
  $grow = Join-Path $script:repoRoot 'worker-grow'
  GitRun worktree add -q $grow "item/$growId-growing-story"
  $script:cwd = $grow
  Backlog task edit $growId -s 'In Progress' | Out-Null
  Backlog task edit $growId --append-notes 'Found more work: phases.' | Out-Null
  Commit "docs(backlog): $growId in progress, notes"
  GitRun push -q
  # Another story planned meanwhile from main must not reuse the running story's ID.
  GitRun fetch -q
  $tmp = New-Worktree 'tmp-other' 'new-other' 'origin/main'
  $script:cwd = $tmp
  $other = Backlog task create 'Other story' --labels 'kind:story,tier:S' --ordinal 50 --description 'Other' --ac 'Fine'
  $otherId = [regex]::Match($other, 'Created task (TASK-\d+)').Groups[1].Value.ToLower()
  Check ($otherId -ne $growId) "a new story planned while $growId is unmerged gets its own ID ($otherId)"
  $script:cwd = $main
  GitRun worktree remove --force $tmp
  GitRun branch -D new-other | Out-Null
  # Coordinator: epic branch at the story branch tip, subtasks added on it.
  $epicBranch = "epic/$growId-growing-story"
  $epic = New-Worktree 'epic' $epicBranch "item/$growId-growing-story"
  $script:cwd = $epic
  GitRun push -q -u origin $epicBranch
  Backlog task edit $growId --append-notes 'Phases: reason.' | Out-Null
  Backlog task create 'Phase one' --parent $growId --labels 'kind:task,tier:S' --ordinal 10 --description 'Phase one' --ac 'P1' | Out-Null
  Backlog task create 'Phase two' --parent $growId --labels 'kind:task,tier:S' --ordinal 20 --dep "$growId.1" --description 'Phase two' --ac 'P2' | Out-Null
  Commit "docs(backlog): $growId phases: add $growId.1, $growId.2"
  GitRun push -q
  Check ((Backlog task list --plain -p $growId) -match "TASK-$($growId.Substring(5))\.2") 'phases listed under the parent'
  # Subtask 1 is worked on its own branch and merged into the epic.
  $w1 = New-Worktree 'worker-p1' "item/$growId.1-phase-one" $epicBranch
  $script:cwd = $w1
  Backlog task edit "$growId.1" -s 'In Progress' | Out-Null
  Commit "docs(backlog): $growId.1 in progress"
  # Subtask 2 finds a prerequisite; the coordinator adds it on the epic branch.
  $script:cwd = $epic
  Backlog task create 'Prerequisite' --parent $growId --labels 'kind:task,tier:S' --ordinal 15 --description 'Prereq' --ac 'PR' | Out-Null
  Commit "docs(backlog): $growId prerequisite"
  GitRun push -q
  $created = (Backlog task list --plain -p $growId)
  $ids = [regex]::Matches($created, 'TASK-\d+\.\d+') | ForEach-Object { $_.Value } | Sort-Object -Unique
  Check ($ids.Count -eq 3) "three subtasks with unique IDs ($($ids -join ', '))"
  $preId = (($ids | Where-Object { $_ -notin @("TASK-$($growId.Substring(5)).1", "TASK-$($growId.Substring(5)).2") }) | Select-Object -First 1).ToLower()
  # The worker of subtask 2 merges the epic branch, then adds the dependency (repeating the old one).
  $w2 = New-Worktree 'worker-p2' "item/$growId.2-phase-two" $epicBranch
  $script:cwd = $w2
  Backlog task edit "$growId.2" -s 'In Progress' | Out-Null
  GitRun merge -q --no-edit origin/$epicBranch
  Backlog task edit "$growId.2" --dep "$growId.1,$preId" | Out-Null
  $v = TaskView "$growId.2"
  Check ($v -match "TASK-$($growId.Substring(5))\.1" -and $v -match $preId.ToUpper().Replace('-', '-')) 'subtask 2 depends on its old dependency and the prerequisite'
  Check ((Backlog doctor) -match 'No duplicate IDs') 'doctor is clean after the dependency edit'
  Commit "docs(backlog): $growId.2 waits for $preId"
  # Finish all subtasks and merge them into the epic, then the epic into main.
  foreach ($pair in @(@($w1, "$growId.1", "item/$growId.1-phase-one"), @($w2, "$growId.2", "item/$growId.2-phase-two"))) {
    $script:cwd = $pair[0]
    Backlog task edit $pair[1] --final-summary 'Done work.' | Out-Null
    Backlog task edit $pair[1] -s Done | Out-Null
    Commit "docs(backlog): $($pair[1]) done"
    GitRun push -q -u origin $pair[2]
    $script:cwd = $epic
    GitRun merge -q --no-ff $pair[2] -m "Merge pull request from $($pair[2])"
  }
  $script:cwd = $epic
  Backlog task edit $preId -s Done | Out-Null
  Backlog task edit $growId -s Done --append-notes 'Closed.' | Out-Null
  Commit "docs(backlog): $growId done"
  GitRun merge -q --no-edit main
  $script:cwd = $main
  GitRun merge -q --no-ff $epicBranch -m 'Merge pull request #3 from epic'
  $all = @($growId, "$growId.1", "$growId.2", $preId) | ForEach-Object { StatusOf $_ }
  Check (@($all | Where-Object { $_ -eq 'Done' }).Count -eq 4) 'the final merge brings every status to main (parent and three subtasks Done)'
  $allIds = Get-ChildItem (Join-Path $main 'backlog/tasks') -Filter 'task-*.md' | ForEach-Object { ($_.Name -split ' - ')[0] }
  Check (@($allIds).Count -eq @($allIds | Sort-Object -Unique).Count) 'no duplicate IDs on main'
  Check ((Backlog doctor) -match 'No duplicate IDs') 'doctor is clean on main'

  # --- 4. Multi-line text and options after it, in one command each ---
  Write-Host '[4] Multi-line fields followed by more options'
  $tmp = New-Worktree 'tmp-multi' 'multi' 'main'
  $script:cwd = $tmp
  $text = "First line`nSecond line with `` ` `` and `"quotes`"`nТретья строка 汉字"
  $made = Backlog task create 'Multi' --labels 'kind:task,tier:S' --description $text --ac 'Kept after text' --ac 'Second kept'
  $multiId = [regex]::Match($made, 'Created task (TASK-\d+)').Groups[1].Value.ToLower()
  Backlog task edit $multiId --plan $text --append-notes 'Note after plan' --check-ac 2 -s 'In Progress' | Out-Null
  Backlog task edit $multiId --final-summary $text --check-dod 1 | Out-Null
  $f = TaskFile $multiId
  Check (([regex]::Matches($f, [regex]::Escape('Третья строка 汉字'))).Count -eq 3) 'description, plan and final summary each keep all three lines'
  Check ($f -match '(?m)^status: In Progress' -and $f -match '- \[x\] #2 Second kept' -and $f -match 'Note after plan' -and $f -match '- \[x\] #1 The gate') 'options after a multi-line field (--append-notes, --check-ac, -s, --check-dod) all applied'
  $script:cwd = $main
  GitRun worktree remove --force $tmp
  GitRun branch -D multi

  Check ((GitText status --porcelain) -eq '') 'main checkout is clean'
}

try {
  # 1. Install, find, and run the flow under a plain npm prefix.
  $savedPath = $env:PATH
  $savedVolta = $env:VOLTA_HOME
  $env:PATH = (Install-Npm) + [IO.Path]::PathSeparator + $env:PATH
  $npmPath = $env:PATH
  $voltaPath = $null
  if (-not $SkipVolta -and $IsWindows -and (Get-Command volta -ErrorAction SilentlyContinue)) {
    $env:PATH = $savedPath
    $voltaPath = (Install-Volta) + [IO.Path]::PathSeparator + $savedPath
  } else {
    Write-Host 'Volta not used (not installed, not Windows, or -SkipVolta).'
  }
  $voltaHome = $env:VOLTA_HOME
  # Volta's node shim needs its (real, read-only) home even while the profile is faked.
  $realVoltaHome = $savedVolta ?? ($IsWindows ? (Join-Path $env:LOCALAPPDATA 'Volta') : $null)

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
    $env:VOLTA_HOME = $realVoltaHome
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
  }
} catch {
  Write-Host "ERROR: $($_.Exception.Message)`n$($_.ScriptStackTrace)" -ForegroundColor Red
  $script:failures++
} finally {
  if ($Keep) { Write-Host "Kept: $work" } else {
    # Worktrees mark their files read-only on some platforms; retry once after clearing it.
    try { Remove-Item $work -Recurse -Force } catch { Get-ChildItem $work -Recurse -Force | ForEach-Object { try { $_.Attributes = 'Normal' } catch {} }; Remove-Item $work -Recurse -Force -ErrorAction Continue }
  }
}

Write-Host "`n$($script:checks - $script:failures) of $($script:checks) checks passed."
if ($script:failures -gt 0) { exit 1 }
