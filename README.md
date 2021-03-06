[![clasp](https://img.shields.io/badge/built%20with-clasp-4285f4.svg)](https://github.com/google/clasp)
![ci](https://github.com/k2tzumi/mob-timer-bot/workflows/ci/badge.svg)

What is this?
==============================

 This bot is a special slack reminder that can be used for pairing and mob programming.  
  This bot runs as a web app within a Google app script.  
You can make this bot work by registering it as a request URL for the [Slack API](https://api.slack.com/apps) slash command.

![movie](https://user-images.githubusercontent.com/1182787/88473078-e71f1d80-cf54-11ea-81a1-0ef551e4feb4.gif)

Slack slash command
--------------------

See help.  
* Help command execution method
```
/mob help
```
* When you start mob programming  
```
/mob
```


REQUIREMENTS
--------------------
- `npm`
- [clasp](https://github.com/google/clasp)  
`npm install -g @google/clasp`
- `make`
- GAS Library
  - OAuth2

USAGE
--------------------

To use it, you need to set up Google apps scripts, and Slack API.

### Install Google apps scripts

1. Enable Google Apps Script API  
https://script.google.com/home/usersettings
2. make push  
3. make deploy  
4. Grant the necessary privileges  
make open  
Publish > Deploy as web app.. > Update  
Grant access

The URL of the current web app after deployment will be used as the request URL for the OAuth authentication screen and Slack message action.

### Register with the Slack API

* Create New App  
https://api.slack.com/apps  
Please make a note of `App Credentials` displayed after registration.

### Setting Script properties

In order to run the application and change its behavior, you need to set the following Google Apps scripts property.

|Property name|Required|Setting Value|Description|
|--|--|--|--|
|VERIFICATION_TOKEN|○|Basic Information > App Credentials > Verification Token|A token that easily authenticates the source of a hooked request|
|CLIENT_ID|○|Basic Information > App Credentials > Client ID|Use with OAuth|
|CLIENT_SECRET|○|Basic Information > App Credentials > Client Secret|Use with OAuth|
|COUNT_DOWN_NOTIFICATION_TIME||N minutes before the end of the mob|default `5` minutes.<br>min 1 minutes(Accept suspend time), max 360 minutes(Maximum cache retention time)|

1. Open Project  
`$ make open`
2. Add Scirpt properties  
File > Project properties > Scirpt properties > Add row  
Setting Property & Value

### OAuth Authentication

#### Settings OAuth & Permissions

* Redirect URLs  
`Add New Redirect URL` > Add Redirect URL  > `Save URLs`  
For example) https://script.google.com/macros/s/miserarenaiyo/usercallback  
You can check the Redirect URL in the following way. The `RedirectUri` of the displayed page.  
`$ make application`  
* Bot Token Scopes  
Click `Add an OAuth Scope` to select the following permissions  
  * [chat:write](https://api.slack.com/scopes/chat:write)
  * [commands](https://api.slack.com/scopes/commands)
  * [channels:history](https://api.slack.com/scopes/channels:history)
  * [groups:history](https://api.slack.com/scopes/groups:history)
  * [mpim:history](https://api.slack.com/scopes/mpim:history)
  * [im:history](https://api.slack.com/scopes/im:history)

* Install App to Workspace  
You must specify a destination channel that bot can post to as an app.

### Install App to Workspace

1. Open web application  
`$ make application`  
The browser will be launched with the following URL:  
For example) https://script.google.com/macros/s/miserarenaiyo/exec  
2. Click `Authorize.`  
You must specify a destination channel that bot can post to as an app.
3. Click `Allow`  
The following message is displayed when OAuth authentication is successful  
```
Success!
Setting EventSubscriptions
Setting Slash Commands
Setting Interactivity & Shortcuts
```
When prompted, click the `Setting Slash Commands` to set up an Slash Commands.  
Thes click the `Setting Interactivity & Shortcuts` to set up an Interactivity.  

### Setting Slack App

Register the URL of the Google Apps script deployed as a web app as the request URL for each of the following items.  
You can configure the settings from the link that appears after OAuth authentication.

#### Settings Slash Commands

* Create New Command  
Setting Request URL.  

#### Setting Interactivity & Shortcuts

Turn on.  
Setting Interactivity Request URL  
