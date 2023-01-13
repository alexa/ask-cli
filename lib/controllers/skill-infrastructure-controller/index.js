const R = require('ramda');
const path = require('path');

const SkillMetadataController = require('@src/controllers/skill-metadata-controller');
const ResourcesConfig = require('@src/model/resources-config');
const Manifest = require('@src/model/manifest');
const MultiTasksView = require('@src/view/multi-tasks-view');
const Messenger = require('@src/view/messenger');
const hashUtils = require('@src/utils/hash-utils');
const stringUtils = require('@src/utils/string-utils');
const SpinnerView = require('@src/view/spinner-view');
const profileHelper = require('@src/utils/profile-helper');

const DeployDelegate = require('./deploy-delegate');

const defaultAlexaAwsRegionMap = {
    default: 'us-east-1',
    NA: 'us-east-1',
    EU: 'eu-west-1',
    FE: 'us-west-2'
};

module.exports = class SkillInfrastructureController {
    constructor(configuration) {
        const { profile, doDebug, ignoreHash } = configuration;
        this.profile = profile;
        this.doDebug = doDebug;
        this.ignoreHash = ignoreHash;
    }

    /**
     * Bootstrap a skill project with deploy delegate's custom logic, to initiate the project to be ready for deployment.
     * @param {String} workspacePath The path to the new skill's workspace
     * @param {Function} callback (error)
     */
    bootstrapInfrastructures(workspacePath, callback) {
        const infraType = ResourcesConfig.getInstance().getSkillInfraType(this.profile);
        if (!stringUtils.isNonBlankString(infraType)) {
            return process.nextTick(() => {
                callback('[Error]: Please set the "type" field for your skill infrastructures.');
            });
        }
        // 1.Prepare the loading of deploy delegate
        DeployDelegate.load(infraType, (loadErr, deployDelegate) => {
            if (loadErr) {
                return callback(loadErr);
            }
            // 2.Call bootstrap method from deploy delegate
            const bootstrapOptions = {
                profile: this.profile,
                userConfig: ResourcesConfig.getInstance().getSkillInfraUserConfig(this.profile),
                workspacePath
            };
            deployDelegate.bootstrap(bootstrapOptions, (bootsErr, bootstrapResult) => {
                if (bootsErr) {
                    return callback(bootsErr);
                }
                const { userConfig } = bootstrapResult;
                ResourcesConfig.getInstance().setSkillInfraUserConfig(this.profile, userConfig);
                callback();
            });
        });
    }

    /**
     * Entry method for skill infrastructure deployment based on the deploy delegate type.
     * @param {Function} callback
     */
    deployInfrastructure(callback) {
        const infraType = ResourcesConfig.getInstance().getSkillInfraType(this.profile);
        // 1.Prepare the loading of deploy delegate
        DeployDelegate.load(infraType, (loadErr, deployDelegate) => {
            if (loadErr) {
                return callback(loadErr);
            }
            // 2.Trigger regional deployment using deploy delegate
            this.deployInfraToAllRegions(deployDelegate, (deployErr, deployResult) => {
                if (deployErr) {
                    return callback(deployErr);
                }
                // 3.Post deploy skill manifest update
                this.updateSkillManifestWithDeployResult(deployResult, (postUpdateErr) => {
                    if (postUpdateErr) {
                        return callback(postUpdateErr);
                    }
                    callback();
                });
            });
        });
    }

    /**
     * Deploy skill infrastructure to all the Alexa regions.
     * @param {Object} dd DeployDelegate instance
     * @param {Function} callback (error, invokeResult)
     *                            invokeResult: { $region: { endpoint: { url }, lastDeployHash, deployState } }
     */
    deployInfraToAllRegions(dd, callback) {
        const skillName = stringUtils.filterNonAlphanumeric(Manifest.getInstance().getSkillName())
            || stringUtils.filterNonAlphanumeric(path.basename(process.cwd()));
        if (!stringUtils.isNonBlankString(skillName)) {
            return callback('[Error]: Failed to parse the skill name used to decide the CloudFormation stack name. '
                + 'Please make sure your skill name or skill project folder basename contains alphanumeric characters.');
        }
        const regionsList = ResourcesConfig.getInstance().getCodeRegions(this.profile);
        if (!regionsList || regionsList.length === 0) {
            return callback('[Warn]: Skip the infrastructure deployment, as the "code" field has not been set in the resources config file.');
        }
        const userConfig = ResourcesConfig.getInstance().getSkillInfraUserConfig(this.profile);
        const deployRegions = this._getAlexaDeployRegions(regionsList, userConfig);

        // 1.instantiate MultiTasksView
        const taskConfig = {
            concurrent: true,
            exitOnError: false
        };
        const multiTasksView = new MultiTasksView(taskConfig);
        // 2.register each regional task into MultiTasksView
        regionsList.forEach((region) => {
            const taskTitle = `Deploy Alexa skill infrastructure for region "${region}"`;
            const taskHandle = (reporter, taskCallback) => {
                this._deployInfraByRegion(reporter, dd, region, skillName, deployRegions, taskCallback);
            };
            multiTasksView.loadTask(taskHandle, taskTitle, region);
        });
        // 3.start multi-tasks and validate task response
        multiTasksView.start((taskErr, taskResult) => {
            const { error, partialResult } = taskErr || {};
            const result = partialResult || taskResult;
            // update skipped deployment task with deploy region result
            if (result) {
                R.keys(result).filter((alexaRegion) => result[alexaRegion].isDeploySkipped).forEach((alexaRegion) => {
                    const { deployRegion } = result[alexaRegion];
                    result[alexaRegion] = result[deployRegion];
                });
            }
            if (error) {
                // update partial successful deploy results to resources config
                if (result && !R.isEmpty(R.keys(result))) {
                    this._updateResourcesConfig(regionsList, result);
                }
                return callback(error);
            }
            // 4.validate response and update states based on the results
            try {
                dd.validateDeployDelegateResponse(result);
            } catch (responseInvalidErr) {
                return callback(responseInvalidErr);
            }
            this._updateResourcesConfig(regionsList, result);
            callback(null, result);
        });
    }

    /**
     * Update the skill manifest based on the skill infrastructure deployment result.
     * @param {Object} rawDeployResult deploy result from invoke: { $region: { endpoint: { url }, lastDeployHash, deployState } }
     * @param {Function} callback (error)
     */
    updateSkillManifestWithDeployResult(rawDeployResult, callback) {
        const targetEndpoints = ResourcesConfig.getInstance().getTargetEndpoints(this.profile);
        // for backward compatibility, defaulting to api from skill manifest if targetEndpoints is not defined
        const domains = targetEndpoints.length ? targetEndpoints : Object.keys(Manifest.getInstance().getApis());
        // 1.update local skill.json file:
        // update the "uri" in all target api endpoints for each region
        domains.forEach((domain) => {
            R.keys(rawDeployResult).forEach((region) => {
                Manifest.getInstance().setApisEndpointByDomainRegion(domain, region, rawDeployResult[region].endpoint);
            });
        });
        // add skill events if defined in resources config
        const events = ResourcesConfig.getInstance().getSkillEvents(this.profile);
        if (events) {
            R.keys(rawDeployResult).forEach((region) => {
                Manifest.getInstance().setEventsEndpointByRegion(region, rawDeployResult[region].endpoint);
            });
            if (events.publications) {
                const publications = events.publications.map((eventName) => ({ eventName }));
                Manifest.getInstance().setEventsPublications(publications);
            }
            if (events.subscriptions) {
                const subscriptions = events.subscriptions.map((eventName) => ({ eventName }));
                Manifest.getInstance().setEventsSubscriptions(subscriptions);
            }
        }

        Manifest.getInstance().write();
        // 2.compare with current hash result to decide if skill.json file need to be updated
        // (the only possible change in skillMetaSrc during the infra deployment is the skill.json's uri change)
        hashUtils.getHash(ResourcesConfig.getInstance().getSkillMetaSrc(this.profile), (hashErr, currentHash) => {
            if (hashErr) {
                return callback(hashErr);
            }
            if (currentHash === ResourcesConfig.getInstance().getSkillMetaLastDeployHash(this.profile)) {
                return callback();
            }
            // 3.re-upload skill package
            this._ensureSkillManifestGotUpdated((manifestUpdateErr) => {
                if (manifestUpdateErr) {
                    return callback(manifestUpdateErr);
                }
                ResourcesConfig.getInstance().setSkillMetaLastDeployHash(this.profile, currentHash);
                Messenger.getInstance().info('  The api endpoints of skill.json have been updated from the skill infrastructure deploy results.');
                callback();
            });
        });
    }

    /**
     * Deploy skill infrastructure by calling invoke function from deploy delegate.
     * @param {Object} reporter upstream CLI status reporter
     * @param {Object} dd injected deploy delegate instance
     * @param {String} alexaRegion
     * @param {String} skillName
     * @param {Object} deployRegions
     * @param {Function} callback (error, invokeResult)
     *                   callback.error can be a String or { message, context } Object which passes back the partial deploy result
     */
    _deployInfraByRegion(reporter, dd, alexaRegion, skillName, deployRegions, callback) {
        const regionConfig = {
            profile: this.profile,
            doDebug: this.doDebug,
            ignoreHash: this.ignoreHash,
            alexaRegion,
            skillId: ResourcesConfig.getInstance().getSkillId(this.profile),
            skillName,
            code: {
                codeBuild: ResourcesConfig.getInstance().getCodeBuildByRegion(this.profile, alexaRegion).file,
                isCodeModified: null
            },
            userConfig: ResourcesConfig.getInstance().getSkillInfraUserConfig(this.profile),
            deployState: ResourcesConfig.getInstance().getSkillInfraDeployState(this.profile),
            deployRegions
        };
        // 1.calculate the lastDeployHash for current code folder and compare with the one in record
        const lastDeployHash = ResourcesConfig.getInstance().getCodeLastDeployHashByRegion(this.profile, regionConfig.alexaRegion);
        hashUtils.getHash(regionConfig.code.codeBuild, (hashErr, currentHash) => {
            if (hashErr) {
                return callback(hashErr);
            }
            regionConfig.code.isCodeModified = currentHash !== lastDeployHash;
            // 2.trigger the invoke function from deploy delegate
            dd.invoke(reporter, regionConfig, (invokeErr, invokeResult) => {
                if (invokeErr) {
                    return callback(invokeErr);
                }
                const { isAllStepSuccess, isCodeDeployed, isDeploySkipped, resultMessage } = invokeResult;
                // track the current hash if isCodeDeployed
                if (isCodeDeployed) {
                    invokeResult.lastDeployHash = currentHash;
                }
                // skip task if isDeploySkipped
                if (isDeploySkipped) {
                    reporter.skipTask(resultMessage);
                }
                // pass result message as error message if deploy not success and not skipped
                if (!isAllStepSuccess && !isDeploySkipped) {
                    callback({ message: resultMessage, context: invokeResult });
                } else {
                    callback(null, invokeResult);
                }
            });
        });
    }

    /**
     * Update the the ask resources config and the deploy state.
     * @param {Object} regionsList list of configured alexa regions
     * @param {Object} rawDeployResult deploy result from invoke: { $region: deploy-delegate's response }
     */
    _updateResourcesConfig(regionsList, rawDeployResult) {
        const curDeployState = ResourcesConfig.getInstance().getSkillInfraDeployState(this.profile) || {};
        const newDeployState = {};
        regionsList.forEach((alexaRegion) => {
            const { deployState, lastDeployHash } = rawDeployResult[alexaRegion] || {};
            newDeployState[alexaRegion] = deployState || curDeployState[alexaRegion];
            if (lastDeployHash) {
                ResourcesConfig.getInstance().setCodeLastDeployHashByRegion(this.profile, alexaRegion, lastDeployHash);
            }
        });
        ResourcesConfig.getInstance().setSkillInfraDeployState(this.profile, newDeployState);
        ResourcesConfig.getInstance().write();
    }

    /**
     * Make sure the skill manifest is updated successfully by deploying the skill package
     * @param {Function} callback
     */
    _ensureSkillManifestGotUpdated(callback) {
        const spinner = new SpinnerView();
        spinner.start('Updating skill package from the skill infrastructure deploy results.');
        let vendorId, skillMetaController;
        try {
            vendorId = profileHelper.resolveVendorId(this.profile);
            skillMetaController = new SkillMetadataController({ profile: this.profile, doDebug: this.doDebug });
        } catch (err) {
            spinner.terminate();
            return callback(err);
        }
        skillMetaController.deploySkillPackage(vendorId, this.ignoreHash, (deployErr) => {
            spinner.terminate();
            if (deployErr) {
                return callback(deployErr);
            }
            callback();
        });
    }

    /**
     * Return deploy regions map based on configured alexa code regions
     * @param  {Array} regionsList list of configured alexa regions
     * @param  {Object} userConfig
     * @return {Object}
     */
    _getAlexaDeployRegions(regionsList, userConfig) {
        const deployRegions = {};
        regionsList.forEach((alexaRegion) => {
            const awsRegion = alexaRegion === 'default'
                ? userConfig.awsRegion
                : R.path(['regionalOverrides', alexaRegion, 'awsRegion'], userConfig);
            deployRegions[alexaRegion] = awsRegion || defaultAlexaAwsRegionMap[alexaRegion];
        });
        return deployRegions;
    }
};
