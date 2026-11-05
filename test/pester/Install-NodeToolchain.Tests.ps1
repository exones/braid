#Requires -Version 7.6
# PATH resolution in scripts/Install-NodeToolchain.ps1 when node on PATH is a
# version-manager launcher (as with Volta) rather than the runtime itself.
# Uses the real Node.js running these tests; skipped when it is out of range.

BeforeAll {
  . (Join-Path $PSScriptRoot '../../scripts/Install-NodeToolchain.ps1')

  $command = Get-Command node -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
  $script:RealNode = if ($null -eq $command) { $null } else { Get-BraidRealNodeExe -NodeExe $command.Source }
  $script:Usable = $null -ne $script:RealNode -and (Test-BraidNodeInRange -NodeExe $script:RealNode) -and (Test-BraidBundledNpm -NodeExe $script:RealNode)

  function New-Launcher {
    param(
      [Parameter(Mandatory = $true)][string]$Directory,
      [Parameter(Mandatory = $true)][string]$Body
    )
    New-Item -ItemType Directory -Force -Path $Directory | Out-Null
    if ($IsWindows) {
      [System.IO.File]::WriteAllText((Join-Path $Directory 'node.cmd'), "@echo off`r`n$Body`r`n")
    } else {
      $path = Join-Path $Directory 'node'
      [System.IO.File]::WriteAllText($path, "#!/bin/sh`n$Body`n")
      & chmod '+x' $path
    }
  }
}

Describe 'Get-BraidPathToolchain with a launcher on PATH' {
  BeforeEach {
    $script:SavedPath = $env:PATH
    $script:LauncherDir = Join-Path $TestDrive ([guid]::NewGuid().ToString('n'))
  }

  AfterEach {
    $env:PATH = $script:SavedPath
  }

  It 'selects the runtime directory that the launcher runs' {
    if (-not $script:Usable) {
      Set-ItResult -Skipped -Because 'the Node.js running the tests is not >=26.13.0 <27 with its bundled npm'
      return
    }
    $forward = if ($IsWindows) { "`"$script:RealNode`" %*" } else { "exec `"$script:RealNode`" `"`$@`"" }
    New-Launcher -Directory $script:LauncherDir -Body $forward
    $env:PATH = $script:LauncherDir

    Get-BraidPathToolchain | Should -Be ([System.IO.Path]::GetFullPath((Split-Path -Parent $script:RealNode)))
  }

  It 'checks the file on PATH when the launcher cannot name its runtime' {
    New-Launcher -Directory $script:LauncherDir -Body 'echo not-a-path'
    $launcher = (Get-ChildItem -LiteralPath $script:LauncherDir | Select-Object -First 1).FullName

    Get-BraidRealNodeExe -NodeExe $launcher | Should -Be $launcher
  }
}
