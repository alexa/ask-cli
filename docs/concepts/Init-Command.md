# INIT COMMAND

`ask init` helps a skill developer to setup a new or an existing Alexa skill project. The command will walk the user through creating an ask-resources.json file to help deploy the skill. It will cover the most common attributes and will suggest sensible defaults using AWS Lambda as your endpoint.

**STRUCTURE OF INIT COMMAND:**

`ask init [--hosted-skill-id <hosted-skill-id>] [-p|--profile <profile>] [--debug]`

**OPTIONS DESCRIPTION:**

**hosted-skill-id**: Optional. Specify a Hosted Skill Id.

**profile**: Optional. Specify a profile name to be used. Defaults to `ASK_DEFAULT_PROFILE`.

**debug**: Optional. Appends a debug message to the standard error.


## WORKFLOW:

### HOSTED-SKILL-ID:

Running the init command with hosted-skill-id option will,

* Call Skill Management API's `getManifest` and gets Skill name from the response. Throws error if the skillId does not correspond to a hosted skill id.

* Prompts user for a folder name for the skill package. Throws error if the folder name does not adhere to CLI specifications. Project folder name should consist of alphanumeric character(s) plus "-" only.

* Clones the corresponding Skill package and the corresponding Git hooks into the folder name specified above.

### NON-HOSTED-SKILL-ID:

Running the init command without hosted-skill-id option will,

* Run a pre-check to establish if `ask-resources.json` file is available in the current working directory.
	* If available, prompts the user with the following message, `ask-resources.json already exists in current directory. Do you want to overwrite it?`
		* If user selects `Y`, proceeds with the setup process.
		* If user selects `n`, CLI throws an error - `[Error]: Please modify the existing ask-resources.json file or choose to overwrite.`
	* If unavailable, proceeds with the setup process.

* Prompts user for a `skill-id`.
	* User can leave this to be empty to create a new skill or,
	* Enter a value for the skill-id. Must be of the format `amzn1.ask.skill.12345678-1234-1234-123456789123`.

* Prompts user for Skill package path. **Defaults to `./skill-package`**.
* Prompts user for Lambda code path. **Defaults to `./lambda`**.
* Prompts user whether to use AWS CloudFormation to deploy Lambda.
	* If user selects `Y`, `cfn-deployer` will be used as the deployer type.
	* Else, `lambda-deployer` will be used.
* Prompts user for Lambda runtime. **Defaults to `nodejs10.x`**.
* Prompts user for the entry point of Lambda function. **Defaults to `index.handler`**.

* Once all the values have been entered by the user, CLI displays the resources configuration that has been entered by the user, and prompts user to confirm if the configuration looks correct.
	* If user selects `Y`, `ask-resources.json` file is updated with the skill infrastructure configuration.
	* Else, CLI thrown an error - `[Error]: Project init aborted.`

**Sample resources configuration:**

``` javascript

{
  "askcliResourcesVersion": "<>",
  "profiles": {
    "<profile-name>": {
      "skillId": "<skill-id>",
      "skillMetadata": {
        "src": "<skill-package-path>"
      },
      "code": {
        "default": {
          "src": "<lambda-path>"
        }
      },
      "skillInfrastructure": {
        "type": "@ask-cli/<cfn-deployer | lambda-deployer>",
        "userConfig": {
          "runtime": "<Lambda runtime>",
          "handler": "<Lambda entry point>"
        }
      }
    }
  }
}
```