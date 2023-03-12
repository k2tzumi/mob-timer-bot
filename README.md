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
Depending on the privileges of the user, the slash command may not be available, but the command can be substituted by sending a comment message to `@mobtimerbot`.


REQUIREMENTS
--------------------
- `npm` (`npx`)  
This project uses the npx command that comes with npm version 5.2.0 or later. If you are using Node version 8.2 or lower, please install it with `npm install -g npx`.
- [clasp](https://github.com/google/clasp)  
- `make`
- GAS Library
  - [OAuth2](https://github.com/googleworkspace/apps-script-oauth2)
  - [JobBroker](https://github.com/k2tzumi/apps-script-jobqueue)

USAGE
--------------------

To use it, you need to set up Google apps scripts, and Slack API.

## Steps

1. Enable Google Apps Script API  
https://script.google.com/home/usersettings
2. Clone this repository to your local machine.
3. Run `make push` to install the dependencies and the necessary libraries, authenticate with Google, create a new GAS project and upload the code.
4. Run `make deploy` to deploy the project as a web app.  
The first time you publish it as a web application, you will need to authorize it, so please follow the steps below.
Open the script editor. (`make open`)  
Click Deploy > New deployment.  
Select Web app as the deployment type.  
Choose who can access your web app and who will execute it.  
Click Deploy.  
For more information, please refer to the official Google documentation.  
https://developers.google.com/apps-script/concepts/deployments
5. Run `make application` to open the deployed web app in your browser. Follow the instructions on the web app to install the Slack app and perform OAuth authentication. The web app will automatically upload the App manifest to Slack and configure the necessary settings for you.

# How to use

The usage of this bot is as follows.

1. Invite bots to your channel (e.g. /invite @mobtimerbot)
2. Execute a slash command ( `/mob` ).  
  - select users to join the mob
  - please specify the time of the mob
  - If you are satisfied with the order of the mob, press the `Start Mobbing` button