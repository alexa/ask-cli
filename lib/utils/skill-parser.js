'use strict';

const jsonUtility = require('./json-utility');
const domainRegistry = require('./domain-registry');
const path = require('path');

/*
 * Get SkillInfo (Extract CLI relative info from skillManifest)
 *
 * @params skillManifest
 * @return skillInfo with following fields
 *       | skillName
 *       | endpointsInfo
 *       | publishLocaleList
 *       | domainList
 *       | hasLambdaFunction
 */
module.exports.extractSkillInfo = (skillManifest) => {
    let skillInfo = {
        'skillName': module.exports.parseSkillName(skillManifest),
        'endpointsInfo': module.exports.parseEndpointInfo(skillManifest),
        'publishLocaleList': module.exports.parsePublishingLocaleList(skillManifest),
        'domainList': module.exports.parseDomainList(skillManifest)
    };
    skillInfo.hasLambdaFunction = module.exports.hasLambdaFunction(skillInfo.endpointsInfo);
    if (!skillInfo.skillName || skillInfo.skillName.length === 0) {
        // delete domain check. the check will be done by backend
        return null;
    }
    return skillInfo;
};

module.exports.parseSkillName = (skillManifest) => {
    let locales = jsonUtility.getPropertyFromJsonObject(skillManifest,
        ['skillManifest', 'publishingInformation', 'locales']);
    if (!locales) {
        return null;
    }
    let name;
    if (locales.hasOwnProperty('en-US')) {
        name = locales['en-US'].name;
    } else if (locales.hasOwnProperty('en-GB')){
        name = locales['en-GB'].name;
    } else {
        name = locales[Object.keys(locales)[0]].name;
    }
    let result = name.replace(/[\s]+/g, '_'); // Change spaces between skill name to underbar
    if (!result || result.length === 0) {
        console.error('Get skill name error. Skill name should not be empty.');
        return null;
    }
    return result;
};

module.exports.parseEndpointInfo = (skillManifest) => {
    let endpointsInfo = {};
    let domainList = module.exports.parseDomainList(skillManifest);
    if (!domainList || domainList.length === 0) {
        return endpointsInfo;
    }
    for (let domain of domainList) {
        let domainKey = domainRegistry.getSkillSchemaKey(domain);
        let domainInfo = jsonUtility.getPropertyFromJsonObject(skillManifest, ['skillManifest', 'apis', domainKey]);
        if (!domainInfo.hasOwnProperty('endpoint')) {
            continue;
        }
        endpointsInfo[domain] = {};

        // Add default region to the list
        endpointsInfo[domain]['default'] = {};
        if (domainInfo.endpoint.hasOwnProperty('uri')) {
            endpointsInfo[domain]['default'].uri = domainInfo.endpoint.uri;
        }
        if (domainInfo.endpoint.hasOwnProperty('sourceDir')) {
            endpointsInfo[domain]['default'].sourceDir = domainInfo.endpoint.sourceDir;
        }
        if (Object.keys(endpointsInfo[domain]['default']).length === 0) {
            delete endpointsInfo[domain]['default'];
        }

        // Add endpoints in the 'regions' field. Only check 'regions' when default 'endpoint' exists
        if (domainInfo.hasOwnProperty('regions')) {
            let regionInfo = domainInfo.regions;
            for (let region of Object.getOwnPropertyNames(regionInfo)) {
                if (!regionInfo[region].hasOwnProperty('endpoint')) {
                    continue;
                }
                let endpointInfoForRegion = regionInfo[region].endpoint;
                endpointsInfo[domain][region] = {};
                if (endpointInfoForRegion.hasOwnProperty('uri')) {
                    endpointsInfo[domain][region].uri = endpointInfoForRegion.uri;
                }
                if (endpointInfoForRegion.hasOwnProperty('sourceDir')) {
                    endpointsInfo[domain][region].sourceDir = endpointInfoForRegion.sourceDir;
                }
                if (Object.keys(endpointsInfo[domain][region]).length === 0) {
                    delete endpointsInfo[domain][region];
                }
            }
        }


        // Delete the domain which doesn't have details in endpoint field
        if (Object.keys(endpointsInfo[domain]).length === 0) {
            delete endpointsInfo[domain];
        }
    }
    return endpointsInfo;
};

module.exports.parseDomainList = (skillManifest) => {
    let apis = jsonUtility.getPropertyFromJsonObject(skillManifest, ['skillManifest', 'apis']);
    if (!apis) {
        return null;
    }
    if (Object.keys(apis).length < 1) {
        console.warn('Skill.json invalid. Skill domain not specified.');
        return null;
    }

    let domainList = [];
    for (let domain of domainRegistry.domainList()) {
        let domainKey = domainRegistry.getSkillSchemaKey(domain);
        if (apis.hasOwnProperty(domainKey)) {
            domainList.push(domain);
        }
    }
    return domainList;
};

module.exports.hasLambdaFunction = (endpointsInfo) => {
    if (!endpointsInfo || (endpointsInfo.constructor === Object && Object.keys(endpointsInfo).length === 0)) {
        return false;
    }
    for (let domain of Object.getOwnPropertyNames(endpointsInfo)) {
        for (let region of Object.getOwnPropertyNames(endpointsInfo[domain])) {
            if (endpointsInfo[domain][region].sourceDir && endpointsInfo[domain][region].sourceDir.length !== 0) {
                return true;
            }
            let uri = endpointsInfo[domain][region].uri;
            if (uri && uri.startsWith('arn:')) {
                return true;
            }
        }
    }
    return false;
};

module.exports.parsePublishingLocaleList = (skillManifest) => {
    let publishingLocalesInfo = jsonUtility.getPropertyFromJsonObject(skillManifest,
        ['skillManifest', 'publishingInformation', 'locales']);
    if (!publishingLocalesInfo) {
        return null;
    }
    return Object.keys(publishingLocalesInfo);
};

module.exports.isSkillNameValid = (name) => {
    let filteredName = name.match(/([a-zA-Z0-9-_]+)/g);
    if (filteredName && filteredName[0] === name) {
        return true;
    } else {
        return false;
    }
};

module.exports.isValidLambdaFunctionName = (functionName) => {
    if (functionName.length === 0) {
        return false;
    }
    let re = /[a-zA-Z0-9-_]+/;
    let capturedStringArray = functionName.match(re);
    return functionName.length === capturedStringArray[0].length ? true : false;
};

module.exports.isAbsoluteURL = (url) => {
    let lambda_regex = /arn:aws:lambda:[a-z]+-[a-z]+-[0-9]:[0-9]{12}:function:[a-zA-Z0-9-_]+(\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})?(:[a-zA-Z0-9-_]+)?/;
    if (url && (url.substr(0, 6) === 'https:'  || lambda_regex.test(url))) {
        return true;
    }
    return false;
};

module.exports.reorganizeToObjectList = (endpointsInfo) => {
    let listOfLambdaMetaDataObject = [];
    for (let domain of Object.keys(endpointsInfo)) {
        let reversedMap = reverseKeyValue(endpointsInfo[domain]);
        if (Object.keys(reversedMap).length === 0) {
            continue;
        } else if (Object.keys(reversedMap).length ===1) {
            let addingObject = {};
            addingObject.sourceDirFromDomainLevel = domain;
            addingObject.domain = domain;
            addingObject.regions = reversedMap[Object.keys(reversedMap)[0]];
            addingObject.uri = Object.keys(reversedMap)[0];
            listOfLambdaMetaDataObject.push(addingObject);
        } else {
            for (let arn of Object.keys(reversedMap)) {
                let addingObject = {};
                let regionList = reversedMap[arn];
                let littlePath = path.join(domain, regionList.join('-'));
                addingObject.sourceDirFromDomainLevel = littlePath;
                addingObject.domain = domain;
                addingObject.regions = regionList;
                addingObject.uri = arn;
                listOfLambdaMetaDataObject.push(addingObject);
            }
        }
    }
    return listOfLambdaMetaDataObject;
};

function reverseKeyValue(domainObject) {
    let reversedObject = {};
    for (let region of Object.keys(domainObject)) {
        if (domainObject[region].uri.startsWith('https://')) {
            continue;
        }
        if (!reversedObject.hasOwnProperty(domainObject[region].uri)) {
            reversedObject[domainObject[region].uri] = [];
        }
        reversedObject[domainObject[region].uri].push(region);
    }
    return reversedObject;
}
