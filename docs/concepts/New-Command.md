# NEW COMMAND

`askx new` allows developers to create a new skill from Alexa-provided templates or custom templates and support several deployment methods/deployers. 
The deployment methods are: 1) Create an `Alexa hosted skill`, and clone the skill project to the local machine. 
2)  Upload local code to Amazon S3, and use `AWS CloudFormation` to configure AWS resources required for the skill. 
3) Creat an AWS IAM Role with basic permissions to access `AWS Lambda`. Update the configuration and upload the local code to an AWS Lambda function. 
4) Manually deploy skill infrastructure. 

**STRUCTURE OF INIT COMMAND:**

`askx init [--template-url <template name>]
        [-p | --profile <profile>]
        [--debug]
        [-h | --help]`

**OPTIONS DESCRIPTION:**

**template-url**: Optional. Specify the URL of a Git repository that contains a skill template.

**profile**: Optional. Specify a profile name to be used. Defaults to use `default` as the profile name, if this option or environmental variable `ASK_DEFAULT_PROFILE` is not set.

**debug**: Optional. Appends a debug message to the standard error.


## WORKFLOW:

Users will be asked following questions to create a new skill:

* Prompts user for a `programming language`
	* Select a programming language.
* Prompts user for a `deploy delegate` to depoly skill infrastructure
	* Select a deployer.
* Prompts user for a `skill template`
	* Select a skill template.
* Prompts user for a `skill name`
  * Leave this empty to use default skill name or
  * Enter a value for skill name.
* Prompts user for a `folder name` for the skill project
  * Leave this empty to use default folder name or
  * Enter a value for folder name.

## DEPLOYERS:

* **Alexa Hosted deployer**
  * Dependency: SMAPI
  * Description: Builds Alexa skills quickly by provisioning required resources automatically. 
  The deployer will create a new AWS account with a deployment pipeline (CodeBuild), a skill Lambda function, a Git repository (CodeCommit) and an S3 bucket.
* **AWS Lambda**
  * Dependency: AWS-SDK
  * Description: Deploys updated Lambda function code by replicating the existing CLI V1 functionality. Function ARN will be returned back to the CLI and further updated in the skill manifest.
* **AWS CloudFormation**
  * Dependency: AWS-SDK
  * Description: Provides CloudFormation stack template(s) to deploy skill backends, making it easy to standardize skill infrastructures. Multiple regions can be configured. 
  Function ARNs need to be the output in each yaml template file.
* **Custom Deployer**
  * Dependency: Custom Shell Script
  * Description: Allows all other serverless deployment flow using CLI deploy logic.


## TEMPLATES:

* **Use an Amazon-provided template**

**Structure of a skill project folder**

To create a new skill project from one of the Amazon-provided templates, the skill project contains the following files and folders:

```
skill project folder
├── code 
│   ├── index.js 
│   ├── package.json 
│   └── util.js 
├── infrastructure 
├── skill-package 
│   └── assets
│       └── images
│           ├── en-US_largeIcon.png
│           └── en-US_smallIcon.png
│   └── interactionModels 
│       └── custom
│           └── en-US.json
│   └── skill.json 
├── ask-resources.json
├── .gitignore
```
The following list explains each part of the skill project:
  
  **lambda** – A folder that contains the source code for the skill's AWS Lambda function. The files contained here depend on the runtime for the skill.
  
  **code** –  A folder that contains the source code for your skill that utilizes the ASK SDK.
  
  **infrastructure** – A folder that contains your CloudFormation definitions for deploying your skill to AWS
  
  **skill-package** – A folder that contains Skill resources utilized by the ASK platform such as skill manifest, interaction models, and assets.

  **ask-resources.json** - A file that contains configuration for your Alexa skill project
 
* **Use your own template**

Users can use their own skill template instead of choosing from one of the Amazon-provided templates. To use a custom template, users provide the URL of a Git repository that contains a template.
