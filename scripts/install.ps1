$loggedUser = $env:username
$domainUser = $env:USERDOMAIN + "\" + $loggedUser
$tn = "PacktpubNotifier_" + $loggedUser

schtasks.exe /delete /tn $tn /F 2>&1 | Out-Null

$xml = [xml] (Get-Content $PSScriptRoot/PacktpubNotifier.xml)

$xml.Task.RegistrationInfo.Author = $domainUser
$xml.Task.RegistrationInfo.Date = (Get-Date -Format o).ToString()
$xml.Task.Principals.Principal.UserId = $domainuser
$xml.Task.Triggers.CalendarTrigger.StartBoundary = (Get-Date ([DateTime]::Today.AddDays(1).addHours(2)) -Format o).ToString()
$xml.Task.Actions.Exec.Command = "launchHidden.vbs"
$xml.Task.Actions.Exec.Arguments = "./run.ps1"
$xml.Task.Actions.Exec.WorkingDirectory = (Resolve-Path .).Path

$filepath = New-TemporaryFile

$xml.Save($filepath.FullName) | Out-Null
schtasks.exe /create /tn $tn /xml $filepath |Out-Null

Remove-Item $filepath