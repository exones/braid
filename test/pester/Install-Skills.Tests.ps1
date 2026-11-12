#Requires -Version 7.6
# scripts/Install-Skills.ps1 against a disposable repository and disposable
# target folders under $TestDrive. The installer is run as a separate pwsh
# process because it ends with exit.

BeforeAll {
  $script:Installer = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../scripts/Install-Skills.ps1'))

  function Invoke-RepoGit {
    param([Parameter(Mandatory = $true)][string[]]$GitArguments)
    & git -C $script:Repo @GitArguments | Out-Null
    if ($LASTEXITCODE -ne 0) {
      throw "git $($GitArguments -join ' ') exited $LASTEXITCODE"
    }
  }

  function Write-RepoFile {
    param(
      [Parameter(Mandatory = $true)][string]$Relative,
      [Parameter(Mandatory = $true)][string]$Text
    )
    $path = Join-Path $script:Repo $Relative
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $path) | Out-Null
    [System.IO.File]::WriteAllText($path, $Text, [System.Text.UTF8Encoding]::new($false))
  }

  function Invoke-Install {
    param([string[]]$Extra = @())
    $targets = $script:TargetA + [System.IO.Path]::PathSeparator + $script:TargetB
    $arguments = @('-NoProfile', '-File', $script:Installer, '-RepositoryRoot', $script:Repo, '-Target', $targets) + $Extra
    $lines = @(& pwsh @arguments 2>&1)
    return [pscustomobject]@{ Code = $LASTEXITCODE; Text = (($lines | ForEach-Object { "$_" }) -join "`n") }
  }

  function Get-Installed {
    param(
      [Parameter(Mandatory = $true)][string]$Root,
      [Parameter(Mandatory = $true)][string]$Relative
    )
    return [System.IO.File]::ReadAllText((Join-Path $Root $Relative))
  }
}

Describe 'Install-Skills.ps1' {
  BeforeEach {
    $work = Join-Path $TestDrive ([guid]::NewGuid().ToString('n'))
    $script:Repo = Join-Path $work 'repo'
    $script:TargetA = Join-Path $work 'hosts/a'
    $script:TargetB = Join-Path $work 'hosts/b'
    New-Item -ItemType Directory -Path $script:Repo | Out-Null
    Invoke-RepoGit @('init', '-q', '-b', 'main')
    Invoke-RepoGit @('config', 'user.email', 'fixture@example.invalid')
    Invoke-RepoGit @('config', 'user.name', 'fixture')
    Invoke-RepoGit @('config', 'core.autocrlf', 'false')
    Write-RepoFile '.agents/skills/braid-demo/SKILL.md' "v1`n"
    Write-RepoFile '.agents/skills/braid-demo/assets/t.md' "asset`n"
    Write-RepoFile '.agents/skills/braid/SKILL.md' "coordinator`n"
    foreach ($name in @('other', 'braidx', 'my-braid', 'Braid-Upper')) {
      Write-RepoFile ".agents/skills/$name/SKILL.md" "not braid`n"
    }
    Invoke-RepoGit @('add', '-A')
    Invoke-RepoGit @('commit', '-q', '-m', 'v1')
    $script:First = (& git -C $script:Repo rev-parse HEAD).Trim()
  }

  It 'installs the committed braid skills and a stamp into every target' {
    $result = Invoke-Install
    $result.Code | Should -Be 0 -Because $result.Text
    foreach ($root in @($script:TargetA, $script:TargetB)) {
      Get-Installed $root 'braid-demo/SKILL.md' | Should -Be "v1`n"
      Get-Installed $root 'braid-demo/assets/t.md' | Should -Be "asset`n"
      Get-Installed $root 'braid/SKILL.md' | Should -Be "coordinator`n"
      (Get-Installed $root 'braid/.braid-install.json' | ConvertFrom-Json).commit | Should -Be $script:First
      $stamp = Get-Installed $root 'braid-demo/.braid-install.json' | ConvertFrom-Json
      $stamp.commit | Should -Be $script:First
      $stamp.ref | Should -Be 'main'
      @(Get-ChildItem -LiteralPath $root -Force | ForEach-Object Name | Sort-Object) | Should -Be @('braid', 'braid-demo')
    }
  }

  It 'replaces an earlier install with newly committed content and ignores uncommitted edits' {
    (Invoke-Install).Code | Should -Be 0
    Write-RepoFile '.agents/skills/braid-demo/SKILL.md' "v2`n"
    Invoke-RepoGit @('commit', '-q', '-am', 'v2')
    Write-RepoFile '.agents/skills/braid-demo/SKILL.md' "uncommitted`n"

    $result = Invoke-Install
    $result.Code | Should -Be 0 -Because $result.Text
    Get-Installed $script:TargetA 'braid-demo/SKILL.md' | Should -Be "v2`n"
  }

  It 'leaves unrelated folders alone and no staging folders behind' {
    New-Item -ItemType Directory -Force -Path (Join-Path $script:TargetA 'mine') | Out-Null
    (Invoke-Install).Code | Should -Be 0
    (Invoke-Install).Code | Should -Be 0
    @(Get-ChildItem -LiteralPath $script:TargetA -Force | ForEach-Object Name | Sort-Object) | Should -Be @('braid', 'braid-demo', 'mine')
  }

  It 'refuses to replace a folder it did not install unless -Force is given' {
    New-Item -ItemType Directory -Force -Path (Join-Path $script:TargetB 'braid-demo') | Out-Null
    [System.IO.File]::WriteAllText((Join-Path $script:TargetB 'braid-demo/SKILL.md'), "someone else's`n")

    $result = Invoke-Install
    $result.Code | Should -Not -Be 0
    $result.Text | Should -Match 'not installed by this script'
    Get-Installed $script:TargetB 'braid-demo/SKILL.md' | Should -Be "someone else's`n"

    $forced = Invoke-Install -Extra @('-Force')
    $forced.Code | Should -Be 0 -Because $forced.Text
    Get-Installed $script:TargetB 'braid-demo/SKILL.md' | Should -Be "v1`n"
  }

  It 'checks every target before it replaces anything' {
    (Invoke-Install).Code | Should -Be 0
    Write-RepoFile '.agents/skills/braid-demo/SKILL.md' "v2`n"
    Invoke-RepoGit @('commit', '-q', '-am', 'v2')
    Remove-Item -LiteralPath (Join-Path $script:TargetB 'braid-demo/.braid-install.json') -Force

    $result = Invoke-Install
    $result.Code | Should -Not -Be 0
    $result.Text | Should -Match 'not installed by this script'
    Get-Installed $script:TargetA 'braid-demo/SKILL.md' | Should -Be "v1`n"
  }

  It 'removes stamped braid skills that left the ref and keeps unstamped folders' {
    Write-RepoFile '.agents/skills/braid-old/SKILL.md' "old`n"
    Invoke-RepoGit @('add', '-A')
    Invoke-RepoGit @('commit', '-q', '-m', 'add braid-old')
    (Invoke-Install).Code | Should -Be 0
    Get-Installed $script:TargetA 'braid-old/SKILL.md' | Should -Be "old`n"
    foreach ($name in @('braid-mine', 'other')) {
      New-Item -ItemType Directory -Force -Path (Join-Path $script:TargetA $name) | Out-Null
    }
    Invoke-RepoGit @('rm', '-q', '-r', '.agents/skills/braid-old')
    Invoke-RepoGit @('commit', '-q', '-m', 'drop braid-old')

    $result = Invoke-Install
    $result.Code | Should -Be 0 -Because $result.Text
    @(Get-ChildItem -LiteralPath $script:TargetA -Force | ForEach-Object Name | Sort-Object) | Should -Be @('braid', 'braid-demo', 'braid-mine', 'other')
    @(Get-ChildItem -LiteralPath $script:TargetB -Force | ForEach-Object Name | Sort-Object) | Should -Be @('braid', 'braid-demo')
  }

  It 'fails for a ref that does not exist' {
    (Invoke-Install -Extra @('-Ref', 'no-such-ref')).Code | Should -Not -Be 0
  }
}
