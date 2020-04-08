# Configure Command

`ask configure` configures the credentials that ASK CLI uses to authenticate skill developer to Amazon developer services and Amazon Web Services (AWS). The Amazon developer credentials stored in `cli_config` file located at `(.ask/cli_config)` of your home directory are used to authenticate a request while connecting SMAPI service to deploy a skill and/or interacting with other Alexa Skill resources. If a Skill developer prefers to deploy the backend code to AWS Lambda or manage existing skills that use AWS Lambda, a reference to the developer's Amazon Web Services (AWS) credentials is also stored in `.aws/credentials` file in your home directory.

## ASK CLI PROFILES' SETUP

ASK CLI uses profiles to distinguish between Amazon Developer credentials and AWS credentials. Profiles make it easier to manage skills that are owned by different Amazon developer organizations, and backend code in AWS Lambda that is owned by different AWS accounts. The 3 major steps in the setup are:

### ASK PROFILE SETUP

 `default` is chosen as default profile name to store Alexa developer credentials unless specifically mentioned by the user using the option `-p <profile_name>` or `--profile <profile_name>` while using the `ask configure` command.

 * **Profile selection process:**
    * If no previous profiles exist and user does not use `ask configure -p <profile_name>` to specify a profile name, CLI creates the corresponding `.ask/cli_config` file and sets the profile name to `default`.
    * If no previous profiles exist and user uses `ask configure -p <profile_name>` to specify a profile name, CLI creates the corresponding `.ask/cli_config` file and sets profile name to `profile_name`.
    * If CLI finds existing profile(s), user is provided an option to select an existing profile or choose to create a new profile. **A profile name can contain upper and lowercase letters, numbers, hyphens, and underscores only**.

 * **Fetching LWA tokens:** The configure command can be operated with and without `--no-browser` option.
   * If user runs `ask configure --no-browser`, CLI displays a URL `(LWA Authorization endpoint)` and prompts user to open the URL in a browser. The browser displays a page for the user to log in to and fetch `Authorization Code`. CLI waits for the user to paste the Authorization Code into the command prompt. Once CLI receives a valid Authorization Code, it makes a call to the `Authentication endpoint` to fetch corresponding Access Token.
   * If user doesn't specify the `--no-browser` option, CLI directly makes a request to Authorization endpoint by opening system default browser, fetch the Authorization code and make a call to Authentication endpoint to fetch the access token. Upon completion, these details are recorded in `.ask/cli_config` file.

### VENDOR ID SETUP

Sometimes Amazon may ask you for your vendor ID (VID) in order to perform debugging or whitelisting. Your VID is tied to your [Developer Console](https://developer.amazon.com/) account. ASK CLI leverages Vendor Operations [API](https://developer.amazon.com/en-US/docs/alexa/smapi/vendor-operations.html) to fetch VID and associate it with a profile.

* If no VID is associated with your account, CLI throws an error. To setup Vendor ID, please follow the instructions [here](https://developer.amazon.com/en-US/docs/alexa/smapi/manage-credentials-with-ask-cli.html#vendor-id).
* If a single VID is tagged to your account, CLI associates this VID with your profile.
* If multiple VIDs are linked, then CLI provides the developer with a choice of choosing a VID. Once a VID has been selected, CLI updates the current profile object in the config file with corresponding VID.


### AWS PROFILE SETUP

CLI provides user with an option to setup AWS profile or not. If user chooses to not set up an AWS profile, CLI wraps up the setup process. Else,

**Profile selection process:**
 * If the user had setup both `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` as environment variables, CLI prompts the user to confirm using environment profile. If user opts to go with environment variables, the    corresponding aws profile is chose as `__AWS_CREDENTIALS_IN_ENVIRONMENT_VARIABLE__`. Else,
 * If no previous aws profiles are found, `ask-cli-default` is chosen as the default profile name.
 * If multiple profile(s) are found, CLI prompts user to choose an existing profile or create a new profile.
   * If user chooses an existing profile, CLI maps the corresponding AWS profile with ASK profile and updates the `.ask/cli_config` file and wraps up the setup process.
   * If user chooses to create a new AWS profile, user is prompted to enter a profile name. `ask-cli-default` is chosen as default profile name to store AWS developer credentials, unless specifically mentioned by the user.

**Profile setup process**
 * If there are existing profiles, user is presented with an option to select an existing profile or choose to create new profile. If user selects an existing profile, since the corresponding `aws_access_key_id` and `aws_secret_access_key` is already available, CLI finishes the setup process with a confirmation message.
 * If user chooses to create new profile, CLI prompts the user for a name and proceeds with the AWS profile setup process. Similar to ASK profile setup, AWS profile setup can be operated in two modes, `ask configure` and `ask configure --no-browser`. In `--no-browser` mode, CLI displays a URL which points to AWS IAM role creation page and prompts the user to open the URL in a browser. Else, CLI opens the URL in system default browser without any user intervention.
   * User is presented with a login screen to AWS developer account. Create a new profile if you do not have one [here](https://console.aws.amazon.com/).
   * Upon successful login, if the generated IAM user name (`ask-cli-<aws_profile_name>`) is unique, user is taken to the review page with the minimum required policies applied to create an IAM user role.
   * If there exists an IAM role with the same name as the IAM user name, the user is redirected to the page where the user name can be updated. Clicking `next` in the `set permissions` and `Add tags` pages, user is taken to the review page. **The policies used in either of the workflows can be updated by the user if required.**

Upon successful completion of the creation of the IAM user, CLI expects the user to enter the generated `aws_access_key_id` and `aws_secret_access_key` into the command prompt. Upon completion of this process, CLI finishes the setup process by updating both `.aws/credentials` file and `.ask/cli_config` file with a confirmation message of the setup.

The policies used in the creation of IAM role are `IAMFullAccess`, `AWSCloudFormationFullAccess`, `AmazonS3FullAccess` and `AWSLambdaFullAccess`. For more information on IAM roles and policies, refer to the documentation [here](https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html).


---

Once all the steps have been successfully completed, the corresponding `.ask/cli_config` and `.aws/credentials` file structure will be,

#### cli_config file (for multiple profiles).

``` javascript

{
  "profiles": {
    "<User chosen profile name or 'default'>": {
      "token": {
        "access_token": "<your access token here>",
        "refresh_token": "<your refresh token here>",
        "token_type": "bearer",
        "expires_in": 3600,
        "expires_at": "<expiry date>"
      },
      "vendor_id": "<VendorId>",
      "aws_profile": "<aws_profile_name>( if user had set it up as part of configure workflow )"
    },
    "<profile_2>": {
      "token": {
        "access_token": "<your access token here>",
        "refresh_token": "<your refresh token here>",
        "token_type": "bearer",
        "expires_in": 3600,
        "expires_at": "<expiry date>"
      },
      "vendor_id": "<VendorId>",
      "aws_profile": "<aws_profile_name_2>( if user had set it up as part of configure workflow )"
    }
  }
}

```
#### AWS credentials file (for multiple profiles).

``` ini
[aws_profile_name]
aws_access_key_id=user_aws_access_key_id
aws_secret_access_key=user_secret_access_key
[aws_profile_name_2]
aws_access_key_id=user_aws_access_key_id
aws_secret_access_key=user_secret_access_key
```

