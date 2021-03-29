<p align="center">
  <img src="https://m.media-amazon.com/images/G/01/mobile-apps/dex/avs/docs/ux/branding/mark1._TTH_.png">
  <br/>
  <h1 align="center">Alexa Skills Kit Command Line interface</h1>
  <p align="center">
    <a href="https://www.npmjs.com/package/ask-cli"><img src="https://badge.fury.io/js/ask-cli.svg"></a>
    <a href="https://github.com/alexa/ask-cli/actions?query=workflow%3A%22Unit+Test%22"><img src="https://github.com/alexa/ask-cli/workflows/Unit%20Test/badge.svg?branch=master"></a>
  </p>
  <p align="center">
    <a href="https://conventionalcommits.org"><img src="https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg"></a>
  </p>
</p>


The Alexa Skills Kit Command Line Interface (ask-cli-x) is used to create, manage, and deploy Alexa Conversation Skills with the Alexa Conversations Description Language(ACDL) from the command line. Please see the full documentation from [Create an Alexa Conversations Skill with ACDL](https://developer.amazon.com/en-US/docs/alexa/conversations/acdl-tutorial-create-skill.html).

Note that Alexa Conversations Description Language (ACDL) is offered as a beta and may change as we receive feedbacks and iterate on the features. Alexa Conversations currently support en-US only.


### Getting Started

**1. Install CLI**

```
$ npm install -g ask-cli-x
```


**2. Configure CLI profile**

Before you can start using the ASK CLI, configure your ASK (and AWS) credentials:

```
$ askx configure
```

You’ll be prompted to sign into your Amazon developer account. If you choose to have your skill hosted by AWS, you’ll have the option of linking your AWS account as well.


**3. Create new skill project**

Create a new skill project and follow the prompts from the command:

```
$ askx new
```

You'll be asked to select the programming language, the hosting method, the template for your skill. You'll also be asked to enter a skill name or press enter to select the default skill name and enter a folder name or press enter to select the default folder name.

Your new skill project will provide a number of files and folders that make up the structure of an Alexa skill. 

**4. Compile the skill artifacts**

In this step, you compile the skill artifacts.

To compile the skill artifacts
1. On a command line, navigate to your skill folder.
2. Enter the following command.

```
$ askx compile
```


**5. Deploy Alexa skill**

In order for Alexa to communicate with your skill code, it will need to be deployed and hosted on the cloud using this command.

```
$ askx deploy
```

The deploy command performs the following steps:

1. `skill-package/` resources will be zipped and uploaded to the ASK platform via SMAPI's [Skill Package Service](https://developer.amazon.com/docs/smapi/skill-package-api-reference.html).
2. `lambda/` source files will be built and zipped for deployment to AWS. We currently support the build flows of npm for Nodejs, pip for Python and maven for Java developers.
3. `infrastructure/` definitions will be used to provision resources on AWS. The `lambda/`'s zip file from the previous step will be deployed to the provisioned AWS Lambda function.

**6. Read about the package structure and artifacts**

While your skill deploys, you can familiarize yourself with the package contents in [Understand the Directory Structure of ACDL](https://developer.amazon.com/en-US/docs/alexa/conversations/acdl-understand-directory-structure.html).


**7. Test the skill**

After your skill deploys, you can run it by using the ASK CLI as follows.

To run you skill by using the ASK CLI

1. After your skill deploys, get the skill ID from the deployment information that the command line displays.
2. To run your skill by using the Alexa simulator, enter the following command on the command line.

```
$ askx dialog -s <your-skill-id> -l en-US -g development
```
