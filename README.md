<p align="center">
  <img src="https://m.media-amazon.com/images/G/01/mobile-apps/dex/avs/docs/ux/branding/mark1._TTH_.png">
  <br/>
  <h1 align="center">Alexa Skills Kit Command Line interface</h1>
  <p align="center">
    <a href="https://www.npmjs.com/package/ask-cli-x"><img src="https://badge.fury.io/js/ask-cli-x.svg"></a>
    <a href="https://travis-ci.org/alexa-labs/ask-cli"><img src="https://travis-ci.org/alexa-labs/ask-cli.svg?branch=master"></a>
  </p>
</p>


The Alexa Skills Kit Command Line Interface (ask-cli) is used to create, manage, and deploy Alexa skills from the command line.

<p align="center">
  <img align="center" src="https://ask-cli-static-content.s3-us-west-2.amazonaws.com/document-assets/ask-cli-x-flow.gif" height="280" />
</p>

*NOTE:* This source is currently for a beta version of the ask-cli. For the latest stable version of the ask-cli, see the [ASK CLI quick start guide](https://developer.amazon.com/docs/smapi/quick-start-alexa-skills-kit-command-line-interface.html).


### Getting Started

**1. Install CLI**

```
$ npm install -g ask-cli-x
```


**2. Configure CLI**

Before you can start using the ASK CLI, configure your ASK (and AWS) credentials:

```
$ askx init
```

You’ll be prompted to sign into your Amazon developer account. If you choose to have your skill hosted by AWS, you’ll have the option of linking your AWS account as well.

**3. Create new skill project**

Create a new skill project and follow the prompts from the command:

```
$ askx new
```

You'll be asked to select a deployment method for your skill. Currently during the beta, we only support deployment via CloudFormation (@ask-cli/cfn-deployer).

Your new skill project will provide a number of files and folders that make up the structure of an Alexa skill. Here is an overview on each of the files and folders that are created by default:

| File/Folder       | Description  |
| :--------------   | :----------- |
| skill-package/    | Skill resources utilized by the ASK platform such as skill manifest, interaction models, and assets |
| code/	            | Contains the source code for your skill that utilizes the ASK SDK |
| infrastructure/   | Contains your CloudFormation definitions for deploying your skill to AWS |
| ask-resources config     | Configuration for your Alexa skill project |

See the [ASK SDKs documentation](https://developer.amazon.com/docs/sdk/alexa-skills-kit-sdks.html) to learn more about how to build an Alexa skill.

**4. Deploy skill to AWS**

In order for Alexa to communicate with your skill code, it will need to be deployed and hosted on the cloud. We currently provide support for deployment via CloudFormation to AWS.

```
$ askx deploy
```

deploy performs the following steps:

1. `skill-package/` resources will be zipped and uploaded to the ASK platform via SMAPI's [Skill Package Service](https://developer.amazon.com/docs/smapi/skill-package-api-reference.html).
2. `code/` source files will be built and zipped for deployment to AWS. We currently support the build flows of npm for Nodejs, pip for Python and maven for Java developers.
3. `infrastructure/` definitions will be used to provision resources on AWS. The `code/` zip file from the previous step will be deployed to the provisioned AWS Lambda function. Currently this is deployed by using the `@ask-cli/cfn-deployer`, you can add any AWS services in the skill's stack template and deploy them together.



