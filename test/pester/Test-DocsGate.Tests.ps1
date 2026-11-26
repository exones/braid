#Requires -Version 7.6
# scripts/Test-DocsGate.ps1 fails closed, shown on a disposable repository under
# $TestDrive. CR and trailing whitespace are shown in the index blob and,
# separately, in the worktree, because an empty worktree diff cannot see a bad
# blob and a clean blob cannot see a local edit.

BeforeAll {
  $script:ToolRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
  $script:Gate = Join-Path $script:ToolRoot 'scripts/Test-DocsGate.ps1'

  function Invoke-RepoGit {
    param([Parameter(Mandatory = $true)][string[]]$GitArguments)
    & git -C $script:Work @GitArguments
    if ($LASTEXITCODE -ne 0) {
      throw "git $($GitArguments -join ' ') exited $LASTEXITCODE"
    }
  }

  # Writes the text as given: no newline conversion.
  function Write-RepoFile {
    param(
      [Parameter(Mandatory = $true)][string]$Relative,
      [Parameter(Mandatory = $true)][string]$Text
    )
    $path = Join-Path $script:Work $Relative
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $path) | Out-Null
    [System.IO.File]::WriteAllText($path, $Text, [System.Text.UTF8Encoding]::new($false))
  }

  function Add-RepoFile {
    param(
      [Parameter(Mandatory = $true)][string]$Relative,
      [Parameter(Mandatory = $true)][string]$Text
    )
    Write-RepoFile $Relative $Text
    Invoke-RepoGit @('add', '--', $Relative)
  }

  # Puts the text into the index and the clean text into the worktree. The text is
  # staged before .gitattributes can strip CR: --no-filters stores the bytes as is.
  function Set-IndexBlob {
    param(
      [Parameter(Mandatory = $true)][string]$Relative,
      [Parameter(Mandatory = $true)][string]$Text,
      [Parameter(Mandatory = $true)][string]$Worktree
    )
    Write-RepoFile $Relative $Text
    $sha = & git -C $script:Work hash-object -w --no-filters -- $Relative
    if ($LASTEXITCODE -ne 0) {
      throw "git hash-object exited $LASTEXITCODE"
    }
    Invoke-RepoGit @('update-index', '--add', '--cacheinfo', "100644,$sha,$Relative")
    Write-RepoFile $Relative $Worktree
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
    param([string]$Root = $script:Work)
    $result = Invoke-Gate -Root $Root
    $result.Code | Should -Be 0 -Because $result.Text
    $result.Text | Should -Match 'docs-gate: passed'
  }

  function Assert-Fails {
    param([Parameter(Mandatory = $true)][string]$Pattern)
    $result = Invoke-Gate
    $result.Code | Should -Not -Be 0 -Because $result.Text
    $result.Text | Should -Match $Pattern
  }
}

Describe 'Test-DocsGate.ps1' {
  BeforeEach {
    $script:Work = Join-Path $TestDrive ([guid]::NewGuid().ToString('n'))
    New-Item -ItemType Directory -Path $script:Work | Out-Null
    Invoke-RepoGit @('init', '-q')
    Invoke-RepoGit @('config', 'core.autocrlf', 'false')
    Invoke-RepoGit @('config', 'core.safecrlf', 'false')
    Add-RepoFile '.gitattributes' "* text=auto eol=lf`n*.png binary`n"
    Add-RepoFile 'hello.md' "# Hello`n`nSee [there](other.md#there).`n"
    Add-RepoFile 'other.md' "# There`n`nText.`n"
    Add-RepoFile 'sample.txt' "ok`n"
    Add-RepoFile 'pixel.png' "`0`r`n"
  }

  It 'passes the baseline repository' {
    Assert-Passes
  }

  It 'passes when the repository is on another drive than the tools' -Skip:(-not $IsWindows) {
    $used = @((Get-PSDrive -PSProvider FileSystem).Name)
    $letter = @('X', 'Y', 'Z', 'W', 'V', 'U', 'T', 'S', 'R') | Where-Object { $used -notcontains $_ } | Select-Object -First 1
    $letter | Should -Not -BeNullOrEmpty -Because 'the case needs a free drive letter'
    & subst "${letter}:" $script:Work
    $LASTEXITCODE | Should -Be 0
    try {
      Assert-Passes -Root "${letter}:\"
    } finally {
      & subst "${letter}:" /d | Out-Null
    }
  }

  It 'ignores an untracked file with a broken link' {
    Write-RepoFile 'untracked.md' "# Hidden`n`n[missing](missing.md)`n"
    Assert-Passes
  }

  It 'fails on a broken relative link' {
    Add-RepoFile 'hello.md' "# Hello`n`nSee [there](other.md#there).`n`n[gone](missing.md)`n"
    Assert-Fails 'broken link in hello\.md:.*missing\.md'
  }

  It 'fails on a broken anchor' {
    Add-RepoFile 'hello.md' "# Hello`n`nSee [missing](other.md#missing-heading).`n"
    Assert-Fails 'broken link in hello\.md:.*missing-heading'
  }

  It 'passes a broken link under a frozen path and fails one outside it' {
    Add-RepoFile 'scripts/markdown-link-exclusions.json' "{`n  `"version`": 2,`n  `"frozen`": [`"closed/`"],`n  `"exclusions`": []`n}`n"
    Add-RepoFile 'closed/old.md' "# Old`n`n[gone](missing.md)`n"
    Assert-Passes
    Add-RepoFile 'open/new.md' "# New`n`n[gone](missing.md)`n"
    Assert-Fails 'broken link in open/new\.md:.*missing\.md'
  }

  It 'keeps a skill link inside its own folder' {
    Add-RepoFile '.agents/skills/demo/SKILL.md' "# Demo`n`nSee [the template](assets/t.md).`n"
    Add-RepoFile '.agents/skills/demo/assets/t.md' "# Template`n"
    Assert-Passes
    Add-RepoFile '.agents/skills/demo/SKILL.md' "# Demo`n`nSee [other](../../../other.md).`n"
    Assert-Fails 'skill link leaves its folder in \.agents/skills/demo/SKILL\.md'
  }

  It 'lets braid skills link to each other only' {
    Add-RepoFile '.agents/skills/braid/references/shared.md' "# Shared`n"
    Add-RepoFile '.agents/skills/other/notes.md' "# Notes`n"
    Add-RepoFile '.agents/skills/braid-demo/SKILL.md' "# Demo`n`nSee [shared](../braid/references/shared.md).`n"
    Assert-Passes
    Add-RepoFile '.agents/skills/braid-demo/SKILL.md' "# Demo`n`nSee [notes](../other/notes.md).`n"
    Assert-Fails 'skill link leaves its folder in \.agents/skills/braid-demo/SKILL\.md'
    Add-RepoFile '.agents/skills/braid-demo/SKILL.md' "# Demo`n"
    Add-RepoFile '.agents/skills/other/SKILL.md' "# Other`n`nSee [shared](../braid/references/shared.md).`n"
    Assert-Fails 'skill link leaves its folder in \.agents/skills/other/SKILL\.md'
  }

  It 'fails on <Name> in the index blob and in the worktree' -ForEach @(
    @{ Name = 'a CR line ending'; Bad = "crlf line`r`n"; Clean = "crlf line`n"; Finding = 'CR line ending'; Suffix = '' }
    @{ Name = 'a trailing space'; Bad = "hello `n"; Clean = "hello`n"; Finding = 'trailing whitespace'; Suffix = ':1 \(1 line\)' }
    @{ Name = 'a trailing tab'; Bad = "hello`t`n"; Clean = "hello`n"; Finding = 'trailing whitespace'; Suffix = ':1 \(1 line\)' }
    @{ Name = 'trailing whitespace with no final newline'; Bad = "a`nb "; Clean = "a`nb`n"; Finding = 'trailing whitespace'; Suffix = ':2 \(1 line\)' }
    @{ Name = 'trailing whitespace before CR'; Bad = "a`nb `r`n"; Clean = "a`nb`n"; Finding = 'trailing whitespace'; Suffix = ':2 \(1 line\)' }
    @{ Name = 'two lines of trailing whitespace'; Bad = "a`nb `nc`nd `n"; Clean = "a`n"; Finding = 'trailing whitespace'; Suffix = ':2 \(2 lines\)' }
  ) {
    Set-IndexBlob 'sample.txt' $Bad -Worktree $Clean
    Assert-Fails "$Finding in index blob sample\.txt$Suffix"
    Add-RepoFile 'sample.txt' $Clean
    Write-RepoFile 'sample.txt' $Bad
    Assert-Fails "$Finding in worktree sample\.txt$Suffix"
  }

  It 'checks a path with a space and a non-ASCII name' {
    Add-RepoFile 'a b/é.txt' "x `n"
    Assert-Fails 'trailing whitespace in index blob a b/é\.txt:1'
  }

  It 'skips a file whose text attribute is unset' {
    Add-RepoFile '.gitattributes' "* text=auto eol=lf`n*.png binary`n*.raw -text`n"
    Add-RepoFile 'data.raw' "x `r`n"
    Assert-Passes
  }

  It 'skips a file with a NUL byte' {
    Add-RepoFile 'blob.dat' "`0x `r`n"
    Assert-Passes
  }
}
