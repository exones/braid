# Runs the Pester suites under test/pester. Needs Pester 5.5 or newer, which
# this script does not install; see the README. Exits with Pester's failure
# count, so 0 means every test passed.
# Does not call scripts/Verify.ps1.
#Requires -Version 7.6
[CmdletBinding()]
param(
  [string]$Path = (Join-Path (Split-Path -Parent $PSScriptRoot) 'test/pester')
)

$ErrorActionPreference = 'Stop'

$pester = Get-Module -ListAvailable -Name Pester |
  Where-Object { $_.Version -ge [version]'5.5.0' } |
  Sort-Object Version -Descending |
  Select-Object -First 1
if ($null -eq $pester) {
  [Console]::Error.WriteLine('pester: Pester 5.5.0 or newer is required. Install it with: Install-PSResource -Name Pester -Version 5.7.1 -Scope CurrentUser')
  exit 1
}
Import-Module -Name $pester.Path -Force

$configuration = New-PesterConfiguration
$configuration.Run.Path = $Path
$configuration.Run.Exit = $true
$configuration.Output.Verbosity = 'Detailed'
Invoke-Pester -Configuration $configuration
