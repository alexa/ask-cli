# Alexa Skills Kit Command Line Interface (ASK CLI)

Changes for ASK CLI are tracked at [Change log](https://github.com/amznlabs/ask-cli/wiki/change-log)

## Demo video

This 3-minute video shows how to get started with the ASK CLI.
[Demo Video](https://askcli.s3.amazonaws.com/demo.html)

## Quick start

```
$ npm install -g git+https://github.com/amznlabs/ask-cli.git
$ ask init

(May need to do '$ sudo npm install ...')
```

The `(sudo) npm install` step above will fail if you have not set up your GitHub login with `git`. If this happens, you'll need to set it up by first creating a [personal access token](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/) and following the instructions below.

```
$ git clone https://github.com/amznlabs/ask-cli.git
Username: your_GitHub_username
Password: your_token (2-factor auth accounts use token instead of password)
$ cd ask-cli
$ npm install -g

(May need to do '$ sudo npm install -g')
```

## About the project

This repository hosts the Alexa Skills Kit Command Line Interface, a tool that integrates with the Alexa Skill Management API to enable developers to manage their Alexa skills from the command line. The [Wiki section](https://github.com/amznlabs/ask-cli/wiki) of this project contains documentation on the CLI as well as the underlying Alexa Skill Management API.

Here are links to specific topics in the documentation.

* [Understanding the Alexa Skill Management API](https://github.com/amznlabs/ask-cli/wiki)
* [Command Line Interface (CLI) Installation and Usage Instructions](https://github.com/amznlabs/ask-cli/wiki/Command-Line-Interface-%28CLI%29-Usage-Instructions)
* [Account Linking Schema](https://github.com/amznlabs/ask-cli/wiki/Account-Linking-Schema)
* [Account Linking Operations](https://github.com/amznlabs/ask-cli/wiki/Account-Linking-Operations)
* [Interaction Model Schema](https://github.com/amznlabs/ask-cli/wiki/Interaction-Model-Schema)
* [Interaction Model Operations](https://github.com/amznlabs/ask-cli/wiki/Interaction-Model-Operations)
* [Skill Schemas](https://github.com/amznlabs/ask-cli/wiki/Skill-Schemas)
* [Skill Operations](https://github.com/amznlabs/ask-cli/wiki/Skill-Operations)
* [Skill Certification Operations](https://github.com/amznlabs/ask-cli/wiki/Skill-Certification-Operations)
* [Vendor Operations](https://github.com/amznlabs/ask-cli/wiki/Vendor-Operations)

## Project status: private beta

The CLI and the API are currently in **private beta**, and some of their features may change during the beta period. Significant changes will be communicated in advance, via emails and [Issues](https://github.com/amznlabs/ask-cli/issues). We will share future milestone dates in the coming weeks as we finalize our plans for the public launch.

## Have feedback?

We encourage you to share your feedback, bug reports, and feature requests related to the CLI and the API in the [Issues](https://github.com/amznlabs/ask-cli/issues) section. You are also welcome to email us at ask-smapi-feedback@amazon.com.
