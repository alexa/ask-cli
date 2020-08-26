module.exports.APPLICATION_NAME = 'ask-cli';
module.exports.NPM_REGISTRY_URL_BASE = 'http://registry.npmjs.org';

module.exports.METRICS = {
    ENDPOINT: 'https://client-telemetry.amazonalexa.com'
};

module.exports.DEPLOYER_TYPE = {
    HOSTED: {
        OPTION_NAME: 'Alexa-hosted skills',
        NAME: '@ask-cli/hosted-skill-deployer',
        DESCRIPTION: 'Host your skill code by Alexa (free).'
    },
    CFN: {
        OPTION_NAME: 'AWS with CloudFormation',
        NAME: '@ask-cli/cfn-deployer',
        DESCRIPTION: 'Host your skill code with AWS services and provision with AWS CloudFormation (requires AWS account)'
    },
    LAMBDA: {
        OPTION_NAME: 'AWS Lambda',
        NAME: '@ask-cli/lambda-deployer',
        DESCRIPTION: 'Host your skill code on AWS Lambda (requires AWS account).'
    }
};

module.exports.DEPLOY_TARGET = {
    SKILL_METADATA: 'skill-metadata',
    SKILL_INFRASTRUCTURE: 'skill-infrastructure',
};

module.exports.HOSTED_SKILL = {
    DEFAULT_SKILL_NAME: 'Hello World Skill',
    LOCALES: ['de-DE', 'en-AU', 'en-CA', 'en-GB', 'en-IN', 'en-US', 'es-ES', 'es-MX',
        'es-US', 'fr-CA', 'fr-FR', 'hi-IN', 'it-IT', 'ja-JP', 'pt-BR'],
    REGIONS: {
        'us-east-1': 'US_EAST_1',
        'us-west-2': 'US_WEST_2',
        'eu-west-1': 'EU_WEST_1'
    },
    DEFAULT_RUNTIME: {
        NodeJS: 'NODE_10_X',
        Python: 'PYTHON_3_7',
    },
    SIGNIN_PATH: '/ap/signin',
    PERMISSION_ENUM: {
        NEW_SKILL: 'newSkill'
    },
    RESOURCES: {
        MANIFEST: 'manifest',
        INTERACTION_MODEL: 'interactionModel',
        PROVISIONING: 'hostedSkillProvisioning',
        DEPLOYMENT: 'hostedSkillDeployment'
    },
    MANIFEST: {
        publishingInformation: {
            locales: {
            }
        },
        apis: {
            custom: {
            }
        }
    },
    PERMISSION_CHECK_RESULT: {
        NEW_USER_REGISTRATION_REQUIRED: 'NEW_USER_REGISTRATION_REQUIRED',
        RATE_EXCEEDED: 'RATE_EXCEEDED',
        ALLOWED: 'ALLOWED'
    },
    MANIFEST_STATUS: {
        SUCCESS: 'SUCCEEDED',
        FAILURE: 'FAILED',
        IN_PROGRESS: 'IN_PROGRESS'
    },
    PROVISIONING_STATUS: {
        SUCCESS: 'SUCCEEDED',
        FAILURE: 'FAILED',
        IN_PROGRESS: 'IN_PROGRESS'
    },
    INTERACTION_MODEL_STATUS: {
        SUCCESS: 'SUCCEEDED',
        FAILURE: 'FAILED',
        IN_PROGRESS: 'IN_PROGRESS'
    },
    GIT_HOOKS_TEMPLATES: {
        PRE_PUSH: {
            URL: 'https://ask-cli-static-content.s3-us-west-2.amazonaws.com/git-hooks-templates/pre-push'
        }
    }
};

module.exports.SKILL = {
    RESOURCES: {
        MANIFEST: 'manifest',
        INTERACTION_MODEL: 'interactionModel',
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
    SIMULATION_STATUS: {
        SUCCESS: 'SUCCESSFUL',
        FAILURE: 'FAILED',
        IN_PROGRESS: 'IN_PROGRESS'
    },
    DOMAIN: {
        CAN_ENABLE_DOMAIN_LIST: ['custom', 'music']
    }
};

module.exports.CONFIGURATION = {
    JSON_DISPLAY_INDENT: 2,
    OPEN_BROWSER_DELAY: 1000,
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
    HIDDEN_ASK_FOLDER: '.ask',
    ASK_STATES_JSON_CONFIG: 'ask-states.json',
    ASK_RESOURCES_JSON_CONFIG: 'ask-resources.json',
    SKILL_PACKAGE: {
        PACKAGE: 'skill-package',
        MANIFEST: 'skill.json'
    },
    SKILL_CODE: {
        CODE: 'code', // TODO ; replaced with LAMBDA
        LAMBDA: 'lambda'
    },
    SKILL_INFRASTRUCTURE: {
        INFRASTRUCTURE: 'infrastructure'
    },
    LEGACY_PATH: '.legacy',
    AWS: {
        HIDDEN_FOLDER: '.aws',
        CREDENTIAL_FILE: 'credentials'
    },
    ASK: {
        HIDDEN_FOLDER: '.ask',
        PROFILE_FILE: 'cli_config',
        METRIC_FILE: 'cli_metric'
    }
};

module.exports.TEMPLATES = {
    TEMPLATE_BRANCH_NAME: 'ask-cli-x',
    LANGUAGE_MAP: {
        NodeJS: {
            TEMPLATE_INDEX: 'https://ask-cli-static-content.s3-us-west-2.amazonaws.com/skill-templates/nodejs-templates.json'
        },
        Python: {
            TEMPLATE_INDEX: 'https://ask-cli-static-content.s3-us-west-2.amazonaws.com/skill-templates/python-templates.json'
        },
        Java: {
            TEMPLATE_INDEX: 'https://ask-cli-static-content.s3-us-west-2.amazonaws.com/skill-templates/java-templates.json'
        }
    }
};

module.exports.AWS_SKILL_INFRASTRUCTURE_DEFAULT_REGION = 'us-east-1';

module.exports.ALEXA = {
    REGION: {
        DEFAULT: 'default',
        NA: 'NA',
        EU: 'EU',
        FE: 'FE'
    }
};

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
        GET_METRICS: 'get-metrics',
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
        CREATE_HOSTED_SKILL: 'create-alexa-hosted-skill',
        GET_HOSTED_SKILLS_META_DATA: 'get-alexa-hosted-skill',
        GET_GIT_CREDENTIALS: 'get-git-credentials',
        GET_HOSTED_SKILLS_PERMISSION: 'get-alexa-hosted-skill-permission',
        // Task
        GET_TASK: 'get-task',
        SEARCH_TASK: 'search-task'
    },
    DEFAULT_MAX_RESULT_PER_PAGE: 50
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
const SCOPES_SUBSCRIPTIONS = 'alexa::ask:subscriptions';
const SCOPES_SKILLS_DEBUG = 'alexa::ask:skills:debug';

module.exports.LWA = {
    S3_RESPONSE_PARSER_URL: 'https://ask-cli-static-content.s3-us-west-2.amazonaws.com/html/ask-cli-no-browser.html',
    DEFAULT_STATE: 'Ask-SkillModel-ReadWrite',
    DEFAULT_SCOPES: `${SCOPES_SKILLS_READWRITE} ${SCOPES_MODELS_READWRITE} ${SCOPES_SKILLS_TEST} ${SCOPES_CATALOG_READ}`
        + ` ${SCOPES_CATALOG_READWRITE} ${SCOPES_SUBSCRIPTIONS} ${SCOPES_SKILLS_DEBUG}`,
    SIGNIN_URL: 'https://www.amazon.com/ap/signin',
    // Below are the details for the ask-cli's default LWA client which is used internally if another client is not provided by the users.
    // Use of this client outside of the CLI is unauthorized and unsupported by Amazon.
    // To create an LWA client for other use, please follow the documentation at https://developer.amazon.com/docs/login-with-amazon/register-web.html
    CLI_INTERNAL_ONLY_LWA_CLIENT: {
        CLIENT_ID: 'amzn1.application-oa2-client.aad322b5faab44b980c8f87f94fbac56',
        CLIENT_CONFIRMATION: '1642d8869b829dda3311d6c6539f3ead55192e3fc767b9071c888e60ef151cf9'
    },
    DEFAULT_AUTHORIZE_HOST: 'https://www.amazon.com',
    DEFAULT_AUTHORIZE_PATH: '/ap/oa',
    DEFAULT_TOKEN_HOST: 'https://api.amazon.com',
    DEFAULT_TOKEN_PATH: '/auth/o2/token',
    LOCAL_PORT: 9090
};

module.exports.REGEX_VALIDATIONS = {
    PROFILE_NAME: /(^[a-zA-Z0-9-_]+$)(?!__ENVIRONMENT_ASK_PROFILE__)/g
};

module.exports.ASK_DEFAULT_PROFILE_NAME = 'default';
module.exports.AWS_DEFAULT_PROFILE_NAME = 'ask_cli_default';
module.exports.LOCALHOST_PORT = '9090';

module.exports.FILE_PERMISSION = {
    USER_READ_WRITE: '0600'
};
