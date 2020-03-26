# CREATE SKILL - NEW COMMAND

`askx new` allows developers to create an `Alexa hosted skill`, and clone the skill project to the local machine, which replaces and optimizes `ask create-hosted-skill` command in CLI V1.

Alexa hosted deployer builds Alexa skills quickly by provisioning required resources automatically. 
Alexa hosted service will create a new AWS account with a deployment pipeline (CodeBuild), a skill Lambda function, a Git repository (CodeCommit) and an S3 bucket for developers.
Thus, the developers can then develop on the editor inside the portal or checkout the code using Git and develop with their IDEs.

**STRUCTURE OF INIT COMMAND:**

`askx init [-p | --profile <profile>] [--debug] [-h | --help]`

**OPTIONS DESCRIPTION:**

**profile**: Optional. Specify a profile name to be used. Defaults to use `default` as the profile name, if this option or environmental variable `ASK_DEFAULT_PROFILE` is not set.

**debug**: Optional. Appends a debug message to the standard error.


## WORKFLOW:

Users will be asked following questions to create a new skill:

* Prompts user for a `programming language`
	* Select a programming language.
* Prompts user for a `deploy delegate` to depoly skill infrastructure
	* Select a `@ask-cli/hosted-skill-deployer`.
* Prompts user for a `skill template`
	* There is one template- Hello World Skill as a default option for now.
* Prompts user for a `skill name`
  * Leave this empty to use default skill name or
  * Enter a value for skill name.
* Prompts user for a `folder name` for the skill project
  * Leave this empty to use default folder name or
  * Enter a value for folder name.


# DOWNLOAD SKILL - INIT COMMAND 

`askx init --hosted-skill-id <hosted-skill-id>` -- helps developers migrate an Alexa-Hosted Skill (code + resources) to their local environment.

This command initializes Alexa Hosted Skills by cloning project from the hosted skill service, 
and provide git-ready environment, so the developers can checkout, pull from, and push to a remote Git repository from their local machines.

**STRUCTURE OF INIT COMMAND:**

`askx init [--hosted-skill-id <hosted-skill-id>] [-p | --profile <profile>] [--debug] [-h | --help]`

**OPTIONS DESCRIPTION:**

**debug**: Optional. Specify a skill-id for the Alexa hosted skill.

**profile**: Optional. Specify a profile name to be used. Defaults to use `default` as the profile name, if this option or environmental variable `ASK_DEFAULT_PROFILE` is not set.

**debug**: Optional. Appends a debug message to the standard error.


## WORKFLOW:

Users will be asked the following question to create a new skill:

* Prompts user for a `folder name` for the skill project to store in local machine.
  * Leave this empty to use default folder name or
  * Enter a value for folder name.

## GIT CREDENTIALS

To allow developers to access the CodeCommit repository, Alexa hosted service use git-credential along with ASK-CLI and SMAPI to pass down temporary Git credentials automatically.

Git-credential allows other programs to provide credentials to Git for authentication. When configured, git will invoke the configured program and pass the remote host information the program over STDIN. 
The program can then do whatever is necessary to find the credentials and return a username and a password pair to the STDOUT. Git will then use the pair to authenticate with the remote resource.


# UPGRADE PROJECT - UPGRADE COMMANDS

Skills created with CLI 1.x will need to update their project structure in order to deploy with the CLI v2. 
`askx util upgrade-project` command will attempt to perform the necessary changes. 

**STRUCTURE OF INIT COMMAND:**

`askx util upgrade-project [-p | --profile <profile>] [--debug] [-h | --help]`

**OPTIONS DESCRIPTION:**

**profile**: Optional. Specify a profile name to be used. Defaults to use `default` as the profile name, if this option or environmental variable `ASK_DEFAULT_PROFILE` is not set.

**debug**: Optional. Appends a debug message to the standard error.

## UPGRADE STEPS:

1. Using ask-cli 1.x, deploy your skill:
	* `$ ask deploy`
2. Install ask-cli-x:
	* `$ npm install -g ask-cli-x`
3. Upgrade your skill project with ask-cli-x. From your project's root, run:
	* `$ askx util upgrade-project`
    * A hidden folder named ./legacy that contains a copy of your v1 skill project.
    * Skill package will be downloaded into a ./skill-package folder
    * ask-resources.json will be generated
4. Commit upgrade changes:
  * `$ git commit -m "upgrade project for CLI v2"`
5. Confirm successful upgrade with deploy:
  * `$ git push`


# DEPLOY SKILL - GIT PUSH

`$ git push` helps developers deploy skill package resources and skill code.
In CLI V2, running `ask deploy` on hosted skills will no longer trigger skill deployment. 
Instead, `$ git push` deployes the latest source code to lambda and also deploys the changes in skill package such as interaction model, skill manifest and in-skill products.

## UPGRADE STEPS:

* Push to deploy skill resources and code:
	* `$ git push`
  * Push in `master` branch deploys skill code and resources with development stage
  * Push in `prod` branch deploys a skill code and resources with live stage

