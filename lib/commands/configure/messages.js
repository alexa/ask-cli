/* eslint-disable max-len */
module.exports.ASK_SIGN_IN_FAILURE_MESSAGE = 'Access not granted. Please verify your account credentials are correct.\n'
+ 'If this is your first time getting the error, please retry "ask configure" to ensure any browser-cached tokens are refreshed.';

module.exports.ASK_CLI_CONFIGURATION_MESSAGE = `This command will configure the ASK CLI with a profile associated with your Amazon developer credentials.
------------------------- Step 1 of 2 : ASK CLI Configuration -------------------------`;

module.exports.PROFILE_NAME_VALIDATION_ERROR = 'Invalid profile name. A profile name can contain upper and lowercase letters, numbers, hyphens, and underscores.';

module.exports.CONFIGURE_SETUP_SUCCESS_MESSAGE = `------------------------- Configuration Complete -------------------------
Here is the summary for the profile setup: `;

module.exports.VENDOR_INFO_FETCH_ERROR = 'Could not retrieve vendor data.';

module.exports.VENDOR_ID_CREATE_INSTRUCTIONS = 'There is no Vendor ID associated with your account. To setup Vendor ID, please follow the instructions here: https://developer.amazon.com/en-US/docs/alexa/smapi/manage-credentials-with-ask-cli.html#vendor-id';

module.exports.AWS_CONFIGURATION_MESSAGE = '------------------------- Step 2 of 2 : Associate an AWS Profile with ASK CLI -------------------------';

module.exports.AWS_CREATE_PROFILE_TITLE = '\nComplete the IAM user creation with required permissions from the AWS console, then come back to the terminal.';

module.exports.AWS_CREATE_PROFILE_NO_BROWSER_OPEN_BROWSER = 'Please open the following url in your browser:';

module.exports.ACCESS_SECRET_KEY_AND_ID_SETUP = '\nPlease fill in the "Access Key ID" and "Secret Access Key" from the IAM user creation final page.';

module.exports.SKIP_AWS_CONFIGURATION = `------------------------- Skipping the AWS profile association -------------------------
You will only be able to deploy your Alexa skill. To set up AWS credentials later, use the "ask configure" command towards the same profile again.`;

module.exports.LWA_TOKEN_SHARE_WARN_MESSAGE = 'ASK CLI uses authorization code to fetch LWA tokens. Do not share neither your authorization code nor access tokens.';

module.exports.AWS_SECRET_ACCESS_KEY_AND_ID_SHARE_WARN_MESSAGE = 'ASK CLI will create an IAM user and generate corresponding access key id and secret access key. Do not share neither of them.';
