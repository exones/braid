# Spike 0057: run node --test twice on one runner, baseline and variant, in the order the sample asks.
param([string]$Variant, [int]$Sample)
$ErrorActionPreference = 'Stop'

function Get-VariantEnv([string]$v) {
  $e = @{}
  if ($v -in 'tempd', 'all') {
    $t = Join-Path $env:RUNNER_TEMP 'tmp'
    New-Item -ItemType Directory -Force $t | Out-Null
    $e.TEMP = $t; $e.TMP = $t
  }
  if ($v -eq 'devdrive') { $e.TEMP = $env:DEVTEMP; $e.TMP = $env:DEVTEMP; New-Item -ItemType Directory -Force $env:DEVTEMP | Out-Null }
  if ($v -in 'gitcfg', 'all') {
    $tpl = Join-Path $env:RUNNER_TEMP 'git-template'
    New-Item -ItemType Directory -Force (Join-Path $tpl 'hooks') | Out-Null
    $kv = @(@('core.fscache', 'true'), @('core.preloadindex', 'true'), @('gc.auto', '0'), @('maintenance.auto', 'false'), @('core.fsmonitor', 'false'))
    $e.GIT_CONFIG_COUNT = "$($kv.Count)"
    for ($i = 0; $i -lt $kv.Count; $i++) { $e["GIT_CONFIG_KEY_$i"] = $kv[$i][0]; $e["GIT_CONFIG_VALUE_$i"] = $kv[$i][1] }
    $e.GIT_TEMPLATE_DIR = $tpl
  }
  if ($v -in 'ncc', 'all') { $e.NODE_COMPILE_CACHE = Join-Path $env:RUNNER_TEMP 'ncc' }
  return $e
}

function Invoke-Run([string]$label, [hashtable]$e) {
  $saved = @{}
  foreach ($k in $e.Keys) { $saved[$k] = [Environment]::GetEnvironmentVariable($k); [Environment]::SetEnvironmentVariable($k, $e[$k]) }
  try {
    $junit = Join-Path $env:RUNNER_TEMP "junit-$label.xml"
    $sw = [Diagnostics.Stopwatch]::StartNew()
    node --test --test-reporter dot --test-reporter-destination stdout --test-reporter junit --test-reporter-destination $junit test | Out-Null
    $code = $LASTEXITCODE
    $sw.Stop()
    $sum = 0.0
    foreach ($m in [regex]::Matches((Get-Content -Raw $junit), '<testcase name="[^"]*" time="([\d.]+)"')) { $sum += [double]$m.Groups[1].Value }
    $bench = node spike/bench.mjs
    "RESULT $label exit=$code wall=$([int]$sw.Elapsed.TotalSeconds) sum=$([int]$sum) | $(($bench | ForEach-Object { ($_ -replace '\s+', ' ').Trim() }) -join ' | ')"
  } finally {
    foreach ($k in $e.Keys) { [Environment]::SetEnvironmentVariable($k, $saved[$k]) }
  }
}

$order = if ($Sample % 2 -eq 1) { @('baseline', $Variant) } else { @($Variant, 'baseline') }
foreach ($o in $order) {
  $e = if ($o -eq 'baseline') { @{} } else { Get-VariantEnv $o }
  Invoke-Run $o $e
}
