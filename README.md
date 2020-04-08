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


The Alexa Skills Kit Command Line Interface (ask-cli) is used to create, manage, and deploy Alexa skills from the command line. Please see the full documentation from [ASK CLI quick start guide](https://developer.amazon.com/docs/smapi/quick-start-alexa-skills-kit-command-line-interface.html).

<p align="center">
  <img align="center" src="https://ask-cli-static-content.s3-us-west-2.amazonaws.com/document-assets/v2-ask-cli-intro.gif" height="350" />
</p>

*Note:* To use ask-cli for `Alexa-Hosted skill`, please check our [instructions](https://github.com/alexa/ask-cli/blob/develop/docs/concepts/Alexa-Hosted-Skill-Commands.md) for the usage.

### Getting Started

**1. Install CLI**

```
$ npm install -g ask-cli
```


**2. Configure CLI profile**

Before you can start using the ASK CLI, configure your ASK (and AWS) credentials:

```
$ ask configure
```

You’ll be prompted to sign into your Amazon developer account. If you choose to have your skill hosted by AWS, you’ll have the option of linking your AWS account as well.

<p align="center">
  <img align="center" src="https://ask-cli-static-content.s3-us-west-2.amazonaws.com/document-assets/v2-ask-cli-configure.gif" height="520" />
</p>


**3. Create new skill project**

Create a new skill project and follow the prompts from the command:

```
$ ask new
```

You'll be asked to select a deployment method for your skill. Currently we support deployment via AWS CloudFormation (@ask-cli/cfn-deployer), deployment via AWS Lambda (@ask-cli/lambda-deployer), and deployment through Alexa-Hosted skill (@ask-cli/hosted-skill-deployer).

<p align="center">
  <img align="center" src="https://ask-cli-static-content.s3-us-west-2.amazonaws.com/document-assets/v2-ask-cli-new.gif" height="520" />
</p>

Your new skill project will provide a number of files and folders that make up the structure of an Alexa skill. Here is an overview on each of the files and folders that are created by default:

| File/Folder       | Description  |
| :--------------   | :----------- |
| skill-package/    | Skill resources utilized by the ASK platform such as skill manifest, interaction models, and assets |
| lambda/	          | Contains the source code for your skill that utilizes the ASK SDK |
| infrastructure/   | Contains your CloudFormation definitions for deploying your skill to AWS |
| ask-resources config     | Configuration for your Alexa skill project |

See the [ASK SDKs documentation](https://developer.amazon.com/docs/sdk/alexa-skills-kit-sdks.html) to learn more about how to build an Alexa skill.


**4. Deploy Alexa skill**

In order for Alexa to communicate with your skill code, it will need to be deployed and hosted on the cloud using this command.

```
$ ask deploy
```

The deploy command performs the following steps:

1. `skill-package/` resources will be zipped and uploaded to the ASK platform via SMAPI's [Skill Package Service](https://developer.amazon.com/docs/smapi/skill-package-api-reference.html).
2. `lambda/` source files will be built and zipped for deployment to AWS. We currently support the build flows of npm for Nodejs, pip for Python and maven for Java developers.
3. `infrastructure/` definitions will be used to provision resources on AWS. The `lambda/`'s zip file from the previous step will be deployed to the provisioned AWS Lambda function. The gif below shows the deployment using `@ask-cli/cfn-deployer`, you can also try other deployers as they serve different purposes.

<p align="center">
  <img align="center" src="https://ask-cli-static-content.s3-us-west-2.amazonaws.com/document-assets/v2-ask-cli-deploy.gif" height="520" />
</p>


**5. Dialog with what you build**

To test while developing your skill locally, or quickly showcase your skill ideas, or even build end-to-end testing, you can use CLI's dialog command.

```
$ ask dialog
```

<p align="center">
  <img align="center" src="https://ask-cli-static-content.s3-us-west-2.amazonaws.com/document-assets/v2-ask-cli-dialog.gif" height="520" />
</p>
