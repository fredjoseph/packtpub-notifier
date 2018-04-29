# Packtpub-notifier

A Windows notifier for the [packtpub daily free ebook](https://www.packtpub.com/packt/offers/free-learning)

## Requirement
- NodeJS

## Installation
This notifier doesn't require a specific installation (only `npm install`).
However, the script `install.ps1` allows to create a scheduled task that runs the notifier every day.

### Scoop
This notifier is also added in "fredjoseph" [scoop bucket](https://github.com/fredjoseph/scoop-bucket)

    scoop install packtpubNotifier

## Usage

### Manual
Launch command line `node index.js` or the `Powershell` script `runOnce.ps1`

### Automatic
Create a scheduled task in `Windows Task scheduler` that runs the above command every day 
or use the installation script `install.ps1`.

The folder `scripts` contains :
- `install.ps1` : Script that creates a daily scheduled task based on `PacktpubNotifier.xml` configuration file
- `uninstall.ps1` : Uninstallation script
- `launchHidden.vbs` : Script that allows to launch an other script in a hidden prompt
- `run.ps1` : Script that runs `packtpub-notifier` until successful process
- `runOnce.ps1` : Script that runs `packtpub-notifier` once
- `PacktpubNotifier.xml` : Scheduled Task configuration file (with daily trigger).