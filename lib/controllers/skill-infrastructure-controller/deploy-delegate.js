const path = require('path');

const BUILT_IN_DEPLOY_DELEGATES = {
    '@ask-cli/cfn-deployer': {
        location: 'cfn-deployer',
        description: 'Deploy skill infrastructure by uploading local skill code to Amazon S3, '
            + 'and using AWS CloudFormation to configure all the skill needed AWS resources. '
            + 'Will keep polling the CloudFormation status and update deploy progress in real time. '
            + 'Starting from a basic skill-template.yaml with AWS Lambda related resources.'
    },
    '@ask-cli/lambda-deployer': {
        location: 'lambda-deployer',
        description: 'Deploy skill infrastructure by creating an AWS IAM Role with basic permissions to access AWS Lambda, '
            + 'uploading the local skill code and updating the configuration to an AWS Lambda function.'
    }
};

/**
 * Class for 3p DeployDelegate which implements the contract between ask-cli and its deploy delegate.
 *
 * Each deploy delegate contains the following methods to implement as its interface:
 * - bootstrap  initiate ask-cli's ask-resources config with custom skill infrastructure logic
 *              input: options.codeProperty     { runtime, handler }
 *                     options.workspacePath    workspace dedicated to the deploy delegate, usually it's under "{skillProj}/infrastructures/{type}"
 *                     options.userConfig       the initial userConfig in the infrastructure setting
 *              return: error                   any error during the bootstrap
 *                      result.userConfig       updated userConfig after bootstrap
 *
 * - invoke     trigger the actual deploy logic inside the deploy delegate which will pass back the deploy state if the process succeeds
 *              input: options.profile          ask-cli profile
 *                     options.alexaRegion      alexa region, i.e. default, NA, EU, FE
 *                     options.skillId
 *                     options.skillName
 *                     options.code             the code config from ask-resources for a certain alexa region
 *                     options.userConfig       the userConfig from ask-resources config
 *                     options.deployState      the deployState from ask-resources config
 *              return: error                   any error during the invoke
 *                      result.endpoint         the endpoint field following the definition of skill.json, usually contains the url for the endpoint
 *                      result.deployState      the result of deploy to be tracked in ask-resources config
 */
class DeployDelegate {
    /**
     * Constructor for wrapping the deploy delegate instance to enforce its contract with ask-cli.
     * @param {String} type the deploy delegate type name
     * @param {Object} instance the instance for the deploy delegate
     */
    constructor(type, instance) {
        this.type = type;
        this.instance = instance;
        this._validateDeployDelegateMethods();
    }

    /**
     * Wrapper of deployDelegate's bootstrap method
     * @param {Function} callback
     */
    bootstrap(options, callback) {
        if (!this.instance) {
            return callback('[Fatal]: Please instantiate the DeployDelegate class before using.');
        }
        this.instance.bootstrap(options, callback);
    }

    /**
     * Wrapper of deployDelegate's invoke method
     * @param {Object} reporter upstream CLI status reporter
     * @param {Object} options Invoke options { profile, alexaRegion, skillId, skillName, code, userConfig, deployState }
     * @param {Function} callback
     */
    invoke(reporter, options, callback) {
        if (!this.instance) {
            return callback('[Fatal]: Please instantiate the DeployDelegate class before using.');
        }
        this.instance.invoke(reporter, options, callback);
    }

    /**
     * Validate if the response from DeployDelegate is following the contract between ask-cli and DeployDelegate.
     * @param {Object} deployResult the result from deployDelegate's invoke.
     */
    validateDeployDelegateResponse(deployResult) {
        if (!deployResult) {
            throw new Error('[Error]: Deploy result should not be empty.');
        }
        let error = null;
        for (const region of Object.keys(deployResult)) {
            if (!deployResult[region].endpoint) {
                error = '[Error]: Invalid response from deploy delegate. "endpoint" field must exist in the response.';
                break;
            }
            if (!deployResult[region].endpoint.uri) {
                error = '[Error]: Invalid response from deploy delegate. "uri" field must exist in the "endpoint" field in the response.';
                break;
            }
            if (!deployResult[region].deployState) {
                error = '[Error]: Invalid response from deploy delegate. "deployState" field must exist in the response.';
                break;
            }
        }
        if (error) {
            throw new Error(error);
        }
    }

    /**
     * Validate if the instance of DeployDelegate has required method.
     */
    _validateDeployDelegateMethods() {
        if (!this.instance) {
            throw new Error('[Error]: Invalid deploy delegate. Failed to load the target module.');
        }
        if (!this.instance.bootstrap || typeof this.instance.bootstrap !== 'function') {
            throw new Error('[Error]: Invalid deploy delegate. The class of the deploy delegate must contain "bootstrap" method.');
        }
        if (!this.instance.invoke || typeof this.instance.invoke !== 'function') {
            throw new Error('[Error]: Invalid deploy delegate. The class of the deploy delegate must contain "invoke" method.');
        }
    }
}

/**
 * Factory method to load DeployDelegate class in the managed way
 * Supported built-ins:
 *   @ask-cli/cfn-deployer
 *
 * @param {String} type deploy delegate type
 * @param {Function} callback (error, deployDelegateInstance)
 */
function loadDeployDelegate(type, callback) {
    if (typeof type === 'string' && BUILT_IN_DEPLOY_DELEGATES[type]) {
        let dd;
        const builtinLocation = BUILT_IN_DEPLOY_DELEGATES[type].location;
        try {
            const modulePath = path.join(__dirname, '..', '..', 'builtins', 'deploy-delegates', builtinLocation);
            dd = new DeployDelegate(type, require(modulePath)); // eslint-disable-line global-require
        } catch (loadErr) {
            return process.nextTick(() => {
                callback(`[Error]: Built-in skill infrastructure type "${type}" failed to load.\n${loadErr}`);
            });
        }
        callback(null, dd);
    } else if (type === 'custom') {
        // TODO support custom script type deploy delegate
    } else {
        process.nextTick(() => {
            callback(`[Error]: Skill infrastructure type "${type}" is not recognized by ask-cli.`);
        });
    }
}

module.exports = DeployDelegate;
module.exports.load = loadDeployDelegate;
module.exports.builtin = BUILT_IN_DEPLOY_DELEGATES;
