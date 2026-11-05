# Read-only workspace binding check. PowerShell and local Git only.
# One invocation compares a versioned JSON contract with one checkout.
# Exit 0 match, 1 mismatch or drift, 2 invalid input or failed inspection.
# Does not fetch, switch, stage, clean, reset, commit, or write .braid/.
# Invoke with literal arguments:
#   pwsh -NoProfile -File scripts/Test-WorkspaceBinding.ps1 -ContractPath <contract.json> -RepositoryRoot <absolute-root>
#Requires -Version 7.6
[CmdletBinding()]
param(
  [string]$ContractPath,
  [string]$RepositoryRoot
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
Set-StrictMode -Version Latest

$script:Started = [System.Diagnostics.Stopwatch]::StartNew()
$script:GitReads = [System.Collections.Generic.List[object]]::new()
$script:JsonOptions = [System.Text.Json.JsonSerializerOptions]::new()
$script:JsonOptions.WriteIndented = $true
$script:EncoderProperty = [System.Text.Json.JsonSerializerOptions].GetProperty('Encoder')
if ($null -ne $script:EncoderProperty) {
  $relaxed = [System.Text.Encodings.Web.JavaScriptEncoder]::UnsafeRelaxedJsonEscaping
  $script:JsonOptions.Encoder = $relaxed
}

function New-Map {
  return ,([System.Collections.Generic.Dictionary[string, object]]::new([System.StringComparer]::Ordinal))
}

function New-List {
  return ,([System.Collections.Generic.List[object]]::new())
}

function ConvertTo-ComparablePath {
  param([Parameter(Mandatory = $true)][string]$Path)
  $full = [System.IO.Path]::GetFullPath($Path)
  $trim = $full.TrimEnd([char[]]@('\', '/'))
  if ($trim -match '^[A-Za-z]:$') {
    return $trim + '\'
  }
  if ($trim.Length -eq 0) {
    return $full
  }
  return $trim
}

function Test-SamePath {
  param([string]$Left, [string]$Right)
  $comparison = if ($IsWindows) { [System.StringComparison]::OrdinalIgnoreCase } else { [System.StringComparison]::Ordinal }
  $a = ConvertTo-ComparablePath $Left
  $b = ConvertTo-ComparablePath $Right
  return [string]::Equals($a, $b, $comparison)
}

function Test-SameText {
  param($Left, $Right)
  $leftMissing = $null -eq $Left
  $rightMissing = $null -eq $Right
  if ($leftMissing -or $rightMissing) {
    return $leftMissing -and $rightMissing
  }
  return [string]::Equals([string]$Left, [string]$Right, [System.StringComparison]::Ordinal)
}

function Test-PathInside {
  param([Parameter(Mandatory = $true)][string]$Parent, [Parameter(Mandatory = $true)][string]$Child)
  if (Test-SamePath $Parent $Child) {
    return $true
  }
  $comparison = if ($IsWindows) { [System.StringComparison]::OrdinalIgnoreCase } else { [System.StringComparison]::Ordinal }
  $prefix = (ConvertTo-ComparablePath $Parent) + [System.IO.Path]::DirectorySeparatorChar
  $candidate = ConvertTo-ComparablePath $Child
  return $candidate.StartsWith($prefix, $comparison)
}

function Hide-TextCredentials {
  param([AllowNull()][string]$Text)
  if ([string]::IsNullOrEmpty($Text)) {
    return ''
  }
  return [regex]::Replace($Text, '([A-Za-z][A-Za-z0-9+.-]*://)([^/?#\s@]+)@', '$1***@')
}

function Hide-RemoteCredential {
  param([AllowNull()][string]$Url)
  if ([string]::IsNullOrEmpty($Url)) {
    return $Url
  }
  $scheme = [regex]::Match($Url, '^(?<scheme>[A-Za-z][A-Za-z0-9+.-]*://)(?<userinfo>[^/?#@]+)@(?<rest>.*)$')
  if ($scheme.Success) {
    return $scheme.Groups['scheme'].Value + '***@' + $scheme.Groups['rest'].Value
  }
  $scp = [regex]::Match($Url, '^(?<user>[^/@\s]+)@(?<rest>[^/\s]+:.+)$')
  if ($scp.Success) {
    return '***@' + $scp.Groups['rest'].Value
  }
  return $Url
}

function Get-ElapsedMilliseconds {
  return [int][Math]::Min([int64]$script:Started.ElapsedMilliseconds, [int64][int]::MaxValue)
}

function Test-Sha {
  param([AllowNull()][string]$Value)
  return ($null -ne $Value) -and ($Value -match '^[0-9a-fA-F]{40}$')
}

function Add-InputFailure {
  param(
    [Parameter(Mandatory = $true)][object]$Failures,
    [Parameter(Mandatory = $true)][string]$Message
  )
  $failure = New-Map
  $failure['kind'] = 'input'
  $failure['message'] = $Message
  $Failures.Add($failure)
}

function Add-GitFailure {
  param(
    [Parameter(Mandatory = $true)][object]$Failures,
    [string[]]$Arguments,
    [AllowNull()]$ExitCode,
    [AllowNull()][string]$Stderr
  )
  $failure = New-Map
  $failure['kind'] = 'git'
  $argv = New-List
  if ($null -ne $Arguments) {
    foreach ($argument in $Arguments) { $argv.Add($argument) }
  }
  $failure['argv'] = $argv
  $failure['exitCode'] = $ExitCode
  $text = Hide-TextCredentials $Stderr
  if ($text.Length -gt 4000) {
    $text = $text.Substring(0, 4000) + '...'
  }
  $failure['stderr'] = $text
  $Failures.Add($failure)
}

function Get-PropertyNames {
  param([Parameter(Mandatory = $true)][System.Text.Json.JsonElement]$Element)
  $names = [System.Collections.Generic.List[string]]::new()
  foreach ($property in $Element.EnumerateObject()) {
    $names.Add($property.Name)
  }
  return ,$names
}

function Get-RequiredProperty {
  param(
    [Parameter(Mandatory = $true)][System.Text.Json.JsonElement]$Element,
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][object]$Failures
  )
  $property = $null
  $found = $false
  foreach ($candidate in $Element.EnumerateObject()) {
    if ($candidate.Name -eq $Name) {
      $property = $candidate.Value
      $found = $true
      break
    }
  }
  if (-not $found) {
    Add-InputFailure $Failures "Missing $Name."
    return $null
  }
  return ,$property
}

function Test-AllowedSet {
  param(
    [Parameter(Mandatory = $true)][System.Text.Json.JsonElement]$Element,
    [Parameter(Mandatory = $true)][string[]]$Allowed,
    [Parameter(Mandatory = $true)][object]$Failures,
    [Parameter(Mandatory = $true)][string]$Label
  )
  $allowedSet = [System.Collections.Generic.HashSet[string]]::new([string[]]$Allowed, [System.StringComparer]::Ordinal)
  foreach ($name in (Get-PropertyNames $Element)) {
    if (-not $allowedSet.Contains($name)) {
      Add-InputFailure $Failures "$Label contains unknown property '$name'."
    }
  }
}

function ConvertTo-WorktreeEntry {
  param(
    [Parameter(Mandatory = $true)][System.Text.Json.JsonElement]$Element,
    [Parameter(Mandatory = $true)][object]$Failures,
    [Parameter(Mandatory = $true)][int]$Index
  )
  if ($Element.ValueKind -ne [System.Text.Json.JsonValueKind]::Object) {
    Add-InputFailure $Failures "worktree.entries[$Index] must be an object."
    return $null
  }
  Test-AllowedSet $Element @('xy', 'path', 'originalPath') $Failures "worktree.entries[$Index]"
  $xyProperty = Get-RequiredProperty $Element 'xy' $Failures
  $pathProperty = Get-RequiredProperty $Element 'path' $Failures
  if ($null -eq $xyProperty -or $null -eq $pathProperty) {
    return $null
  }
  if ($xyProperty.ValueKind -ne [System.Text.Json.JsonValueKind]::String -or $pathProperty.ValueKind -ne [System.Text.Json.JsonValueKind]::String) {
    Add-InputFailure $Failures "worktree.entries[$Index] xy and path must be strings."
    return $null
  }
  $xy = $xyProperty.GetString()
  $path = $pathProperty.GetString()
  if ($xy.Length -ne 2 -or $path.Length -eq 0 -or $path.Contains([char]0)) {
    Add-InputFailure $Failures "worktree.entries[$Index] must use a two-character xy and a non-empty path."
    return $null
  }
  $original = $null
  $hasOriginal = $false
  foreach ($candidate in $Element.EnumerateObject()) {
    if ($candidate.Name -eq 'originalPath') {
      $hasOriginal = $true
      if ($candidate.Value.ValueKind -ne [System.Text.Json.JsonValueKind]::String) {
        Add-InputFailure $Failures "worktree.entries[$Index].originalPath must be a string."
        return $null
      }
      $original = $candidate.Value.GetString()
    }
  }
  $rename = $xy[0] -eq 'R' -or $xy[0] -eq 'C'
  if ($rename -and (-not $hasOriginal -or [string]::IsNullOrEmpty($original) -or $original.Contains([char]0))) {
    Add-InputFailure $Failures "worktree.entries[$Index] requires originalPath for a rename or copy."
    return $null
  }
  if ((-not $rename) -and $hasOriginal) {
    Add-InputFailure $Failures "worktree.entries[$Index] must omit originalPath unless xy starts with R or C."
    return $null
  }
  $entry = New-Map
  $entry['xy'] = $xy
  $entry['path'] = $path
  if ($rename) {
    $entry['originalPath'] = $original
  }
  return ,$entry
}

function Read-Contract {
  param([Parameter(Mandatory = $true)][object]$Failures)
  if ([string]::IsNullOrWhiteSpace($ContractPath)) {
    Add-InputFailure $Failures 'ContractPath is required.'
    return $null
  }
  if (-not (Test-Path -LiteralPath $ContractPath -PathType Leaf)) {
    Add-InputFailure $Failures 'ContractPath must be an existing file.'
    return $null
  }
  $file = Get-Item -LiteralPath $ContractPath
  if ($file.Length -gt 1MB) {
    Add-InputFailure $Failures 'ContractPath exceeds 1 MiB.'
    return $null
  }
  $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
  if ($bytes.Length -eq 0) {
    Add-InputFailure $Failures 'ContractPath is empty.'
    return $null
  }
  $document = $null
  $stream = $null
  try {
    $stream = [System.IO.MemoryStream]::new($bytes, $false)
    $parseOptions = [System.Text.Json.JsonDocumentOptions]::new()
    $parseOptions.AllowDuplicateProperties = $false
    try {
      $document = [System.Text.Json.JsonDocument]::Parse($stream, $parseOptions)
    } catch {
      $parseMessage = [string]$_.Exception.Message
      if ($parseMessage -match 'Duplicate') {
        Add-InputFailure $Failures 'ContractPath contains duplicate properties.'
      } else {
        Add-InputFailure $Failures 'ContractPath is not JSON.'
      }
      return $null
    }
    $root = $document.RootElement
    if ($root.ValueKind -ne [System.Text.Json.JsonValueKind]::Object) {
      Add-InputFailure $Failures 'Contract must be a JSON object.'
      return $null
    }
    $phaseProperty = Get-RequiredProperty $root 'phase' $Failures
    $phase = $null
    if ($null -ne $phaseProperty -and $phaseProperty.ValueKind -eq [System.Text.Json.JsonValueKind]::String) {
      $phase = $phaseProperty.GetString()
    } elseif ($null -ne $phaseProperty) {
      Add-InputFailure $Failures 'phase must be a string.'
    }
    $allowedPhase = @('initial', 'resume', 'review', 'coordinator')
    if ($null -ne $phase -and ($allowedPhase -notcontains $phase)) {
      Add-InputFailure $Failures 'phase must be initial, resume, review, or coordinator.'
      $phase = $null
    }
    $topAllowed = [System.Collections.Generic.List[string]]::new()
    $topAllowed.Add('schemaVersion')
    $topAllowed.Add('phase')
    $topAllowed.Add('expected')
    if ($phase -eq 'resume') { $topAllowed.Add('launchHead') }
    if ($phase -eq 'review') {
      $topAllowed.Add('candidateHead')
      $topAllowed.Add('packetRevision')
    }
    Test-AllowedSet $root $topAllowed.ToArray() $Failures 'contract'
    $schemaProperty = Get-RequiredProperty $root 'schemaVersion' $Failures
    if ($null -ne $schemaProperty) {
      $rawSchema = $schemaProperty.GetRawText()
      if ($schemaProperty.ValueKind -ne [System.Text.Json.JsonValueKind]::Number -or $rawSchema -ne '1') {
        Add-InputFailure $Failures 'schemaVersion must be the integer 1.'
      }
    }
    $launchHead = $null
    $candidateHead = $null
    $packetRevision = $null
    if ($phase -eq 'resume') {
      foreach ($candidate in $root.EnumerateObject()) {
        if ($candidate.Name -eq 'launchHead') {
          if ($candidate.Value.ValueKind -ne [System.Text.Json.JsonValueKind]::String -or -not (Test-Sha $candidate.Value.GetString())) {
            Add-InputFailure $Failures 'launchHead must be 40 hexadecimal characters when present.'
          } else {
            $launchHead = $candidate.Value.GetString().ToLowerInvariant()
          }
        }
      }
    }
    if ($phase -eq 'review') {
      $candidateProperty = Get-RequiredProperty $root 'candidateHead' $Failures
      $packetProperty = Get-RequiredProperty $root 'packetRevision' $Failures
      if ($null -ne $candidateProperty -and $candidateProperty.ValueKind -eq [System.Text.Json.JsonValueKind]::String -and (Test-Sha $candidateProperty.GetString())) {
        $candidateHead = $candidateProperty.GetString().ToLowerInvariant()
      } elseif ($null -ne $candidateProperty) {
        Add-InputFailure $Failures 'candidateHead must be 40 hexadecimal characters.'
      }
      if ($null -ne $packetProperty -and $packetProperty.ValueKind -eq [System.Text.Json.JsonValueKind]::String -and (Test-Sha $packetProperty.GetString())) {
        $packetRevision = $packetProperty.GetString().ToLowerInvariant()
      } elseif ($null -ne $packetProperty) {
        Add-InputFailure $Failures 'packetRevision must be 40 hexadecimal characters.'
      }
    }
    $expectedProperty = Get-RequiredProperty $root 'expected' $Failures
    if ($null -eq $expectedProperty -or $expectedProperty.ValueKind -ne [System.Text.Json.JsonValueKind]::Object) {
      if ($null -ne $expectedProperty) {
        Add-InputFailure $Failures 'expected must be an object.'
      }
      return $null
    }
    Test-AllowedSet $expectedProperty @('repositoryRoot', 'branch', 'head', 'origin', 'upstream', 'worktree') $Failures 'expected'
    $parsed = New-Map
    $parsed['phase'] = $phase
    $parsed['launchHead'] = $launchHead
    $parsed['candidateHead'] = $candidateHead
    $parsed['packetRevision'] = $packetRevision
    $rootProperty = Get-RequiredProperty $expectedProperty 'repositoryRoot' $Failures
    if ($null -ne $rootProperty -and $rootProperty.ValueKind -eq [System.Text.Json.JsonValueKind]::String) {
      $rootText = $rootProperty.GetString()
      if (-not [System.IO.Path]::IsPathFullyQualified($rootText)) {
        Add-InputFailure $Failures 'expected.repositoryRoot must be a fully qualified path.'
      }
      $parsed['repositoryRoot'] = $rootText
    } elseif ($null -ne $rootProperty) {
      Add-InputFailure $Failures 'expected.repositoryRoot must be a string.'
    }
    $branchProperty = Get-RequiredProperty $expectedProperty 'branch' $Failures
    if ($null -ne $branchProperty) {
      if ($branchProperty.ValueKind -eq [System.Text.Json.JsonValueKind]::Null) {
        $parsed['branch'] = $null
      } elseif ($branchProperty.ValueKind -eq [System.Text.Json.JsonValueKind]::String -and -not [string]::IsNullOrWhiteSpace($branchProperty.GetString())) {
        $parsed['branch'] = $branchProperty.GetString()
      } else {
        Add-InputFailure $Failures 'expected.branch must be a non-empty string or null for detached HEAD.'
      }
    }
    $headProperty = Get-RequiredProperty $expectedProperty 'head' $Failures
    if ($null -ne $headProperty -and $headProperty.ValueKind -eq [System.Text.Json.JsonValueKind]::String -and (Test-Sha $headProperty.GetString())) {
      $parsed['head'] = $headProperty.GetString().ToLowerInvariant()
    } elseif ($null -ne $headProperty) {
      Add-InputFailure $Failures 'expected.head must be 40 hexadecimal characters.'
    }
    if ($phase -eq 'review' -and $null -ne $candidateHead -and $parsed.ContainsKey('head') -and $parsed['head'] -ne $candidateHead) {
      Add-InputFailure $Failures 'review candidateHead must equal expected.head. packetRevision is not the candidate.'
    }
    $originProperty = Get-RequiredProperty $expectedProperty 'origin' $Failures
    if ($null -ne $originProperty) {
      if ($originProperty.ValueKind -eq [System.Text.Json.JsonValueKind]::Null) {
        $parsed['origin'] = $null
      } elseif ($originProperty.ValueKind -eq [System.Text.Json.JsonValueKind]::Object) {
        Test-AllowedSet $originProperty @('fetch', 'push') $Failures 'expected.origin'
        $fetchProperty = Get-RequiredProperty $originProperty 'fetch' $Failures
        $pushProperty = Get-RequiredProperty $originProperty 'push' $Failures
        $origin = New-Map
        foreach ($pair in @(@('fetch', $fetchProperty), @('push', $pushProperty))) {
          $name = $pair[0]
          $value = $pair[1]
          if ($null -eq $value) { continue }
          if ($value.ValueKind -ne [System.Text.Json.JsonValueKind]::String -or [string]::IsNullOrWhiteSpace($value.GetString()) -or $value.GetString().Contains([char]0)) {
            Add-InputFailure $Failures "expected.origin.$name must be a non-empty string."
          } else {
            $origin[$name] = $value.GetString()
          }
        }
        if ($origin.ContainsKey('fetch') -and $origin.ContainsKey('push')) {
          $parsed['origin'] = $origin
        }
      } else {
        Add-InputFailure $Failures 'expected.origin must be an object or null when origin is absent.'
      }
    }
    $upstreamProperty = Get-RequiredProperty $expectedProperty 'upstream' $Failures
    if ($null -ne $upstreamProperty) {
      if ($upstreamProperty.ValueKind -eq [System.Text.Json.JsonValueKind]::Null) {
        $parsed['upstream'] = $null
      } elseif ($upstreamProperty.ValueKind -eq [System.Text.Json.JsonValueKind]::String -and $upstreamProperty.GetString() -match '^refs/\S+$') {
        $parsed['upstream'] = $upstreamProperty.GetString()
      } else {
        Add-InputFailure $Failures 'expected.upstream must be null or an exact refs/ tracking ref.'
      }
    }
    $worktreeProperty = Get-RequiredProperty $expectedProperty 'worktree' $Failures
    if ($null -ne $worktreeProperty -and $worktreeProperty.ValueKind -eq [System.Text.Json.JsonValueKind]::Object) {
      Test-AllowedSet $worktreeProperty @('clean', 'entries') $Failures 'expected.worktree'
      $cleanProperty = Get-RequiredProperty $worktreeProperty 'clean' $Failures
      $clean = $null
      if ($null -ne $cleanProperty -and ($cleanProperty.ValueKind -eq [System.Text.Json.JsonValueKind]::True -or $cleanProperty.ValueKind -eq [System.Text.Json.JsonValueKind]::False)) {
        $clean = $cleanProperty.GetBoolean()
      } elseif ($null -ne $cleanProperty) {
        Add-InputFailure $Failures 'expected.worktree.clean must be a boolean.'
      }
      $entries = New-List
      $sawEntries = $false
      foreach ($candidate in $worktreeProperty.EnumerateObject()) {
        if ($candidate.Name -eq 'entries') {
          $sawEntries = $true
          if ($candidate.Value.ValueKind -ne [System.Text.Json.JsonValueKind]::Array) {
            Add-InputFailure $Failures 'expected.worktree.entries must be an array.'
          } else {
            $index = 0
            foreach ($item in $candidate.Value.EnumerateArray()) {
              $converted = ConvertTo-WorktreeEntry $item $Failures $index
              if ($null -ne $converted) { $entries.Add($converted) }
              $index++
            }
          }
        }
      }
      if ($null -ne $clean -and $clean -and $sawEntries) {
        Add-InputFailure $Failures 'expected.worktree.entries must be omitted when clean is true.'
      }
      if ($null -ne $clean -and -not $clean -and ((-not $sawEntries) -or $entries.Count -eq 0)) {
        Add-InputFailure $Failures 'expected.worktree.entries must describe the dirty index and worktree when clean is false.'
      }
      if ($null -ne $clean) {
        $worktree = New-Map
        $worktree['clean'] = $clean
        if (-not $clean) { $worktree['entries'] = $entries }
        $parsed['worktree'] = $worktree
      }
    } elseif ($null -ne $worktreeProperty) {
      Add-InputFailure $Failures 'expected.worktree must be an object.'
    }
    if ($Failures.Count -gt 0) {
      return $null
    }
    return ,$parsed
  } finally {
    if ($null -ne $document) { $document.Dispose() }
    if ($null -ne $stream) { $stream.Dispose() }
  }
}

function Invoke-BindingGit {
  param([Parameter(Mandatory = $true)][string[]]$Arguments)
  $recorded = New-List
  foreach ($argument in $Arguments) { $recorded.Add($argument) }
  $script:GitReads.Add($recorded)
  $start = [System.Diagnostics.ProcessStartInfo]::new()
  $start.FileName = 'git'
  $start.UseShellExecute = $false
  $start.CreateNoWindow = $true
  $start.RedirectStandardOutput = $true
  $start.RedirectStandardError = $true
  $utf8 = [System.Text.UTF8Encoding]::new($false)
  $start.StandardOutputEncoding = $utf8
  $start.StandardErrorEncoding = $utf8
  $start.Environment['GIT_OPTIONAL_LOCKS'] = '0'
  $start.Environment['GIT_TERMINAL_PROMPT'] = '0'
  $start.Environment['GCM_INTERACTIVE'] = 'Never'
  foreach ($argument in $Arguments) { $start.ArgumentList.Add($argument) }
  $result = New-Map
  $result['arguments'] = $Arguments
  try {
    $process = [System.Diagnostics.Process]::Start($start)
  } catch {
    $result['started'] = $false
    $result['exitCode'] = $null
    $result['stdout'] = ''
    $result['stderr'] = Hide-TextCredentials $_.Exception.Message
    return ,$result
  }
  try {
    $outputTask = $process.StandardOutput.ReadToEndAsync()
    $errorTask = $process.StandardError.ReadToEndAsync()
    $process.WaitForExit()
    $result['started'] = $true
    $result['exitCode'] = $process.ExitCode
    $result['stdout'] = $outputTask.GetAwaiter().GetResult()
    $result['stderr'] = $errorTask.GetAwaiter().GetResult()
    return ,$result
  } finally {
    $process.Dispose()
  }
}

function Get-GitPrefix {
  param([Parameter(Mandatory = $true)][string]$Root)
  return ,@('--no-optional-locks', '-C', $Root)
}

function Get-OneLine {
  param([AllowNull()][string]$Text)
  if ($null -eq $Text) { return '' }
  return $Text.TrimEnd("`r", "`n")
}

function ConvertFrom-StatusZ {
  param([AllowNull()][string]$Text)
  $entries = New-List
  if ([string]::IsNullOrEmpty($Text)) {
    return ,$entries
  }
  $parts = $Text.Split([char]0)
  if ($parts.Length -gt 0 -and $parts[$parts.Length - 1].Length -eq 0) {
    $bounded = [System.Collections.Generic.List[string]]::new()
    for ($i = 0; $i -lt ($parts.Length - 1); $i++) { $bounded.Add($parts[$i]) }
    $parts = $bounded.ToArray()
  }
  $index = 0
  while ($index -lt $parts.Length) {
    $token = $parts[$index]
    if ($token.Length -lt 4 -or $token[2] -ne ' ') {
      throw "git status record is not porcelain v1 NUL output."
    }
    $xy = $token.Substring(0, 2)
    $path = $token.Substring(3)
    $original = $null
    if ($xy[0] -eq 'R' -or $xy[0] -eq 'C') {
      $index++
      if ($index -ge $parts.Length -or $parts[$index].Length -eq 0) {
        throw 'git status rename record is missing its original path.'
      }
      $original = $parts[$index]
    }
    $entry = New-Map
    $entry['xy'] = $xy
    $entry['path'] = $path
    if ($null -ne $original) { $entry['originalPath'] = $original }
    $entries.Add($entry)
    $index++
  }
  return ,$entries
}

function Get-EntryKey {
  param([Parameter(Mandatory = $true)]$Entry)
  $original = ''
  if ($Entry.ContainsKey('originalPath')) { $original = [string]$Entry['originalPath'] }
  return ([string]$Entry['xy']) + "`0" + ([string]$Entry['path']) + "`0" + $original
}

function Copy-SanitizedOrigin {
  param($Origin)
  if ($null -eq $Origin) { return $null }
  $copy = New-Map
  $copy['fetch'] = Hide-RemoteCredential ([string]$Origin['fetch'])
  $copy['push'] = Hide-RemoteCredential ([string]$Origin['push'])
  return ,$copy
}

function Copy-Worktree {
  param($Worktree)
  $copy = New-Map
  $copy['clean'] = [bool]$Worktree['clean']
  if ($Worktree.ContainsKey('entries')) {
    $entries = New-List
    foreach ($entry in $Worktree['entries']) {
      $item = New-Map
      $item['xy'] = [string]$entry['xy']
      $item['path'] = [string]$entry['path']
      if ($entry.ContainsKey('originalPath')) { $item['originalPath'] = [string]$entry['originalPath'] }
      $entries.Add($item)
    }
    $copy['entries'] = $entries
  }
  return ,$copy
}

function New-ResultShell {
  param([AllowNull()][string]$Phase, [AllowNull()]$Contract)
  $result = New-Map
  $result['schemaVersion'] = 1
  $result['outcome'] = 'inspection-failed'
  $result['phase'] = $Phase
  $result['checkedAt'] = [DateTimeOffset]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ss.fffZ', [System.Globalization.CultureInfo]::InvariantCulture)
  $result['elapsedMilliseconds'] = Get-ElapsedMilliseconds
  $result['gitReads'] = $script:GitReads
  if ($null -eq $Contract) {
    $result['expected'] = $null
  } else {
    $expected = New-Map
    if ($Contract.ContainsKey('repositoryRoot')) { $expected['repositoryRoot'] = [string]$Contract['repositoryRoot'] }
    if ($Contract.ContainsKey('branch')) { $expected['branch'] = $Contract['branch'] }
    if ($Contract.ContainsKey('head')) { $expected['head'] = [string]$Contract['head'] }
    if ($Contract.ContainsKey('origin')) { $expected['origin'] = Copy-SanitizedOrigin $Contract['origin'] }
    if ($Contract.ContainsKey('upstream')) { $expected['upstream'] = $Contract['upstream'] }
    if ($Contract.ContainsKey('worktree')) { $expected['worktree'] = Copy-Worktree $Contract['worktree'] }
    $result['expected'] = $expected
  }
  $result['actual'] = $null
  $result['mismatches'] = New-List
  $result['failures'] = New-List
  $result['drift'] = $null
  $context = New-Map
  $context['launchHead'] = $(if ($null -ne $Contract -and $Contract.ContainsKey('launchHead')) { $Contract['launchHead'] } else { $null })
  $context['candidateHead'] = $(if ($null -ne $Contract -and $Contract.ContainsKey('candidateHead')) { $Contract['candidateHead'] } else { $null })
  $context['packetRevision'] = $(if ($null -ne $Contract -and $Contract.ContainsKey('packetRevision')) { $Contract['packetRevision'] } else { $null })
  $result['context'] = $context
  return ,$result
}

function Add-Mismatch {
  param($Result, [string]$Field, $Expected, $Actual, [string]$Difference)
  $mismatch = New-Map
  $mismatch['field'] = $Field
  $mismatch['expected'] = $Expected
  $mismatch['actual'] = $Actual
  if (-not [string]::IsNullOrEmpty($Difference)) { $mismatch['difference'] = $Difference }
  $Result['mismatches'].Add($mismatch)
}

function Add-UrlMismatch {
  param($Result, [string]$Field, [string]$Expected, [string]$Actual)
  $expectedSafe = Hide-RemoteCredential $Expected
  $actualSafe = Hide-RemoteCredential $Actual
  $difference = $null
  if ($expectedSafe -eq $actualSafe -and $Expected -ne $Actual) { $difference = 'userinfo' }
  Add-Mismatch $Result $Field $expectedSafe $actualSafe $difference
}

function Wait-BindingSync {
  param([Parameter(Mandatory = $true)][string]$RepositoryRoot)
  $sync = $env:BRAID_WORKSPACE_BINDING_SYNC_DIR
  if ([string]::IsNullOrWhiteSpace($sync)) { return }
  if (-not [System.IO.Path]::IsPathFullyQualified($sync) -or -not (Test-Path -LiteralPath $sync -PathType Container)) {
    throw 'BRAID_WORKSPACE_BINDING_SYNC_DIR must be an existing fully qualified directory outside the repository.'
  }
  if (Test-PathInside $RepositoryRoot $sync) {
    throw 'BRAID_WORKSPACE_BINDING_SYNC_DIR must stay outside the repository.'
  }
  $ready = Join-Path $sync 'ready'
  $release = Join-Path $sync 'release'
  [System.IO.File]::WriteAllBytes($ready, [byte[]]@())
  $deadline = [DateTime]::UtcNow.AddSeconds(15)
  while (-not (Test-Path -LiteralPath $release)) {
    if ([DateTime]::UtcNow -gt $deadline) {
      throw 'Sync release timed out before the binding recheck.'
    }
    Start-Sleep -Milliseconds 15
  }
}

function Read-BranchAndHead {
  param([Parameter(Mandatory = $true)][string]$Root, [Parameter(Mandatory = $true)][object]$Failures)
  $prefix = Get-GitPrefix $Root
  $symbolic = Invoke-BindingGit (@($prefix) + @('symbolic-ref', '--quiet', 'HEAD'))
  if (-not $symbolic['started']) {
    Add-GitFailure $Failures $symbolic['arguments'] $null $symbolic['stderr']
    return $null
  }
  $branch = $null
  if ($symbolic['exitCode'] -eq 0) {
    $ref = Get-OneLine $symbolic['stdout']
    if (-not $ref.StartsWith('refs/heads/', [System.StringComparison]::Ordinal)) {
      Add-GitFailure $Failures $symbolic['arguments'] $symbolic['exitCode'] 'symbolic-ref did not return a branch.'
      return $null
    }
    $branch = $ref.Substring('refs/heads/'.Length)
  } elseif ($symbolic['exitCode'] -ne 1) {
    Add-GitFailure $Failures $symbolic['arguments'] $symbolic['exitCode'] $symbolic['stderr']
    return $null
  }
  $head = Invoke-BindingGit (@($prefix) + @('rev-parse', '--verify', '--end-of-options', 'HEAD'))
  if ((-not $head['started']) -or $head['exitCode'] -ne 0) {
    Add-GitFailure $Failures $head['arguments'] $(if ($head['started']) { $head['exitCode'] } else { $null }) $head['stderr']
    return $null
  }
  $sha = Get-OneLine $head['stdout']
  if ($sha -notmatch '^[0-9a-f]{40}$') {
    Add-GitFailure $Failures $head['arguments'] $head['exitCode'] 'rev-parse HEAD did not return a full SHA.'
    return $null
  }
  $snapshot = New-Map
  $snapshot['branch'] = $branch
  $snapshot['head'] = $sha
  return ,$snapshot
}

function Invoke-Check {
  $inputFailures = New-List
  if ([string]::IsNullOrWhiteSpace($RepositoryRoot) -or -not [System.IO.Path]::IsPathFullyQualified($RepositoryRoot)) {
    Add-InputFailure $inputFailures '-RepositoryRoot must be a fully qualified path.'
  } elseif (-not (Test-Path -LiteralPath $RepositoryRoot -PathType Container)) {
    Add-InputFailure $inputFailures '-RepositoryRoot must be an existing directory.'
  }
  $contract = Read-Contract $inputFailures
  if ($inputFailures.Count -gt 0 -or $null -eq $contract) {
    $phase = $null
    if ($null -ne $contract -and $contract.ContainsKey('phase')) { $phase = $contract['phase'] }
    $result = New-ResultShell $phase $contract
    $result['outcome'] = 'invalid'
    $result['failures'] = $inputFailures
    return @{ ExitCode = 2; Result = $result }
  }
  $failures = New-List
  $result = New-ResultShell $contract['phase'] $contract
  $root = [System.IO.Path]::GetFullPath($RepositoryRoot)
  $prefix = Get-GitPrefix $root
  $inside = Invoke-BindingGit (@($prefix) + @('rev-parse', '--is-inside-work-tree'))
  if ((-not $inside['started']) -or $inside['exitCode'] -ne 0 -or (Get-OneLine $inside['stdout']) -ne 'true') {
    Add-GitFailure $failures $inside['arguments'] $(if ($inside['started']) { $inside['exitCode'] } else { $null }) $(if ($inside['started']) { $inside['stderr'] } else { $inside['stderr'] })
    $result['outcome'] = 'inspection-failed'
    $result['failures'] = $failures
    return @{ ExitCode = 2; Result = $result }
  }
  $toplevel = Invoke-BindingGit (@($prefix) + @('rev-parse', '--path-format=absolute', '--show-toplevel'))
  $gitDir = Invoke-BindingGit (@($prefix) + @('rev-parse', '--path-format=absolute', '--git-dir'))
  $commonDir = Invoke-BindingGit (@($prefix) + @('rev-parse', '--path-format=absolute', '--git-common-dir'))
  foreach ($probe in @($toplevel, $gitDir, $commonDir)) {
    if ((-not $probe['started']) -or $probe['exitCode'] -ne 0 -or [string]::IsNullOrWhiteSpace((Get-OneLine $probe['stdout']))) {
      Add-GitFailure $failures $probe['arguments'] $(if ($probe['started']) { $probe['exitCode'] } else { $null }) $probe['stderr']
      $result['outcome'] = 'inspection-failed'
      $result['failures'] = $failures
      return @{ ExitCode = 2; Result = $result }
    }
  }
  $before = Read-BranchAndHead $root $failures
  if ($null -eq $before) {
    $result['outcome'] = 'inspection-failed'
    $result['failures'] = $failures
    return @{ ExitCode = 2; Result = $result }
  }
  try {
    Wait-BindingSync $root
  } catch {
    $syncMessage = Hide-TextCredentials $_.Exception.Message
    Add-InputFailure $failures $syncMessage
    $result['outcome'] = $(if ($syncMessage -like 'BRAID_WORKSPACE_BINDING_SYNC_DIR*') { 'invalid' } else { 'inspection-failed' })
    $result['failures'] = $failures
    return @{ ExitCode = 2; Result = $result }
  }
  $remotes = Invoke-BindingGit (@($prefix) + @('remote'))
  if ((-not $remotes['started']) -or $remotes['exitCode'] -ne 0) {
    Add-GitFailure $failures $remotes['arguments'] $(if ($remotes['started']) { $remotes['exitCode'] } else { $null }) $remotes['stderr']
    $result['outcome'] = 'inspection-failed'
    $result['failures'] = $failures
    return @{ ExitCode = 2; Result = $result }
  }
  $originPresent = $false
  foreach ($line in ($remotes['stdout'] -split "`r?`n")) {
    if ($line -eq 'origin') { $originPresent = $true }
  }
  $origin = $null
  if ($originPresent) {
    $fetch = Invoke-BindingGit (@($prefix) + @('remote', 'get-url', 'origin'))
    $push = Invoke-BindingGit (@($prefix) + @('remote', 'get-url', '--push', 'origin'))
    foreach ($probe in @($fetch, $push)) {
      if ((-not $probe['started']) -or $probe['exitCode'] -ne 0 -or [string]::IsNullOrWhiteSpace((Get-OneLine $probe['stdout']))) {
        Add-GitFailure $failures $probe['arguments'] $(if ($probe['started']) { $probe['exitCode'] } else { $null }) $probe['stderr']
        $result['outcome'] = 'inspection-failed'
        $result['failures'] = $failures
        return @{ ExitCode = 2; Result = $result }
      }
    }
    $origin = New-Map
    $origin['fetch'] = Get-OneLine $fetch['stdout']
    $origin['push'] = Get-OneLine $push['stdout']
  }
  $upstream = $null
  if ($null -ne $before['branch']) {
    $upstreamArg = '@{upstream}'
    $upstreamRead = Invoke-BindingGit (@($prefix) + @('rev-parse', '--verify', '--symbolic-full-name', '--end-of-options', $upstreamArg))
    $format = '%(upstream)'
    $listed = Invoke-BindingGit (@($prefix) + @('for-each-ref', "--format=$format", ('refs/heads/' + [string]$before['branch'])))
    if ((-not $listed['started']) -or $listed['exitCode'] -ne 0) {
      Add-GitFailure $failures $listed['arguments'] $(if ($listed['started']) { $listed['exitCode'] } else { $null }) $listed['stderr']
      $result['outcome'] = 'inspection-failed'
      $result['failures'] = $failures
      return @{ ExitCode = 2; Result = $result }
    }
    $listedRef = Get-OneLine $listed['stdout']
    if (-not $upstreamRead['started']) {
      Add-GitFailure $failures $upstreamRead['arguments'] $null $upstreamRead['stderr']
      $result['outcome'] = 'inspection-failed'
      $result['failures'] = $failures
      return @{ ExitCode = 2; Result = $result }
    }
    if ($upstreamRead['exitCode'] -eq 0) {
      $resolved = Get-OneLine $upstreamRead['stdout']
      if ($resolved -ne $listedRef -or [string]::IsNullOrWhiteSpace($resolved)) {
        Add-GitFailure $failures $upstreamRead['arguments'] $upstreamRead['exitCode'] 'upstream reads disagreed.'
        $result['outcome'] = 'inspection-failed'
        $result['failures'] = $failures
        return @{ ExitCode = 2; Result = $result }
      }
      $upstream = $resolved
    } elseif ($upstreamRead['exitCode'] -eq 128 -and [string]::IsNullOrWhiteSpace($listedRef)) {
      $upstream = $null
    } else {
      Add-GitFailure $failures $upstreamRead['arguments'] $upstreamRead['exitCode'] $upstreamRead['stderr']
      $result['outcome'] = 'inspection-failed'
      $result['failures'] = $failures
      return @{ ExitCode = 2; Result = $result }
    }
  }
  $status = Invoke-BindingGit (@($prefix) + @('status', '--porcelain=v1', '-z', '--untracked-files=all'))
  if ((-not $status['started']) -or $status['exitCode'] -ne 0) {
    Add-GitFailure $failures $status['arguments'] $(if ($status['started']) { $status['exitCode'] } else { $null }) $status['stderr']
    $result['outcome'] = 'inspection-failed'
    $result['failures'] = $failures
    return @{ ExitCode = 2; Result = $result }
  }
  try {
    $entries = ConvertFrom-StatusZ $status['stdout']
  } catch {
    Add-GitFailure $failures $status['arguments'] $status['exitCode'] $_.Exception.Message
    $result['outcome'] = 'inspection-failed'
    $result['failures'] = $failures
    return @{ ExitCode = 2; Result = $result }
  }
  $after = Read-BranchAndHead $root $failures
  if ($null -eq $after) {
    $result['outcome'] = 'inspection-failed'
    $result['failures'] = $failures
    return @{ ExitCode = 2; Result = $result }
  }
  $actualWorktree = New-Map
  $actualWorktree['clean'] = ($entries.Count -eq 0)
  $actualWorktree['entries'] = $entries
  $actual = New-Map
  $actual['invocationRoot'] = ConvertTo-ComparablePath $root
  $actual['repositoryRoot'] = ConvertTo-ComparablePath (Get-OneLine $toplevel['stdout'])
  $actual['branch'] = $before['branch']
  $actual['head'] = $before['head']
  $actual['origin'] = Copy-SanitizedOrigin $origin
  $actual['upstream'] = $upstream
  $actual['worktree'] = $actualWorktree
  $actual['gitDir'] = ConvertTo-ComparablePath (Get-OneLine $gitDir['stdout'])
  $actual['gitCommonDir'] = ConvertTo-ComparablePath (Get-OneLine $commonDir['stdout'])
  $result['actual'] = $actual
  if (-not (Test-SamePath $root $contract['repositoryRoot'])) {
    Add-Mismatch $result 'invocationRoot' (ConvertTo-ComparablePath ([string]$contract['repositoryRoot'])) $actual['invocationRoot'] $null
  }
  if (-not (Test-SamePath (Get-OneLine $toplevel['stdout']) $contract['repositoryRoot'])) {
    Add-Mismatch $result 'repositoryRoot' (ConvertTo-ComparablePath ([string]$contract['repositoryRoot'])) $actual['repositoryRoot'] $null
  }
  $expectedBranch = $contract['branch']
  $actualBranch = $before['branch']
  if (-not (Test-SameText $expectedBranch $actualBranch)) {
    Add-Mismatch $result 'branch' $expectedBranch $actualBranch $null
  }
  if (-not (Test-SameText $before['head'] $contract['head'])) {
    Add-Mismatch $result 'head' $contract['head'] $before['head'] $null
  }
  $expectedOrigin = $contract['origin']
  if ($null -eq $expectedOrigin -and $null -eq $origin) {
    # Both absent.
  } elseif ($null -eq $expectedOrigin -or $null -eq $origin) {
    Add-Mismatch $result 'origin' (Copy-SanitizedOrigin $expectedOrigin) (Copy-SanitizedOrigin $origin) $null
  } else {
    if (-not (Test-SameText $expectedOrigin['fetch'] $origin['fetch'])) {
      Add-UrlMismatch $result 'origin.fetch' ([string]$expectedOrigin['fetch']) ([string]$origin['fetch'])
    }
    if (-not (Test-SameText $expectedOrigin['push'] $origin['push'])) {
      Add-UrlMismatch $result 'origin.push' ([string]$expectedOrigin['push']) ([string]$origin['push'])
    }
  }
  $expectedUpstream = $contract['upstream']
  if (-not (Test-SameText $expectedUpstream $upstream)) {
    Add-Mismatch $result 'upstream' $expectedUpstream $upstream $null
  }
  $expectedEntries = New-List
  if ($contract['worktree'].ContainsKey('entries')) {
    foreach ($entry in $contract['worktree']['entries']) { $expectedEntries.Add($entry) }
  }
  $expectedKeys = [System.Collections.Generic.List[string]]::new()
  $actualKeys = [System.Collections.Generic.List[string]]::new()
  foreach ($entry in $expectedEntries) { $expectedKeys.Add((Get-EntryKey $entry)) }
  foreach ($entry in $entries) { $actualKeys.Add((Get-EntryKey $entry)) }
  $expectedKeys.Sort([System.StringComparer]::Ordinal)
  $actualKeys.Sort([System.StringComparer]::Ordinal)
  $sameEntries = ($expectedKeys.Count -eq $actualKeys.Count)
  if ($sameEntries) {
    for ($i = 0; $i -lt $expectedKeys.Count; $i++) {
      if (-not [string]::Equals($expectedKeys[$i], $actualKeys[$i], [System.StringComparison]::Ordinal)) {
        $sameEntries = $false
      }
    }
  }
  if (-not $sameEntries) {
    Add-Mismatch $result 'worktree.entries' (Copy-Worktree $contract['worktree']) $actualWorktree $null
  }
  $changes = New-List
  $beforeBranchText = $before['branch']
  $afterBranchText = $after['branch']
  $branchDrift = (($null -eq $beforeBranchText) -ne ($null -eq $afterBranchText)) -or (($null -ne $beforeBranchText) -and ($beforeBranchText -cne $afterBranchText))
  if ($branchDrift) {
    $change = New-Map
    $change['field'] = 'branch'
    $change['before'] = $beforeBranchText
    $change['after'] = $afterBranchText
    $changes.Add($change)
  }
  if ($before['head'] -cne $after['head']) {
    $change = New-Map
    $change['field'] = 'head'
    $change['before'] = $before['head']
    $change['after'] = $after['head']
    $changes.Add($change)
  }
  if ($changes.Count -gt 0) {
    $drift = New-Map
    $drift['recheckRequired'] = $true
    $drift['changes'] = $changes
    $result['drift'] = $drift
    $result['outcome'] = 'drift'
    $result['failures'] = $failures
    $result['elapsedMilliseconds'] = Get-ElapsedMilliseconds
    return @{ ExitCode = 1; Result = $result }
  }
  if ($result['mismatches'].Count -gt 0) {
    $result['outcome'] = 'mismatch'
    $result['failures'] = $failures
    $result['elapsedMilliseconds'] = Get-ElapsedMilliseconds
    return @{ ExitCode = 1; Result = $result }
  }
  $result['outcome'] = 'match'
  $result['failures'] = $failures
  $result['elapsedMilliseconds'] = Get-ElapsedMilliseconds
  return @{ ExitCode = 0; Result = $result }
}

function Write-BindingResult {
  param($Result, [int]$ExitCode)
  $label = switch ($Result['outcome']) {
    'match' { 'match' }
    'mismatch' {
      $fields = @(foreach ($item in $Result['mismatches']) { [string]$item['field'] })
      'mismatch: ' + ($fields -join ', ')
    }
    'drift' {
      $fields = @(foreach ($item in $Result['drift']['changes']) { [string]$item['field'] })
      'drift: ' + ($fields -join ', ')
    }
    'invalid' {
      $message = 'invalid input'
      if ($Result['failures'].Count -gt 0) { $message = [string]$Result['failures'][0]['message'] }
      'invalid: ' + (Hide-TextCredentials $message)
    }
    default {
      $message = 'inspection failed'
      if ($Result['failures'].Count -gt 0 -and $Result['failures'][0].ContainsKey('stderr') -and -not [string]::IsNullOrWhiteSpace([string]$Result['failures'][0]['stderr'])) {
        $message = ([string]$Result['failures'][0]['stderr']).Trim()
      } elseif ($Result['failures'].Count -gt 0 -and $Result['failures'][0].ContainsKey('message')) {
        $message = [string]$Result['failures'][0]['message']
      }
      'inspection failed: ' + (Hide-TextCredentials $message)
    }
  }
  [Console]::Error.WriteLine("workspace-binding: $label")
  $Result['elapsedMilliseconds'] = Get-ElapsedMilliseconds
  $json = [System.Text.Json.JsonSerializer]::Serialize($Result, $script:JsonOptions) + "`n"
  $bytes = [System.Text.UTF8Encoding]::new($false).GetBytes($json)
  $stdout = [Console]::OpenStandardOutput()
  $stdout.Write($bytes, 0, $bytes.Length)
  $stdout.Flush()
  return $ExitCode
}

$evaluation = $null
try {
  $evaluation = Invoke-Check
} catch {
  $failed = New-ResultShell $null $null
  $failed['outcome'] = 'inspection-failed'
  Add-InputFailure $failed['failures'] (Hide-TextCredentials $_.Exception.Message)
  $evaluation = @{ ExitCode = 2; Result = $failed }
}
$exitCode = Write-BindingResult $evaluation.Result $evaluation.ExitCode
exit $exitCode
