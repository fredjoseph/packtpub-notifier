$tn = "PacktpubNotifier_" + $env:username

schtasks.exe /delete /tn $tn /F 2>&1 | Out-Null