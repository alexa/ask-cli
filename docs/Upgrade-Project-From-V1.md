# Upgrade Guide For ask-cli beta (askx)

> **This doc talks about how to upgrade from v1 cli-managed Alexa skill project, to the beta project structure.**

In the latest version of the CLI, we have made internal changes that require changes to structure of skill projects created using CLI v1. To help skill projects upgrade to the new project format, we have created an `askx util upgrade-to-v2` command that will attempt to perform the changes necessary.  

In this beta version, the project of Alexa skill is organized with three components: `Alexa skill package`, `skill code` and `skill backend`. They are controlled by the project-config which is not a hidden file from now on. 


## Steps to upgrade

1. Using ask-cli v1, deploy your local work to server:  
    `$ ask deploy`
2. Install ask-cli-x, the current beta version of ask-cli, by using the command below:  
    `$ npm install -g ask-cli-x`
3. Upgrade existing v1 skill project using ask-cli-x command at the root:  
    `$ askx util upgrade-to-v2` 
    * The command will help go through the following steps:
      1.  A new hidden folder named ./legacy will be created, which will include all files from current (v1) directory.
      2. Skill package will be downloaded into a ./skill-package folder (from server's deploy result in step 1).
      3. Skill code will be selectively moved under ./code from v1's ./lambda folder.
    * The table below displays the mapping relations from v1 ask-cli to this beta Alexa skill project.  

        |                      | v1 project        | beta (askx) project                        |
        |----------------------|-------------------|--------------------------------------------|
        | project config       | .ask/config       | ask-resources.json                         |
        | Alexa skill package  | skill.json        | skill-package/skill.json                   |
        |                      | models/xx-YY.json | skill-package/interactionModels/xx-YY.json |
        |                      | isps/             | skill-package/isps/                        |
        |                      | ......            | ......                                     |
        | skill code           | lambda/{codePath} | code/{codePath}                            |
        | skill backend        | N/A               | infrastructures/                           |
    
4. Confirm successful upgrade with a v2 deploy after the upgrade:  
    `$ askx deploy`

**NOTE:**
* No changes will be made to existing AWS resources. We will utilize existing Lambda ARN(s) from the Lambda resources list in v1.
* The upgrade-to-v2 command assumes v1 project structure, and focusing on managing existing resources in Alexa or AWS. Should this fail, we will present developers with error, link to GitHub issues to ask for support.
* The ./hooks folder is no longer needed, as ask-cli v2 can infer code build flow.
