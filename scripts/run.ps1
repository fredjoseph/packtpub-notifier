<#
.SYNOPSIS
Packtpub - daily free ebook notifier.

.DESCRIPTION
Packtpub - daily free ebook notifier.

.PARAMETER Retry
Number of retries on failure (default : -1 -> unlimited)

.PARAMETER Delay
Delay in minutes between 2 attempts (min : 1, max: 720 - default : 15 minutes)

#>
param(
    [ValidateRange(-1, [int]::MaxValue)]
    [Int]$Retry = -1,
    [ValidateRange(1, 720)]
    [Int]$Delay = 15
)

function launch_node_process {
    node $PSScriptRoot/../index.js
    return $?
}

$res = launch_node_process
# Loop until success
While ($res -eq $False -and ($Retry -eq -1 -or $Retry-- -gt 0)) {
    Start-Sleep -s (60 * $Delay)
    $res = launch_node_process
}