'use strict';

const parser = require('../utils/skill-parser');
const path = require('path');
const jsonUtility = require('../utils/json-utility');
const apiWrapper = require('../api/api-wrapper');
const tools = require('../utils/tools');
const clui = require('clui');
const jsonfile = require('jsonfile');
const inquirer = require('inquirer');
const domainRegistry = require('../utils/domain-registry');
const skillParser = require('../utils/skill-parser');
const retry = require('retry');

module.exports = {
    deploySkill: deploySkill,
    updateSkill: updateSkill,
    checkSkillStatus: checkSkillStatus
};

function deploySkill(skillId, preprocessedSkillSchema, skillInfo, profile, doDebug, callback) {
    let submitReadySkillSchema = deleteInvalidEndpoint(preprocessedSkillSchema);
    if (!skillId) {
        let skillName = skillInfo.skillName;
        if (!skillName || !skillName.length) {
            console.warn('Skill name should not be empty. Please set skill name in skill.json.');
            return;
        }
        if (!parser.isSkillNameValid(skillName)) {
            console.warn('Skill name is not valid. ' +
                         'Pattern of the name should be /[a-zA-Z0-9-_]+/.');
            return;
        }
        console.log('-------------------- Create Skill Project --------------------');
        console.log('Profile for the deployment: [' + profile + ']');
        let Spinner = clui.Spinner;
        let createSkillSpinner = new Spinner(' Creating new skill...');
        createSkillSpinner.start();
        createSkill(submitReadySkillSchema, profile, doDebug, (skillId) => {
            updateSkillConfig(skillId, profile);
            checkSkillStatus(skillId, profile, doDebug, (status) => {
                createSkillSpinner.stop();
                handleSkillStatus(status, skillId, callback);
            });
        });
    } else {
        checkClone(skillInfo, profile, () => {
            console.log('-------------------- Update Skill Project --------------------');
            let Spinner = clui.Spinner;
            let updateSkillSpinner = new Spinner(' Updating new skill...');
            updateSkillSpinner.start();
            updateSkill(skillId, submitReadySkillSchema, profile, doDebug, () => {
                checkSkillStatus(skillId, profile, doDebug, (status) => {
                    updateSkillSpinner.stop();
                    handleSkillStatus(status, skillId, callback);
                });
            });
        });
    }
}

function updateSkill(skillId, skillManifest, profile, doDebug, callback) {
    apiWrapper.callUpdateSkill(skillId, skillManifest, profile, doDebug, () => {
        if (typeof callback === 'function' && callback) {
            callback();
        }
    });
}

// Private
function createSkill(skillManifest, profile, doDebug, callback) {
    apiWrapper.callCreateSkill(skillManifest, profile, doDebug, (data) => {
        let skillData = tools.convertDataToJsonObject(data);
        if (skillData) {
            callback(skillData.skillId);
        }
    });
}

function updateSkillConfig(skillId, profile) {
    let projectConfigFile = path.join(process.cwd(), '.ask', 'config');
    let projectConfig = jsonUtility.read(projectConfigFile);
    projectConfig.deploy_settings[profile].skill_id = skillId;
    jsonfile.writeFileSync(projectConfigFile, projectConfig, {spaces: 2});
}

function checkClone(skillInfo, profile, callback) {
    let projectConfigPath = path.join(process.cwd(), '.ask', 'config');
    let projectConfig = jsonUtility.read(projectConfigPath);
    let isCloned = jsonUtility.getPropertyFromJsonObject(projectConfig, ['deploy_settings', profile, 'was_cloned']);
    if (!isCloned) {
        callback();
    } else {
        console.log('This skill project was cloned from a pre-existing skill. Deploying this project will');
        console.log('  - Update skill metadata (skill.json)');

        if (skillInfo.domainList.indexOf('custom') !== -1) {
            console.log('  - Update interaction model (models/*.json)');
        }

        if (Object.keys(skillInfo.endpointsInfo).length > 0) {
            console.log('  - Deploy the Lambda function(s) in ./lambda/*');
        }

        let confirm = {
            type: 'confirm',
            name: 'isAllowed',
            message: 'Do you want to proceed with the above deployments?'
        };
        inquirer.prompt(confirm).then((answers) => {
            if (answers.isAllowed) {
                projectConfig.deploy_settings[profile].was_cloned = false;
                jsonfile.writeFileSync(projectConfigPath, projectConfig, {spaces: 2});
                console.log();
                callback();
            }
        });
    }
}

// Helper function to make the create skill succeed with current smapi requirement.
// This logic can be removed when the lambda validation check moves to skill submission.
function deleteInvalidEndpoint(preprocessedSkillSchema) {
    let skillManifest = JSON.parse(JSON.stringify(preprocessedSkillSchema));
    let domainKeyArray = domainRegistry.domainList().map((domain) => {
        return domainRegistry.getSkillSchemaKey(domain);
    });
    let apisInfo = skillManifest.skillManifest.apis;
    for (let domainKey of domainKeyArray) {
        // domain not existed or domain has no key inside, continue
        if (!apisInfo[domainKey] || Object.keys(apisInfo[domainKey]).length === 0) {
            continue;
        }
        // has default endpoint field but doesn't have anything inside, remove endpoint
        if (!apisInfo[domainKey].endpoint || Object.keys(apisInfo[domainKey].endpoint).length === 0) {
            let deletePathRegionLevel = [domainKey, 'endpoint'];
            jsonUtility.deletePropertyFromJsonObject(apisInfo, deletePathRegionLevel);
        }
        // has regions field but doesn't have any endpoints inside, remove regions
        if (!apisInfo[domainKey].regions || Object.keys(apisInfo[domainKey].regions).length === 0) {
            let deletePathRegionLevel = [domainKey, 'regions'];
            jsonUtility.deletePropertyFromJsonObject(apisInfo, deletePathRegionLevel);
        }

        // remove all the endpoint which is not absolute url for skill creation
        // default endpoint
        if (apisInfo[domainKey].hasOwnProperty('endpoint')) {
            let defaultEndpoint = apisInfo[domainKey].endpoint;
            if (!defaultEndpoint) {
                delete apisInfo[domainKey].endpoint;
            }
            if (defaultEndpoint.hasOwnProperty('uri') && !skillParser.isAbsoluteURL(defaultEndpoint.uri)) {
                let deletePath = [domainKey, 'endpoint'];
                jsonUtility.deletePropertyFromJsonObject(apisInfo, deletePath);
            }
        }
        // other regions' endpoints
        if (apisInfo[domainKey].hasOwnProperty('regions')) {
            let regionsInfo = apisInfo[domainKey].regions;
            for (let region of Object.keys(regionsInfo)) {
                let regionInfo = regionsInfo[region];
                if (regionInfo.hasOwnProperty('endpoint')) {
                    let endpointInfo = regionInfo.endpoint;
                    let deletePath = [domainKey, 'regions', region];
                    if (endpointInfo.hasOwnProperty('uri')) {
                        if (!skillParser.isAbsoluteURL(endpointInfo.uri)) {
                            jsonUtility.deletePropertyFromJsonObject(apisInfo, deletePath);
                        }
                    } else {
                        jsonUtility.deletePropertyFromJsonObject(apisInfo, deletePath);
                    }
                }
            }
            if (Object.keys(regionsInfo).length === 0) {
                jsonUtility.deletePropertyFromJsonObject(apisInfo, [domainKey, 'regions']);
            }
        }
    }
    skillManifest.skillManifest.apis = apisInfo;
    return skillManifest;
}


/**
 * check skill status with retry strategy,
 * callback with the final skill status after retry 5 times.
 *
 * @param skillId
 * @param profile
 * @param doDebug
 * @param callback
 * @return skill building status
 */
function checkSkillStatus(skillId, profile, doDebug, callback) {
    const oneSec = 1000;
    let operation = retry.operation({
        retries: 5,
        minTimeout: 1 * oneSec,
        maxTimeout: 20 * oneSec,
        factor: 2
    });
    operation.attempt(() => {
        apiWrapper.callGetSkillStatus(skillId, profile, doDebug, (data) => {
            let skillStatus = tools.convertDataToJsonObject(data);
            let status = jsonUtility.getPropertyFromJsonObject(skillStatus, ['manifest', 'lastModified', 'status']);
            if (status === 'IN_PROGRESS' && operation.retry(status)) {
                return;
            } else {
                callback(status);
            }
        });
    });
}

function handleSkillStatus(skillStatus, skillId, callback) {
    if (skillStatus === 'SUCCESSFUL') {
        console.log('Skill Id: ' + skillId);
        console.log('Skill deployment finished.');
        if (typeof callback === 'function' && callback) {
            callback(skillId);
        }
    } else if (skillStatus === 'IN_PROGRESS') {
        console.error('[Error]: Time out. Skill schema still in building progress');
        return;
    } else {
        console.error('[Error]: Building skill schema failed');
        return;
    }
}
