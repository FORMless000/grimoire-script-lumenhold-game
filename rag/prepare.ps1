# Verify local authoring readiness. Explicit --build/--sync/--resume enables indexing.
$ErrorActionPreference = 'Stop'
$setupRoot = Split-Path -Parent $PSScriptRoot
$setupCandidates = @()
if ($env:NODE24_BIN) {
    $setupCandidates = @($env:NODE24_BIN)
} else {
    $setupNodeCommand = Get-Command node -CommandType Application -ErrorAction SilentlyContinue
    if ($setupNodeCommand) { $setupCandidates += $setupNodeCommand.Source }
    $setupCandidates += '/opt/homebrew/opt/node@24/bin/node', '/usr/local/opt/node@24/bin/node'
}
$setupNode = $null
foreach ($setupCandidate in $setupCandidates) {
    if (Test-Path -LiteralPath $setupCandidate -PathType Leaf) {
        $setupMajor = & $setupCandidate -p 'process.versions.node.match(/^\d+/)[0]'
        if ($LASTEXITCODE -eq 0 -and $setupMajor -eq '24') {
            $setupNode = $setupCandidate
            break
        }
    }
}
if (-not $setupNode) {
    throw 'Node 24 required. Install Node 24 (including npm), or set NODE24_BIN to its executable, then retry.'
}

$setupOriginalPath = $env:PATH
Push-Location -LiteralPath $setupRoot
try {
    $env:PATH = (Split-Path -Parent $setupNode) + [IO.Path]::PathSeparator + $setupOriginalPath
    & $setupNode (Join-Path $PSScriptRoot 'prepare.js') @args
    $setupExitCode = $LASTEXITCODE
} finally {
    $env:PATH = $setupOriginalPath
    Pop-Location
}
exit $setupExitCode
