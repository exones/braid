#Requires -Version 7.6
# scripts/check-markdown-links.mjs takes its file list from standard input, so a
# list longer than the Windows command-line limit (32,767 characters) works.

BeforeAll {
  . (Join-Path $PSScriptRoot '../../scripts/Install-NodeToolchain.ps1')
  $command = Get-Command node -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
  $script:Node = if ($null -eq $command) { $null } else { Get-BraidRealNodeExe -NodeExe $command.Source }
  $script:Checker = Join-Path $PSScriptRoot '../../scripts/check-markdown-links.mjs'
  $script:ToolRoot = Join-Path $PSScriptRoot '../..'

  function Invoke-Checker {
    param([string]$Root, [string[]]$Arguments, [string]$StdinText)
    $start = [System.Diagnostics.ProcessStartInfo]::new()
    $start.FileName = $script:Node
    $start.WorkingDirectory = (Resolve-Path $script:ToolRoot).Path
    $start.UseShellExecute = $false
    $start.RedirectStandardInput = $true
    $start.RedirectStandardOutput = $true
    $start.RedirectStandardError = $true
    $start.ArgumentList.Add((Resolve-Path $script:Checker).Path)
    $start.ArgumentList.Add($Root)
    foreach ($a in $Arguments) { $start.ArgumentList.Add($a) }
    $process = [System.Diagnostics.Process]::Start($start)
    $err = $process.StandardError.ReadToEndAsync()
    if ($StdinText) { $process.StandardInput.Write($StdinText) }
    $process.StandardInput.Close()
    $out = $process.StandardOutput.ReadToEnd()
    $process.WaitForExit()
    [pscustomobject]@{ ExitCode = $process.ExitCode; Output = $out; Error = $err.GetAwaiter().GetResult() }
  }
}

Describe 'check-markdown-links.mjs file list' {
  BeforeEach {
    $script:Repo = Join-Path $TestDrive ([guid]::NewGuid().ToString('n'))
    New-Item -ItemType Directory -Force -Path $script:Repo | Out-Null
  }

  It 'reads a list longer than 32,767 characters from standard input' {
    $names = 1..700 | ForEach-Object { 'padding-for-a-long-file-name-{0:d4}-abcdefghijklmnopqrstuvwxyz.md' -f $_ }
    foreach ($name in $names) {
      [System.IO.File]::WriteAllText((Join-Path $script:Repo $name), "# t`n")
    }
    [System.IO.File]::WriteAllText((Join-Path $script:Repo $names[0]), "[gone](missing.md)`n")
    $list = ($names -join "`n") + "`n"
    $list.Length | Should -BeGreaterThan 32767
    $result = Invoke-Checker -Root $script:Repo -Arguments @() -StdinText $list
    $result.ExitCode | Should -Be 0
    $found = @($result.Output | ConvertFrom-Json)
    $found.Count | Should -Be 1
    $found[0].file | Should -Be $names[0]
  }

  It 'still accepts path arguments' {
    [System.IO.File]::WriteAllText((Join-Path $script:Repo 'a.md'), "[gone](missing.md)`n")
    $result = Invoke-Checker -Root $script:Repo -Arguments @('a.md') -StdinText ''
    $result.ExitCode | Should -Be 0
    @($result.Output | ConvertFrom-Json).Count | Should -Be 1
  }
}
