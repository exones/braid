#Requires -Version 7.6
# scripts/Select-Tests.ps1 against a small disposable repository under $TestDrive:
# src/a.ts is imported by src/b.ts; src/c.ts stands alone.

BeforeAll {
  $script:Picker = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../scripts/Select-Tests.ps1'))

  function Invoke-RepoGit {
    param([Parameter(Mandatory = $true)][string[]]$GitArguments)
    $pinned = @('-C', $script:Repo, '-c', 'user.name=t', '-c', 'user.email=t@example.invalid',
      '-c', 'commit.gpgsign=false', '-c', 'core.autocrlf=false', '-c', 'core.fsmonitor=false', '-c', 'gc.auto=0')
    & git @pinned @GitArguments | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "git $($GitArguments -join ' ') exited $LASTEXITCODE" }
  }

  function Write-RepoFile {
    param([Parameter(Mandatory = $true)][string]$Relative, [string]$Text = "x`n")
    $path = Join-Path $script:Repo $Relative
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $path) | Out-Null
    [System.IO.File]::WriteAllText($path, $Text, [System.Text.UTF8Encoding]::new($false))
  }

  function Save-Commit {
    Invoke-RepoGit @('add', '-A')
    Invoke-RepoGit @('commit', '-q', '-m', 'change')
  }

  function Select-RepoTest {
    & $script:Picker -RepositoryRoot $script:Repo 6>$null
  }
}

Describe 'Select-Tests.ps1' {
  # One repository is built, and each test works on a copy of it.
  BeforeAll {
    $script:Repo = Join-Path $TestDrive 'template'
    $script:Template = $script:Repo
    New-Item -ItemType Directory -Path $script:Repo | Out-Null
    Invoke-RepoGit @('init', '-q', '-b', 'main')
    Write-RepoFile 'src/a.ts' "export const a = 1;`n"
    Write-RepoFile 'src/b.ts' "import { a } from `"./a.js`";`nexport const b = a;`n"
    Write-RepoFile 'src/c.ts' "export const c = 1;`n"
    Write-RepoFile 'src/cli.ts' "import `"./c.js`";`n"
    Write-RepoFile 'test/direct.test.ts' "import {`n  a,`n} from `"../dist/a.js`";`n"
    Write-RepoFile 'test/transitive.test.ts' "const { b } = await load(`"../dist/b.js`");`n"
    Write-RepoFile 'test/dynamic.test.ts' "await import(new URL(`"../dist/b.js`", import.meta.url).href);`n"
    Write-RepoFile 'test/helped.test.ts' "import { h } from `"./support/h.ts`";`n"
    Write-RepoFile 'test/support/h.ts' "export const h = await load(`"../../dist/a.js`");`n"
    Write-RepoFile 'test/other.test.ts' "import { c } from `"../src/c.ts`";`n"
    Write-RepoFile 'test/types.test.ts' "import type { C } from `"../src/c.ts`";`n"
    Write-RepoFile 'test/spawns.test.ts' "const cli = new URL(`"../dist/cli.js`", import.meta.url);`n"
    Save-Commit
    Invoke-RepoGit @('update-ref', 'refs/remotes/origin/main', 'HEAD')
    Invoke-RepoGit @('switch', '-q', '-c', 'work')
  }

  BeforeEach {
    $script:Repo = Join-Path $TestDrive ([guid]::NewGuid().ToString('n'))
    Copy-Item -LiteralPath $script:Template -Destination $script:Repo -Recurse -Force
  }

  It 'picks the direct and transitive importers of a changed module and nothing else' {
    Write-RepoFile 'src/a.ts' "export const a = 2;`n"
    Save-Commit
    $selection = Select-RepoTest
    $selection.Mode | Should -Be 'picked'
    $selection.Tests | Should -Be @('test/direct.test.ts', 'test/dynamic.test.ts', 'test/helped.test.ts', 'test/transitive.test.ts')
  }

  It 'counts staged, unstaged and untracked changes' {
    Write-RepoFile 'src/c.ts' "export const c = 2;`n"
    Write-RepoFile 'test/staged.test.ts'
    Invoke-RepoGit @('add', 'test/staged.test.ts')
    Write-RepoFile 'test/untracked.test.ts'
    (Select-RepoTest).Tests | Should -Be @('test/other.test.ts', 'test/staged.test.ts', 'test/untracked.test.ts')
  }

  It 'picks a changed test itself' {
    Write-RepoFile 'test/spawns.test.ts' "// changed`n"
    Save-Commit
    (Select-RepoTest).Tests | Should -Be @('test/spawns.test.ts')
  }

  It 'still picks the importers of a removed module' {
    Remove-Item -LiteralPath (Join-Path $script:Repo 'src/c.ts')
    Save-Commit
    (Select-RepoTest).Tests | Should -Be @('test/other.test.ts')
  }

  It 'runs everything when <Path> changed' -ForEach @(
    @{ Path = 'src/cli.ts' }
    @{ Path = 'package.json' }
    @{ Path = 'package-lock.json' }
    @{ Path = 'tsconfig.build.json' }
    @{ Path = 'web/tsconfig.json' }
    @{ Path = 'scripts/Verify.ps1' }
    @{ Path = 'test/support/h.ts' }
    @{ Path = 'test/fixtures/repo/brief.md' }
    @{ Path = 'web/src/App.tsx' }
    @{ Path = '.github/workflows/ci.yml' }
  ) {
    Write-RepoFile $Path "changed`n"
    Save-Commit
    (Select-RepoTest).Mode | Should -Be 'all'
  }

  It 'runs no tests when only docs changed' {
    Write-RepoFile 'README.md'
    Write-RepoFile 'docs/diagram.svg'
    Write-RepoFile 'braids/0001-a/brief.md'
    Save-Commit
    $selection = Select-RepoTest
    $selection.Mode | Should -Be 'docs'
    $selection.Tests | Should -HaveCount 0
  }

  It 'diffs a strand branch against its braid branch' {
    Invoke-RepoGit @('switch', '-q', '-c', 'braid/0001-goal')
    Write-RepoFile 'src/a.ts' "export const a = 3;`n"
    Save-Commit
    Invoke-RepoGit @('switch', '-q', '-c', 'braid/0001/A-step')
    Write-RepoFile 'src/c.ts' "export const c = 3;`n"
    Save-Commit
    (Select-RepoTest).Tests | Should -Be @('test/other.test.ts')
  }

  It 'runs everything when a strand branch has no braid branch' {
    Invoke-RepoGit @('switch', '-q', '-c', 'braid/0002/A-step')
    Write-RepoFile 'src/c.ts' "export const c = 4;`n"
    Save-Commit
    $selection = Select-RepoTest
    $selection.Mode | Should -Be 'all'
    $selection.Why | Should -BeLike '*no braid branch*'
  }

  It 'runs everything when there is no origin/main' {
    Invoke-RepoGit @('update-ref', '-d', 'refs/remotes/origin/main')
    $selection = Select-RepoTest
    $selection.Mode | Should -Be 'all'
    $selection.Why | Should -BeLike '*no merge-base*'
  }
}
