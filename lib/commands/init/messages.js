module.exports = {
    ASK_CLI_INITIALIZATION_MESSAGE: `This command will initialize the ASK CLI with a profile associated with your Amazon developer credentials.
------------------------- Step 1 of 2 : ASK CLI Initialization -------------------------`,
    AWS_INITIALIZATION_MESSAGE: '------------------------- Step 2 of 2 : Associate an AWS Profile with ASK CLI -------------------------',
    SKIP_AWS_INITIALIZATION: `------------------------- Skipping the AWS profile association -------------------------
You will only be able to deploy your Alexa skill. To set up AWS credentials later, use the "ask init" command towards the same profile again.`,
    AWS_CREATE_PROFILE_TITLE: '\nComplete the IAM user creation with required permissions from the AWS console, then come back to the terminal.',
    AWS_CREATE_PROFILE_NO_BROWSER_OPEN_BROWSER: 'Please open the following url in your browser:',
    ACCESS_SECRET_KEY_AND_ID_SETUP: '\nPlease fill in the "Access Key ID" and "Secret Access Key" from the IAM user creation final page.',
    INVALID_COMMAND_ERROR: 'Invalid command. Please run "ask init -h" for help.',
    PROFILE_NAME_VALIDATION_ERROR: 'Invalid profile name. A profile name can contain upper and lowercase letters, numbers, hyphens, and underscores.',
    VENDOR_INFO_FETCH_ERROR: 'Could not retrieve vendor data.',
    ASK_CONFIG_NOT_FOUND_ERROR: 'Config file not found at $HOME/.ask/cli_config.'
};
