const DEFAULT_LIST_MAX_RESULT = 50;

module.exports.SKILL = {
    RESOURCES: {
        MANIFEST: 'manifest',
        INTERACTION_MODEL: 'interactionModel'
    },
    STAGE: {
        DEVELOPMENT: 'development',
        LIVE: 'live',
        CERTIFICATION: 'certification'
    },
    SKILL_STATUS: {
        SUCCEEDED: 'SUCCEEDED',
        FAILED: 'FAILED',
        IN_PROGRESS: 'IN_PROGRESS',
    },
    PACKAGE_STATUS: {
        SUCCEEDED: 'SUCCEEDED',
        FAILED: 'FAILED',
        IN_PROGRESS: 'IN_PROGRESS',
        ROLLBACK_SUCCEEDED: 'ROLLBACK_SUCCEEDED',
        ROLLBACK_FAILED: 'ROLLBACK_FAILED',
        ROLLBACK_IN_PROGRESS: 'ROLLBACK_IN_PROGRESS'
    },
    VALIDATION_STATUS: {
        SUCCESS: 'SUCCESSFUL',
        FAILURE: 'FAILED',
        IN_PROGRESS: 'IN_PROGRESS'
    },
    DOMAIN: {
        CAN_ENABLE_DOMAIN_LIST: ['custom', 'music']
    }
};

module.exports.ISP = {
    NUMBERS: {
        DEFAULT_ISP_MAX_RESULTS: 50
    }
};

module.exports.CONFIGURATION = {
    JSON_DISPLAY_INDENT: 2,
    OPN_BROWSER_DELAY: 1000,
    RETRY: {
        GET_PACKAGE_IMPORT_STATUS: {
            MAX_RETRY: 50,
            MIN_TIME_OUT: 2000,
            FACTOR: 1.1
        },
        GET_PACKAGE_EXPORT_STATUS: {
            MAX_RETRY: 30,
            MIN_TIME_OUT: 2000,
            FACTOR: 1.1
        },
        GET_SIMULATE_STATUS: {
            MAX_RETRY: 20,
            MIN_TIME_OUT: 2000,
            FACTOR: 1.2
        },
        VALIDATE_SKILL_STATUS: {
            MAX_RETRY: 30,
            MIN_TIME_OUT: 1000,
            FACTOR: 1.2
        },
        CREATE_LAMBDA_FUNCTION: {
            BASE: 5000,
            FACTOR: 1.5,
            MAXRETRY: 3
        }
    },
    S3: {
        MULTIPART_UPLOAD: {
            DEFAULT_PART_SIZE: 8 * 1024 * 1024,
            MAX_PART_COUNT: 1000,
            MIN_PART_SIZE: 5 * 1024 * 1024,
            MIN_PART_SIZE_DISPLAY: '5MB',
            CONCURRENCY: 10
        },
        VERSIONING: {
            NOT_FOUND_RETRY_DELAY_MS: 1000
        }
    }
};

module.exports.FILE_PATH = {
    ASK_RESOURCES_JSON_CONFIG: 'ask-resources.json',
    SKILL_PACKAGE: {
        PACKAGE: 'skill-package',
        MANIFEST: 'skill.json'
    },
    SKILL_CODE: {
        CODE: 'code'
    },
    LEGACY_PATH: '.legacy',
    AWS: {
        HIDDEN_FOLDER: '.aws',
        CREDENTIAL_FILE: 'credentials'
    }
};

module.exports.TEMPLATES = {
    TEMPLATE_BRANCH_NAME: 'ask-cli-x',
    LANGUAGE_MAP: {
        NodeJS: {
            TEMPLATE_INDEX: 'https://ask-cli-static-content.s3-us-west-2.amazonaws.com/skill-templates/nodejs-templates.json',
            LAMBDA_RUNTIME: [
                'nodejs8.10',
                'nodejs10.x'
            ]
        },
        Python: {
            TEMPLATE_INDEX: 'https://ask-cli-static-content.s3-us-west-2.amazonaws.com/skill-templates/python-templates.json',
            LAMBDA_RUNTIME: [
                'python2.7',
                'python3.6',
                'python3.7'
            ]
        },
        Java: {
            TEMPLATE_INDEX: 'https://ask-cli-static-content.s3-us-west-2.amazonaws.com/skill-templates/java-templates.json',
            LAMBDA_RUNTIME: [
                'java8'
            ]
        }
    }
};

module.exports.AWS_SKILL_INFRASTRUCTURE_DEFAULT_REGION = 'us-east-1';

module.exports.AWS = {
    IAM: {
        USER: {
            NEW_USER_BASE_URL: 'https://console.aws.amazon.com/iam/home?region=undefined#/users$new?',
            POLICY_ARN: {
                IAM_FULL: 'arn:aws:iam::aws:policy/IAMFullAccess',
                CFN_FULL: 'arn:aws:iam::aws:policy/AWSCloudFormationFullAccess',
                S3_FULL: 'arn:aws:iam::aws:policy/AmazonS3FullAccess',
                LAMBDA_FULL: 'arn:aws:iam::aws:policy/AWSLambdaFullAccess'
            }
        },
        ROLE: {
            LAMBDA_BASIC_ROLE: {
                POLICY_ARN: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
                POLICY: {
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Effect: 'Allow',
                            Principal: {
                                Service: 'lambda.amazonaws.com'
                            },
                            Action: 'sts:AssumeRole'
                        }
                    ]
                }
            }
        }
    }
};

module.exports.PLACEHOLDER = {
    ENVIRONMENT_VAR: {
        AWS_CREDENTIALS: '__AWS_CREDENTIALS_IN_ENVIRONMENT_VARIABLE__',
        PROFILE_NAME: '__ENVIRONMENT_ASK_PROFILE__'
    }
};

module.exports.SMAPI = {
    ENDPOINT: 'https://api.amazonalexa.com',
    VERSION: {
        V0: 'v0',
        V1: 'v1',
        V2: 'v2'
    },
    API_NAME: {
        // Skill
        CREATE_SKILL: 'create-skill',
        DELETE_SKILL: 'delete-skill',
        LIST_SKILLS: 'list-skills',
        GET_SKILL_STATUS: 'get-skill-status',
        SUBMIT: 'submit',
        WITHDRAW: 'withdraw',
        ENABLE_SKILL: 'enable-skill',
        DISABLE_SKILL: 'disable-skill',
        GET_SKILL_ENABLEMENT: 'get-skill-enablement',
        GET_SKILL_CREDENTIALS: 'get-skill-credentials',
        LIST_VENDORS: 'list-vendors',
        // Evaluations
        NLU_PROFILE: 'nlu-profile',
        // Utterance transcripts
        INTENT_REQUEST_HISTORY: 'intent-requests-history',
        LIST_CERTIFICATIONS: 'list-certifications',
        GET_CERTIFICATION: 'get-certification',
        // Manifest
        GET_MANIFEST: 'get-manifest',
        UPDATE_MANIFEST: 'update-manifest',
        // Model
        GET_INTERACTION_MODEL: 'get-interaction-model',
        SET_INTERACTION_MODEL: 'set-interaction-model',
        HEAD_INTERACTION_MODEL: 'head-interaction-model',
        GET_UTTERANCE_DATA: 'get-utterance-data',
        LIST_INTERACTION_MODEL_VERSIONS: 'list-interaction-model-versions',
        // ISP
        CREATE_ISP: 'create-isp',
        GET_ISP: 'get-isp',
        UPDATE_ISP: 'update-isp',
        ASSOCIATE_ISP: 'associate-isp',
        DISASSOCIATE_ISP: 'disassociate-isp',
        LIST_ISP_FOR_SKILL: 'list-isp-for-skill',
        LIST_ISP_FOR_VENDOR: 'list-isp-for-vendor',
        LIST_SKILLS_FOR_ISP: 'list-skills-for-isp',
        DELETE_ISP: 'delete-isp',
        RESET_ISP_ENTITLEMENT: 'reset-isp-entitlement',
        // Skill Package
        CREATE_UPLOAD: 'create-upload',
        IMPORT_PACKAGE: 'import-package',
        GET_IMPORT_STATUS: 'get-import-status',
        EXPORT_PACKAGE: 'export-package',
        GET_EXPORT_STATUS: 'get-export-status',
        // Account Linking
        SET_ACCOUNT_LINKING: 'set-account-linking',
        GET_ACCOUNT_LINKING: 'get-account-linking',
        DELETE_ACCOUNT_LINKING: 'delete-account-linking',
        // Testing
        SIMULATE_SKILL: 'simulate-skill',
        INVOKE_SKILL: 'invoke-skill',
        GET_SIMULATION: 'get-simulation',
        VALIDATE_SKILL: 'validate-skill',
        GET_VALIDATION: 'get-validation',
        // Beta Test
        CREATE_BETA_TEST: 'create-beta-test',
        UPDATE_BETA_TEST: 'update-beta-test',
        GET_BETA_TEST: 'get-beta-test',
        START_BETA_TEST: 'start-beta-test',
        END_BETA_TEST: 'end-beta-test',
        LIST_BETA_TESTERS: 'list-beta-testers',
        ADD_BETA_TESTERS: 'add-beta-testers',
        REMOVE_BETA_TESTERS: 'remove-beta-testers',
        SEND_REMINDER_TO_BETA_TESTERS: 'send-reminder-to-beta-testers',
        REQUEST_FEEDBACK_FROM_BETA_TESTERS: 'request-feedback-from-beta-testers',
        // Private Skill
        ADD_PRIVATE_DISTRIBUTION_ACCOUNT: 'add-private-distribution-account',
        LIST_PRIVATE_DISTRIBUTION_ACCOUNTS: 'list-private-distribution-accounts',
        DELETE_PRIVATE_DISTRIBUTION_ACCOUNT: 'delete-private-distribution-account',
        // Catalog
        CREATE_CATALOG: 'create-catalog',
        GET_CATALOG: 'get-catalog',
        LIST_CATALOGS: 'list-catalogs',
        UPLOAD_CATALOG: 'create-catalog-upload',
        GET_CATALOG_UPLOAD: 'get-catalog-upload',
        LIST_CATALOG_UPLOADS: 'list-catalog-uploads',
        ASSOCIATE_CATALOG_WITH_SKILL: 'associate-catalog-with-skill',
        COMPLET_CATALOG_UPLOAD: 'complete-catalog-upload',
        // Hosted Skills
        GET_HOSTED_SKILLS_META_DATA: 'get-alexa-hosted-skill',
        GET_GIT_CREDENTIALS: 'get-git-credentials',
        GET_HOSTED_SKILLS_PERMISSION: 'get-alexa-hosted-skill-permission'
    },
    DEFAULT_MAX_RESULT_PER_PAGE: DEFAULT_LIST_MAX_RESULT
};

module.exports.HTTP_REQUEST = {
    VERB: {
        GET: 'GET',
        PUT: 'PUT',
        POST: 'POST',
        DELETE: 'DELETE',
        HEAD: 'HEAD'
    },
    STATUS_CODE: {
        OK: 200,
        ACCEPTED: 202,
        NO_CONTENT: 204,
        SEE_OTHER: 303,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        PRECONDITION_FAILED: 412,
        TOO_MANY_REQUESTS: 429,
        INTERNAL_SERVER_ERROR: 500
    }
};

const SCOPES_SKILLS_READWRITE = 'alexa::ask:skills:readwrite';
const SCOPES_MODELS_READWRITE = 'alexa::ask:models:readwrite';
const SCOPES_SKILLS_TEST = 'alexa::ask:skills:test';
const SCOPES_CATALOG_READ = 'alexa::ask:catalogs:read';
const SCOPES_CATALOG_READWRITE = 'alexa::ask:catalogs:readwrite';

module.exports.LWA = {
    S3_RESPONSE_PARSER_URL: 'https://s3.amazonaws.com/ask-cli/response_parser.html',
    DEFAULT_STATE: 'Ask-SkillModel-ReadWrite',
    DEFAULT_SCOPES: `${SCOPES_SKILLS_READWRITE} ${SCOPES_MODELS_READWRITE} ${SCOPES_SKILLS_TEST} ${SCOPES_CATALOG_READ} ${SCOPES_CATALOG_READWRITE}`,
    // Below are the details for the ask-cli's default LWA client which is used internally if another client is not provided by the users.
    // Use of this client outside of the CLI is unauthorized and unsupported by Amazon.
    // To create an LWA client for other use, please follow the documentation at https://developer.amazon.com/docs/login-with-amazon/register-web.html
    CLI_INTERNAL_ONLY_LWA_CLIENT: {
        CLIENT_ID: 'amzn1.application-oa2-client.aad322b5faab44b980c8f87f94fbac56',
        CLIENT_CONFIRMATION: '1642d8869b829dda3311d6c6539f3ead55192e3fc767b9071c888e60ef151cf9'
    }
};

module.exports.COMMAND = {
    NAME: {
        DIALOG: 'dialog',
        SIMULATE: 'simulate',
    },
    INIT: Object.freeze({
        HELP_DESCRIPTION:   '\n  Usage: ask-init\n\n' +
                            '  $ ask init [--no-browser] [-l|--list-profiles] [-p|--profile] [--debug]\n\n' +
                            '  To establish authorization for the CLI to create and modify skills ' +
                            'associated with your Amazon developer account, you must run the init command.\n\n\n' +
                            '  Options:\n\n' +
                            '    --no-browser             display authorization url instead of opening browser\n' +
                            '    -l, --list-profiles      list all the profile(s) for ask-cli\n' +
                            '    -p, --profile <profile>  name for the profile to be created/updated\n' +
                            '    --aws-setup              setup AWS profile with "Access Key ID" and "Secret Access Key"\n' +
                            '    --debug                  ask cli debug mode\n' +
                            '    -h, --help               output usage information',
        ASK_DEFAULT_PROFILE_NAME: 'default',
        AWS_DEFAULT_PROFILE_NAME: 'ask_cli_default'
    }),

    DEPLOY: Object.freeze({
        HELP_DESCRIPTION:   '\n  Usage: ask-deploy\n\n' +
                            '  $ ask deploy [--no-wait] [-t|--target <target>] [--force] [-p|--profile <profile>] [--debug]\n\n' +
                            '  Deploys a skill project to your developer account, optionally deploying Lambda code. ' +
                            'For example, for a custom skill, your skill.json file, interaction model file, and AWS ' +
                            'Lambda function code files will be deployed. For a smart home skill, your skill.json file ' +
                            'and code files will be deployed. For a flash briefing skill, only the skill.json file will' +
                            ' be deployed.\n\n' +
                            '  If the skill has never been deployed, the ask-cli will create a new skill and a new ' +
                            'Lambda function. The newly created skill ID is written to the skill configuration file ' +
                            'at $HOME/.ask/config.\n\n' +
                            '  If the skill already exists, ask-cli will update the existing skill, including metadata, ' +
                            'sample utterances, and so on, as well as AWS Lambda function resources if applicable. If this ' +
                            'skill package has been created by previously downloading an existing skill using "ask clone", ' +
                            'and you perform "ask deploy" on the package for the first time, then ask-cli will prompt you to ' +
                            'ensure you want to overwrite the existing skill in your account.\n\n\n' +
                            '  Options:\n\n' +
                            '    --no-wait                asynchronous model deployment\n' +
                            '    -t, --target <target>    deploy lambda, model, skill, isp or all of them. Options can only be "all", "lambda", "skill", "isp" or "model".\n' +
                            '    --force                  deploy specified skill resources regardless of the eTag check\n' +
                            '    -p, --profile <profile>  ask cli profile\n' +
                            '    --debug                  ask cli debug mode\n' +
                            '    -h, --help               output usage information'
    }),

    CLONE: Object.freeze({
        HELP_DESCRIPTION:   '\n  Usage: ask-clone\n\n' +
                            '  $ ask clone [-s|--skill-id <skill-id>] [-p|--profile <profile>] [--debug]\n\n' +
                            '  Creates a skill project by cloning an existing skill. ' +
                            'Used to set up a new project from the latest deployed one, ' +
                            'possibly for updates or modifications.\n\n' +
                            '  Note: If there is an existing skill project directory with the same ' +
                            'name as the skill being cloned, the directory will be overwritten.\n\n\n' +
                            '  Options:\n\n' +
                            '    -s, --skill-id <skill-id>  skill-id for the skill\n' +
                            '    -p, --profile <profile>    ask cli profile\n' +
                            '    --debug                    ask cli debug mode\n' +
                            '    -h, --help                 output usage information'
    }),

    NEW: Object.freeze({
        HELP_DESCRIPTION:   '\n  Usage: ask-new\n\n' +
                            '  $ ask new [--template [template-name] [--url <url>]] ' +
                            '[-n|--skill-name <name>] [-p|--profile <profile>] [--lambda-name <lambda-name>] [--debug]\n\n' +
                            '  Creates a new skill project in the current directory. Use the new command to create the ' +
                            'directories and files necessary to deploy a skill with minimal modifications.\n\n' +
                            '  The parent directory for the skill will be named the same as the specified skill name, ' +
                            'and the parent directory will contain the other files and directories necessary to manage ' +
                            'the skill with the ask-cli. Following is an example of the directories and files created ' +
                            'for a custom skill in the en-US locale:\n\n' +
                            '  -skill-name\n' +
                            '    -.ask\n' +
                            '      -config\n' +
                            '    -lambda\n' +
                            '      -custom\n' +
                            '        -index.js\n' +
                            '    -models\n' +
                            '      -en-US.json\n' +
                            '    -skill.json\n\n\n' +
                            '    -isps\n' +
                            '      -entitlement' +
                            '        -isp.json' + '' +
                            '      -subscription' + '' +
                            '        -isp.json' +
                            '  Options:\n\n' +
                            '    --template [template-name]     create a skill project based on the chosen template\n' +
                            '    --url <url>                    provide a customized list of templates\n' +
                            '    -n, --skill-name <name>        create new skill project with skill name\n' +
                            '    --lambda-name <lambda-name>    customize lambda function name if necessary\n' +
                            '    -p, --profile <profile>        create new skill project under the chosen profile\n' +
                            '    --debug                        ask cli debug mode\n' +
                            '    -h, --help                     output usage information'
    }),
    ADD: Object.freeze({
        HELP_DESCRIPTION:   '\n  Usage: ask-add\n\n' +
                            '  $ ask add <component> [--isp-id <isp-id>] [-f|--file <file-path>] [--isp-name <name>]\n\n' +
                            '  Create and add a component to the skill project.\n\n' +
                            '    <component>                    type of the component \n'+
                            '                                       isp: create an in-skill-product\n\n' +
                            '    --isp-id <isp-id>              add an existing in-skill product to current skill\n' +
                            '    -f, --file <file-path>         include a skill component file to the skill project\n' +
                            '    --isp-name <name>              assign a name to the new in-skill product when using template\n' +
                            '    -p, --profile <profile>        add a component under the chosen profile\n' +
                            '    -h, --help                     output usage information'
    }),
    REMOVE: Object.freeze({
        HELP_DESCRIPTION:   '\n  Usage: ask-remove\n\n' +
                            '  $ ask remove <component> [--isp-id <isp-id>] [-f|--file <file-path>]\n\n' +
                            '  Remove a skill component from the skill project.\n\n' +
                            '    <component>                    type of the component \n' +
                            '                                       isp: create an in-skill-product\n\n' +
                            '    --isp-id <isp-id>              remove an existing in-skill product to current skill\n' +
                            '    -f, --file                     remove a component file from the skill project\n' +
                            '    -p, --profile <profile>        remove a component under the chosen profile\n' +
                            '    -h, --help                     output usage information'
    }),
    STATUS: Object.freeze({
        HELP_DESCRIPTION:   '\n  Usage: ask-status\n\n' +
                            '  $ ask status [--isp] \n\n' +
                            '  Display the status of skill resource.\n\n' +
                            '    --isp                       show the status of in-skill products\n' +
                            '    -p, --profile <profile>     show the status of skill resource under the chosen profile\n' +
                            '    -h, --help                  output usage information'
    }),
    DIFF: Object.freeze({
        HELP_DESCRIPTION:   '\n  Usage: ask-diff\n\n' +
                            '  $ ask diff [-t|--target <target>] [-p|--profile <profile>] [--debug]\n\n' +
                            '  Compare the local skill resource(s) with the latest version from remote.\n\n' +
                            '    -t, --target <target>      select diff target from "skill", "model", "lambda", "isp" or "all"\n' +
                            '    -p, --profile <profile>    ask cli profile\n' +
                            '    --debug                    ask cli debug mode\n' +
                            '    -h, --help                 output usage information'
    }),
};
