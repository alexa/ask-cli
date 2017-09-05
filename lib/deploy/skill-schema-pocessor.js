'use strict';

const parser = require('../utils/skill-parser');
const profileHelper = require('../utils/profile-helper');
const jsonUtility = require('../utils/json-utility');
const domainRegistry = require('../utils/domain-registry');
const retrieveLambda = require('./lambda-operation/retrieve-lambda');
const async = require('async');
const jsonfile = require('jsonfile');

// Public
module.exports.updateSkillSchemaWithLambdaCreation = (generatedLambdaList, submittingReadySkillSchema) => {
    let finalSkillSchema = JSON.parse(JSON.stringify(submittingReadySkillSchema));
    if (!generatedLambdaList || generatedLambdaList.length === 0) {
        return finalSkillSchema;
    }
    for (let metaData of generatedLambdaList) {
        let arrayPathToUri = ['skillManifest', 'apis', domainRegistry.getSkillSchemaKey(metaData.domain),
            'regions', metaData.region, 'endpoint', 'uri'];
        jsonUtility.writePropertyToJsonOjbect(finalSkillSchema, arrayPathToUri, metaData.arn);
    }
    // Logic to set one region as default.
    for (let domain of Object.keys(finalSkillSchema.skillManifest.apis)) {
        let domainInfo = finalSkillSchema.skillManifest.apis[domain];
        if (domainInfo.hasOwnProperty('endpoint')) {
            // If default region existed and need to create Lambda, replace it with real ARN
            if (domainInfo.regions.hasOwnProperty('default')) {
                domainInfo.endpoint.uri = domainInfo.regions.default.endpoint.uri;
                jsonUtility.deletePropertyFromJsonObject(domainInfo, ['regions', 'default']);
            }
        } else {
            // If NA exists move NA up; else move whatever comes the first
            let regionsKeyArray = Object.keys(domainInfo.regions);
            if (regionsKeyArray.indexOf('NA') === -1) {
                let firstRegion = domainInfo.regions[regionsKeyArray[0]];
                let defaultEndpoint = firstRegion.endpoint;
                domainInfo.endpoint = defaultEndpoint;
                jsonUtility.deletePropertyFromJsonObject(domainInfo, ['regions', regionsKeyArray[0]]);
            } else {
                let defaultEndpoint = domainInfo.regions.NA;
                domainInfo.endpoint = defaultEndpoint;
                jsonUtility.deletePropertyFromJsonObject(domainInfo, ['regions', 'NA']);
            }
        }
        // Clean empty regions if no endpoint inside
        if (Object.keys(domainInfo.regions) === 0) {
            jsonUtility.deletePropertyFromJsonObject(domainInfo, ['regions']);
        }
    }

    return finalSkillSchema;
};

module.exports.parseSkill = (projectConfigFile, skillFile, profile, callback) => {
    let skillManifest = jsonUtility.read(skillFile);

    if (!isValidSkillManifest(skillManifest)) {
        console.error('Invalid skill manifest.');
        return;
    }

    let askConfig = jsonUtility.read(projectConfigFile);
    let skillName = parser.parseSkillName(skillManifest);
    if (!askConfig.deploy_settings[profile] || Object.keys(askConfig.deploy_settings[profile]).length === 0) {
        addNewProfileToConfig(askConfig, skillName, skillManifest, profile);
        jsonfile.writeFileSync(projectConfigFile, askConfig, {spaces: 2});
    }

    let skillId = jsonUtility.getPropertyFromJsonObject(askConfig, ['deploy_settings', profile, 'skill_id']);

    // doing merge
    let mergedSkillManifest = collate(skillManifest, askConfig.deploy_settings[profile].merge);
    // move default endpoint under regions to treat it as regular endpoint
    moveDefaultEndpointIntoRegions(mergedSkillManifest);
    // create file
    generateSubmittingReadySkillManifest(mergedSkillManifest, profile, (preprocessedSkillManifest) => {
        // this skillManifest has sourceDir and url -> either true url, or functionName that need to be created.
        // which means if there is a functionName that can be find on AWS, it will change to the ARN.
        let withTrueURLSkillManifest = collate(mergedSkillManifest, preprocessedSkillManifest);

        moveDefaultEndpointUpBack(withTrueURLSkillManifest);
        moveDefaultEndpointUpBack(preprocessedSkillManifest);

        let skillInfo = parser.extractSkillInfo(withTrueURLSkillManifest);

        callback(preprocessedSkillManifest, skillInfo, skillId);
    });
};


// Private
function collate(baseLayer, overrideLayer) {
    function collateHelper(base, top) {
        for (let p of Object.getOwnPropertyNames(top)) {
            if (base[p] && base[p].constructor === Array) {
                if (top[p].constructor === Array) {
                    base[p] = top[p];
                    continue;
                }
                console.error('Merging object have different types. Please check skill.json and .ask/config');
                process.exit(1);
            }
            if (top[p].constructor === Object && base.hasOwnProperty(p)) {
                collateHelper(base[p], top[p]);
                continue;
            }
            base[p] = top[p];
        }
    }
    if (!overrideLayer) {
        return JSON.parse(JSON.stringify(baseLayer));
    }
    let deepCopyFirstLayer = JSON.parse(JSON.stringify(baseLayer));
    let deepCopyOverrideLayer = JSON.parse(JSON.stringify(overrideLayer));
    collateHelper(deepCopyFirstLayer, deepCopyOverrideLayer);
    return deepCopyFirstLayer;
}

function moveDefaultEndpointIntoRegions(mergedSkillManifest) {
    let apisInfo = jsonUtility.getPropertyFromJsonObject(mergedSkillManifest, ['skillManifest', 'apis']);
    for (let domain of Object.getOwnPropertyNames(apisInfo)) {
        let domainInfo = apisInfo[domain];
        if (domainInfo.hasOwnProperty('endpoint')) {
            if (!domainInfo.hasOwnProperty('regions')) {
                domainInfo.regions = {};
            }
            domainInfo.regions.default = {
                endpoint: domainInfo.endpoint
            };
        }
    }
    return mergedSkillManifest;
}

function generateSubmittingReadySkillManifest(mergedSkillManifest, profile, callback) {
    let deepCopiedSkillManifest = JSON.parse(JSON.stringify(mergedSkillManifest));
    let awsProfile = profileHelper.getAWSProfile(profile);
    async.each(domainRegistry.domainList(), (domain, domainAsyncCallback) => {
        let domainKey = domainRegistry.getSkillSchemaKey(domain);
        let pathToRegions = ['skillManifest', 'apis', domainKey, 'regions'];
        let regionsInfo = jsonUtility.getPropertyFromJsonObject(deepCopiedSkillManifest, pathToRegions);
        if (!regionsInfo || Object.getOwnPropertyNames(regionsInfo).length === 0) {
            domainAsyncCallback();
            return;
        }
        async.each(Object.getOwnPropertyNames(regionsInfo), (region, regionLevelCallback) => {
            if (!regionsInfo[region].endpoint.uri || regionsInfo[region].endpoint.uri.length === 0) {
                if (regionsInfo[region].endpoint.sourceDir && regionsInfo[region].endpoint.sourceDir.length !== 0) {
                    // if no aws, no uri. we don't need sourceDir since we will not deploy lambda for the users.
                    if (!awsProfile) {
                        delete regionsInfo[region];
                    }
                    // not uri, has sourceDir, will create lambda using the codebase.
                    regionLevelCallback();
                } else {
                    // no uri, no sourceDir but has endpoint filed
                    regionLevelCallback('[Error]: Invalid uri info.\n' +
                        'Please check "skill.json" and ".ask/config" files and set your endpoint information correctly.');
                }
                return;
            }
            if (!parser.isAbsoluteURL(regionsInfo[region].endpoint.uri)) {
                // if not correct URL, delete them if no aws in the profile.
                if (!awsProfile) {
                    delete regionsInfo[region];
                    regionLevelCallback();
                    return;
                }

                // has uri, but not real ARN, call aws to check if there is a real ARN binded with this functionName
                retrieveLambda.retrieveLambdaFunction(regionsInfo[region].endpoint.uri, region, awsProfile, (awsResponseURL) => {
                    if (awsResponseURL && awsResponseURL.substr(0, 4) === 'arn:') {
                        let arrayPathToUri = [region, 'endpoint', 'uri'];
                        jsonUtility.writePropertyToJsonOjbect(regionsInfo, arrayPathToUri, awsResponseURL);
                    }
                    // if use function name cannot find lambda function, and not sourceDir, stop the process
                    if (!regionsInfo[region].endpoint.sourceDir || regionsInfo[region].endpoint.sourceDir.length === 0) {
                        regionLevelCallback('[Error]: Invalid url info.\n' +
                            'Cannot find valid lambda function with the given name, ' +
                            'nor find sourceDir as codebase path to create lambda function.');
                    }
                    regionLevelCallback();
                    return;
                });
            } else {
                // if aws says no function with this function name, treat as create new lambda.
                // so uri won't change here
                regionLevelCallback();
                return;
            }
        }, (err) => {
            if (err) {
                domainAsyncCallback(err);
            }
            domainAsyncCallback();
        });
    }, (err) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        obtainUniqueness(deepCopiedSkillManifest, (approvedSkillManifest) => {
            callback(approvedSkillManifest);
        });
    });
}

// check whether multiple different code bases map to a single lambda uri, and remove 'sourceDir' and pass to callback.
function obtainUniqueness(skillManifest, callback) {
    let checkUniqueMap = new Map();
    let domainKeyArray = domainRegistry.domainList().map((domain) => {
        return domainRegistry.getSkillSchemaKey(domain);
    });
    for (let domainKey of domainKeyArray) {
        if (!skillManifest.skillManifest.apis[domainKey] || !skillManifest.skillManifest.apis[domainKey].regions) {
            continue;
        }
        let regionsInfo = skillManifest.skillManifest.apis[domainKey].regions;
        for (let region of Object.getOwnPropertyNames(regionsInfo)) {
            let uri = regionsInfo[region].endpoint.uri;
            if (!uri) {
                continue;
            }
            let deletePath = ['skillManifest', 'apis', domainKey, 'regions', region, 'endpoint', 'sourceDir'];
            if (uri.substr(0,4) !== 'arn:') {
                // it's a function name, which aws don't have a function match with
                jsonUtility.deletePropertyFromJsonObject(skillManifest, deletePath);
                continue;
            }
            let sourceDir = regionsInfo[region].endpoint.sourceDir;
            if (!sourceDir || sourceDir.length === 0) {
                continue;
            }
            if (!checkUniqueMap.get(uri)) {
                checkUniqueMap.set(uri, sourceDir);
            } else if (sourceDir !== checkUniqueMap.get(uri)) {
                console.error('Multiple source directory point to a same endpoint.');
                process.exit(1);
            }
            jsonUtility.deletePropertyFromJsonObject(skillManifest, deletePath);
        }
    }
    callback(skillManifest);
}

function moveDefaultEndpointUpBack(skillManifest) {
    let apisInfo = jsonUtility.getPropertyFromJsonObject(skillManifest, ['skillManifest', 'apis']);
    for (let domain of Object.getOwnPropertyNames(apisInfo)) {
        if (apisInfo[domain].hasOwnProperty('regions')) {
            apisInfo[domain].endpoint = jsonUtility.getPropertyFromJsonObject(
                apisInfo, [domain, 'regions', 'default', 'endpoint']);
            jsonUtility.deletePropertyFromJsonObject(apisInfo, [domain, 'regions', 'default']);
        }
    }
}

function addNewProfileToConfig(askConfig, skillName, skillManifest, profile) {
    let domainList = parser.parseDomainList(skillManifest);
    askConfig.deploy_settings[profile] = {
        skill_id: '',
        was_cloned: false,
        merge: {
            skillManifest: {
                apis: {
                }
            }
        }
    };

    for (let domain of domainList) {
        let targetPath = ['deploy_settings', profile, 'merge', 'skillManifest', 'apis', domain];
        jsonUtility.writePropertyToJsonOjbect(askConfig, targetPath, {});
    }


    let awsProfile = profileHelper.getAWSProfile(profile);
    if (!awsProfile) {
       return;
    }

    for (let domain of domainList) {
        if (domainRegistry.domainList().indexOf(domain) === -1) {
            continue;
        }

        let apisPath = ['skillManifest', 'apis', domain];
        let domainInfo = jsonUtility.getPropertyFromJsonObject(skillManifest, apisPath);

        if (!domainInfo || Object.keys(domainInfo).length === 0) {
            continue;
        } else {
            let domainObject = {
                endpoint: {
                    uri: "ask-" + domain + "-" + skillName + "-" + profile
                }
            };
            let addPath = ['deploy_settings', profile, 'merge', 'skillManifest', 'apis', domain];
            jsonUtility.writePropertyToJsonOjbect(askConfig, addPath, domainObject);
        }
    }
}

// a basic validation for skill.json
// to check whether it has skillManifest or not
function isValidSkillManifest(skillSchema) {
    if (skillSchema &&
        skillSchema.skillManifest &&
        typeof skillSchema.skillManifest === 'object')
    {
        return true;
    }
    else {
        return false;
    }
}