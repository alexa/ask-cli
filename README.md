The [Alexa Skills Kit Command Line Interface (ASK CLI)](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/ask-cli-command-reference) is a tool for you to manage your Alexa skills and related AWS Lambda functions. With the ASK CLI, you can now quickly and easily create new skills and update your existing skills from the command line and local development environment.

**The ASK CLI is currently in beta**. Until the end of the beta, we may introduce some changes in the functionality based on the customer feedback we receive.

## Step 1: Prerequisites for ASK CLI

- [Amazon developer account](http://developer.amazon.com) to manage your Alexa skills.
- [AWS account and credentials](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/set-up-credentials-for-an-amazon-web-services-account), if you plan to use AWS Lambda functions to host your skill's business logic.


## Step 2: Install ASK CLI

Use npm to install ASK CLI. Run the npm global install command into the ask-cli folder:

    $ npm install -g ask-cli

If you are using Linux, the installation may require `sudo`:

    $ sudo npm install -g ask-cli


## Step 3: Initialize ASK CLI

The first time you use ASK CLI, you must call the `init` command to initialize the tool with your Amazon developer account.

    $ ask init

You will be prompted to select your profile and to log in to your developer account. Once the initialization is complete, you can use ASK CLI to manage your skills.


## Step 4: Use ASK CLI Commands to Manage Your Skills

### Creating a new skill
The `ask new` command allows you to quickly create a new Alexa skill.

    $ ask new --skill-name 'my-skill'
    $ cd my-skill
    $ ask deploy

This will create a fully working "Hello World" skill that can be enabled and invoked immediately. If you make any subsequent changes, just use `ask deploy` again to deploy all of your changes.

### Working on an existing skill
The `ask clone` command allows you to set up a local project from your existing skill.

    $ ask clone --skill-id 'amzn1.ask.skill.UUID'
    $ cd my-existing-skill-name
    # make some changes here
    $ ask deploy

`ask deploy` will deploy all of your changes to skill manifest, interaction models, and AWS Lambda function(s).

To see all of the commands available in ASK CLI, refer to the [ASK CLI Reference](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/ask-cli-command-reference).
