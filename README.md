
The Alexa Skills Kit (ASK) CLI (ask-cli) is used to create, manage, and deploy Alexa skills from the command line.

*NOTE:* This source is currently for a beta version of the ask-cli. For the latest stable version of the ask-cli, see the [ASK CLI quick start guide](https://developer.amazon.com/docs/smapi/quick-start-alexa-skills-kit-command-line-interface.html).

Installation

```
$ npm install -g ask-cli-x
```

Getting Started

1. Configure the CLI

Before you can start using the ASK CLI, configure your ASK (and AWS) credentials:

```
$ askx init
```

You’ll be prompted to sign into your Amazon developer account. If you choose to have your skill hosted by AWS, you’ll have the option of linking your AWS account as well.

2. Create a new skill project

Create a new skill project and follow the prompts:

```
$ askx new
```

*NOTE:* You will be asked to select a deployment method for your skill. Currently during the beta, we only support deployment via CloudFormation (@ask-cli/cfn-deployer).

Your new skill project will provide a number of files and folders that make up the structure of an Alexa skill. Here is an overview on each of the files and folders that are created by default:

| File/Folder       | Description  |
| :--------------   | :----------- |
| code/	            | Contains the source code for your skill that utilizes the ASK SDK |
| skill-package/    | Skill resources utilized by the ASK platform including the skill manifest, interaction models, and assets |
| infrastructure/   | Contains your CloudFormation definitions for deploying your skill to AWS |
| ask-resources config     | Configuration for your Alexa skill project |

See the [ASK SDKs documentation](https://developer.amazon.com/docs/sdk/alexa-skills-kit-sdks.html) to learn more about how to build an Alexa skill.

3. Deploy your skill to AWS

In order for Alexa to communicate with your skill code, it will need to be deployed and hosted on the cloud. We currently provide support for deployment via CloudFormation to AWS.

```
$ askx deploy
```

deploy performs the following steps:

1. `skill-package/` resources will be zipped and uploaded to the ASK platform via [SMAPI Skill Package Service](https://developer.amazon.com/docs/smapi/skill-package-api-reference.html).
2. `code/` source files will be built (e.g. npm install) and zipped for deployment to AWS.
3. `infrastructure/` definitions will be used to provision resources on AWS. The `code/` zip file from the previous step will be deployed to the provisioned AWS Lambda function. 

