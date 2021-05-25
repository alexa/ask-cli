import R from 'ramda';
import path from 'path';

import SkillMetadataController from '@src/controllers/skill-metadata-controller';
import ResourcesConfig from '@src/model/resources-config';
import Manifest from '@src/model/manifest';
import MultiTasksView from '@src/view/multi-tasks-view';
import Messenger from '@src/view/messenger';
import hashUtils from '@src/utils/hash-utils';
import stringUtils from '@src/utils/string-utils';
import SpinnerView from '@src/view/spinner-view';
import profileHelper from '@src/utils/profile-helper';

import { loadDeployDelegate } from './deploy-delegate';

const getResourcesConfig = () => ResourcesConfig.getInstance() as ResourcesConfig;
const getManifest = () => Manifest.getInstance() as Manifest;

export interface ISkillInfrastructureController {
    profile: string;
    doDebug: boolean;
    ignoreHash: boolean;
};

export default class SkillInfrastructureController {
    private profile: string;
    private doDebug: boolean;
    private ignoreHash: boolean;

    constructor(configuration: ISkillInfrastructureController) {
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
    bootstrapInfrastructures(workspacePath: string, callback: Function) {
        const infraType = getResourcesConfig().getSkillInfraType(this.profile);
        if (!stringUtils.isNonBlankString(infraType)) {
            return process.nextTick(() => {
                callback('[Error]: Please set the "type" field for your skill infrastructures.');
            });
        }
        // 1.Prepare the loading of deploy delegate
        loadDeployDelegate(infraType, (loadErr?: Error, deployDelegate?: any) => {
            if (loadErr) {
                return callback(loadErr);
            }
            // 2.Call bootstrap method from deploy delegate
            const bootstrapOptions = {
                profile: this.profile,
                userConfig: getResourcesConfig().getSkillInfraUserConfig(this.profile),
                workspacePath
            };
            deployDelegate.bootstrap(bootstrapOptions, (bootsErr?: Error, bootstrapResult?: any) => {
                if (bootsErr) {
                    return callback(bootsErr);
                }
                const { userConfig } = bootstrapResult;
                getResourcesConfig().setSkillInfraUserConfig(this.profile, userConfig);
                callback();
            });
        });
    }

    /**
     * Entry method for skill infrastructure deployment based on the deploy delegate type.
     * @param {Function} callback
     */
    deployInfrastructure(callback: Function) {
        const infraType = getResourcesConfig().getSkillInfraType(this.profile);
        // 1.Prepare the loading of deploy delegate
        loadDeployDelegate(infraType, (loadErr?: Error, deployDelegate?: any) => {
            if (loadErr) {
                return callback(loadErr);
            }
            // 2.Trigger regional deployment using deploy delegate
            this.deployInfraToAllRegions(deployDelegate, (deployErr?: Error, deployResult?: any) => {
                if (deployErr) {
                    return callback(deployErr);
                }
                // 3.Post deploy skill manifest update
                this.updateSkillManifestWithDeployResult(deployResult, (postUpdateErr?: Error) => {
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
    deployInfraToAllRegions(dd: any, callback: Function) {
        const skillName = stringUtils.filterNonAlphanumeric(getManifest().getSkillName())
            || stringUtils.filterNonAlphanumeric(path.basename(process.cwd()));
        if (!stringUtils.isNonBlankString(skillName)) {
            return callback('[Error]: Failed to parse the skill name used to decide the CloudFormation stack name. '
                + 'Please make sure your skill name or skill project folder basename contains alphanumeric characters.');
        }
        const regionsList = getResourcesConfig().getCodeRegions(this.profile);
        if (!regionsList || regionsList.length === 0) {
            return callback('[Warn]: Skip the infrastructure deployment, as the "code" field has not been set in the resources config file.');
        }

        // 1.instantiate MultiTasksView
        const taskConfig = {
            concurrent: true,
            exitOnError: false
        };
        const multiTasksView = new MultiTasksView(taskConfig);
        // 2.register each regional task into MultiTasksView
        regionsList.forEach((region) => {
            const taskTitle = `Deploy Alexa skill infrastructure for region "${region}"`;
            const taskHandle = (reporter: any, taskCallback: any) => {
                this._deployInfraByRegion(reporter, dd, region, skillName, taskCallback);
            };
            multiTasksView.loadTask(taskHandle, taskTitle, region);
        });
        // 3.start multi-tasks and validate task response
        multiTasksView.start((taskErr, taskResult) => {
            if (taskErr) {
                // update partial successful deploy results to resources config
                if (taskErr.partialResult && !R.isEmpty(R.keys(taskErr.partialResult))) {
                    this._updateResourcesConfig(taskErr.partialResult);
                }
                return callback(taskErr.error);
            }
            // 4.validate response and update states based on the results
            try {
                dd.validateDeployDelegateResponse(taskResult);
            } catch (responseInvalidErr) {
                return callback(responseInvalidErr);
            }
            this._updateResourcesConfig(taskResult);
            callback(null, taskResult);
        });
    }

    /**
     * Update the skill manifest based on the skill infrastructure deployment result.
     * @param {Object} rawDeployResult deploy result from invoke: { $region: { endpoint: { url }, lastDeployHash, deployState } }
     * @param {Function} callback (error)
     */
    updateSkillManifestWithDeployResult(rawDeployResult: any, callback: Function) {
        const targetEndpoints = getResourcesConfig().getTargetEndpoints(this.profile);
        // for backward compatibility, defaulting to api from skill manifest if targetEndpoints is not defined
        const domains = targetEndpoints.length ? targetEndpoints : Object.keys(getManifest().getApis());
        // 1.update local skill.json file: update the "uri" in all target endpoints for each region
        domains.forEach((domain: string) => {
            R.keys(rawDeployResult).forEach((region) => {
                const regionStr = region as string;
                if (domain === Manifest.endpointTypes.EVENTS) {
                    getManifest().setEventsEndpointByRegion(regionStr, rawDeployResult[region].endpoint);
                } else {
                    getManifest().setApisEndpointByDomainRegion(domain, regionStr, rawDeployResult[region].endpoint);
                }
            });
        });

        getManifest().write();
        // 2.compare with current hash result to decide if skill.json file need to be updated
        // (the only possible change in skillMetaSrc during the infra deployment is the skill.json's uri change)
        hashUtils.getHash(getResourcesConfig().getSkillMetaSrc(this.profile), (hashErr?: Error, currentHash?: any) => {
            if (hashErr) {
                return callback(hashErr);
            }
            if (currentHash === getResourcesConfig().getSkillMetaLastDeployHash(this.profile)) {
                return callback();
            }
            // 3.re-upload skill package
            this._ensureSkillManifestGotUpdated((manifestUpdateErr?: Error) => {
                if (manifestUpdateErr) {
                    return callback(manifestUpdateErr);
                }
                getResourcesConfig().setSkillMetaLastDeployHash(this.profile, currentHash);
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
     * @param {Function} callback (error, invokeResult)
     *                   callback.error can be a String or { message, context } Object which passes back the partial deploy result
     */
    _deployInfraByRegion(reporter: any, dd: any, alexaRegion: string, skillName: string, callback: Function) {
        const build = getResourcesConfig().getCodeBuildByRegion(this.profile, alexaRegion) as any;
        const regionConfig: any = {
            profile: this.profile,
            ignoreHash: this.ignoreHash,
            alexaRegion,
            skillId: getResourcesConfig().getSkillId(this.profile),
            skillName,
            code: {
                codeBuild: build.file,
                isCodeModified: null
            },
            userConfig: getResourcesConfig().getSkillInfraUserConfig(this.profile),
            deployState: getResourcesConfig().getSkillInfraDeployState(this.profile)
        };
        // 1.calculate the lastDeployHash for current code folder and compare with the one in record
        const lastDeployHash = getResourcesConfig().getCodeLastDeployHashByRegion(this.profile, regionConfig.alexaRegion);
        hashUtils.getHash(regionConfig.code.codeBuild, (hashErr, currentHash) => {
            if (hashErr) {
                return callback(hashErr);
            }
            regionConfig.code.isCodeModified = currentHash !== lastDeployHash;
            // 2.trigger the invoke function from deploy delegate
            dd.invoke(reporter, regionConfig, (invokeErr?: Error, invokeResult?: any) => {
                if (invokeErr) {
                    return callback(invokeErr);
                }
                const { isAllStepSuccess, isCodeDeployed } = invokeResult;
                // track the current hash if isCodeDeployed
                if (isCodeDeployed) {
                    invokeResult.lastDeployHash = currentHash;
                }
                // pass back result based on if isAllStepSuccess, pass result as error if not all steps succeed
                callback(isAllStepSuccess ? null : invokeResult, isAllStepSuccess ? invokeResult : undefined);
            });
        });
    }

    /**
     * Update the the ask resources config and the deploy state.
     * @param {Object} rawDeployResult deploy result from invoke: { $region: deploy-delegate's response }
     */
    _updateResourcesConfig(rawDeployResult: any) {
        const newDeployState: any = {};
        R.keys(rawDeployResult).forEach((alexaRegion) => {
            const region = alexaRegion as string;
            newDeployState[region] = rawDeployResult[region].deployState;
            getResourcesConfig().setCodeLastDeployHashByRegion(this.profile, region, rawDeployResult[region].lastDeployHash);
        });
        getResourcesConfig().setSkillInfraDeployState(this.profile, newDeployState);
        getResourcesConfig().write();
    }

    /**
     * Make sure the skill manifest is updated successfully by deploying the skill package
     * @param {Function} callback
     */
    _ensureSkillManifestGotUpdated(callback: Function) {
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
        skillMetaController.deploySkillPackage(vendorId, this.ignoreHash, (deployErr?: Error) => {
            spinner.terminate();
            if (deployErr) {
                return callback(deployErr);
            }
            callback();
        });
    }
};
