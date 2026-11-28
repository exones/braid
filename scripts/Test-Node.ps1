# `npm run test`: every suite under test/, with node --test capped at half the cores, so one gate leaves room
# for the board. A CI runner (`CI` set) runs only its own tests and keeps node's default.
#Requires -Version 7.6
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
Set-StrictMode -Version Latest

$arguments = @('--test', '--test-reporter', 'spec')
if (-not $env:CI) {
  $cap = [Math]::Max(1, [int][Math]::Floor([Environment]::ProcessorCount / 2))
  $arguments += "--test-concurrency=$cap"
}
$arguments += 'test'
& node @arguments
exit $LASTEXITCODE
