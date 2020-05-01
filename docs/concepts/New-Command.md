# NEW COMMAND

`ask new` allows developers to create a new skill from Alexa-provided templates or custom templates and support several deployment methods/deployers.


**STRUCTURE OF NEW COMMAND:**

`ask new [--template-url <template url>]
        [--template-branch <template branch>]
        [-p | --profile <profile>]
        [--debug]
        [-h | --help]`

**OPTIONS DESCRIPTION:**

**template-url**: Optional. Specify the URL of a Git repository that contains a skill template.

**template-branch**: Optional. Specify the branch for a Git repository that contains a skill template.

**profile**: Optional. Specify a profile name to be used. Defaults to use `default` as the profile name, if this option or environmental variable `ASK_DEFAULT_PROFILE` is not set.

**debug**: Optional. Show debug messages.


## DEPLOYERS:

* **Alexa-hosted skills**
  * Dependency: SMAPI
  * Description: Create an `Alexa hosted skill`, clone the skill project, and provide git-ready environment to deploy the skill.
* **AWS with CloudFormation**
  * Dependency: AWS-SDK
  * Description: Upload local code to Amazon S3, and use `AWS CloudFormation` to configure AWS resources required for the skill.
* **AWS Lambda**
  * Dependency: AWS-SDK
  * Description: Create an AWS IAM Role with basic permissions to access `AWS Lambda`. Update the configuration and upload the local code to an AWS Lambda function.



## TEMPLATES:

* **Use an Amazon-provided template**

Please refer to [Alexa Skill Project Resource Components](https://github.com/alexa/ask-cli/blob/develop/docs/concepts/Alexa-Skill-Project-Definition.md) for the Amazon-provided templates' structure.


* **Use your own template**

Users can use their own skill template instead of choosing from one of the Amazon-provided templates. To use a custom template, users provide the URL of a Git repository that contains a template.
