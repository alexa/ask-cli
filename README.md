The Alexa Skills Kit Command Line Interface (ASK CLI) is a tool that lets developers manage (create, read, update) their Alexa skills and related resources such as interaction models from the command line. It can be used interactively, in scripts, or plugged into any build system or CI/CD product that supports command-line execution steps. It performs skill management actions by calling the Alexa Skill Management API under the hood.

The Alexa Skill Management API provides RESTful HTTP interfaces for programmatically performing Alexa skill management, such as creating a new skill or updating an interaction model. The API authenticates the caller through [Login with Amazon](https://developer.amazon.com/login-with-amazon), allowing any developer to build tools or services that can create and update Alexa skills on behalf of their users. The ASK CLI is one of such tools.

The API's current authentication scheme is optimized for the authorization use case where the developer delegates API access to a tool or service. If you have a need to call the API directly for your own skill management needs, please open a GitHub issue.

## Alexa Skills Kit Command Line Interface (ASK CLI)

The CLI allows the user to create, read, and update Alexa skills and connected Lambda functions from the command line. The CLI is open-source and available for download on github. The CLI makes it easy to do the following:

* [Create new skill project](Command-Line-Interface-(CLI)-Usage-Instructions.md#new-command)
* [Deploy skill project to development stage](Command-Line-Interface-(CLI)-Usage-Instructions.md#deploy-command)
* [Clone existing skill to a local skill project](Command-Line-Interface-(CLI)-Usage-Instructions.md#clone-command)
* [Call individual Alexa Skill Management APIs](Command-Line-Interface-(CLI)-Usage-Instructions.md#api-command)
* [Download/upload of Lambda code](Command-Line-Interface-(CLI)-Usage-Instructions.md#lambda-command)
* [View CloudWatch logs](Command-Line-Interface-(CLI)-Usage-Instructions.md#log-subcommand)

## Alexa Skill Management API

If you're building your own tool or service to integrate with the API, you will need to implement OAuth 2.0 integration with [Login with Amazon](https://developer.amazon.com/login-with-amazon) to request your users' authorization and retrieve access tokens used to call the Skill Management API. Please see the [developer guide for Login with Amazon](https://images-na.ssl-images-amazon.com/images/G/01/lwa/dev/docs/website-developer-guide._TTH_.pdf). The API requires using the `authorization code` grant type. The OAuth scopes your application can to request and the associated permissions are listed below.

| Scope  | Permissions | 
| --- | --- |
| `alexa::ask:skills:read` | List the vendor IDs associated with the Amazon developer account<br>Read skill details (excluding interaction models)) |
| `alexa::ask:skills:readwrite` | All `alexa::ask:skills:read` permissions<br>Create skills<br>Update skills<br>Read and update account linking info for skills |
| `alexa::ask:models:read` | Read interaction models<br>Get build status for interaction models |
| `alexa::ask:models:readwrite` | All `alexa::ask:models:read` permissions<br>Update interaction models |

Please see the following the API documentation below and the object schemas in the next section.
The API's root endpoint is `https://api.amazonalexa.com/beta`, and the paths shown in each of the API operations below need to be concatenated to the root.
The `access token` retrieved from Login with Amazon should be provided in the `Authorization` header in each request.

* [Skill operations](smapi-skill-operations.md)
* [Model operations](smapi-model-operations.md)
* [Account Lining operations](smapi-acount-operations.md)
* [Vendor operations](smapi-vendor-operations.md)

## Object Schemas

When you manage Alexa skills with the CLI tool or the API, you will need to know the JSON format for representing each resource.

* [Skill schemas (Custom, Smart Home and Flash Briefing)](smapi-skill-schema.md)
* [Interaction model schemas](smapi-interaction-model-schema.md)
* [Account linking information](smapi-account-linking-schema.md)
