# Pre-PR gate. Quick (npm run verify): tracked Markdown links and anchors,
# tracked-text LF/trailing whitespace, OIDC release shape, typecheck, build,
# tests. -Full (npm run verify:full, used by CI and releases) also runs the
# tooling tests (docs-gate negatives, install policy, Node toolchain, Pester)
# and the packed-install proof.
# Root dependencies stay on `npm ci`, which reads .npmrc. The install-policy fixture is a
# separate project and is not a root dependency. The OIDC guard only reads release.yml.
# Stops on the first failed native command and returns that exit code.
# Does not call npm run verify. scripts/Test-Package.ps1 does not call this script.
# test/fixtures/oidc-release/Test-OidcReleaseGuard.ps1 does not call this script.
# test/fixtures/install-policy/Test-InstallPolicy.ps1 does not call this script.
# test/fixtures/node-toolchain/Test-NodeToolchain.ps1 does not call this script.
# scripts/Test-Pester.ps1 and the suites under test/pester do not call this script.
#Requires -Version 7.6
[CmdletBinding()]
param(
  [switch]$Full
)
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
Set-StrictMode -Version Latest

if ($env:BRAID_VERIFY_DEPTH -eq '1') {
  Write-Error 'scripts/Verify.ps1 must not invoke itself.'
  exit 1
}
$env:BRAID_VERIFY_DEPTH = '1'

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot
# Same order as the direct installer: PATH Node.js with bundled npm, then the shared pin.
. (Join-Path $PSScriptRoot 'Install-NodeToolchain.ps1')

function Invoke-VerifiedNative {
  param(
    [Parameter(Mandatory = $true)][string]$Executable,
    [Parameter(Mandatory = $true)][string[]]$Arguments
  )
  & $Executable @Arguments
  $code = $LASTEXITCODE
  if ($code -ne 0) {
    exit $code
  }
}

$bin = Resolve-BraidNodeToolchain
$separator = [System.IO.Path]::PathSeparator
$env:PATH = "$bin$separator$env:PATH"

$node = Join-Path $bin $(if ($IsWindows) { 'node.exe' } else { 'node' })
# npm.cmd and the Unix npm shim can delegate to a prefix npm from another install.
# Run the npm-cli.js that shipped in the selected Node.js directory.
$npmCliCandidates = @(
  (Join-Path $bin 'node_modules/npm/bin/npm-cli.js'),
  (Join-Path (Split-Path -Parent $bin) 'lib/node_modules/npm/bin/npm-cli.js')
)
$npmCli = $null
foreach ($candidate in $npmCliCandidates) {
  if (Test-Path -LiteralPath $candidate) {
    $npmCli = (Resolve-Path -LiteralPath $candidate).Path
    break
  }
}
if (-not (Test-Path -LiteralPath $node) -or $null -eq $npmCli) {
  Write-Error "Node.js toolchain is incomplete: $bin"
  exit 1
}

$nodeVersion = (& $node --version)
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}
$npmVersion = (& $node $npmCli --version)
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}
Write-Host "node $("$nodeVersion".Trim()) ($node)"
Write-Host "npm $("$npmVersion".Trim()) ($npmCli)"

$typescript = Join-Path $repoRoot 'node_modules/typescript/package.json'
if (-not (Test-Path -LiteralPath $typescript)) {
  Write-Error "Dependencies are not installed. Prepend '$bin' to PATH and run 'npm ci' from the repository root."
  exit 1
}

function Invoke-Script {
  param(
    [Parameter(Mandatory = $true)][string]$Label,
    [Parameter(Mandatory = $true)][string]$Relative
  )
  Write-Host $Label
  Invoke-VerifiedNative -Executable 'pwsh' -Arguments @('-NoProfile', '-File', (Join-Path $repoRoot $Relative))
}

Write-Host "verify: $(if ($Full) { 'full' } else { 'quick' })"
Invoke-Script 'docs-gate: tracked Markdown links and tracked text' 'scripts/Test-DocsGate.ps1'
Invoke-Script 'oidc-release: trusted publishing shape' 'test/fixtures/oidc-release/Test-OidcReleaseGuard.ps1'
if ($Full) {
  Invoke-Script 'docs-gate: negative fixtures' 'test/fixtures/docs-gate/Test-DocsGateNegatives.ps1'
  Invoke-Script 'install-policy: unreviewed scripts, git specs, and remote specs' 'test/fixtures/install-policy/Test-InstallPolicy.ps1'
  Invoke-Script 'node-toolchain: PATH precedence, shared store, and failure fixtures' 'test/fixtures/node-toolchain/Test-NodeToolchain.ps1'
  Invoke-Script 'pester: PowerShell suites under test/pester' 'scripts/Test-Pester.ps1'
}

Invoke-VerifiedNative -Executable $node -Arguments @($npmCli, 'run', 'typecheck')
Invoke-VerifiedNative -Executable $node -Arguments @($npmCli, 'run', 'build')
Write-Host "test: every suite under test/"
Invoke-VerifiedNative -Executable $node -Arguments @($npmCli, 'run', 'test')
if ($Full) {
  Invoke-Script 'package: packed install outside the checkout' 'scripts/Test-Package.ps1'
}
exit 0
