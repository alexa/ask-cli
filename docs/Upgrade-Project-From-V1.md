# Upgrade Guide For ask-cli v2

> **Use this guide to upgrade CLI 1.x projects for deployment with the CLI v2**

Skills created with CLI 1.x will need to update their project structure in order to deploy with CLI v2. To help projects upgrade to the new format, we have provided an `ask util upgrade-project` command that will attempt to perform the necessary changes.

## Upgrade steps

1. Using ask-cli 1.x, deploy your skill:
    `$ ask deploy`
2. Install ask-cli:
    `$ npm install -g ask-cli`
3. Upgrade your skill project with ask-cli. From your project's root, run:
    `$ ask util upgrade-project`
    * The command will make the following changes to the project structure:

        |                      | v1 project        | v2 project                        |
        |----------------------|-------------------|--------------------------------------------|
        | project config       | .ask/config       | ask-resources.json                         |
        | Alexa skill package  | skill.json        | skill-package/skill.json                   |
        |                      | models/xx-YY.json | skill-package/interactionModels/xx-YY.json |
        |                      | isps/             | skill-package/isps/                        |
        |                      | ......            | ......                                     |
        | skill code           | lambda/{codePath} | code/{codePath}                            |
        | skill backend        | N/A               | infrastructures/                           |
     * The command will also create a hidden folder named ./legacy that contains a copy of your v1 skill project before the upgrade. If the upgrade is unsuccessful, use the contents of this folder to restore your skill project to its state before the upgrade.

4. Confirm successful upgrade with a v2 deploy after the upgrade:
    `$ ask deploy`

**NOTE:**
* No changes will be made to existing AWS resources. We will utilize existing Lambda ARN(s) from the Lambda resources list in v1.
* The upgrade-project command assumes v1 project structure, and focusing on managing existing resources in Alexa or AWS. Should this fail, we will present developers with error, link to GitHub issues to ask for support.
* The ./hooks folder is no longer needed, as ask-cli v2 can infer code build flow.

If you encounter any problems during this upgrade process, please create a [issues](https://github.com/alexa/ask-cli/issues) to us.
