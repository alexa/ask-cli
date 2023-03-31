# Frequent Asked Questions


### Q: Since v2 ask-cli removes "ask clone" command, what should I do to download my skill project?

- If you have used v1 ask-cli, please use command `ask util upgrade-project` to update your existing v1 project to v2 format.
- If you want to clone an Alexa-Hosted skill, please use command `ask init --hosted-skill-id {skillId}`.
- If you want to develop skill in local project from web console, please use command `ask init` to flexibly link your resources in the ask-resources.json. More in details:
  1. Create a new folder as your local Alexa skill project, run `ask smapi export-package -s {skillId} -g {stage}` to download your skill-package.
  2. Retrieve your Lambda source code. This step really depends on how you source control your code, it can be the code downloaded from existing Lambda function, or S3, or from "git clone".
  3. Run `ask init` wizard, where you will be asked to fill your skill-id, file path for skill-package and Lambda source code, and how do you want to deploy the skill infrastructures (backend).
- If you want to get your latest change after updating skill in ASK console, please run `ask smapi export-package` command once you make sure local changes towards skill-package won't be overwritten by the command.

Our reason to remove the clone command is to define ask-cli as a deployment tool for Alexa skill, not source control tool. The data flow in CLI will be user-driven and unidirectional. We highly encourage our skill developers to use their own source version control tools to manage their projects.

--- 

### Q: For Windows users, if your skill return empty response, and log shows "Module not found: GenericErrorMapper" or "Cannot find module './dispatcher/error/mapper/GenericErrorMapper'", how to resolve?

This issue is related to CLI's deploy command to build code using Powershell script, caused by Powershell 6.2 shipping a broken *Compress-Archive* command. CLI zips your codebase using this PS command and then upload to Lambda. If you happen to use that version, please run the following command to update the command with the fix, and re-deploy your skill project.
```
  Install-Module Microsoft.PowerShell.Archive -MinimumVersion 1.2.3.0 -Repository PSGallery -Force
```
Related issues: https://github.com/alexa/ask-cli/issues/38, https://github.com/alexa/ask-cli/issues/59, https://github.com/alexa/ask-cli/issues/117. Thanks for your effort for reporting this issue.


### Q: How to deploy only skill package and ignore skillInfrastructure?

ASK CLI v1 had option '--target' to deploy only skill package and not the infrastructure. Similar behavior can be achieved in ASK CLI v2 by removing "skillInfrastructure" property from ask-resources.json. 
